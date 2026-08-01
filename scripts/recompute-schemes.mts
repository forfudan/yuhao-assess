#!/usr/bin/env tsx
/**
 * 批量重算内置方案的測評結果，並回寫 yuhao-assess-data/schemes/
 *
 * 當量表或選重鍵口徑一改，各方案 JSON 裡存檔的數字就過時了，
 * 而對比頁會把「當前方案現算的值」和「内置方案的存檔值」並排顯示，
 * 口徑不一致排名就是錯的。這個腳本用碼表重跑一遍，讓存檔值回到同一口徑。
 *
 * 重算範圍：速度當量分析、鍵位熱力、連續文本當量（都受當量表和選重鍵口徑影響）。
 * 其餘測評結果（重碼、候選個數、簡碼效率）不受影響，原樣保留。
 *
 * 連續文本當量存的是分佈的格點計數加幾個統計量，不是幾萬個原始樣本值，
 * 每個方案只多出幾 KB，換來的是導入 JSON 的人不必再等一次抽樣就能看圖。
 *
 * 跑完會順帶更新連續文本當量的參考分佈常量（見 compute-reference.mts），
 * 所以平時只需要這一條命令。參考分佈的輸入没變時會自動跳過，不會白等一分鐘。
 *
 * 碼表來源優先級：
 *   1. yuhao-assess-data/tables/<方案>.txt（有就用，便於把碼表釘在某個版本）
 *   2. 方案 JSON 的 元數據.碼表下載鏈接（自動下載，緩存到 .cache/tables/）
 *
 * 用法：
 *   pnpm recompute            重算並回寫
 *   pnpm recompute --dry-run  只報告差異，不寫文件
 *   pnpm recompute --refresh  忽略下載緩存與參考分佈指紋，全部重新拉取和重算
 *   pnpm recompute xuma sky   只重算指定方案（參考分佈照常檢查）
 *
 * 注意：腳本直接複用 src/services 下的生產代碼，不另寫一份解析邏輯，
 * 以免和網頁端算出不同的結果。瀏覽器 API（fetch）在下面用本地文件墊片。
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP_DIR = path.resolve(__dirname, '..')
const PUBLIC_DIR = path.join(APP_DIR, 'public')
const DATA_REPO = path.resolve(APP_DIR, '../yuhao-assess-data')
const TABLES_DIR = path.join(DATA_REPO, 'tables')
const SCHEMES_DIR = path.join(DATA_REPO, 'schemes')
const CACHE_DIR = path.join(APP_DIR, '.cache/tables')

// ---------------------------------------------------------------------------
// 瀏覽器 API 墊片：服務層用 fetch('/settings/...') 讀數據，這裡改讀本地 public/
// ---------------------------------------------------------------------------
const 原生fetch = globalThis.fetch
globalThis.fetch = (async (資源: unknown, 選項?: unknown) => {
  const url = String(資源)
  if (url.startsWith('/')) {
    const 文件路徑 = path.join(PUBLIC_DIR, url)
    if (!fs.existsSync(文件路徑)) return new Response('', { status: 404 })
    return new Response(fs.readFileSync(文件路徑))
  }
  return 原生fetch(資源 as string, 選項 as RequestInit)
}) as typeof fetch

const { 碼表處理服務實例 } = await import('../src/services/codeTableService.ts')
const { 字頻表服務類别 } = await import('../src/services/charFrequencyService.ts')
const { 從碼表計算加權速度當量, 生成一級簡碼加選重鍵表, 生成二級簡碼加選重鍵表 } =
  await import('../src/services/speedEquivalentService.ts')
const { 計算按鍵計數 } = await import('../src/services/keyboardHeatmapService.ts')
const { 清洗連續文本, 蒙特卡洛連續文本當量 } =
  await import('../src/services/continuousEquivalentService.ts')
const { 壓縮連續文本當量結果 } = await import('../src/atoms/continuousEquivalent.ts')
const { 默認選重鍵表 } = await import('../src/types/scheme.ts')
// 參考分佈跟着一起更新，省得用戶記兩條命令；輸入没變時它自己會跳過
const { 生成參考分佈 } = await import('./compute-reference.mts')

// ---------------------------------------------------------------------------
// 工具
// ---------------------------------------------------------------------------

/**
 * 讀取碼表文本
 *
 * 倉庫裡有的碼表存成了 UTF-16LE（如 zhedou.txt），
 * 直接按 UTF-8 讀會得到滿是空字節的亂碼、解析出 0 個字符，
 * 所以先按 BOM 判斷編碼。
 */
function 讀取碼表文本(文件路徑: string): string {
  const 緩衝 = fs.readFileSync(文件路徑)
  if (緩衝.length >= 2 && 緩衝[0] === 0xff && 緩衝[1] === 0xfe) {
    return 緩衝.subarray(2).toString('utf16le')
  }
  if (緩衝.length >= 2 && 緩衝[0] === 0xfe && 緩衝[1] === 0xff) {
    // UTF-16BE：先做字節對調再按 LE 解
    const 對調 = Buffer.from(緩衝.subarray(2))
    for (let i = 0; i + 1 < 對調.length; i += 2) {
      const t = 對調[i] as number
      對調[i] = 對調[i + 1] as number
      對調[i + 1] = t
    }
    return 對調.toString('utf16le')
  }
  return 緩衝.toString('utf8').replace(/^﻿/, '')
}

/**
 * 取得某方案的碼表文本
 *
 * 本地 tables/ 裡有就直接用；没有就按方案 JSON 裡的 碼表下載鏈接 下載，
 * 並緩存到 .cache/tables/ 供後續重跑複用（`--refresh` 可強制重新拉取）。
 * @returns 碼表文本與來源説明；無法取得時返回 null
 */
async function 取得碼表文本(
  鍵名: string,
  下載鏈接: string | undefined,
  強制刷新: boolean
): Promise<{ 文本: string; 來源: string } | null> {
  const 本地路徑 = path.join(TABLES_DIR, `${鍵名}.txt`)
  if (fs.existsSync(本地路徑)) {
    return { 文本: 讀取碼表文本(本地路徑), 來源: '本地' }
  }

  if (!下載鏈接) return null

  const 緩存路徑 = path.join(CACHE_DIR, `${鍵名}.txt`)
  if (!強制刷新 && fs.existsSync(緩存路徑)) {
    return { 文本: 讀取碼表文本(緩存路徑), 來源: '緩存' }
  }

  const 響應 = await 原生fetch(下載鏈接)
  if (!響應.ok) {
    throw new Error(`下載碼表失敗 HTTP ${響應.status}: ${下載鏈接}`)
  }
  const 緩衝 = Buffer.from(await 響應.arrayBuffer())
  fs.mkdirSync(CACHE_DIR, { recursive: true })
  fs.writeFileSync(緩存路徑, 緩衝)
  return { 文本: 讀取碼表文本(緩存路徑), 來源: '線上' }
}

/** 計算碼表哈希（與 ProcessTablePage 的算法保持一致） */
async function 計算碼表哈希(原始碼表: Map<number, [string, string, number]>): Promise<string> {
  const 排序數據 = Array.from(原始碼表.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, [字符, 編碼]]) => `${字符}\t${編碼}`)
    .join('\n')
  const 哈希緩衝 = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(排序數據))
  return Array.from(new Uint8Array(哈希緩衝))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * 存進方案 JSON 的連續文本當量抽樣設置
 *
 * 必須與 SpeedEquivalentPage 的下拉選單初始值一致：
 * 用戶打開頁面看到的就是這組設置，存檔和界面對得上纔不會誤導。
 */
const 連續文本當量窗口長度 = 100
const 連續文本當量樣本數 = 20000

const 字頻來源列表 = [
  '知乎簡體字頻',
  '北語簡體字頻',
  '臺標繁體字頻',
  '古籍繁體字頻',
  '繁簡聯合字頻',
] as const

/** 各字頻來源在結果字段名裡的前綴，與 速度當量分析結果介面 對應 */
const 碼型列表 = [
  { 後綴: '全碼速度當量', 取表: (t: 各碼表) => t.全碼 },
  { 後綴: '一級簡碼速度當量', 取表: (t: 各碼表) => t.一簡 },
  { 後綴: '二級簡碼速度當量', 取表: (t: 各碼表) => t.二簡 },
  { 後綴: '全部簡碼速度當量', 取表: (t: 各碼表) => t.全簡 },
] as const

interface 各碼表 {
  全碼: Map<string, string[]>
  一簡: Map<string, string[]>
  二簡: Map<string, string[]>
  全簡: Map<string, string[]>
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------

async function main() {
  const 參數 = process.argv.slice(2)
  const 試運行 = 參數.includes('--dry-run')
  const 強制刷新 = 參數.includes('--refresh')
  const 指定方案 = 參數.filter(a => !a.startsWith('--'))

  if (!fs.existsSync(SCHEMES_DIR)) {
    console.error(`❌ 找不到方案目錄: ${SCHEMES_DIR}`)
    console.error('   請確保 yuhao-assess-data 與 yuhao-assess 在同一層目錄')
    process.exit(1)
  }

  console.log('🚀 重算内置方案測評結果')
  console.log(`📂 碼表: ${TABLES_DIR}`)
  console.log(`📂 方案: ${SCHEMES_DIR}`)
  if (試運行) console.log('🧪 試運行模式，不寫入文件')
  console.log('')

  // 當量表與字頻表只需加載一次
  const 當量表 = JSON.parse(
    fs.readFileSync(path.join(PUBLIC_DIR, 'settings/equivTable.json'), 'utf8')
  ).data as Record<string, number>
  console.log(`📐 當量表 ${Object.keys(當量表).length} 組碼對`)

  const 字頻表 = new Map<string, Record<string, number>>()
  字頻表.set('知乎簡體字頻', await 字頻表服務類别.加載知乎簡體字頻())
  字頻表.set('北語簡體字頻', await 字頻表服務類别.加載北語簡體字頻())
  字頻表.set('臺標繁體字頻', await 字頻表服務類别.加載臺標繁體字頻())
  字頻表.set('古籍繁體字頻', await 字頻表服務類别.加載古籍繁體字頻())
  // 繁簡聯合字頻依賴前四者，必須最後算
  字頻表.set('繁簡聯合字頻', await 字頻表服務類别.計算繁簡聯合字頻())
  console.log(
    `📊 字頻表 ${字頻來源列表.map(s => `${s}:${Object.keys(字頻表.get(s) ?? {}).length}`).join('  ')}`
  )

  const 連續語料 = 清洗連續文本(
    fs.readFileSync(path.join(PUBLIC_DIR, 'texts/literature.txt'), 'utf8')
  )
  console.log(
    `📖 連續文本語料 ${連續語料.length} 字` +
      `（窗口 ${連續文本當量窗口長度} 字，抽樣 ${連續文本當量樣本數.toLocaleString()} 次）`
  )
  console.log('')

  const 内置 = JSON.parse(
    fs.readFileSync(path.join(PUBLIC_DIR, 'settings/builtin-schemes.json'), 'utf8')
  )
  let 方案鍵名列表: string[] = 内置.schemes
    .filter((s: { enabled?: boolean }) => s.enabled)
    .map((s: { key: string }) => s.key)
  if (指定方案.length > 0) {
    方案鍵名列表 = 方案鍵名列表.filter(k => 指定方案.includes(k))
    if (方案鍵名列表.length === 0) {
      console.error(`❌ 指定的方案都不在啟用列表裡: ${指定方案.join(', ')}`)
      process.exit(1)
    }
  }

  const 已更新: string[] = []
  const 已跳過: Array<{ 方案: string; 原因: string }> = []

  for (const 鍵名 of 方案鍵名列表) {
    const 方案路徑 = path.join(SCHEMES_DIR, `${鍵名}.json`)

    if (!fs.existsSync(方案路徑)) {
      已跳過.push({ 方案: 鍵名, 原因: '找不到方案 JSON' })
      continue
    }

    try {
      const 配置 = JSON.parse(fs.readFileSync(方案路徑, 'utf8'))
      const 碼表元數據 = 配置.碼表元數據 ?? {}
      const 選重鍵表 = 配置.方案參數?.選重鍵表 ?? 默認選重鍵表

      const 碼表 = await 取得碼表文本(鍵名, 配置.元數據?.碼表下載鏈接, 強制刷新)
      if (!碼表) {
        已跳過.push({
          方案: 鍵名,
          原因: 'tables/ 裡没有碼表，方案 JSON 也没有 元數據.碼表下載鏈接',
        })
        continue
      }

      const { rawCodeTable } = await 碼表處理服務實例.解析原始碼表文本(
        碼表.文本,
        碼表元數據.分隔符 ?? '空格',
        碼表元數據.第一列類型 ?? '字符'
      )
      const 處理結果 = await 碼表處理服務實例.處理原始碼表(rawCodeTable, {
        最大碼長: 配置.方案參數.最大碼長,
        編碼終止指示符列表: 配置.方案參數.編碼終止指示符列表,
      })

      if (處理結果.全碼表.size === 0) {
        已跳過.push({ 方案: 鍵名, 原因: '碼表解析出 0 個字符（編碼或分隔符設置可能不對）' })
        continue
      }

      const 各碼表: 各碼表 = {
        全碼: 處理結果.全碼加選重鍵表,
        全簡: 處理結果.簡碼加選重鍵表,
        一簡: 生成一級簡碼加選重鍵表(處理結果.簡碼加選重鍵表, 處理結果.全碼加選重鍵表, []),
        二簡: 生成二級簡碼加選重鍵表(處理結果.簡碼加選重鍵表, 處理結果.全碼加選重鍵表, []),
      }

      // 速度當量：5 種字頻 × 4 種碼型
      const 速度當量分析: Record<string, unknown> = {}
      for (const 來源 of 字頻來源列表) {
        const 字頻 = 字頻表.get(來源) ?? {}
        for (const { 後綴, 取表 } of 碼型列表) {
          速度當量分析[`${來源}${後綴}`] = 從碼表計算加權速度當量(
            取表(各碼表),
            字頻,
            當量表,
            選重鍵表
          )
        }
      }
      速度當量分析.更新時間 = new Date().toISOString()

      // 鍵位熱力：用北語簡體字頻，與 KeyboardHeatmapPage 的 當前字頻 保持一致
      const 熱力字頻 = 字頻表.get('北語簡體字頻') ?? {}
      const 鍵位熱力 = {
        全碼: 計算按鍵計數(各碼表.全碼, 熱力字頻, 選重鍵表),
        簡碼: 計算按鍵計數(各碼表.全簡, 熱力字頻, 選重鍵表),
      }

      // 連續文本當量：存分佈的格點計數，導入方案的人不必再抽樣一次
      const 連續文本當量 = 壓縮連續文本當量結果({
        統計: {
          全碼加選重: 蒙特卡洛連續文本當量(連續語料, 各碼表.全碼, 當量表, {
            窗口長度: 連續文本當量窗口長度,
            樣本數: 連續文本當量樣本數,
            選重鍵表,
          }),
          全部簡碼加選重: 蒙特卡洛連續文本當量(連續語料, 各碼表.全簡, 當量表, {
            窗口長度: 連續文本當量窗口長度,
            樣本數: 連續文本當量樣本數,
            選重鍵表,
          }),
        },
        樣本數: 連續文本當量樣本數,
        窗口長度: 連續文本當量窗口長度,
        更新時間: new Date().toISOString(),
      })

      const 舊值 = 配置.測評結果?.速度當量分析?.繁簡聯合字頻全碼速度當量
      const 新值 = 速度當量分析.繁簡聯合字頻全碼速度當量 as number
      const 差值 = typeof 舊值 === 'number' ? 新值 - 舊值 : NaN

      配置.測評結果 = { ...(配置.測評結果 ?? {}), 速度當量分析, 鍵位熱力, 連續文本當量 }
      配置.方案參數.選重鍵表 = 選重鍵表
      配置.碼表元數據 = {
        ...碼表元數據,
        哈希值: await 計算碼表哈希(rawCodeTable),
        總字符數: 處理結果.全碼表.size,
      }
      配置.元數據.更新時間 = new Date().toISOString()

      if (!試運行) fs.writeFileSync(方案路徑, JSON.stringify(配置, null, 2) + '\n')

      const 差值文字 = Number.isNaN(差值)
        ? '（無舊值）'
        : `${差值 >= 0 ? '+' : ''}${差值.toFixed(4)}`
      const 連續均值 = 連續文本當量.統計.全碼加選重?.平均數 ?? NaN
      console.log(
        `✅ ${鍵名.padEnd(14)} ${碼表.來源.padEnd(2)} ${處理結果.全碼表.size.toString().padStart(7)} 字  ` +
          `繁簡聯合全碼當量 ${新值.toFixed(4)}  ${差值文字}  ` +
          `連續文本 μ ${連續均值.toFixed(4)}`
      )
      已更新.push(鍵名)
    } catch (錯誤) {
      已跳過.push({ 方案: 鍵名, 原因: 錯誤 instanceof Error ? 錯誤.message : String(錯誤) })
    }
  }

  console.log('')
  console.log(`🎉 完成：更新 ${已更新.length} 個，跳過 ${已跳過.length} 個`)
  if (已跳過.length > 0) {
    console.log('')
    console.log('⚠️  以下方案未重算，存檔數值仍是舊口徑：')
    for (const { 方案, 原因 } of 已跳過) {
      console.log(`   ${方案.padEnd(14)} ${原因}`)
    }
    console.log('')
    console.log('💡 修法二選一：把 txt 放進 yuhao-assess-data/tables/，')
    console.log('   或在方案 JSON 的 元數據.碼表下載鏈接 填上碼表地址，然後重跑')
  }
  // 參考分佈依賴卿雲的 選重鍵表，所以必須排在方案重算之後
  console.log('')
  console.log('─'.repeat(60))
  console.log('')
  await 生成參考分佈({ 試運行, 強制: 強制刷新 })

  if (!試運行 && 已更新.length > 0) {
    console.log('')
    console.log('💡 接下來：cd ../yuhao-assess-data && ./update-data.sh 推送，')
    console.log('   然後在 yuhao-assess 跑 pnpm fetchlocal 同步到 public/')
  }
}

main().catch(錯誤 => {
  console.error('❌ 重算失敗:', 錯誤)
  process.exit(1)
})
