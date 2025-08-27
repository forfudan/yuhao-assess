/**
 * 码表处理服务
 * 负责预处理各种类型的码表，避免在不同组件中重复计算
 */

import { generateFullCodeTable, generateShortCodeTable } from './codeTableCleanService'
import { getFrequencyCharsUnion } from './dataService'
import type { CodeTable } from '../types'

// 处理后的码表结果接口
export interface ProcessedCodeTables {
  original: CodeTable
  full: CodeTable                    // 全码表（每个字符只保留最长编码）
  short: CodeTable                   // 简码表（每个字符只保留最短编码）
  fullWithSelection: CodeTable       // 全码加选重按键表（用于当量计算等）
  shortWithSelection: CodeTable      // 简码加选重按键表（补空格+选重键）
}

// 码表处理服务类
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
   * 处理原始码表，生成所有需要的派生码表
   */
  async processCodeTable(originalCodeTable: CodeTable, options?: { isPrefix?: boolean, maxLength?: number }): Promise<ProcessedCodeTables> {
    // 生成全码表和简码表
    const fullResult = generateFullCodeTable(originalCodeTable)
    const shortResult = generateShortCodeTable(originalCodeTable)
    
    // 计算最大码长
    const maxLength = options?.maxLength || this.calculateMaxCodeLength(originalCodeTable)  // 使用原始码表计算
    const isPrefix = options?.isPrefix || false
    
    // 保存处理选项
    this.processingOptions = { isPrefix, maxLength }
    
    // 并行获取字频字符并集和生成基础码表
    const [frequencyChars] = await Promise.all([
      getFrequencyCharsUnion().catch(() => {
        console.warn('無法獲取字頻字符並集，將使用完整碼表（性能較低）')
        return null
      })
    ])
    
    // 生成两种加选重按键的码表（使用字频优化）
    const fullWithSelection = await this.generateCodeTableWithSelection(fullResult.codeTable, maxLength, isPrefix, frequencyChars)
    const shortWithSelection = await this.generateCodeTableWithSelection(shortResult.codeTable, maxLength, isPrefix, frequencyChars)
    
    this.processedTables = {
      original: originalCodeTable,
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
   * 获取已处理的码表
   */
  getProcessedTables(): ProcessedCodeTables | null {
    return this.processedTables
  }

  getProcessingOptions(): { isPrefix: boolean; maxLength: number } | null {
    return this.processingOptions
  }

  /**
   * 清除缓存的处理结果
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
   */
  async generateCodeTableWithSelection(
    codeTable: CodeTable, 
    maxLength: number, 
    isPrefix: boolean,
    frequencyChars: Set<string> | null = null
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
        
        // 如果不是前缀码，且码长不到最大码长，且为首选时，补充一个下划线（代表空格）用于选重
        // 如果是前缀码，则不补充下划线
        if (!isPrefix && code.length < maxLength && isFirstCandidate) {
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
   */
  static async generateCodeTableWithSelection(
    codeTable: CodeTable, 
    maxLength: number, 
    isPrefix: boolean
  ): Promise<CodeTable> {
    const instance = CodeTableProcessingService.getInstance()
    
    // 获取字频字符集合（用于优化）
    let frequencyChars: Set<string> | null = null
    try {
      frequencyChars = await getFrequencyCharsUnion()
    } catch (error) {
      console.warn('無法獲取字頻字符並集，將使用完整碼表（性能較低）')
    }
    
    return instance.generateCodeTableWithSelection(codeTable, maxLength, isPrefix, frequencyChars)
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
