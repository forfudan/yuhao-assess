/**
 * 码表处理服务
 * 负责预处理各种类型的码表，避免在不同组件中重复计算
 */

import { generateFullCodeTable, generateShortCodeTable } from './codeTableCleanService'
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
  processCodeTable(originalCodeTable: CodeTable, options?: { isPrefix?: boolean, maxLength?: number }): ProcessedCodeTables {
    console.log('开始处理码表...')
    
    // 生成全码表和简码表
    const fullResult = generateFullCodeTable(originalCodeTable)
    const shortResult = generateShortCodeTable(originalCodeTable)
    
    // 计算最大码长
    const maxLength = options?.maxLength || this.calculateMaxCodeLength(fullResult.codeTable)
    const isPrefix = options?.isPrefix || false
    
    // 生成两种加选重按键的码表
    // 无论全码表还是简码表，都使用相同的逻辑：根据是否前缀码决定是否补空格
    const fullWithSelection = this.generateCodeTableWithSelection(fullResult.codeTable, maxLength, isPrefix)
    const shortWithSelection = this.generateCodeTableWithSelection(shortResult.codeTable, maxLength, isPrefix)
    
    this.processedTables = {
      original: originalCodeTable,
      full: fullResult.codeTable,
      short: shortResult.codeTable,
      fullWithSelection: fullWithSelection,
      shortWithSelection: shortWithSelection
    }
    
    console.log('码表处理完成')
    return this.processedTables
  }

  /**
   * 获取已处理的码表
   */
  getProcessedTables(): ProcessedCodeTables | null {
    return this.processedTables
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
   * 生成加选重按键的码表
   * 对于不到最大码长的编码：
   * - 如果不是前缀码且为首选：补充一个下划线（代表空格）用于选重
   * - 如果是前缀码且为首选：不补充任何东西
   * 对于重码，会添加选择键
   */
  private generateCodeTableWithSelection(
    codeTable: CodeTable, 
    maxLength: number, 
    isPrefix: boolean
  ): CodeTable {
    const processedTable = new Map<string, string[]>()
    
    // 首先收集所有编码的字符，按频率排序以确定候选顺序
    const codeToChars = new Map<string, string[]>()
    
    for (const [char, codes] of codeTable.entries()) {
      if (codes.length === 0) continue
      
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
    
    return processedTable
  }

  /**
   * 检查是否有可用的处理结果
   */
  hasProcessedTables(): boolean {
    return this.processedTables !== null
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
