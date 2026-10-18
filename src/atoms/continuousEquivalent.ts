/**
 * 連續文本當量分析結果的 Atom 狀態管理
 */
import { atomWithStorage } from 'jotai/utils'
import type { 字頻來源型别 } from '../types'
import type {
  簡碼分檔鍵,
  簡碼分檔當量項介面,
  簡碼分檔表介面,
  連續文本當量統計介面,
  緊湊分佈介面,
} from '../services/continuousEquivalentService'
import { 壓縮分佈, 展開分佈 } from '../services/continuousEquivalentService'

/** 參與連續文本當量分析的碼表口徑 */
export type 連續文本當量碼表口徑 = '全碼加選重' | '全部簡碼加選重'

/**
 * 連續文本當量分析結果
 */
export interface 連續文本當量分析結果介面 {
  /** 各碼表口徑對應的統計結果 */
  統計: Partial<Record<連續文本當量碼表口徑, 連續文本當量統計介面>>
  /**
   * 各字頻、各檔位的簡碼加選重
   *
   * 數字檔是 top N：前 N 個有效簡碼走簡碼，其餘走全碼。
   * 「全部」是該字頻下每一個有效簡碼。與「全部簡碼加選重」（每個字都取最短碼）不是同一張表。
   */
  簡碼分檔?: 簡碼分檔表介面
  /** 抽樣樣本數 */
  樣本數: number
  /** 窗口長度（字符數） */
  窗口長度: number
  更新時間: string
}

/** 存檔用的統計：分佈換成緊湊形式，其餘字段照舊 */
export type 連續文本當量統計存檔介面 = Omit<連續文本當量統計介面, '分佈'> & {
  分佈: 緊湊分佈介面
}

/** 存檔用的一檔簡碼當量 */
export interface 簡碼分檔當量存檔項介面 {
  簡碼個數: number
  統計: 連續文本當量統計存檔介面
}

export type 簡碼分檔存檔表介面 = Partial<
  Record<字頻來源型别, Partial<Record<簡碼分檔鍵, 簡碼分檔當量存檔項介面>>>
>

/**
 * 連續文本當量的存檔形式（寫進方案 JSON 的就是這個）
 *
 * 蒙特卡洛的幾萬個樣本值本身不必留：畫圖只需要各格點上的樣本個數
 * 加上幾個核心統計量，體積小到可以直接進方案 JSON。存下來之後，
 * 導入方案的人不必再等一次抽樣就能看到分佈圖。
 */
export interface 連續文本當量存檔介面 {
  統計: Partial<Record<連續文本當量碼表口徑, 連續文本當量統計存檔介面>>
  /** 舊存檔没有這一塊；缺了就只剩全碼與全部簡碼兩條曲線 */
  簡碼分檔?: 簡碼分檔存檔表介面
  樣本數: number
  窗口長度: number
  更新時間: string
}

/**
 * 運行時結果 → 存檔形式
 */
function 壓縮簡碼分檔(分檔: 簡碼分檔表介面 | undefined): 簡碼分檔存檔表介面 | undefined {
  if (!分檔) return undefined
  const 存檔: 簡碼分檔存檔表介面 = {}
  for (const [字頻, 各檔] of Object.entries(分檔) as [
    字頻來源型别,
    簡碼分檔表介面[字頻來源型别],
  ][]) {
    if (!各檔) continue
    const 存各檔: Partial<Record<簡碼分檔鍵, 簡碼分檔當量存檔項介面>> = {}
    for (const [檔位, 項] of Object.entries(各檔) as [
      簡碼分檔鍵,
      簡碼分檔當量項介面 | undefined,
    ][]) {
      if (!項) continue
      存各檔[檔位] = { 簡碼個數: 項.簡碼個數, 統計: { ...項.統計, 分佈: 壓縮分佈(項.統計.分佈) } }
    }
    if (Object.keys(存各檔).length > 0) 存檔[字頻] = 存各檔
  }
  return Object.keys(存檔).length > 0 ? 存檔 : undefined
}

export function 壓縮連續文本當量結果(結果: 連續文本當量分析結果介面): 連續文本當量存檔介面 {
  const 統計: 連續文本當量存檔介面['統計'] = {}
  for (const [口徑, 項] of Object.entries(結果.統計)) {
    if (!項) continue
    統計[口徑 as 連續文本當量碼表口徑] = { ...項, 分佈: 壓縮分佈(項.分佈) }
  }
  return {
    統計,
    簡碼分檔: 壓縮簡碼分檔(結果.簡碼分檔),
    樣本數: 結果.樣本數,
    窗口長度: 結果.窗口長度,
    更新時間: 結果.更新時間,
  }
}

/**
 * 存檔形式 → 運行時結果；格式不對時返回 null，不讓壞數據污染頁面
 */
function 展開簡碼分檔(存檔: 簡碼分檔存檔表介面 | undefined): 簡碼分檔表介面 | undefined {
  if (!存檔) return undefined
  const 結果: 簡碼分檔表介面 = {}
  for (const [字頻, 各檔] of Object.entries(存檔) as [
    字頻來源型别,
    簡碼分檔存檔表介面[字頻來源型别],
  ][]) {
    if (!各檔) continue
    const 各檔結果: Partial<Record<簡碼分檔鍵, 簡碼分檔當量項介面>> = {}
    for (const [檔位, 項] of Object.entries(各檔) as [
      簡碼分檔鍵,
      簡碼分檔當量存檔項介面 | undefined,
    ][]) {
      if (!項 || !Array.isArray(項.統計?.分佈?.個數)) continue
      各檔結果[檔位] = {
        簡碼個數: 項.簡碼個數,
        統計: { ...項.統計, 分佈: 展開分佈(項.統計.分佈) },
      }
    }
    if (Object.keys(各檔結果).length > 0) 結果[字頻] = 各檔結果
  }
  return Object.keys(結果).length > 0 ? 結果 : undefined
}

export function 展開連續文本當量結果(
  存檔: 連續文本當量存檔介面 | null | undefined
): 連續文本當量分析結果介面 | null {
  if (!存檔?.統計) return null

  const 統計: 連續文本當量分析結果介面['統計'] = {}
  for (const [口徑, 項] of Object.entries(存檔.統計)) {
    if (!項 || !Array.isArray(項.分佈?.個數)) continue
    統計[口徑 as 連續文本當量碼表口徑] = { ...項, 分佈: 展開分佈(項.分佈) }
  }
  if (Object.keys(統計).length === 0) return null

  return {
    統計,
    簡碼分檔: 展開簡碼分檔(存檔.簡碼分檔),
    樣本數: 存檔.樣本數,
    窗口長度: 存檔.窗口長度,
    更新時間: 存檔.更新時間,
  }
}

/**
 * 連續文本當量分析結果原子狀態
 *
 * 持久化到 localStorage：選預設方案時結果是從方案 JSON 的存檔讀出來的，
 * 碼表本身並没有載入，刷新後無從重算，只能靠持久化把結果留住。
 */
export const 連續文本當量分析原子狀態 = atomWithStorage<連續文本當量分析結果介面 | null>(
  '連續文本當量分析',
  null
)
