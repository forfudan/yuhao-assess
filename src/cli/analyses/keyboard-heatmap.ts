/**
 * 键位热力分析
 * 使用北语简体字频计算全码和简码各按键的加权使用计数
 *
 * 注：按键计数逻辑与 KeyboardHeatmapPage.tsx 中的 計算按鍵計數 等价，
 * 因该函数定义在页面组件内未提取为 service，此处直接实现。
 */

import type { 碼表型别, 頻率數據型别 } from '../../types'
import type { 鍵位熱力分析結果介面 } from '../../atoms/keyboardHeatmap'

function calcKeyCount(codeTable: 碼表型别, charFreq: 頻率數據型别): Record<string, number> {
  const distribution = new Map<string, number>()

  for (const [char, codes] of codeTable.entries()) {
    if (!codes || codes.length === 0) continue
    const weight = charFreq[char] || 0
    for (const code of codes) {
      if (!code) continue
      for (const ch of code.toLowerCase()) {
        // _ 转为 space
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

export async function analyzeKeyboardHeatmap(
  fullCodeWithSelectionTable: 碼表型别,
  shortCodeWithSelectionTable: 碼表型别,
  charFreq: 頻率數據型别
): Promise<鍵位熱力分析結果介面> {
  const 全碼 = calcKeyCount(fullCodeWithSelectionTable, charFreq)
  const 簡碼 = calcKeyCount(shortCodeWithSelectionTable, charFreq)

  return {
    全碼,
    簡碼,
    更新時間: new Date().toISOString(),
  }
}
