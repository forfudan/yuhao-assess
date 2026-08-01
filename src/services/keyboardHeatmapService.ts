/**
 * 鍵位熱力分析服務
 *
 * 從頁面中抽出的純計算部分，讓批量重算腳本
 * （scripts/recompute-schemes.mjs）能複用與頁面完全相同的邏輯。
 */

import type { 碼表型别 } from '../types'
import { 默認選重鍵表 } from '../types/scheme'
import type { 選重鍵表型别 } from '../types/scheme'
import { 替換選重鍵 } from './speedEquivalentService'

/**
 * 從碼表和字頻計算某模式的按鍵加權使用計數
 *
 * 選重鍵按方案配置折算後再計數，否則二重、三重的擊鍵
 * 會全部堆在數字排上，與速度當量的口徑對不上。
 * @param 碼表 全碼加選重鍵表或簡碼加選重鍵表
 * @param 字頻 字符 → 相對頻率
 * @param 選重鍵表 第 n 選 → 實際按鍵
 * @returns 按鍵 → 加權計數（空格記爲 `space`）
 */
export function 計算按鍵計數(
  碼表: 碼表型别,
  字頻: Record<string, number>,
  選重鍵表: 選重鍵表型别 = 默認選重鍵表
): Record<string, number> {
  const distribution = new Map<string, number>()

  for (const [字符, codes] of 碼表.entries()) {
    if (!codes || codes.length === 0) continue
    const weight = 字頻[字符] || 0
    for (const rawCode of codes) {
      if (!rawCode) continue
      const code = 替換選重鍵(rawCode, 選重鍵表)
      for (const ch of code.toLowerCase()) {
        const key = ch === '_' ? 'space' : ch
        distribution.set(key, (distribution.get(key) || 0) + weight)
      }
    }
  }

  const result: Record<string, number> = {}
  for (const [key, count] of distribution.entries()) {
    result[key] = count
  }
  return result
}
