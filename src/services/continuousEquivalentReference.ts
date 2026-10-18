/**
 * 連續文本當量的參考分佈
 *
 * 參考曲線的 μ / σ 直接取自各方案 JSON 裏存好的 測評結果.連續文本當量，
 * 不再另外生成一份常量表——那份表遲早會和方案 JSON 對不上口徑。
 * 代價是參考只覆蓋方案存檔用的那個窗口長度（重算腳本固定爲 100 字）：
 * 用户把窗口改成别的值時查不到參考，這是對的，
 * 拿窗口 100 的 σ 去比窗口 20 的分佈只會得出錯誤結論。
 */

import type { 方案列表項介面 } from '@/types/scheme'
import type { 字頻來源型别 } from '@/types'
import type {
  連續文本當量碼表口徑,
  連續文本當量分析結果介面,
  連續文本當量存檔介面,
} from '@/atoms/continuousEquivalent'
import type { 簡碼分檔鍵, 簡碼分檔當量項介面 } from '@/services/continuousEquivalentService'
import { 簡碼分檔數值列表, 全部簡碼分檔, 展開分佈 } from '@/services/continuousEquivalentService'

/** 一組常態分佈參數 */
export interface 參考分佈項介面 {
  平均數: number
  標準差: number
}

/** 下拉選單裏的一個參考方案 */
export interface 參考方案項介面 {
  鍵名: string
  方案名: string
}

/**
 * 頁面默認選中的參考方案
 *
 * 卿雲是文檔和討論裏最常拿來做基準的方案，所以固定默認選它；
 * 該方案不在列表裏（比如被停用了）時退回列表第一項。
 */
export const 默認參考方案鍵名 = 'yuhao-joy'

/**
 * 從方案列表中挑出能當參考的那些
 *
 * 順序照搬傳入的方案列表（即 builtin-schemes.json 的順序），
 * 没有連續文本當量存檔的方案不會出現在選單裏。
 */
export function 取可用參考方案(方案列表: 方案列表項介面[]): 參考方案項介面[] {
  return 方案列表
    .filter(項 => 項.配置.測評結果?.連續文本當量?.統計)
    .map(項 => ({ 鍵名: 項.鍵名, 方案名: 項.配置.元數據.方案名 }))
}

/**
 * 取某個參考方案的分佈參數
 *
 * @param 窗口長度 當前圖上用的窗口長度；與存檔不一致時返回 undefined
 * @returns 平均數與標準差；查不到時返回 undefined
 */
export function 取參考分佈(
  方案列表: 方案列表項介面[],
  鍵名: string,
  口徑: 連續文本當量碼表口徑,
  窗口長度: number
): 參考分佈項介面 | undefined {
  const 存檔 = 方案列表.find(項 => 項.鍵名 === 鍵名)?.配置.測評結果?.連續文本當量
  if (!存檔 || 存檔.窗口長度 !== 窗口長度) return undefined

  const 統計 = 存檔.統計?.[口徑]
  if (!統計) return undefined

  return { 平均數: 統計.平均數, 標準差: 統計.標準差 }
}

/** 取參考方案存檔用的窗口長度，用於在窗口對不上時給出提示 */
export function 取參考窗口長度(方案列表: 方案列表項介面[], 鍵名: string): number | undefined {
  return 方案列表.find(項 => 項.鍵名 === 鍵名)?.配置.測評結果?.連續文本當量?.窗口長度
}

/** 取參考方案的顯示名 */
export function 取參考方案名(方案列表: 方案列表項介面[], 鍵名: string): string {
  return 方案列表.find(項 => 項.鍵名 === 鍵名)?.配置.元數據.方案名 ?? 鍵名
}

const 簡碼檔位順序: 簡碼分檔鍵[] = [
  ...簡碼分檔數值列表.map(數 => String(數) as 簡碼分檔鍵),
  全部簡碼分檔,
]

function 取列表存檔(方案列表: 方案列表項介面[], 鍵名: string): 連續文本當量存檔介面 | undefined {
  return 方案列表.find(項 => 項.鍵名 === 鍵名)?.配置.測評結果?.連續文本當量
}

function 取標識符存檔(
  方案列表: 方案列表項介面[],
  標識符: string | undefined
): 連續文本當量存檔介面 | undefined {
  if (!標識符) return undefined
  return 方案列表.find(項 => 項.配置.元數據.標識符 === 標識符)?.配置.測評結果?.連續文本當量
}

/**
 * 把存檔或運行時的一檔還原成圖表能吃的統計
 *
 * 運行時的分佈是 `{當量值, 個數}[]`，存檔是緊湊格點。兩種都認。
 */
export function 讀取簡碼分檔項(
  來源: 連續文本當量分析結果介面 | 連續文本當量存檔介面 | null | undefined,
  字頻: 字頻來源型别,
  檔位: 簡碼分檔鍵
): 簡碼分檔當量項介面 | undefined {
  const 原始 = 來源?.簡碼分檔?.[字頻]?.[檔位]
  if (!原始?.統計) return undefined
  if (Array.isArray(原始.統計.分佈)) return 原始 as 簡碼分檔當量項介面
  if (!Array.isArray(原始.統計.分佈?.個數)) return undefined
  return {
    簡碼個數: 原始.簡碼個數,
    統計: { ...原始.統計, 分佈: 展開分佈(原始.統計.分佈) },
  }
}

/** 只關心某個字頻下有哪些檔、每檔幾個簡碼。運行時和存檔都能對上這個形狀 */
type 簡碼檔位索引 = Partial<Record<簡碼分檔鍵, { 簡碼個數: number }>>

/**
 * 當前方案在某個字頻下有哪些檔
 *
 * 頁面上剛算完的結果優先。結果裏還没有分檔（舊的 localStorage）
 * 而方案列表裏的存檔抽樣設置又對得上時，改讀存檔。
 */
export function 取當前字頻分檔(
  運行時: 連續文本當量分析結果介面 | null,
  方案列表: 方案列表項介面[],
  標識符: string | undefined,
  字頻: 字頻來源型别
): 簡碼檔位索引 | undefined {
  const 來自結果 = 運行時?.簡碼分檔?.[字頻]
  if (來自結果 && Object.keys(來自結果).length > 0) return 來自結果

  const 存檔 = 取標識符存檔(方案列表, 標識符)
  if (!存檔?.簡碼分檔?.[字頻]) return undefined
  if (運行時 && (運行時.窗口長度 !== 存檔.窗口長度 || 運行時.樣本數 !== 存檔.樣本數)) {
    return undefined
  }
  return 存檔.簡碼分檔[字頻]
}

/** 參考方案在某個字頻下有哪些檔。窗口長度不在這裏擋，畫曲線時再比 */
export function 取參考字頻分檔(
  方案列表: 方案列表項介面[],
  鍵名: string,
  字頻: 字頻來源型别
): 簡碼檔位索引 | undefined {
  return 取列表存檔(方案列表, 鍵名)?.簡碼分檔?.[字頻]
}

/**
 * 兩個方案都算過的檔位，按 25…500、全部 的順序
 *
 * 没有參考方案時只看當前方案。數字檔在重算時就已經按「有效簡碼够不够」裁過，
 * 這裏取交集即可。
 */
export function 取可比較簡碼檔位(
  當前分檔: 簡碼檔位索引 | undefined,
  參考分檔: 簡碼檔位索引 | undefined,
  有參考方案: boolean
): 簡碼分檔鍵[] {
  if (!當前分檔) return []
  return 簡碼檔位順序.filter(檔位 => {
    if (!當前分檔[檔位]) return false
    if (!有參考方案) return true
    return !!參考分檔?.[檔位]
  })
}

/**
 * 參考曲線用的分檔參數
 *
 * 窗口與存檔不一致時不返回，避免拿不同窗口的 σ 去疊圖。
 */
export function 取參考簡碼分檔(
  方案列表: 方案列表項介面[],
  鍵名: string,
  字頻: 字頻來源型别,
  檔位: 簡碼分檔鍵,
  窗口長度: number
): (參考分佈項介面 & { 簡碼個數: number }) | undefined {
  const 存檔 = 取列表存檔(方案列表, 鍵名)
  if (!存檔 || 存檔.窗口長度 !== 窗口長度) return undefined
  const 項 = 存檔.簡碼分檔?.[字頻]?.[檔位]
  if (!項) return undefined
  return { 平均數: 項.統計.平均數, 標準差: 項.統計.標準差, 簡碼個數: 項.簡碼個數 }
}
