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

/**
 * 當量分佈詳情數據結構
 */
export interface EquivDistributionItem {
  equivValue: number
  keyPairs: string[]
  frequencyRatio: number  // 頻率比例（0-1之間）
  description: string  // 按鍵組合特點説明
}

/**
 * 計算當量值分檔詳情
 * 將按鍵組合按當量值分檔（1.0-2.1，每0.1一檔）
 * @param pairFrequencies 碼對頻率數據
 * @param equivTable 當量表
 * @returns 按當量值降序排列的分檔詳情
 */
export function calculateEquivDistribution(
  pairFrequencies: Record<string, number>,
  equivTable: Record<string, number>
): EquivDistributionItem[] {
  // 創建當量值檔位映射 (1.0 到 2.1，每 0.1 一檔)
  const equivBuckets: Record<number, { keyPairs: Set<string>; totalFrequency: number }> = {}
  
  // 初始化檔位（1.0 到 2.1）
  for (let i = 10; i <= 21; i++) {
    const equivValue = i / 10
    equivBuckets[equivValue] = {
      keyPairs: new Set<string>(),
      totalFrequency: 0
    }
  }
  
  // 計算總頻率
  let overallTotalFrequency = 0
  for (const frequency of Object.values(pairFrequencies)) {
    overallTotalFrequency += frequency
  }
  
  // 將每個按鍵組合歸入相應檔位
  for (const [pair, frequency] of Object.entries(pairFrequencies)) {
    const equiv = equivTable[pair]
    if (equiv !== undefined) {
      // 將當量值四捨五入到最近的0.1檔位
      const roundedEquiv = Math.round(equiv * 10) / 10
      // 確保在1.0-2.1範圍內
      const clampedEquiv = Math.max(1.0, Math.min(2.1, roundedEquiv))
      
      if (equivBuckets[clampedEquiv]) {
        equivBuckets[clampedEquiv].keyPairs.add(pair)
        equivBuckets[clampedEquiv].totalFrequency += frequency
      }
    }
  }
  
  // 轉換為數組並降序排序
  const result = Object.entries(equivBuckets)
    .map(([equivValue, data]) => ({
      equivValue: parseFloat(equivValue),
      keyPairs: Array.from(data.keyPairs).sort(),
      frequencyRatio: overallTotalFrequency > 0 ? data.totalFrequency / overallTotalFrequency : 0,
      description: generateEquivDescription(parseFloat(equivValue), Array.from(data.keyPairs))
    }))
    .filter(item => item.keyPairs.length > 0) // 過濾掉沒有數據的檔位
    .sort((a, b) => b.equivValue - a.equivValue) // 降序排序
  
  return result
}

/**
 * 根據當量值和按鍵組合生成説明
 * @param equivValue 當量值
 * @param keyPairs 按鍵組合列表
 * @returns 説明文字
 */
function generateEquivDescription(equivValue: number, keyPairs: string[]): string {
  // 根據當量值範圍返回對應的説明
  if (equivValue >= 2.1) {
    return '多為含小指或無名指的異指大跨排'
  } else if (equivValue >= 2.0) {
    return '多為單手相連二指大跨排'
  } else if (equivValue >= 1.9) {
    return '多為單手小跨排、或含小指組合'
  } else if (equivValue >= 1.8) {
    return '多為食指跨排、或單手相鄰跨排'
  } else if (equivValue >= 1.7) {
    return '多為含無名指小指單手小跨排'
  } else if (equivValue >= 1.6) {
    return '多為含食指中指單手小跨排'
  } else if (equivValue >= 1.5) {
    return '多為單手小跨排、或同指同排'
  } else if (equivValue >= 1.4) {
    return '多為含食指同手同排或小跨排'
  } else if (equivValue >= 1.3) {
    return '多為同指連擊、或非中排的雙手互擊'
  } else if (equivValue >= 1.2) {
    return '多為小跨排、或同排的雙手互擊'
  } else if (equivValue >= 1.1) {
    return '多為涉及食指和中指的雙手互擊'
  } else {
    return '雙手互擊的特殊組合'
  }
}
