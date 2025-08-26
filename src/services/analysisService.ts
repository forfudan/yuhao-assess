/**
 * 碼表分析服務
 * 
 * 實現各種輸入法評測指標的計算，包括靜態重碼率、動態重碼率等
 * 
 * 參考: quant.py
 */

import type { CodeTable, CharFrequency, CodeTableEntry, CodeTableMetrics } from '../types/index'

/**
 * 計算某個字符集下的靜態重碼數
 * 
 * 靜態重碼指的是在碼表中有相同編碼的字符數量，不考慮字頻
 * 參考 Python: get_static_dup_rate
 * 
 * @param codeTable - 碼表 (每個字符對應唯一編碼)
 * @param charset - 字符集，可以是字符集合或 'all' 表示全部字符
 * @returns 靜態重碼的字符數量
 */
export function getStaticDupRate(
  codeTable: CodeTable,
  charset: Set<string> | 'all' = 'all'
): number {
  // 創建編碼到字符的映射，用於檢測重複
  const codeToChars = new Map<string, string[]>()
  
  // 遍歷碼表，過濾字符集
  for (const [char, codes] of codeTable.entries()) {
    // 如果指定了字符集且當前字符不在字符集中，跳過
    if (charset !== 'all' && !charset.has(char)) {
      continue
    }
    
    // 假設每個字符只對應一個編碼（已處理過的碼表）
    const code = codes[0]
    if (code) {
      if (!codeToChars.has(code)) {
        codeToChars.set(code, [])
      }
      codeToChars.get(code)!.push(char)
    }
  }
  
  // 計算有重碼的字符數量
  let duplicateCount = 0
  for (const chars of codeToChars.values()) {
    if (chars.length > 1) {
      // 所有共享同一編碼的字符都算作重碼字符
      duplicateCount += chars.length
    }
  }
  
  return duplicateCount
}

/**
 * 計算某個字頻數據下的動態選重率
 * 
 * 動態重碼率考慮字頻權重，計算在實際使用中需要選重的概率
 * 參考 Python: get_dynamic_dup_rate
 * 
 * 算法邏輯：
 * 1. 按編碼分組，每組內按字頻降序排列
 * 2. 對於每個編碼組，除了頻率最高的字符外，其他字符的頻率都需要選重
 * 3. 動態重碼率 = 總選重頻率 / 總字頻
 * 
 * @param codeTable - 碼表 (每個字符對應唯一編碼)
 * @param charFrequency - 字頻數據
 * @returns 動態重碼率 (0-1之間的小數)
 */
export function getDynamicDupRate(
  codeTable: CodeTable,
  charFrequency: CharFrequency
): number {
  // 按編碼分組，收集每個編碼對應的字符及其頻率
  const codeToCharFreqs = new Map<string, Array<{ char: string; freq: number }>>()
  
  // 遍歷碼表
  for (const [char, codes] of codeTable.entries()) {
    // 假設每個字符只對應一個編碼（已處理過的碼表）
    const code = codes[0]
    if (code) {
      const freq = charFrequency[char] || 0
      
      if (!codeToCharFreqs.has(code)) {
        codeToCharFreqs.set(code, [])
      }
      codeToCharFreqs.get(code)!.push({ char, freq })
    }
  }
  
  // 計算動態重碼率
  let totalDupFreq = 0  // 總選重頻率
  
  for (const charFreqs of codeToCharFreqs.values()) {
    if (charFreqs.length > 1) {
      // 按頻率降序排序
      charFreqs.sort((a, b) => b.freq - a.freq)
      
      // 計算該編碼組的總頻率
      const groupTotalFreq = charFreqs.reduce((sum, item) => sum + item.freq, 0)
      
      // 最高頻字符的頻率（不需要選重）
      const firstCharFreq = charFreqs[0].freq
      
      // 需要選重的頻率 = 總頻率 - 最高頻字符頻率
      totalDupFreq += groupTotalFreq - firstCharFreq
    }
    // 注意：無重碼的編碼不會貢獻選重頻率，但會在總字頻中計算
  }
  
  // 計算總字頻（所有字符的頻率總和）
  let totalFreq = 0
  for (const [char] of codeTable.entries()) {
    totalFreq += charFrequency[char] || 0
  }
  
  // 返回動態重碼率
  return totalFreq > 0 ? totalDupFreq / totalFreq : 0
}

/**
 * 計算各種碼表指標的便捷函數
 * 
 * @param codeTable - 碼表
 * @param charFrequency - 字頻數據（可選）
 * @param charset - 字符集（可選，默認為 'all'）
 * @returns 包含各種指標的對象
 */
export function calculateCodeTableMetrics(
  codeTable: CodeTable,
  charFrequency?: CharFrequency,
  charset: Set<string> | 'all' = 'all'
): CodeTableMetrics {
  const codeStats = getCodeStats(codeTable, charset)
  
  const metrics: CodeTableMetrics = {
    // 靜態重碼數
    staticDupCount: getStaticDupRate(codeTable, charset),
    
    // 動態重碼率（如果提供了字頻數據）
    dynamicDupRate: charFrequency ? getDynamicDupRate(codeTable, charFrequency) : null,
    
    // 碼表基本統計
    totalChars: charset === 'all' ? codeTable.size : Array.from(codeTable.keys()).filter(char => charset.has(char)).length,
    
    // 編碼統計
    codeStats
  }
  
  return metrics
}

/**
 * 獲取編碼統計信息
 * 
 * @param codeTable - 碼表
 * @param charset - 字符集
 * @returns 編碼統計信息
 */
function getCodeStats(
  codeTable: CodeTable,
  charset: Set<string> | 'all' = 'all'
) {
  const codeLengths: number[] = []
  const uniqueCodes = new Set<string>()
  
  for (const [char, codes] of codeTable.entries()) {
    // 如果指定了字符集且當前字符不在字符集中，跳過
    if (charset !== 'all' && !charset.has(char)) {
      continue
    }
    
    const code = codes[0] // 假設每個字符只對應一個編碼
    if (code) {
      codeLengths.push(code.length)
      uniqueCodes.add(code)
    }
  }
  
  const avgCodeLength = codeLengths.length > 0 
    ? codeLengths.reduce((sum, len) => sum + len, 0) / codeLengths.length 
    : 0
  
  return {
    totalCodes: uniqueCodes.size,
    avgCodeLength: Math.round(avgCodeLength * 100) / 100, // 保留兩位小數
    minCodeLength: codeLengths.length > 0 ? Math.min(...codeLengths) : 0,
    maxCodeLength: codeLengths.length > 0 ? Math.max(...codeLengths) : 0
  }
}

/**
 * 輔助函數：將碼表轉換為條目數組
 * 
 * @param codeTable - 碼表
 * @param charFrequency - 字頻數據（可選）
 * @returns 碼表條目數組
 */
export function codeTableToEntries(
  codeTable: CodeTable,
  charFrequency?: CharFrequency
): CodeTableEntry[] {
  const entries: CodeTableEntry[] = []
  
  for (const [char, codes] of codeTable.entries()) {
    const code = codes[0] // 假設每個字符只對應一個編碼
    if (code) {
      entries.push({
        char,
        code,
        frequency: charFrequency?.[char]
      })
    }
  }
  
  return entries
}

/**
 * 輔助函數：從字頻數據中獲取指定字符集的子集
 * 
 * @param charFrequency - 字頻數據
 * @param charset - 字符集
 * @returns 過濾後的字頻數據
 */
export function filterCharFrequency(
  charFrequency: CharFrequency,
  charset: Set<string>
): CharFrequency {
  const filtered: CharFrequency = {}
  
  for (const char of charset) {
    if (char in charFrequency) {
      filtered[char] = charFrequency[char]
    }
  }
  
  return filtered
}

// =============================================================================
// 速度等效分析函数
// =============================================================================

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
 * 计算速度等效值（基础版本）
 * @param pairFrequencies 码对频率数据
 * @param equivTable 等效值表
 * @returns 计算出的速度等效值
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
 * 计算速度等效值（完整版本，包含码表和字频处理）
 * @param codeTable 码表
 * @param charFrequency 字频数据
 * @param equivTable 等效值表
 * @returns 计算出的速度等效值
 */
export function calculateSpeedEquivFromCodeTable(
  codeTable: CodeTable,
  charFrequency: Record<string, number>,
  equivTable: Record<string, number>
): number {
  const pairFrequencies = calculateCodePairFrequencies(codeTable, charFrequency)
  return calculateSpeedEquiv(pairFrequencies, equivTable)
}
