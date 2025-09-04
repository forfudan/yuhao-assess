import { generateCharset, type CharsetType } from './charsetService'
import { generateFullCodeTable } from './codeTableCleanService'
import type { CodeTable } from '../types/index'

// 定義返回數據的接口
export interface MaximumCandidatesResult {
  maxCount: number
  codes: Array<{
    code: string
    chars: string[]
  }>
}

/**
 * 計算指定字符集中每個編碼的最大候選項個數
 */
export async function getMaximumCandidates(
  codeTable: CodeTable,
  charsetType: CharsetType
): Promise<MaximumCandidatesResult> {
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
  
  // 統計每個編碼對應的字符
  const codeToChars = new Map<string, string[]>()
  
  for (const char of charset) {
    const codes = fullCodeTable.get(char)
    if (codes && codes.length > 0) {
      const code = codes[0] // 使用第一個編碼（全碼）
      if (!codeToChars.has(code)) {
        codeToChars.set(code, [])
      }
      codeToChars.get(code)!.push(char)
    }
  }
  
  // 找出最大候選項個數
  let maxCount = 0
  for (const chars of codeToChars.values()) {
    if (chars.length > maxCount) {
      maxCount = chars.length
    }
  }
  
  // 找出所有達到最大候選項個數的編碼
  const maxCodes: Array<{ code: string; chars: string[] }> = []
  for (const [code, chars] of codeToChars.entries()) {
    if (chars.length === maxCount) {
      maxCodes.push({ code, chars })
    }
  }
  
  return {
    maxCount,
    codes: maxCodes
  }
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
    'cjk_to_j'
  ]
  
  const results: Record<string, MaximumCandidatesResult> = {}
  
  for (const charsetType of charsetTypes) {
    try {
      const result = await getMaximumCandidates(codeTable, charsetType)
      results[charsetType] = result
    } catch (error) {
      console.error(`計算 ${charsetType} 最大候選項失敗:`, error)
      results[charsetType] = {
        maxCount: 0,
        codes: []
      }
    }
  }
  
  return results
}
