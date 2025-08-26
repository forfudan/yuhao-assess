/**
 * 速度當量分析服务
 * 处理打字速度相关的计算和分析
 */

import type { CodeTable, CharFrequency } from '../types'

/**
 * 计算码对频率
 * @param codeTable 码表
 * @param charFrequency 字频数据
 * @returns 码对频率数据
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
 * 计算速度當量（基础版本）
 * @param pairFrequencies 码对频率数据
 * @param equivTable 當量表
 * @returns 计算出的速度當量
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
 * 计算速度當量（完整版本，包含码表和字频处理）
 * @param codeTable 码表
 * @param charFrequency 字频数据
 * @param equivTable 當量表
 * @returns 计算出的速度當量
 */
export function calculateSpeedEquivFromCodeTable(
  codeTable: CodeTable,
  charFrequency: Record<string, number>,
  equivTable: Record<string, number>
): number {
  const pairFrequencies = calculateCodePairFrequencies(codeTable, charFrequency)
  return calculateSpeedEquiv(pairFrequencies, equivTable)
}
