#!/usr/bin/env tsx
/**
 * 生成連續文本當量的參考分佈常量（src/data/continuousEquivalentReference.ts）
 *
 * 圖上疊一條參考方案的常態分佈曲線，讓用戶一眼看出自己的方案偏快還是偏慢。
 * 參考方案的均值和標準差只取決於「窗口長度 × 碼表口徑」——
 * 抽樣次數只影響估計精度，不改變分佈本身，所以不作爲一個維度。
 *
 * 可選的參考方案見 參考方案列表，頁面上用下拉選單切換，一次只畫一條，
 * 免得圖上線太多反而看不清。
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

/**
 * 可選的參考方案，排在第一位的是頁面默認值
 *
 * 加方案的成本是每個約一分鐘的抽樣，以及圖上多一個下拉選項，
 * 所以只放有代表性的幾個，不要把内置方案全塞進來。
 */
const 參考方案鍵名列表 = ['yuhao-joy', 'yuhao-ling'] as const
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
 * 指紋一致就説明語料、當量表、各參考方案碼表都没變，抽樣可以整個跳過。
 */
function 讀取已有指紋(): string | null {
  if (!fs.existsSync(輸出路徑)) return null
  const 匹配 = /參考指紋 = '([^']*)'/.exec(fs.readFileSync(輸出路徑, 'utf8'))
  return 匹配?.[1] ?? null
}

/** 單個參考方案的輸入 */
interface 參考方案輸入 {
  鍵名: string
  方案名: string
  碼表文本: string
  選重鍵表: unknown
  配置: { 方案參數: { 最大碼長: number; 編碼終止指示符列表?: string[] } }
  碼表元數據: { 分隔符?: '空格' | '製表符' | '逗號' | '分號'; 第一列類型?: '字符' | '編碼' }
}

/** 由參考分佈的全部輸入算一個指紋 */
function 計算輸入指紋(語料: string, 當量表文本: string, 各方案: 參考方案輸入[]) {
  const 摘要 = createHash('sha256').update(語料).update(當量表文本)
  for (const { 鍵名, 碼表文本, 選重鍵表 } of 各方案) {
    摘要.update(鍵名).update(碼表文本).update(JSON.stringify(選重鍵表))
  }
  return 摘要.update(窗口長度列表.join(',')).update(String(參考樣本數)).digest('hex').slice(0, 16)
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
  // 先把各方案的輸入都收齊，才能算出覆蓋全部方案的指紋
  const 各方案: 參考方案輸入[] = []
  for (const 鍵名 of 參考方案鍵名列表) {
    const 配置 = JSON.parse(
      fs.readFileSync(path.join(DATA_REPO, 'schemes', `${鍵名}.json`), 'utf8')
    )
    各方案.push({
      鍵名,
      方案名: 配置.元數據.方案名,
      碼表文本: await 取得碼表文本(鍵名, 配置.元數據?.碼表下載鏈接),
      選重鍵表: 配置.方案參數?.選重鍵表 ?? 默認選重鍵表,
      配置,
      碼表元數據: 配置.碼表元數據 ?? {},
    })
  }

  console.log(`🚀 生成參考分佈：${各方案.map(項 => `${項.方案名}（${項.鍵名}）`).join('、')}`)

  const 語料 = 清洗連續文本(fs.readFileSync(path.join(PUBLIC_DIR, 'texts/literature.txt'), 'utf8'))
  const 當量表文本 = fs.readFileSync(path.join(PUBLIC_DIR, 'settings/equivTable.json'), 'utf8')
  const 當量表 = JSON.parse(當量表文本).data as Record<string, number>

  const 指紋 = 計算輸入指紋(語料, 當量表文本, 各方案)
  if (!選項.強制 && 指紋 === 讀取已有指紋()) {
    console.log(`⏭️  語料、當量表、各參考碼表均未變（指紋 ${指紋}），跳過重算`)
    console.log('   要強制重算：pnpm reference --force')
    return { 已跳過: true }
  }

  console.log(`📖 語料 ${語料.length} 字`)
  console.log(
    `🎲 ${各方案.length} 個方案 × ${窗口長度列表.length} 個窗口 × 2 個口徑，` +
      `每格抽樣 ${參考樣本數.toLocaleString()} 次（約需數分鐘）`
  )
  console.log('')

  const 結果: Record<string, Record<string, Record<number, unknown>>> = {}

  for (const 方案 of 各方案) {
    const { rawCodeTable } = await 碼表處理服務實例.解析原始碼表文本(
      方案.碼表文本,
      方案.碼表元數據.分隔符 ?? '空格',
      方案.碼表元數據.第一列類型 ?? '字符'
    )
    const 處理結果 = await 碼表處理服務實例.處理原始碼表(rawCodeTable, {
      最大碼長: 方案.配置.方案參數.最大碼長,
      編碼終止指示符列表: 方案.配置.方案參數.編碼終止指示符列表,
    })

    console.log(`📇 ${方案.方案名}（${方案.鍵名}）碼表 ${處理結果.全碼表.size} 字`)

    const 各口徑 = [
      { 口徑: '全碼加選重', 碼表: 處理結果.全碼加選重鍵表 },
      { 口徑: '全部簡碼加選重', 碼表: 處理結果.簡碼加選重鍵表 },
    ] as const

    結果[方案.鍵名] = {}
    for (const { 口徑, 碼表 } of 各口徑) {
      結果[方案.鍵名]![口徑] = {}
      for (const 窗口長度 of 窗口長度列表) {
        const 統計 = 蒙特卡洛連續文本當量(語料, 碼表, 當量表, {
          窗口長度,
          樣本數: 參考樣本數,
          選重鍵表: 方案.選重鍵表 as Record<string, string>,
        })
        結果[方案.鍵名]![口徑]![窗口長度] = {
          平均數: Number(統計.平均數.toFixed(5)),
          標準差: Number(統計.標準差.toFixed(5)),
        }
        console.log(
          `   ${口徑.padEnd(16)} 窗口 ${String(窗口長度).padStart(3)}  ` +
            `μ ${統計.平均數.toFixed(4)}  σ ${統計.標準差.toFixed(4)}`
        )
      }
    }
    console.log('')
  }

  /**
   * JSON 轉 TS 字面量：能當標識符用的鍵去掉引號，其餘保留
   *
   * 方案鍵名帶連字號（yuhao-joy），去了引號就不是合法標識符了。
   */
  const 轉字面量 = (值: unknown) =>
    JSON.stringify(值, null, 2).replace(/"([^"]+)":/g, (原文, 鍵: string) =>
      /^(?:[A-Za-z_$一-鿿][\w$一-鿿]*|\d+)$/.test(鍵) ? `${鍵}:` : 原文
    )

  const 方案列表字面量 = 各方案
    .map(項 => `  { 鍵名: '${項.鍵名}', 方案名: '${項.方案名}' },`)
    .join('\n')

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

/**
 * 可選的參考方案，排第一的是頁面默認值
 *
 * 一次只在圖上畫一條參考曲線；要比別的方案就在下拉選單裡切換。
 */
export const 參考方案列表 = [
${方案列表字面量}
] as const

/** 參考方案鍵名 */
export type 參考方案鍵名 = (typeof 參考方案列表)[number]['鍵名']

/** 頁面默認選中的參考方案 */
export const 默認參考方案: 參考方案鍵名 = '${各方案[0]!.鍵名}'

/** 取參考方案的顯示名 */
export function 取參考方案名(鍵名: 參考方案鍵名): string {
  return 參考方案列表.find(項 => 項.鍵名 === 鍵名)?.方案名 ?? 鍵名
}

/** 生成時的語料字數 */
export const 參考語料字數 = ${語料.length}

/** 輸入指紋（語料 + 當量表 + 各參考碼表 + 抽樣設置），用於判斷是否需要重跑 */
export const 參考指紋 = '${指紋}'

/**
 * 各參考方案在各窗口長度下的當量分佈參數
 *
 * 只按「方案 × 碼表口徑 × 窗口長度」索引——抽樣次數只影響估計精度，
 * 不改變分佈本身，所以不是一個維度。
 */
export const 參考分佈表: Record<
  參考方案鍵名,
  Record<連續文本當量碼表口徑, Record<number, 參考分佈項介面 | undefined>>
> = ${轉字面量(結果)}

/**
 * 取參考分佈；没有對應窗口長度時返回 undefined
 */
export function 取參考分佈(
  方案鍵名: 參考方案鍵名,
  口徑: 連續文本當量碼表口徑,
  窗口長度: number
): 參考分佈項介面 | undefined {
  return 參考分佈表[方案鍵名]?.[口徑]?.[窗口長度]
}
`

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
