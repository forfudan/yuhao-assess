/**
 * 碼表服務
 * 統一的碼表處理服務，負責解析、處理和生成各類碼表
 */

import { isInCJKToJ, loadCJKBlockData } from './charsetService'
import type { 碼表型别, 原始碼表型别, 頻率數據型别, 處理後的碼表結果介面 } from '../types'

// =============================================================================
// 類型定義
// =============================================================================

/**
 * 碼表處理選項介面
 *
 * @property 最大碼長 最大碼長
 * @property 編碼終止指示符列表 編碼終止指示符列表
 */
export interface 碼表處理選項介面 {
  最大碼長?: number // 預設爲 4
  編碼終止指示符列表?: string[] // 編碼終止指示符列表
}

// =============================================================================
// 碼表處理服務類
// =============================================================================

/**
 * 碼表處理服務
 * 提供碼表解析、處理和生成的完整功能
 */
export class 碼表處理服務 {
  private static 實例: 碼表處理服務
  private 已處理碼表: 處理後的碼表結果介面 | null = null
  private 處理選項: 碼表處理選項介面 | null = null

  private constructor() {}

  static getInstance(): 碼表處理服務 {
    if (!碼表處理服務.實例) {
      碼表處理服務.實例 = new 碼表處理服務()
    }
    return 碼表處理服務.實例
  }

  // ===========================================================================
  // 第一層：解析原始碼表文本
  // ===========================================================================

  /**
   * 解析碼表文本爲原始碼表（保持行順序）
   * @param 文本 碼表文本内容
   * @param 分隔符 分隔符類型（空格、製表符、逗號、分號）
   * @param 第一列類型 第一列類型（字符、編碼）
   */
  async 解析原始碼表文本(
    文本: string,
    分隔符: '空格' | '製表符' | '逗號' | '分號',
    第一列類型: '字符' | '編碼'
  ): Promise<{ rawCodeTable: 原始碼表型别 }> {
    // 先加載 CJK 區塊數據，確保 isInCJKToJ 可以正常工作
    await loadCJKBlockData()

    const rawCodeTable: 原始碼表型别 = new Map()
    const 行數組 = 文本.split('\n')
    let 行索引 = 0

    // 確定分隔符正則
    let 分隔符正則: RegExp
    switch (分隔符) {
      case '製表符':
        分隔符正則 = /\t+/
        break
      case '逗號':
        分隔符正則 = /,/
        break
      case '分號':
        分隔符正則 = /;/
        break
      case '空格':
      default:
        分隔符正則 = /\s+/
        break
    }

    // 第一遍：收集所有字符-編碼對
    const 臨時條目: Array<{ lineIndex: number; char: string; code: string }> = []

    for (const 行 of 行數組) {
      const 修剪後的行 = 行.trim()
      if (!修剪後的行 || 修剪後的行.startsWith('#') || 修剪後的行.startsWith('//')) {
        continue
      }

      const 部分 = 修剪後的行.split(分隔符正則)
      if (部分.length < 2) continue

      let 字符: string
      let 編碼: string

      if (第一列類型 === '字符') {
        const char = 部分[0]
        const code = 部分[1]
        if (!char || !code) continue
        字符 = char
        編碼 = code
      } else {
        const code = 部分[0]
        const char = 部分[1]
        if (!code || !char) continue
        編碼 = code
        字符 = char
      }

      // 只處理單個字符（包括 CJK 漢字）
      if (Array.from(字符).length === 1 && isInCJKToJ(字符)) {
        臨時條目.push({ lineIndex: 行索引++, char: 字符, code: 編碼 })
      }
    }

    // 第二遍：計算每個編碼下的 N 選位置
    const 編碼位置映射 = new Map<string, Map<string, number>>() // 編碼 -> 字符 -> 位置

    for (const 條目 of 臨時條目) {
      const { code: 編碼, char: 字符 } = 條目

      if (!編碼位置映射.has(編碼)) {
        編碼位置映射.set(編碼, new Map())
      }

      const 字符映射 = 編碼位置映射.get(編碼)!
      if (!字符映射.has(字符)) {
        // 當前編碼下已有的字符數量 + 1 就是這個字符的位置
        字符映射.set(字符, 字符映射.size + 1)
      }
    }

    // 第三遍：構建最終的 RawCodeTable，包含 N 選信息
    for (const 條目 of 臨時條目) {
      const { lineIndex: 行索引, char: 字符, code: 編碼 } = 條目
      const 位置 = 編碼位置映射.get(編碼)!.get(字符)!
      rawCodeTable.set(行索引, [字符, 編碼, 位置])
    }

    return { rawCodeTable }
  }

  // ===========================================================================
  // 第二層：處理原始碼表（生成四個輔助碼表）
  // ===========================================================================

  /**
   * 處理原始碼表，生成四個輔助碼表
   * @param 原始碼表 原始碼表（行號 -> [字符, 編碼, N選]）
   * @param options 處理選項
   */
  async 處理原始碼表(
    原始碼表: 原始碼表型别,
    options?: 碼表處理選項介面
  ): Promise<處理後的碼表結果介面> {
    const maxLength = options?.最大碼長 || 4
    const 編碼終止指示符列表 = options?.編碼終止指示符列表
    const 是否存在編碼終止指示符 = !!(編碼終止指示符列表 && 編碼終止指示符列表.length > 0)

    // 初始化四個輔助碼表
    const full: 碼表型别 = new Map()
    const short: 碼表型别 = new Map()
    const 全碼加選重鍵表: 碼表型别 = new Map()
    const 簡碼加選重鍵表: 碼表型别 = new Map()

    // 追蹤每個字符的最大和最小編碼長度
    const maxCodeLengthMap = new Map<string, number>()
    const minCodeLengthMap = new Map<string, number>()

    // 計算全局最大碼長
    let globalMaxLength = 0
    for (const [, [, code]] of 原始碼表) {
      globalMaxLength = Math.max(globalMaxLength, code.length)
    }

    // 保存處理選項
    this.處理選項 = { 最大碼長: maxLength, 編碼終止指示符列表 }

    // 按行號順序遍歷 原始碼表
    const sortedEntries = Array.from(原始碼表.entries()).sort((a, b) => a[0] - b[0])

    for (const [, [char, code, position]] of sortedEntries) {
      // 只處理單個 CJK 漢字
      if (Array.from(char).length !== 1 || !isInCJKToJ(char)) {
        continue
      }

      const codeLength = code.length
      const currentMaxLength = maxCodeLengthMap.get(char)
      const currentMinLength = minCodeLengthMap.get(char)

      // 生成帶選重的編碼
      const codeWithSelection = this.生成帶選重鍵的編碼(
        code,
        position,
        codeLength,
        maxLength,
        是否存在編碼終止指示符,
        編碼終止指示符列表
      )

      // 首次遇到該字符
      if (currentMaxLength === undefined) {
        full.set(char, [code])
        short.set(char, [code])
        全碼加選重鍵表.set(char, [codeWithSelection])
        簡碼加選重鍵表.set(char, [codeWithSelection])
        maxCodeLengthMap.set(char, codeLength)
        minCodeLengthMap.set(char, codeLength)
        continue
      }

      // 如果新編碼長度嚴格大於當前最大編碼長度
      if (codeLength > currentMaxLength) {
        full.delete(char)
        全碼加選重鍵表.delete(char)
        full.set(char, [code])
        全碼加選重鍵表.set(char, [codeWithSelection])
        maxCodeLengthMap.set(char, codeLength)
      }

      // 如果新編碼長度嚴格小於當前最小編碼長度
      if (codeLength < currentMinLength!) {
        short.delete(char)
        簡碼加選重鍵表.delete(char)
        short.set(char, [code])
        簡碼加選重鍵表.set(char, [codeWithSelection])
        minCodeLengthMap.set(char, codeLength)
      }
    }

    this.已處理碼表 = {
      全碼表: full,
      簡碼表: short,
      全碼加選重鍵表,
      簡碼加選重鍵表,
    }

    return this.已處理碼表
  }

  // ===========================================================================
  // 詞語碼表生成（保留功能）
  // ===========================================================================

  /**
   * 生成詞語全碼輔助碼表（帶選重鍵）
   * 單字詞使用全碼，多字詞從全碼截取
   * @param wordFreq 歸一化後的詞頻表（按頻數降序排列）
   * @param fullCodeTable 單字全碼表
   * @returns 詞語碼表 Map<詞語, [編碼+選重鍵]>
   */
  生成詞語全碼表(wordFreq: 頻率數據型别, fullCodeTable: 碼表型别): 碼表型别 {
    const 詞語全碼加選重鍵表: 碼表型别 = new Map()

    // 獲取處理選項
    const options = this.處理選項
    if (!options) {
      console.warn('[碼表處理服務] 處理選項未設置，無法生成詞語碼表')
      return 詞語全碼加選重鍵表
    }

    const { 最大碼長: maxLength = 4, 編碼終止指示符列表 } = options
    const 是否存在編碼終止指示符 = !!(編碼終止指示符列表 && 編碼終止指示符列表.length > 0)

    // 用於追蹤每個編碼的出現次數（選重位置）
    const codePositionMap = new Map<string, number>()

    // 詞頻表已經按頻數降序排列，直接遍歷
    for (const [word] of Object.entries(wordFreq)) {
      // 生成詞語編碼
      const code = this.生成詞語編碼(word, fullCodeTable)
      if (!code) continue

      // 獲取當前編碼的選重位置
      const position = (codePositionMap.get(code) || 0) + 1
      codePositionMap.set(code, position)

      // 生成帶選重鍵的編碼
      const codeWithSelection = this.生成帶選重鍵的編碼(
        code,
        position,
        code.length,
        maxLength,
        是否存在編碼終止指示符,
        編碼終止指示符列表
      )

      詞語全碼加選重鍵表.set(word, [codeWithSelection])
    }

    console.log(`[碼表處理服務] 詞語全碼表生成完成，共 ${詞語全碼加選重鍵表.size} 個詞語`)
    return 詞語全碼加選重鍵表
  }

  /**
   * 生成詞語簡碼輔助碼表（帶選重鍵）
   * 單字詞使用簡碼，多字詞從全碼截取
   * @param wordFreq 歸一化後的詞頻表（按頻數降序排列）
   * @param fullCodeTable 單字全碼表
   * @param shortCodeTable 單字簡碼表
   * @returns 詞語碼表 Map<詞語, [編碼+選重鍵]>
   */
  生成詞語簡碼表(
    wordFreq: 頻率數據型别,
    fullCodeTable: 碼表型别,
    shortCodeTable: 碼表型别
  ): 碼表型别 {
    const 詞語簡碼加選重鍵表: 碼表型别 = new Map()

    // 獲取處理選項
    const options = this.處理選項
    if (!options) {
      console.warn('[碼表處理服務] 處理選項未設置，無法生成詞語簡碼表')
      return 詞語簡碼加選重鍵表
    }

    const { 最大碼長: maxLength = 4, 編碼終止指示符列表 } = options
    const 是否存在編碼終止指示符 = !!(編碼終止指示符列表 && 編碼終止指示符列表.length > 0)

    // 用於追蹤每個編碼的出現次數（選重位置）
    const codePositionMap = new Map<string, number>()

    // 詞頻表已經按頻數降序排列，直接遍歷
    for (const [word] of Object.entries(wordFreq)) {
      // 生成詞語編碼（單字詞使用簡碼）
      const code = this.生成詞語編碼(word, fullCodeTable, shortCodeTable, true)
      if (!code) continue

      // 獲取當前編碼的選重位置
      const position = (codePositionMap.get(code) || 0) + 1
      codePositionMap.set(code, position)

      // 生成帶選重鍵的編碼
      const codeWithSelection = this.生成帶選重鍵的編碼(
        code,
        position,
        code.length,
        maxLength,
        是否存在編碼終止指示符,
        編碼終止指示符列表
      )

      詞語簡碼加選重鍵表.set(word, [codeWithSelection])
    }

    console.log(`[碼表處理服務] 詞語簡碼表生成完成，共 ${詞語簡碼加選重鍵表.size} 個詞語`)
    return 詞語簡碼加選重鍵表
  }

  // ===========================================================================
  // 工具方法
  // ===========================================================================

  /**
   * 生成帶選重鍵的編碼
   */
  private 生成帶選重鍵的編碼(
    code: string,
    position: number,
    codeLength: number,
    maxLength: number,
    是否存在編碼終止指示符: boolean,
    編碼終止指示符列表?: string[]
  ): string {
    let processedCode = code

    // N選爲1的特殊處理
    if (position === 1) {
      // 存在編碼終止指示符的特殊處理邏輯
      if (是否存在編碼終止指示符 && 編碼終止指示符列表 && codeLength < maxLength) {
        const lastChar = code.slice(-1)
        const needsUnderscore = !編碼終止指示符列表.includes(lastChar) && lastChar !== '_'
        if (needsUnderscore) {
          processedCode = code + '_'
        }
      } else if (!是否存在編碼終止指示符 && codeLength < maxLength) {
        // 不存在編碼終止指示符：首選且未達到最大碼長時補充下劃線
        processedCode = code + '_'
      }
    }

    // 如果不是首選（position > 1），添加選擇鍵
    if (position > 1) {
      processedCode += position.toString()
    }

    return processedCode
  }

  /**
   * 生成詞語編碼（根據詞長使用不同規則）
   * @param word 詞語
   * @param fullCodeTable 單字全碼表
   * @param shortCodeTable 單字簡碼表（可選）
   * @param useShortCode 單字詞是否使用簡碼（默認false）
   */
  private 生成詞語編碼(
    word: string,
    fullCodeTable: 碼表型别,
    shortCodeTable?: 碼表型别,
    useShortCode: boolean = false
  ): string {
    try {
      const len = word.length
      if (len === 1) {
        // 單字：根據useShortCode決定使用全碼還是簡碼
        if (useShortCode && shortCodeTable) {
          const codes = shortCodeTable.get(word)
          const firstCode = codes && codes.length > 0 ? codes[0] : undefined
          return firstCode || ''
        } else {
          const codes = fullCodeTable.get(word)
          const firstCode = codes && codes.length > 0 ? codes[0] : undefined
          return firstCode || ''
        }
      } else if (len === 2) {
        // 兩字詞：兩個字各取前兩碼
        const char1 = word[0]
        const char2 = word[1]
        if (!char1 || !char2) return ''
        const code1 = fullCodeTable.get(char1)?.[0] || ''
        const code2 = fullCodeTable.get(char2)?.[0] || ''
        return code1.slice(0, 2) + code2.slice(0, 2)
      } else if (len === 3) {
        // 三字詞：首二字各取一碼，第三字兩碼
        const char1 = word[0]
        const char2 = word[1]
        const char3 = word[2]
        if (!char1 || !char2 || !char3) return ''
        const code1 = fullCodeTable.get(char1)?.[0] || ''
        const code2 = fullCodeTable.get(char2)?.[0] || ''
        const code3 = fullCodeTable.get(char3)?.[0] || ''
        return code1.slice(0, 1) + code2.slice(0, 1) + code3.slice(0, 2)
      } else {
        // 四字及以上：首二三末各取第一碼
        const char1 = word[0]
        const char2 = word[1]
        const char3 = word[2]
        const charLast = word[len - 1]
        if (!char1 || !char2 || !char3 || !charLast) return ''
        const code1 = fullCodeTable.get(char1)?.[0] || ''
        const code2 = fullCodeTable.get(char2)?.[0] || ''
        const code3 = fullCodeTable.get(char3)?.[0] || ''
        const codeLast = fullCodeTable.get(charLast)?.[0] || ''
        return code1.slice(0, 1) + code2.slice(0, 1) + code3.slice(0, 1) + codeLast.slice(0, 1)
      }
    } catch (error) {
      return ''
    }
  }

  // ===========================================================================
  // 緩存管理
  // ===========================================================================

  /**
   * 獲取已處理的碼表
   */
  獲取已處理碼表(): 處理後的碼表結果介面 | null {
    return this.已處理碼表
  }

  /**
   * 獲取處理選項
   */
  獲取處理選項(): 碼表處理選項介面 | null {
    return this.處理選項
  }

  /**
   * 獲取特定類型的碼表
   */
  獲取碼表(type: '全碼表' | '簡碼表' | '全碼加選重鍵表' | '簡碼加選重鍵表'): 碼表型别 | null {
    if (!this.已處理碼表) {
      return null
    }
    return this.已處理碼表[type]
  }

  /**
   * 檢查是否有可用的處理結果
   */
  是否有已處理碼表(): boolean {
    return this.已處理碼表 !== null
  }

  /**
   * 清除緩存的處理結果
   */
  清除緩存(): void {
    this.已處理碼表 = null
    this.處理選項 = null
  }
}

// 導出單例實例
export const 碼表處理服務實例 = 碼表處理服務.getInstance()

// =============================================================================
// [保留功能] 碼表清理工具
// 注意：這些功能來自舊 Vue 架構，暫時保留以備後用
// =============================================================================

/**
 * 碼表清理選項
 */
export interface 碼表清理選項 {
  singleCharOnly?: boolean // 是否只保留單字
  codeStrategy: 'longest' | 'shortest' | 'all' // 編碼選擇策略
  removeEmptyCodes?: boolean // 是否移除空編碼
  minCodeLength?: number // 最小編碼長度
  maxCodeLength?: number // 最大編碼長度
}

/**
 * 清理結果
 */
export interface 清理結果 {
  codeTable: 碼表型别 // 清理後的碼表
  stats: {
    originalChars: number // 原始字符數
    cleanedChars: number // 清理後字符數
    removedChars: number // 移除的字符數
    originalCodes: number // 原始編碼總數
    cleanedCodes: number // 清理後編碼總數
  }
  removedChars: string[] // 被移除的字符列表
}

/**
 * 簡單的單字符檢查函數
 */
function isSingleChar(char: string): boolean {
  return Array.from(char).length === 1
}

/**
 * 清理碼表
 * @param rawCodeTable 原始碼表
 * @param options 清理選項
 * @returns 清理結果
 */
export function 清理碼表(rawCodeTable: 碼表型别, options: 碼表清理選項): 清理結果 {
  const {
    singleCharOnly = true,
    codeStrategy,
    removeEmptyCodes = true,
    minCodeLength = 1,
    maxCodeLength = 10,
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

    // 如果没有有效編碼，跳過該字符
    if (filteredCodes.length === 0) {
      removedChars.push(char)
      continue
    }

    // 根據策略選擇編碼
    let selectedCodes: string[]

    switch (codeStrategy) {
      case 'longest': {
        const maxLength = Math.max(...filteredCodes.map(code => code.length))
        selectedCodes = filteredCodes.filter(code => code.length === maxLength)
        const firstCode = selectedCodes[0]
        selectedCodes = firstCode ? [firstCode] : []
        break
      }

      case 'shortest': {
        const minLength = Math.min(...filteredCodes.map(code => code.length))
        selectedCodes = filteredCodes.filter(code => code.length === minLength)
        const firstCode = selectedCodes[0]
        selectedCodes = firstCode ? [firstCode] : []
        break
      }

      case 'all':
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
      cleanedCodes,
    },
    removedChars,
  }
}

/**
 * 驗證碼表格式
 * @param codeTable 要驗證的碼表
 * @returns 驗證結果
 */
export function 驗證碼表(codeTable: 碼表型别): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  for (const [char, codes] of codeTable.entries()) {
    if (!char) {
      errors.push('發現空字符')
    }

    if (Array.from(char).length > 1) {
      warnings.push(`字符 "${char}" 不是單字符`)
    }

    if (!codes || codes.length === 0) {
      errors.push(`字符 "${char}" 没有編碼`)
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
    warnings,
  }
}

/**
 * 獲取碼表統計信息
 * @param codeTable 碼表
 * @returns 統計信息
 */
export function 獲取碼表統計(codeTable: 碼表型别): {
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

    if (Array.from(char).length === 1) {
      singleChars++
      if (isInCJKToJ(char)) {
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
      cjkChars,
    },
  }
}
