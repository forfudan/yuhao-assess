#!/usr/bin/env tsx
/**
 * 生成連續文本當量的參考分佈常量（src/data/continuousEquivalentReference.ts）
 *
 * 圖上疊一條參考方案的常態分佈曲線，讓用戶一眼看出自己的方案偏快還是偏慢。
 * 參考方案的均值和標準差只取決於「窗口長度 × 碼表口徑」——
 * 抽樣次數只影響估計精度，不改變分佈本身，所以不作爲一個維度。
 *
 * 語料（literature.txt）或當量表一更新，這裡的常量就過時了，需要重跑：
 *   pnpm reference
 */

import fs from 'fs'
import path from 'path'
import { createHash } from 'crypto'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP_DIR = path.resolve(__dirname, '..')
const PUBLIC_DIR = path.join(APP_DIR, 'public')
const DATA_REPO = path.resolve(APP_DIR, '../yuhao-assess-data')
const 輸出路徑 = path.join(APP_DIR, 'src/data/continuousEquivalentReference.ts')

/** 參考方案：卿雲 */
const 參考方案鍵名 = 'yuhao-joy'
/** 與 SpeedEquivalentPage 下拉選單保持一致 */
const 窗口長度列表 = [10, 20, 50, 100, 200]
/** estimation 用的抽樣次數，取大一些讓常量穩定到小數點後四位 */
const 參考樣本數 = 400000

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
const { 清洗連續文本, 蒙特卡洛連續文本當量 } =
  await import('../src/services/continuousEquivalentService.ts')
const { 默認選重鍵表 } = await import('../src/types/scheme.ts')

/** 與 recompute-schemes.mts 相同的碼表取得邏輯：本地優先，其次線上下載並緩存 */
async function 取得碼表文本(鍵名: string, 下載鏈接?: string): Promise<string> {
  const 本地路徑 = path.join(DATA_REPO, 'tables', `${鍵名}.txt`)
  if (fs.existsSync(本地路徑)) return fs.readFileSync(本地路徑, 'utf8')

  const 緩存路徑 = path.join(APP_DIR, '.cache/tables', `${鍵名}.txt`)
  if (fs.existsSync(緩存路徑)) return fs.readFileSync(緩存路徑, 'utf8')

  if (!下載鏈接) throw new Error(`找不到 ${鍵名} 的碼表，且方案 JSON 没有 碼表下載鏈接`)
  const 響應 = await 原生fetch(下載鏈接)
  if (!響應.ok) throw new Error(`下載碼表失敗 HTTP ${響應.status}: ${下載鏈接}`)
  const 緩衝 = Buffer.from(await 響應.arrayBuffer())
  fs.mkdirSync(path.dirname(緩存路徑), { recursive: true })
  fs.writeFileSync(緩存路徑, 緩衝)
  return 緩衝.toString('utf8')
}

/**
 * 讀出已生成文件裡的輸入指紋
 *
 * 指紋一致就説明語料、當量表、參考方案碼表都没變，40 萬次抽樣可以整個跳過。
 */
function 讀取已有指紋(): string | null {
  if (!fs.existsSync(輸出路徑)) return null
  const 匹配 = /參考指紋 = '([^']*)'/.exec(fs.readFileSync(輸出路徑, 'utf8'))
  return 匹配?.[1] ?? null
}

/** 由參考分佈的全部輸入算一個指紋 */
function 計算輸入指紋(語料: string, 當量表文本: string, 碼表文本: string, 選重鍵表: unknown) {
  return createHash('sha256')
    .update(語料)
    .update(當量表文本)
    .update(碼表文本)
    .update(JSON.stringify(選重鍵表))
    .update(窗口長度列表.join(','))
    .update(String(參考樣本數))
    .digest('hex')
    .slice(0, 16)
}

/** 生成參考分佈的結果 */
export interface 生成結果介面 {
  已跳過: boolean
}

/**
 * 生成參考分佈常量文件
 * @param 選項.試運行 只報告不寫文件
 * @param 選項.強制 忽略指紋，無論如何都重算
 */
export async function 生成參考分佈(
  選項: { 試運行?: boolean; 強制?: boolean } = {}
): Promise<生成結果介面> {
  const 方案路徑 = path.join(DATA_REPO, 'schemes', `${參考方案鍵名}.json`)
  const 配置 = JSON.parse(fs.readFileSync(方案路徑, 'utf8'))
  const 碼表元數據 = 配置.碼表元數據 ?? {}
  const 選重鍵表 = 配置.方案參數?.選重鍵表 ?? 默認選重鍵表

  console.log(`🚀 生成參考分佈：${配置.元數據.方案名}（${參考方案鍵名}）`)

  const 碼表文本 = await 取得碼表文本(參考方案鍵名, 配置.元數據?.碼表下載鏈接)
  const 語料 = 清洗連續文本(fs.readFileSync(path.join(PUBLIC_DIR, 'texts/literature.txt'), 'utf8'))
  const 當量表文本 = fs.readFileSync(path.join(PUBLIC_DIR, 'settings/equivTable.json'), 'utf8')
  const 當量表 = JSON.parse(當量表文本).data as Record<string, number>

  const 指紋 = 計算輸入指紋(語料, 當量表文本, 碼表文本, 選重鍵表)
  if (!選項.強制 && 指紋 === 讀取已有指紋()) {
    console.log(`⏭️  語料、當量表、碼表均未變（指紋 ${指紋}），跳過重算`)
    console.log('   要強制重算：pnpm reference --force')
    return { 已跳過: true }
  }

  const { rawCodeTable } = await 碼表處理服務實例.解析原始碼表文本(
    碼表文本,
    碼表元數據.分隔符 ?? '空格',
    碼表元數據.第一列類型 ?? '字符'
  )
  const 處理結果 = await 碼表處理服務實例.處理原始碼表(rawCodeTable, {
    最大碼長: 配置.方案參數.最大碼長,
    編碼終止指示符列表: 配置.方案參數.編碼終止指示符列表,
  })

  console.log(`📖 語料 ${語料.length} 字   📇 碼表 ${處理結果.全碼表.size} 字`)
  console.log(`🎲 每格抽樣 ${參考樣本數.toLocaleString()} 次（約需一分鐘）`)
  console.log('')

  const 各口徑 = [
    { 口徑: '全碼加選重', 碼表: 處理結果.全碼加選重鍵表 },
    { 口徑: '全部簡碼加選重', 碼表: 處理結果.簡碼加選重鍵表 },
  ] as const

  const 結果: Record<string, Record<number, { 平均數: number; 標準差: number }>> = {}
  for (const { 口徑, 碼表 } of 各口徑) {
    結果[口徑] = {}
    for (const 窗口長度 of 窗口長度列表) {
      const 統計 = 蒙特卡洛連續文本當量(語料, 碼表, 當量表, {
        窗口長度,
        樣本數: 參考樣本數,
        選重鍵表,
      })
      結果[口徑]![窗口長度] = {
        平均數: Number(統計.平均數.toFixed(5)),
        標準差: Number(統計.標準差.toFixed(5)),
      }
      console.log(
        `   ${口徑.padEnd(16)} 窗口 ${String(窗口長度).padStart(3)}  ` +
          `μ ${統計.平均數.toFixed(4)}  σ ${統計.標準差.toFixed(4)}`
      )
    }
  }

  const 內容 = `/**
 * 連續文本當量參考分佈（自動生成，請勿手改）
 *
 * 由 scripts/compute-reference.mts 生成：\`pnpm reference\`
 * 語料或當量表更新後需要重跑，否則圖上的參考曲線會和實際口徑對不上。
 */

import type { 連續文本當量碼表口徑 } from '../atoms/continuousEquivalent'

/** 一組常態分佈參數 */
export interface 參考分佈項介面 {
  平均數: number
  標準差: number
}

/** 參考方案名稱，用於圖例 */
export const 參考方案名 = '${配置.元數據.方案名}'

/** 生成時的語料字數 */
export const 參考語料字數 = ${語料.length}

/** 輸入指紋（語料 + 當量表 + 參考碼表 + 抽樣設置），用於判斷是否需要重跑 */
export const 參考指紋 = '${指紋}'

/**
 * 參考方案在各窗口長度下的當量分佈參數
 *
 * 只按「碼表口徑 × 窗口長度」索引——抽樣次數只影響估計精度，
 * 不改變分佈本身，所以不是一個維度。
 */
export const 參考分佈表: Record<
  連續文本當量碼表口徑,
  Record<number, 參考分佈項介面 | undefined>
> = ${JSON.stringify(結果, null, 2).replace(/"([^"]+)":/g, '$1:')}

/**
 * 取參考分佈；没有對應窗口長度時返回 undefined
 */
export function 取參考分佈(
  口徑: 連續文本當量碼表口徑,
  窗口長度: number
): 參考分佈項介面 | undefined {
  return 參考分佈表[口徑]?.[窗口長度]
}
`

  console.log('')
  if (選項.試運行) {
    console.log('🧪 試運行模式，未寫入文件')
  } else {
    fs.mkdirSync(path.dirname(輸出路徑), { recursive: true })
    fs.writeFileSync(輸出路徑, 內容)
    console.log(`✅ 已寫入 ${path.relative(APP_DIR, 輸出路徑)}`)
  }
  return { 已跳過: false }
}

// 被 recompute-schemes.mts 導入時不自動執行，只有直接跑纔執行
const 直接運行 = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (直接運行) {
  const 參數 = process.argv.slice(2)
  生成參考分佈({
    試運行: 參數.includes('--dry-run'),
    強制: 參數.includes('--force'),
  }).catch(錯誤 => {
    console.error('❌ 生成參考分佈失敗:', 錯誤)
    process.exit(1)
  })
}
