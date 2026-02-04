import { generateCharset, type CharsetType } from './charsetService'
import { 碼表處理服務實例 } from './codeTableService'
import type { CodeTable } from '../types/index'

// 定義返回數據的接口
export interface 最大候選個數結果 {
  最大候選個數: number
  編碼列表: string[] // 只存儲編碼，不存儲字符列表
}

/**
 * 計算指定字符集中每個編碼的最大候選項個數
 */
export async function getMaximumCandidates(
  codeTable: CodeTable,
  charsetType: CharsetType
): Promise<最大候選個數結果> {
  // 從碼表鍵中提取所有單個字符
  const allUniqueChars = new Set<string>()
  for (const key of codeTable.keys()) {
    for (const char of key) {
      allUniqueChars.add(char)
    }
  }

  // 使用全局緩存的正確處理結果，而不是重新處理
  const processedTables = 碼表處理服務實例.獲取已處理碼表()
  if (!processedTables) {
    throw new Error('全局碼表處理結果不可用，請先處理主碼表')
  }

  const fullCodeTable = processedTables.全碼表

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
  let 最大候選個數 = 0
  for (const chars of codeToChars.values()) {
    if (chars.length > 最大候選個數) {
      最大候選個數 = chars.length
    }
  }

  // 找出所有達到最大候選項個數的編碼（只存儲編碼，不存儲字符）
  const 編碼列表: string[] = []
  for (const [code, chars] of codeToChars.entries()) {
    if (chars.length === 最大候選個數) {
      編碼列表.push(code)
    }
  }

  return {
    最大候選個數,
    編碼列表,
  }
}

/**
 * 計算所有字符集的最大候選項個數
 */
export async function getAllMaximumCandidates(codeTable: CodeTable) {
  const charsetTypes: CharsetType[] = [
    'gb2312',
    'tonggui',
    'guozi',
    'cjk_basic',
    'cjk_to_a',
    'cjk_to_b',
    'cjk_to_f',
    'cjk_to_j',
  ]

  const results: Record<string, 最大候選個數結果> = {}

  for (const charsetType of charsetTypes) {
    try {
      const result = await getMaximumCandidates(codeTable, charsetType)
      results[charsetType] = result
    } catch (error) {
      console.error(`計算 ${charsetType} 最大候選項失敗:`, error)
      results[charsetType] = {
        最大候選個數: 0,
        編碼列表: [],
      }
    }
  }

  return results
}
