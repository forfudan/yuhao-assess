/**
 * 碼表清理服務
 * 
 * 提供碼表清理和處理功能，包括單字全碼表和簡碼表的生成
 */

import type { CodeTable } from '../types/index'

// 简单的单字符检查函数
function isSingleChar(char: string): boolean {
  return char.length === 1
}

/**
 * 碼表清理選項
 */
export interface CodeTableCleanOptions {
  // 是否只保留單字
  singleCharOnly?: boolean
  // 編碼選擇策略
  codeStrategy: 'longest' | 'shortest' | 'all'
  // 是否移除空編碼
  removeEmptyCodes?: boolean
  // 最小編碼長度
  minCodeLength?: number
  // 最大編碼長度
  maxCodeLength?: number
}

/**
 * 清理結果
 */
export interface CleanResult {
  // 清理後的碼表
  codeTable: CodeTable
  // 統計信息
  stats: {
    originalChars: number      // 原始字符數
    cleanedChars: number       // 清理後字符數
    removedChars: number       // 移除的字符數
    originalCodes: number      // 原始編碼總數
    cleanedCodes: number       // 清理後編碼總數
  }
  // 被移除的字符（用於調試）
  removedChars: string[]
}

/**
 * 清理碼表的核心函數
 * 
 * @param rawCodeTable - 原始碼表
 * @param options - 清理選項
 * @returns 清理結果
 */
export function cleanCodeTable(
  rawCodeTable: CodeTable,
  options: CodeTableCleanOptions
): CleanResult {
  const {
    singleCharOnly = true,
    codeStrategy,
    removeEmptyCodes = true,
    minCodeLength = 1,
    maxCodeLength = 10
  } = options

  const cleanedCodeTable = new Map<string, string[]>()
  const removedChars: string[] = []
  
  let originalCodes = 0
  let cleanedCodes = 0

  // 計算原始編碼總數
  for (const codes of rawCodeTable.values()) {
    originalCodes += codes.length
  }

  // 處理每個字符
  for (const [char, codes] of rawCodeTable.entries()) {
    // 檢查是否只保留單字
    if (singleCharOnly && !isSingleChar(char)) {
      removedChars.push(char)
      continue
    }

    // 過濾編碼
    let filteredCodes = codes.filter(code => {
      if (removeEmptyCodes && !code.trim()) return false
      if (code.length < minCodeLength) return false
      if (code.length > maxCodeLength) return false
      return true
    })

    // 如果沒有有效編碼，跳過該字符
    if (filteredCodes.length === 0) {
      removedChars.push(char)
      continue
    }

    // 根據策略選擇編碼
    let selectedCodes: string[]
    
    switch (codeStrategy) {
      case 'longest':
        // 選擇最長的編碼
        const maxLength = Math.max(...filteredCodes.map(code => code.length))
        selectedCodes = filteredCodes.filter(code => code.length === maxLength)
        // 如果有多個最長編碼，取第一個
        selectedCodes = [selectedCodes[0]]
        break
        
      case 'shortest':
        // 選擇最短的編碼
        const minLength = Math.min(...filteredCodes.map(code => code.length))
        selectedCodes = filteredCodes.filter(code => code.length === minLength)
        // 如果有多個最短編碼，取第一個
        selectedCodes = [selectedCodes[0]]
        break
        
      case 'all':
        // 保留所有編碼
        selectedCodes = filteredCodes
        break
        
      default:
        throw new Error(`未知的編碼策略: ${codeStrategy}`)
    }

    cleanedCodeTable.set(char, selectedCodes)
    cleanedCodes += selectedCodes.length
  }

  return {
    codeTable: cleanedCodeTable,
    stats: {
      originalChars: rawCodeTable.size,
      cleanedChars: cleanedCodeTable.size,
      removedChars: removedChars.length,
      originalCodes,
      cleanedCodes
    },
    removedChars
  }
}

/**
 * 生成單字全碼表
 * 只保留單字，對每個字提取編碼長度最長的那個code
 * 
 * @param rawCodeTable - 原始碼表
 * @returns 單字全碼表
 */
export function generateFullCodeTable(rawCodeTable: CodeTable): CleanResult {
  return cleanCodeTable(rawCodeTable, {
    singleCharOnly: true,
    codeStrategy: 'longest',
    removeEmptyCodes: true
  })
}

/**
 * 生成單字簡碼表
 * 只保留單字，對每個字提取編碼長度最短的那個code
 * 
 * @param rawCodeTable - 原始碼表
 * @returns 單字簡碼表
 */
export function generateShortCodeTable(rawCodeTable: CodeTable): CleanResult {
  return cleanCodeTable(rawCodeTable, {
    singleCharOnly: true,
    codeStrategy: 'shortest',
    removeEmptyCodes: true
  })
}

/**
 * 生成單字完整碼表（保留所有編碼）
 * 只保留單字，保留每個字的所有有效編碼
 * 
 * @param rawCodeTable - 原始碼表
 * @returns 單字完整碼表
 */
export function generateCompleteCharTable(rawCodeTable: CodeTable): CleanResult {
  return cleanCodeTable(rawCodeTable, {
    singleCharOnly: true,
    codeStrategy: 'all',
    removeEmptyCodes: true
  })
}

/**
 * 驗證碼表格式
 * 
 * @param codeTable - 要驗證的碼表
 * @returns 驗證結果
 */
export function validateCodeTable(codeTable: CodeTable): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  for (const [char, codes] of codeTable.entries()) {
    // 檢查字符
    if (!char) {
      errors.push('發現空字符')
    }
    
    if (char.length !== 1) {
      warnings.push(`字符 "${char}" 不是單字符`)
    }

    // 檢查編碼
    if (!codes || codes.length === 0) {
      errors.push(`字符 "${char}" 沒有編碼`)
    } else {
      for (const code of codes) {
        if (!code || !code.trim()) {
          errors.push(`字符 "${char}" 有空編碼`)
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * 碼表統計信息
 */
export function getCodeTableStats(codeTable: CodeTable): {
  totalChars: number
  totalCodes: number
  avgCodesPerChar: number
  codeLengthDistribution: Map<number, number>
  charTypes: {
    singleChars: number
    multiChars: number
    cjkChars: number
  }
} {
  let totalCodes = 0
  let singleChars = 0
  let multiChars = 0
  let cjkChars = 0
  const codeLengthDistribution = new Map<number, number>()

  for (const [char, codes] of codeTable.entries()) {
    totalCodes += codes.length
    
    if (char.length === 1) {
      singleChars++
      if (isSingleChar(char)) {
        cjkChars++
      }
    } else {
      multiChars++
    }

    for (const code of codes) {
      const length = code.length
      codeLengthDistribution.set(length, (codeLengthDistribution.get(length) || 0) + 1)
    }
  }

  return {
    totalChars: codeTable.size,
    totalCodes,
    avgCodesPerChar: Math.round((totalCodes / codeTable.size) * 100) / 100,
    codeLengthDistribution,
    charTypes: {
      singleChars,
      multiChars,
      cjkChars
    }
  }
}
