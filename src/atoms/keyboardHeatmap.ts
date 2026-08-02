/**
 * 鍵位熱力分析結果的 Atom 狀態管理
 *
 * 只存儲各按鍵的加權使用計數（頻率原始數據）。
 * 統計分析（手指負擔、按排分布、左右手平衡）和模擬標點使用頻率
 * 均在頁面中即時演算，不存入 atom。
 */
import { atomWithStorage } from 'jotai/utils'

/**
 * 鍵位熱力分析結果介面
 * 全碼和簡碼各存一份按鍵加權使用計數
 */
export interface 鍵位熱力分析結果介面 {
  /** 全碼各按鍵的加權使用計數 */
  全碼: Record<string, number>
  /** 簡碼各按鍵的加權使用計數 */
  簡碼: Record<string, number>
  更新時間?: string
}

/**
 * 鍵位熱力分析結果
 * 存儲全碼和簡碼的按鍵加權使用計數
 *
 * 持久化到 localStorage：選預設方案時結果是從方案 JSON 的存檔讀出來的，
 * 碼表本身並没有載入，刷新後無從重算，只能靠持久化把結果留住。
 */
export const 鍵位熱力分析原子狀態 = atomWithStorage<鍵位熱力分析結果介面 | null>(
  '鍵位熱力分析',
  null
)
