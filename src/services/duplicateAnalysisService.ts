/**
 * 重碼分析服務
 * 處理重碼率計算、重碼統計和重碼報告生成
 */

import { generateCharset, type CharsetType, charsetInfo } from './charsetService'
import type { CodeTable, CharFrequency } from '../types/index'

/**
 * 計算某個字符集下的靜態重碼數
 * @param codeTable 碼表（每個字符對應唯一編碼）
 * @param charset 字符集，可以是字符集合或 'all' 表示全部字符
 * @returns 靜態重碼的字符數量
 */
export function getStaticDupRate(
  codeTable: CodeTable,
  charset: Set<string> | 'all' = 'all'
): number {
  const codeToChars = new Map<string, string[]>()
  
  for (const [char, codes] of codeTable.entries()) {
    if (charset !== 'all' && !charset.has(char)) {
      continue
    }
    
    const code = codes[0]
    if (code) {
      if (!codeToChars.has(code)) {
        codeToChars.set(code, [])
      }
      codeToChars.get(code)!.push(char)
    }
  }
  
  let duplicateCount = 0
  for (const chars of codeToChars.values()) {
    if (chars.length > 1) {
      duplicateCount += chars.length
    }
  }
  
  return duplicateCount
}

/**
 * 計算某個字頻數據下的動態選重率
 * @param codeTable 碼表（每個字符對應唯一編碼）
 * @param charFrequency 字頻數據
 * @param sortByFrequency 是否按字頻重新排序，false 表示保持原始碼表排序
 * @returns 動態重碼率（0-1之間的小數）
 */
export function getDynamicDupRate(
  codeTable: CodeTable,
  charFrequency: CharFrequency,
  sortByFrequency: boolean = true
): number {
  const codeToCharFreqs = new Map<string, Array<{ char: string; freq: number }>>()
  
  for (const [char, codes] of codeTable.entries()) {
    const code = codes[0]
    if (code) {
      const freq = charFrequency[char] || 0
      
      if (!codeToCharFreqs.has(code)) {
        codeToCharFreqs.set(code, [])
      }
      codeToCharFreqs.get(code)!.push({ char, freq })
    }
  }
  
  let totalDupFreq = 0
  
  for (const charFreqs of codeToCharFreqs.values()) {
    if (charFreqs.length > 1) {
      if (sortByFrequency) {
        charFreqs.sort((a, b) => b.freq - a.freq)
      }
      
      const groupTotalFreq = charFreqs.reduce((sum, item) => sum + item.freq, 0)
      const firstCharFreq = charFreqs[0].freq
      totalDupFreq += groupTotalFreq - firstCharFreq
    }
  }
  
  let totalFreq = 0
  for (const [char] of codeTable.entries()) {
    totalFreq += charFrequency[char] || 0
  }
  
  return totalFreq > 0 ? totalDupFreq / totalFreq : 0
}

/**
 * 從原始順序的碼表（帶選重鍵）計算動態選重率
 * 適用於 fullWithSelection 和 shortWithSelection 碼表
 * @param codeTableWithSelection 帶選重鍵的碼表（編碼末尾包含選重數字 2-9）
 * @param charFrequency 字頻數據
 * @returns 動態重碼率（0-1之間的小數）
 */
export function getDynamicDupRateFromOriginalOrder(
  codeTableWithSelection: CodeTable,
  charFrequency: CharFrequency
): number {
  let totalDupFreq = 0
  let totalFreq = 0
  
  for (const [char, codes] of codeTableWithSelection.entries()) {
    const code = codes[0]
    if (!code) continue
    
    const freq = charFrequency[char] || 0
    totalFreq += freq
    
    // 檢查編碼最後一位是否為數字 0-9（表示需要選重）
    const lastChar = code.slice(-1)
    const isSelection = /[0-9]/.test(lastChar)
    
    if (isSelection) {
      totalDupFreq += freq
    }
  }
  
  return totalFreq > 0 ? totalDupFreq / totalFreq : 0
}

export interface DuplicateStats {
  charset: CharsetType
  charsetName: string
  description: string
  totalChars: number
  duplicateCount: number
  duplicateRate: number
  uniqueCodes: number
  codeEfficiency: number
}

/**
 * 非一選重碼字的詳細信息
 */
export interface NonFirstDuplicateDetail {
  char: string              // 非一選的重碼字
  code: string              // 對應的編碼
  frequency: number         // 該字的字頻
  rank: number              // 該字在字頻表中的排名（字頻降序）
  allCharsOnCode: string[]  // 該編碼上的所有字符（按字頻降序）
}

/**
 * 獲取非一選重碼字的詳細信息
 * @param codeTable 碼表（每個字符對應唯一編碼）
 * @param charFrequency 字頻數據
 * @param sortByFrequency 是否按字頻重新排序（true表示按字頻排序，false表示保持碼表原始順序）
 * @returns 非一選重碼字的詳細信息列表，按字頻降序排列
 */
export function getNonFirstDuplicateDetails(
  codeTable: CodeTable,
  charFrequency: CharFrequency,
  sortByFrequency: boolean = true
): NonFirstDuplicateDetail[] {
  const codeToCharFreqs = new Map<string, Array<{ char: string; freq: number }>>()
  
  // 按編碼分組字符，只保留在字頻表中存在的字符
  for (const [char, codes] of codeTable.entries()) {
    const code = codes[0]
    if (code) {
      const freq = charFrequency[char]
      // 只保留字頻表中存在的字符
      if (freq !== undefined && freq > 0) {
        if (!codeToCharFreqs.has(code)) {
          codeToCharFreqs.set(code, [])
        }
        codeToCharFreqs.get(code)!.push({ char, freq })
      }
    }
  }
  
  // 創建字頻排名映射
  const allCharsWithFreq = Object.entries(charFrequency)
    .filter(([_, freq]) => freq > 0)
    .sort(([_, freqA], [__, freqB]) => freqB - freqA)
  const charRankMap = new Map<string, number>()
  allCharsWithFreq.forEach(([char, _], index) => {
    charRankMap.set(char, index + 1)
  })
  
  const results: NonFirstDuplicateDetail[] = []
  
  for (const [code, charFreqs] of codeToCharFreqs.entries()) {
    if (charFreqs.length > 1) {
      // 排序：按字頻降序
      if (sortByFrequency) {
        charFreqs.sort((a, b) => b.freq - a.freq)
      }
      
      // 獲取該編碼上所有字符
      const allCharsOnCode = charFreqs.map(item => item.char)
      
      // 添加非一選的字符（跳過第一個）
      for (let i = 1; i < charFreqs.length; i++) {
        results.push({
          char: charFreqs[i].char,
          code: code,
          frequency: charFreqs[i].freq,
          rank: charRankMap.get(charFreqs[i].char) || 0,
          allCharsOnCode: allCharsOnCode
        })
      }
    }
  }
  
  // 結果按字頻降序排列
  results.sort((a, b) => b.frequency - a.frequency)
  
  return results
}

/**
 * 計算指定字符集的重碼統計
 * @param fullCodeTable 單字全碼表
 * @param charsetType 字符集類型
 * @returns 重碼統計結果
 */
export async function calculateCharsetDuplicates(
  fullCodeTable: CodeTable,
  charsetType: CharsetType
): Promise<DuplicateStats> {
  const allChars = new Set(fullCodeTable.keys())
  const charset = await generateCharset(charsetType, allChars)
  
  const duplicateCount = getStaticDupRate(fullCodeTable, charset)
  const totalChars = charset.size
  
  const codesInCharset = new Set<string>()
  for (const char of charset) {
    const codes = fullCodeTable.get(char)
    if (codes && codes.length > 0) {
      codesInCharset.add(codes[0])
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
