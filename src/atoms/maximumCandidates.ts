/**
 * 候選個數分析原子狀態
 * 存儲候選個數分析的統計結果（可導出到 JSON）
 */

import { atomWithStorage } from 'jotai/utils'

/**
 * 單個字符集的最大候選項結果
 */
export interface 最大候選個數結果 {
  最大候選個數: number
  編碼列表: string[] // 只存儲編碼，字符在需要時從碼表實時計算
}

/**
 * 最大候選個數分析完整結果
 * 這些數據會持久化，可以導出到 JSON
 */
export interface 最大候選個數分析結果 {
  // 各字符集的候選個數
  gb2312?: 最大候選個數結果
  tonggui?: 最大候選個數結果
  guozi?: 最大候選個數結果
  cjk_basic?: 最大候選個數結果
  cjk_to_a?: 最大候選個數結果
  cjk_to_b?: 最大候選個數結果
  cjk_to_f?: 最大候選個數結果
  cjk_to_j?: 最大候選個數結果

  // 元數據
  字符數?: number // 總字符數
  更新時間?: string
  碼表哈希?: string // 用於判斷碼表是否變化
}

/**
 * 候選個數分析原子狀態（持久化到 localStorage）
 */
export const 候選個數分析原子狀態 = atomWithStorage<最大候選個數分析結果 | null>(
  'maximumCandidatesAnalysis',
  null
)
