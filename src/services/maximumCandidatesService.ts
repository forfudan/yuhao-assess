import { generateCharset, type CharsetType } from './charsetService'
import { generateFullCodeTable } from './codeTableCleanService'
import type { CodeTable } from '../types/index'

/**
 * 計算指定字符集中每個編碼的最大候選項個數
 */
export async function getMaximumCandidates(
  codeTable: CodeTable,
  charsetType: CharsetType
): Promise<number> {
  // 從碼表鍵中提取所有單個字符
  const allUniqueChars = new Set<string>()
  for (const key of codeTable.keys()) {
    for (const char of key) {
      allUniqueChars.add(char)
    }
  }

  // 生成全碼表
  const fullCodeResult = generateFullCodeTable(codeTable)
  const fullCodeTable = fullCodeResult.codeTable
  
  // 生成指定字符集
  const charset = await generateCharset(charsetType, allUniqueChars)
  
  // 統計每個編碼對應的字符數量
  const codeToCharsCount = new Map<string, number>()
  
  for (const char of charset) {
    const codes = fullCodeTable.get(char)
    if (codes && codes.length > 0) {
      const code = codes[0] // 使用第一個編碼（全碼）
      const currentCount = codeToCharsCount.get(code) || 0
      codeToCharsCount.set(code, currentCount + 1)
    }
  }
  
  // 找出最大候選項個數
  let maxCandidates = 0
  for (const count of codeToCharsCount.values()) {
    if (count > maxCandidates) {
      maxCandidates = count
    }
  }
  
  return maxCandidates
}

/**
 * 計算所有字符集的最大候選項個數
 */
export async function getAllMaximumCandidates(codeTable: CodeTable) {
  const charsetTypes: CharsetType[] = [
    'gb2312',
    'guozi',
    'cjk_basic',
    'cjk_to_a',
    'cjk_to_b',
    'cjk_to_f',
    'cjk_to_i'
  ]
  
  const results: Record<string, number> = {}
  
  for (const charsetType of charsetTypes) {
    try {
      const maxCandidates = await getMaximumCandidates(codeTable, charsetType)
      results[charsetType] = maxCandidates
    } catch (error) {
      console.error(`計算 ${charsetType} 最大候選項失敗:`, error)
      results[charsetType] = 0
    }
  }
  
  return results
}
