/**
 * 碼表處理服務
 * 負責預處理各種類型的碼表，避免在不同組件中重複計算
 */

import { generateFullCodeTable, generateShortCodeTable } from './codeTableCleanService'
import { getFrequencyCharsUnion } from './dataService'
import { isInCJKToJ } from './charsetService'
import type { CodeTable } from '../types'

// 處理後的碼表結果接口
export interface ProcessedCodeTables {
  original: CodeTable
  full: CodeTable                    // 全碼表（每個字符只保留最長編碼）
  short: CodeTable                   // 簡碼表（每個字符只保留最短編碼）
  fullWithSelection: CodeTable       // 全碼加選重按鍵表（用於當量計算等）
  shortWithSelection: CodeTable      // 簡碼加選重按鍵表（補空格+選重鍵）
}

// 碼表處理服務類
export class CodeTableProcessingService {
  private static instance: CodeTableProcessingService
  private processedTables: ProcessedCodeTables | null = null
  private processingOptions: { isPrefix: boolean; maxLength: number } | null = null

  private constructor() {}

  static getInstance(): CodeTableProcessingService {
    if (!CodeTableProcessingService.instance) {
      CodeTableProcessingService.instance = new CodeTableProcessingService()
    }
    return CodeTableProcessingService.instance
  }

  /**
   * 過濾原始碼表，只保留 CJK 漢字（單字）
   */
  private filterOriginalCodeTable(originalCodeTable: CodeTable): CodeTable {
    const filteredCodeTable: CodeTable = new Map()
    
    for (const [char, codes] of originalCodeTable.entries()) {
      // 只保留單個 CJK 漢字
      if (Array.from(char).length === 1 && isInCJKToJ(char)) {
        filteredCodeTable.set(char, codes)
      }
    }
    
    console.log(`[CodeTableProcessingService] 原始碼表過濾：${originalCodeTable.size} -> ${filteredCodeTable.size} 個 CJK 漢字`)
    return filteredCodeTable
  }

  /**
   * 處理原始碼表，生成所有需要的派生碼表
   */
  async processCodeTable(originalCodeTable: CodeTable, options?: { isPrefix?: boolean, maxLength?: number, prefixKeys?: string[] }): Promise<ProcessedCodeTables> {
    // 首先過濾原始碼表，只保留 CJK 漢字
    const filteredOriginalCodeTable = this.filterOriginalCodeTable(originalCodeTable)
    
    // 生成全碼表和簡碼表（使用過濾後的碼表）
    const fullResult = generateFullCodeTable(filteredOriginalCodeTable)
    const shortResult = generateShortCodeTable(filteredOriginalCodeTable)
    
    // 計算最大碼長（使用過濾後的碼表）
    const maxLength = options?.maxLength || this.calculateMaxCodeLength(filteredOriginalCodeTable)
    const isPrefix = options?.isPrefix || false
    const prefixKeys = options?.prefixKeys
    
    // 保存處理選項
    this.processingOptions = { isPrefix, maxLength }
    
    // 並行獲取字頻字符並集和生成基礎碼表
    const [frequencyChars] = await Promise.all([
      getFrequencyCharsUnion().catch(() => {
        console.warn('無法獲取字頻字符並集，將使用完整碼表（性能較低）')
        return null
      })
    ])
    
    // 生成两种加选重按键的码表（使用字频优化）
    const fullWithSelection = await this.generateCodeTableWithSelection(fullResult.codeTable, maxLength, isPrefix, frequencyChars, prefixKeys)
    const shortWithSelection = await this.generateCodeTableWithSelection(shortResult.codeTable, maxLength, isPrefix, frequencyChars, prefixKeys)
    
    this.processedTables = {
      original: filteredOriginalCodeTable,  // 使用過濾後的碼表作為「原始」碼表
      full: fullResult.codeTable,
      short: shortResult.codeTable,
      fullWithSelection: fullWithSelection,
      shortWithSelection: shortWithSelection
    }
    
    return this.processedTables
  }

  private debugUnderscoreInFullWithSelection(fullWithSelection: CodeTable) {
    console.log('=== 全码加选重按键表调试 ===')
    const underscoreCodes: string[] = []
    const allCodes: string[] = []
    
    for (const [char, codes] of Object.entries(fullWithSelection)) {
      for (const code of codes) {
        allCodes.push(`${char}: ${code}`)
        if (code.endsWith('_')) {
          underscoreCodes.push(`${char}: ${code}`)
          if (underscoreCodes.length >= 10) break
        }
      }
      if (underscoreCodes.length >= 10 && allCodes.length >= 100) break
    }
    
    // 输出前10个下划线编码
    console.log('前10个末尾是下划线的编码:')
    underscoreCodes.forEach((item, index) => {
      console.log(`${index + 1}. ${item}`)
    })
    
    // 输出前100个所有编码
    console.log('前100个全码加选重编码:')
    allCodes.slice(0, 100).forEach((item, index) => {
      console.log(`${index + 1}. ${item}`)
    })
    
    console.log('=== 全码加选重按键表调试结束 ===')
  }

  /**
   * 獲取已處理的碼表
   */
  getProcessedTables(): ProcessedCodeTables | null {
    return this.processedTables
  }

  getProcessingOptions(): { isPrefix: boolean; maxLength: number } | null {
    return this.processingOptions
  }

  /**
   * 清除緩存的處理結果
   */
  clearCache(): void {
    this.processedTables = null
  }

  /**
   * 计算码表的最大码长
   */
  private calculateMaxCodeLength(codeTable: CodeTable): number {
    let maxLength = 0
    for (const codes of codeTable.values()) {
      for (const code of codes) {
        const codeLength = code.length
        if (codeLength > maxLength) {
          maxLength = Math.max(maxLength, codeLength)
        }
      }
    }
    return maxLength || 4 // 默认4位
  }

  /**
   * 生成加选重按键的码表（优化版本，支持字频过滤）
   * 对于不到最大码长的编码：
   * - 如果不是前缀码且为首选：补充一个下划线（代表空格）用于选重
   * - 如果是前缀码且为首选：不补充任何东西
   * 对于重码，会添加选择键
   * 
   * @param codeTable 原始码表
   * @param maxLength 最大码长
   * @param isPrefix 是否为前缀码
   * @param frequencyChars 字频表字符集合（用于过滤，null则不过滤）
   * @param prefixKeys 前缀码上屏键列表（可选）
   */
  async generateCodeTableWithSelection(
    codeTable: CodeTable, 
    maxLength: number, 
    isPrefix: boolean,
    frequencyChars: Set<string> | null = null,
    prefixKeys?: string[]
  ): Promise<CodeTable> {
    const processedTable = new Map<string, string[]>()
    
    // 统计信息
    let totalChars = 0
    let filteredChars = 0
    
    // 首先收集所有编码的字符，按频率排序以确定候选顺序
    const codeToChars = new Map<string, string[]>()
    
    for (const [char, codes] of codeTable.entries()) {
      if (codes.length === 0) continue
      
      totalChars++
      
      // 如果提供了字频字符集合，只处理在其中的字符
      if (frequencyChars && !frequencyChars.has(char)) {
        filteredChars++
        continue
      }
      
      for (const code of codes) {
        if (!codeToChars.has(code)) {
          codeToChars.set(code, [])
        }
        codeToChars.get(code)!.push(char)
      }
    }
    
    // 为每个字符处理编码
    for (const [char, codes] of codeTable.entries()) {
      if (codes.length === 0) continue
      
      // 字频过滤：只处理在字频表中的字符
      if (frequencyChars && !frequencyChars.has(char)) {
        continue
      }
      
      const processedCodes: string[] = []
      
      for (const code of codes) {
        const charsWithThisCode = codeToChars.get(code) || []
        const charIndex = charsWithThisCode.indexOf(char)
        const isFirstCandidate = charIndex === 0
        
        let processedCode = code
        
        // 前缀码的特殊处理逻辑：
        // 当(1)编码没有达到最大码长时，且(2)编码的最后一个字符不是 prefixKeys 中的字符或下划线(表示空格)，
        // 则在编码末尾增加一个下划线（表示空格）。这是因为如果不到最大码长，且不是以prefixKeys或下划线结尾，
        // 则意味着无法形成唯一分割，需要加一个下划线来让编码上屏。
        if (isPrefix && prefixKeys && code.length < maxLength) {
          const lastChar = code.slice(-1)
          const needsUnderscore = !prefixKeys.includes(lastChar) && lastChar !== '_'
          if (needsUnderscore) {
            processedCode = code + '_'
          }
        } else if (!isPrefix && code.length < maxLength && isFirstCandidate) {
          // 非前缀码的原有逻辑：首选且未达到最大码长时补充下划线
          processedCode = code + '_'
        }
        
        // 如果有多个候选，且不是首选，添加选择键
        if (charsWithThisCode.length > 1 && charIndex > 0) {
          const selectKeys = [';', "'", '4', '5', '6', '7', '8', '9']
          if (charIndex - 1 < selectKeys.length) {
            processedCode += selectKeys[charIndex - 1]
          } else {
            // 超过选择键数量时用数字继续
            processedCode += (charIndex + 1).toString()
          }
        }
        
        processedCodes.push(processedCode)
      }
      
      processedTable.set(char, processedCodes)
    }
    
    // 输出优化统计信息
    if (frequencyChars) {
      const remainingChars = totalChars - filteredChars
      const reductionPercent = ((filteredChars / totalChars) * 100).toFixed(1)
      console.log(`碼表字頻優化: 原始 ${totalChars} 字符，過濾 ${filteredChars} 字符，保留 ${remainingChars} 字符 (減少 ${reductionPercent}%)`)
    }
    
    return processedTable
  }

  /**
   * 检查是否有可用的处理结果
   */
  hasProcessedTables(): boolean {
    return this.processedTables !== null
  }

  /**
   * 静态方法：生成加选重按键的码表（供外部直接调用）
   * @param codeTable 原始码表
   * @param maxLength 最大码长
   * @param isPrefix 是否为前缀码
   * @param prefixKeys 前缀码上屏键列表（可选）
   */
  static async generateCodeTableWithSelection(
    codeTable: CodeTable, 
    maxLength: number, 
    isPrefix: boolean,
    prefixKeys?: string[]
  ): Promise<CodeTable> {
    const instance = CodeTableProcessingService.getInstance()
    
    // 获取字频字符集合（用于优化）
    let frequencyChars: Set<string> | null = null
    try {
      frequencyChars = await getFrequencyCharsUnion()
    } catch (error) {
      console.warn('無法獲取字頻字符並集，將使用完整碼表（性能較低）')
    }
    
    return instance.generateCodeTableWithSelection(codeTable, maxLength, isPrefix, frequencyChars, prefixKeys)
  }

  /**
   * 获取特定类型的码表
   */
  getCodeTable(type: 'original' | 'full' | 'short' | 'fullWithSelection' | 'shortWithSelection'): CodeTable | null {
    if (!this.processedTables) {
      return null
    }
    return this.processedTables[type]
  }
}

// 导出单例实例
export const codeTableProcessingService = CodeTableProcessingService.getInstance()
