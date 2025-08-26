/**
 * 速度當量分析服務
 * 處理打字速度相關的計算和分析
 */

import type { CodeTable, CharFrequency } from '../types'

/**
 * 計算碼對頻率
 * @param codeTable 碼表
 * @param charFrequency 字頻數據
 * @returns 碼對頻率數據
 */
export function calculateCodePairFrequencies(
  codeTable: CodeTable,
  charFrequency: Record<string, number>
): Record<string, number> {
  const pairFrequencies: Record<string, number> = {}
  
  for (const [char, codes] of codeTable.entries()) {
    const frequency = charFrequency[char] || 0
    if (frequency === 0 || codes.length === 0) continue
    
    const code = codes[0] // 使用第一個編碼
    
    // 生成所有相鄰的編碼對
    for (let i = 0; i < code.length - 1; i++) {
      const pair = code.substring(i, i + 2)
      pairFrequencies[pair] = (pairFrequencies[pair] || 0) + frequency
    }
  }
  
  return pairFrequencies
}

/**
 * 計算速度當量值（基礎版本）
 * @param pairFrequencies 碼對頻率數據
 * @param equivTable 當量表
 * @returns 計算出的速度當量值
 */
export function calculateSpeedEquiv(
  pairFrequencies: Record<string, number>,
  equivTable: Record<string, number>
): number {
  let totalWeightedEquiv = 0
  let totalFrequency = 0
  
  for (const [pair, frequency] of Object.entries(pairFrequencies)) {
    const equiv = equivTable[pair]
    if (equiv !== undefined) {
      totalWeightedEquiv += equiv * frequency
      totalFrequency += frequency
    }
  }
  
  return totalFrequency > 0 ? totalWeightedEquiv / totalFrequency : 0
}

/**
 * 計算速度當量值（完整版本，包含碼表和字頻處理）
 * @param codeTable 碼表
 * @param charFrequency 字頻數據
 * @param equivTable 當量表
 * @returns 計算出的速度當量值
 */
export function calculateSpeedEquivFromCodeTable(
  codeTable: CodeTable,
  charFrequency: Record<string, number>,
  equivTable: Record<string, number>
): number {
  const pairFrequencies = calculateCodePairFrequencies(codeTable, charFrequency)
  return calculateSpeedEquiv(pairFrequencies, equivTable)
}
