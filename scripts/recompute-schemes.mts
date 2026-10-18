#!/usr/bin/env tsx
/**
 * 批量重算内置方案的測評結果，並回寫 yuhao-assess-data/schemes/
 *
 * 當量表或選重鍵口徑一改，各方案 JSON 裏存檔的數字就過時了，
 * 而對比頁會把「當前方案現算的值」和「内置方案的存檔值」並排顯示，
 * 口徑不一致排名就是錯的。這個腳本用碼表重跑一遍，讓存檔值回到同一口徑。
 *
 * 重算範圍：**全部六項測評結果 ＋ 連續文本當量**，一項不留。
 *
 * 從前只重算「受當量表和選重鍵口徑影響」的那幾項，其餘原樣保留。那個劃分站不住：
 * 靜態重碼受 charsets.json 的字集定義影響，動態選重、候選個數同理，而這些都會改。
 * 2026-10-06 對賬查出存檔裏所有方案的 GB2312 一行都還是舊的（實際字符數 6764，
 * 而 charsets.json 是 6763），五筆986 的 GB2312 重碼字數更是 427 對 123——
 * 都是「不重算就永遠不會回到新口徑」。既然如此就全部重算，别再分類。
 *
 * 六項直接調 `src/cli/analyzer.ts` 的 `runAllAnalyses`，與 `pnpm cli` 同一支；
 * 這裏只額外算網頁端纔有的連續文本當量。
 *
 * **算出來一樣就不動那個文件**：各分析塊逐項比對（忽略它自己的時間戳），
 * 全等就把舊的那一塊原樣留下，連 更新時間 都不改；整個方案都没變就根本不寫盤。
 * 這樣 `git status` 裏列出來的就真的是「數值變了」的那幾個方案。
 * 連續文本當量用的是定種子的蒙特卡洛（`隨機種子` 默認 20260801），所以同樣的輸入
 * 跑幾次都是同一個結果，不會每次都把文件碰髒。
 *
 * 連續文本當量存的是分佈的格點計數加幾個統計量，不是幾萬個原始樣本值，
 * 每個方案只多出幾 KB，換來的是導入 JSON 的人不必再等一次抽樣就能看圖。
 * 簡碼分檔另外按五個字頻、各檔（25/50/100/200/300/400/500/全部）存 top N 混合碼表的分佈。
 *
 * 連續文本當量圖上的參考曲線直接讀各方案 JSON 裏的這份存檔，
 * 不再另外生成常量表，所以這條命令跑完就没有别的東西要同步了。
 *
 * 碼表來源優先級：
 *   1. yuhao-assess-data/tables/<方案>.txt（有就用，便於把碼表釘在某個版本）
 *   2. 方案 JSON 的 元數據.碼表下載鏈接（自動下載，緩存到 .cache/tables/）
 *
 * 用法：
 *   pnpm recompute            重算並回寫
 *   pnpm recompute --dry-run  只報告差異，不寫文件
 *   pnpm recompute --refresh  忽略碼表下載緩存，全部重新拉取和重算
 *   pnpm recompute xuma sky   只重算指定方案
 *
 * 注意：腳本直接複用 src/services 下的生産代碼，不另寫一份解析邏輯，
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
// 瀏覽器 API 墊片：服務層用 fetch('/settings/...') 讀數據，這裏改讀本地 public/
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

const { runAllAnalyses } = await import('../src/cli/analyzer.ts')
const { 簡碼效率N值列表 } = await import('../src/services/shortCodeEfficiencyService.ts')
const { 碼表處理服務實例 } = await import('../src/services/codeTableService.ts')
const { 字頻表服務類别 } = await import('../src/services/charFrequencyService.ts')
const { 從碼表計算加權速度當量, 生成一級簡碼加選重鍵表, 生成二級簡碼加選重鍵表 } =
  await import('../src/services/speedEquivalentService.ts')
const { 計算按鍵計數 } = await import('../src/services/keyboardHeatmapService.ts')
const { 清洗連續文本, 蒙特卡洛連續文本當量, 計算各字頻簡碼分檔當量 } =
  await import('../src/services/continuousEquivalentService.ts')
const { 壓縮連續文本當量結果 } = await import('../src/atoms/continuousEquivalent.ts')
const { analyzeStaticDuplicate } = await import('../src/cli/analyses/static-duplicate.ts')
const { 默認選重鍵表 } = await import('../src/types/scheme.ts')

// ---------------------------------------------------------------------------
// 工具
// ---------------------------------------------------------------------------

/**
 * 讀取碼表文本
 *
 * 倉庫裏有的碼表存成了 UTF-16LE（如 zhedou.txt），
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
 * 本地 tables/ 裏有就直接用；没有就按方案 JSON 裏的 碼表下載鏈接 下載，
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

  const 響應 = await 原生fetch(下載鏈接, { signal: AbortSignal.timeout(60_000) })
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
 * 用户打開頁面看到的就是這組設置，存檔和界面對得上纔不會誤導。
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

/** 各字頻來源在結果字段名裏的前綴，與 速度當量分析結果介面 對應 */
const 碼型列表 = [
  { 後綴: '全碼速度當量', 取表: (t: 各碼表) => t.全碼 },
  { 後綴: '一級簡碼速度當量', 取表: (t: 各碼表) => t.一簡 },
  { 後綴: '二級簡碼速度當量', 取表: (t: 各碼表) => t.二簡 },
  { 後綴: '全部簡碼速度當量', 取表: (t: 各碼表) => t.全簡 },
] as const

/** 各分析塊自己帶的時間戳字段，比對時一律忽略 */
const 時間戳字段 = new Set(['更新時間', '計算時間'])

/** 剥掉時間戳之後深比一份結果；用來判斷「這一塊到底變了没有」 */
function 内容相同(甲: unknown, 乙: unknown): boolean {
  return JSON.stringify(去時間戳(甲)) === JSON.stringify(去時間戳(乙))
}

function 去時間戳(值: unknown): unknown {
  if (Array.isArray(值)) return 值.map(去時間戳)
  if (值 && typeof 值 === 'object') {
    // 鍵名排序，免得字段順序不同被當成内容不同
    const 出: Record<string, unknown> = {}
    for (const k of Object.keys(值 as Record<string, unknown>).sort()) {
      if (時間戳字段.has(k)) continue
      出[k] = 去時間戳((值 as Record<string, unknown>)[k])
    }
    return 出
  }
  return 值
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
    console.error(`❌ 找不到方案目録: ${SCHEMES_DIR}`)
    console.error('   請確保 yuhao-assess-data 與 yuhao-assess 在同一層目録')
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
      console.error(`❌ 指定的方案都不在啓用列表裏: ${指定方案.join(', ')}`)
      process.exit(1)
    }
  }

  const 已更新: string[] = []
  const 未變: string[] = []
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
          原因: 'tables/ 裏没有碼表，方案 JSON 也没有 元數據.碼表下載鏈接',
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

      // 六項測評全交給 CLI 那支 runAllAnalyses，與 `pnpm cli` 同一條路；
      // 這裏不再自己拼速度當量與鍵位熱力，免得兩邊慢慢長歪。
      const 六項 = await runAllAnalyses({
        processedCodeTable: 處理結果,
        maxCodeLength: 配置.方案參數.最大碼長,
        選重鍵表,
        簡碼效率N值列表,
        onStepStart: () => {},
        onStepDone: () => {},
      })

      const 全碼加選重 = 處理結果.全碼加選重鍵表
      const 全簡加選重 = 處理結果.簡碼加選重鍵表
      const 抽樣 = {
        窗口長度: 連續文本當量窗口長度,
        樣本數: 連續文本當量樣本數,
        選重鍵表,
      }

      // 連續文本當量：存分佈的格點計數，導入方案的人不必再抽樣一次。
      // 簡碼分檔是 top N：前 N 個有效簡碼走簡碼，其餘走全碼，按五個字頻各存一份。
      const 連續文本當量 = 壓縮連續文本當量結果({
        統計: {
          全碼加選重: 蒙特卡洛連續文本當量(連續語料, 全碼加選重, 當量表, 抽樣),
          全部簡碼加選重: 蒙特卡洛連續文本當量(連續語料, 全簡加選重, 當量表, 抽樣),
        },
        簡碼分檔: 計算各字頻簡碼分檔當量(
          連續語料,
          全碼加選重,
          全簡加選重,
          {
            知乎簡體: 字頻表.get('知乎簡體字頻') ?? {},
            北語簡體: 字頻表.get('北語簡體字頻') ?? {},
            臺標繁體: 字頻表.get('臺標繁體字頻') ?? {},
            古籍繁體: 字頻表.get('古籍繁體字頻') ?? {},
            繁簡聯合: 字頻表.get('繁簡聯合字頻') ?? {},
          },
          配置.方案參數.最大碼長,
          當量表,
          抽樣
        ),
        樣本數: 連續文本當量樣本數,
        窗口長度: 連續文本當量窗口長度,
        更新時間: new Date().toISOString(),
      })

      const 舊值 = 配置.測評結果?.速度當量分析?.繁簡聯合字頻全碼速度當量
      const 新值 = 六項.速度當量分析?.繁簡聯合字頻全碼速度當量 as number
      const 差值 = typeof 舊值 === 'number' ? 新值 - 舊值 : NaN

      // 逐塊比對：算出來和存檔一樣就把舊的那一塊原樣留下（連它的時間戳一起），
      // 這樣没變的方案文件連一個字節都不會動。
      const 舊測評 = (配置.測評結果 ?? {}) as Record<string, unknown>
      const 新測評: Record<string, unknown> = { ...六項, 連續文本當量 }
      const 變了的塊: string[] = []
      for (const 塊名 of Object.keys(新測評)) {
        if (内容相同(舊測評[塊名], 新測評[塊名])) {
          新測評[塊名] = 舊測評[塊名]
        } else {
          變了的塊.push(塊名)
        }
      }
      let 有變 = 變了的塊.length > 0
      配置.測評結果 = { ...舊測評, ...新測評 }
      配置.方案參數.選重鍵表 = 選重鍵表
      const 新碼表元數據 = {
        ...碼表元數據,
        // 把實際解析時用到的那兩個值寫回去。只寫哈希與字數、把這兩格留空的話，
        // 方案 JSON 裏就是一份「有碼表元數據但没有分隔符」的半成品，而
        // `驗證方案` 見到 碼表元數據 存在就要求分隔符合法——於是整個方案
        // 在前端被靜靜濾掉，下拉選單裏根本不出現（2026-10-06 魔靈與瀟明就是這樣）。
        分隔符: 碼表元數據.分隔符 ?? '空格',
        第一列類型: 碼表元數據.第一列類型 ?? '字符',
        哈希值: await 計算碼表哈希(rawCodeTable),
        總字符數: 處理結果.全碼表.size,
      }
      if (!内容相同(配置.碼表元數據, 新碼表元數據)) 有變 = true
      配置.碼表元數據 = 新碼表元數據

      // 只有真的算出不同的數纔動 更新時間，否則整個文件保持原樣
      if (有變) 配置.元數據.更新時間 = new Date().toISOString()

      const 新文本 = JSON.stringify(配置, null, 2) + '\n'
      const 落盤 = 有變 && 新文本 !== fs.readFileSync(方案路徑, 'utf8')
      if (!試運行 && 落盤) fs.writeFileSync(方案路徑, 新文本)

      const 差值文字 = Number.isNaN(差值)
        ? '（無舊值）'
        : `${差值 >= 0 ? '+' : ''}${差值.toFixed(4)}`
      const 連續均值 = 連續文本當量.統計.全碼加選重?.平均數 ?? NaN
      console.log(
        `${有變 ? '✅' : '⚪️'} ${鍵名.padEnd(14)} ${碼表.來源.padEnd(2)} ${處理結果.全碼表.size.toString().padStart(7)} 字  ` +
          `繁簡聯合全碼當量 ${新值.toFixed(4)}  ${差值文字}  ` +
          `連續文本 μ ${連續均值.toFixed(4)}` +
          (有變 ? '  改了：' + 變了的塊.join('、') : '  （無變化，未改動文件）')
      )
      if (有變) 已更新.push(鍵名)
      else 未變.push(鍵名)
    } catch (錯誤) {
      已跳過.push({ 方案: 鍵名, 原因: 錯誤 instanceof Error ? 錯誤.message : String(錯誤) })
    }
  }

  console.log('')
  console.log(
    `🎉 完成：更新 ${已更新.length} 個，無變化 ${未變.length} 個，跳過 ${已跳過.length} 個`
  )
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
