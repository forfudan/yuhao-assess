/**
 * 简码效率分析
 * 计算 5 种字频下 28 个 N 值的字频加权平均码长
 */

import { 計算指定字頻下之簡碼效率 } from '../../services/shortCodeEfficiencyService'
import type { 碼表型别, 頻率數據型别 } from '../../types'
import type { 簡碼效率分析結果介面 } from '../../atoms/shortCodeEfficiency'

// 与 web 版一致的 N 值列表（28 个值）
const N_VALUES = [
  100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000,
  6000, 7000, 8000, 9000, 10000, 12000, 15000, 20000, 30000, 50000,
]

export async function analyzeShortCodeEfficiency(
  shortCodeWithSelectionTable: 碼表型别,
  fullCodeWithSelectionTable: 碼表型别,
  charFrequencies: Record<string, 頻率數據型别>,
  maxCodeLength: number
): Promise<簡碼效率分析結果介面> {
  // 构建简码映射（取最短编码）
  const shortCodeMap = new Map<string, string>()
  for (const [char, codes] of shortCodeWithSelectionTable.entries()) {
    if (codes.length > 0) {
      const shortest = codes.reduce((a, b) => (a.length <= b.length ? a : b))
      shortCodeMap.set(char, shortest)
    }
  }

  // 构建全码映射（取最长编码）
  const fullCodeMap = new Map<string, string>()
  for (const [char, codes] of fullCodeWithSelectionTable.entries()) {
    if (codes.length > 0) {
      const longest = codes.reduce((a, b) => (a.length >= b.length ? a : b))
      fullCodeMap.set(char, longest)
    }
  }

  const calc = (freq: 頻率數據型别) =>
    計算指定字頻下之簡碼效率(freq, shortCodeMap, fullCodeMap, maxCodeLength, N_VALUES)

  const [知乎, 北語, 臺標, 古籍, 繁簡] = await Promise.all([
    Promise.resolve(calc(charFrequencies['知乎簡體字頻'] || {})),
    Promise.resolve(calc(charFrequencies['北語簡體字頻'] || {})),
    Promise.resolve(calc(charFrequencies['臺標繁體字頻'] || {})),
    Promise.resolve(calc(charFrequencies['古籍繁體字頻'] || {})),
    Promise.resolve(calc(charFrequencies['繁簡聯合字頻'] || {})),
  ])

  return {
    知乎簡體字頻下之簡碼效率: 知乎,
    北語簡體字頻下之簡碼效率: 北語,
    臺標繁體字頻下之簡碼效率: 臺標,
    古籍繁體字頻下之簡碼效率: 古籍,
    繁簡聯合字頻下之簡碼效率: 繁簡,
    計算時間: Date.now(),
  }
}
