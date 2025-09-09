/**
 * 重碼分析服務
 * 處理重碼率計算、重碼統計和重碼報告生成
 */

import { generateCharset, type CharsetType, charsetInfo } from './charsetService'
import { generateFullCodeTable } from './codeTableCleanService'
import type { CodeTable, CharFrequency } from '../types/index'

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
 * 1. 按編碼分組，每組内按字頻降序排列
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
 * 重碼統計結果
 */
export interface DuplicateStats {
  charset: CharsetType
  charsetName: string
  description: string
  totalChars: number        // 該字符集中的總字符數
  duplicateCount: number    // 重碼字符數
  duplicateRate: number     // 重碼率 (重碼字符數 / 總字符數)
  uniqueCodes: number       // 該字符集中的唯一編碼數
  codeEfficiency: number    // 編碼效率 (唯一編碼數 / 總字符數)
}

/**
 * 計算指定字符集的重碼統計
 * 
 * @param fullCodeTable - 單字全碼表
 * @param charsetType - 字符集類型
 * @returns 重碼統計結果
 */
export async function calculateCharsetDuplicates(
  fullCodeTable: CodeTable,
  charsetType: CharsetType
): Promise<DuplicateStats> {
  // 生成字符集
  const allChars = new Set(fullCodeTable.keys())
  const charset = await generateCharset(charsetType, allChars)
  
  // 計算重碼數
  const duplicateCount = getStaticDupRate(fullCodeTable, charset)
  const totalChars = charset.size
  
  // 計算該字符集中的唯一編碼數
  const codesInCharset = new Set<string>()
  for (const char of charset) {
    const codes = fullCodeTable.get(char)
    if (codes && codes.length > 0) {
      codesInCharset.add(codes[0]) // 單字全碼表每字符只有一個編碼
    }
  }
  
  const info = charsetInfo[charsetType]
  
  return {
    charset: charsetType,
    charsetName: info.name,
    description: info.description,
    totalChars,
    duplicateCount,
    duplicateRate: totalChars > 0 ? duplicateCount / totalChars : 0,
    uniqueCodes: codesInCharset.size,
    codeEfficiency: totalChars > 0 ? codesInCharset.size / totalChars : 0
  }
}
