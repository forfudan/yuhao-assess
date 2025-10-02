/**
 * 碼表處理服務
 * 負責預處理各種類型的碼表，避免在不同組件中重複計算
 */

import { getFrequencyCharsUnion } from './dataService'
import { isInCJKToJ } from './charsetService'
import type { CodeTable, RawCodeTable } from '../types'

// 處理後的碼表結果接口
export interface ProcessedCodeTables {
  full: CodeTable                    // 全碼表（每個字符只保留最長編碼，保持原始順序）
  short: CodeTable                   // 簡碼表（每個字符只保留最短編碼，保持原始順序）
  fullWithSelection: CodeTable       // 全碼加選重按鍵表（用於當量計算等，保持原始順序）
  shortWithSelection: CodeTable      // 簡碼加選重按鍵表（補空格+選重鍵，保持原始順序）
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
   * 直接從 RawCodeTable 生成四个辅助碼表，单次遍歷完成
   * 
   * @param rawCodeTable 原始碼表（行号 -> [字符, 編碼, N选]）
   * @param options 處理選項
   */
  async processRawCodeTable(
    rawCodeTable: RawCodeTable,
    options?: {
      isPrefix?: boolean
      maxLength?: number
      prefixKeys?: string[]
    }
  ): Promise<ProcessedCodeTables> {
    
    const isPrefix = options?.isPrefix || false
    const prefixKeys = options?.prefixKeys
    
    // 初始化四個輔助碼表
    const full: CodeTable = new Map()
    const short: CodeTable = new Map()
    const fullWithSelection: CodeTable = new Map()
    const shortWithSelection: CodeTable = new Map()
    
    // 追蹤每個字符的最大和最小編碼長度
    const maxCodeLengthMap = new Map<string, number>()
    const minCodeLengthMap = new Map<string, number>()
    
    // 計算全局最大碼長
    let globalMaxLength = 0
    for (const [, [, code]] of rawCodeTable) {
      globalMaxLength = Math.max(globalMaxLength, code.length)
    }
    const maxLength = options?.maxLength || globalMaxLength || 4
    
    // 保存處理選項
    this.processingOptions = { isPrefix, maxLength }
    
    // 按行號順序遍歷 rawCodeTable
    const sortedEntries = Array.from(rawCodeTable.entries()).sort((a, b) => a[0] - b[0])
    
    for (const [, [char, code, position]] of sortedEntries) {
      // 只處理單個 CJK 漢字
      if (Array.from(char).length !== 1 || !isInCJKToJ(char)) {
        continue
      }
      
      const codeLength = code.length
      const currentMaxLength = maxCodeLengthMap.get(char)
      const currentMinLength = minCodeLengthMap.get(char)
      
      // 生成帶選重的編碼
      const codeWithSelection = this.generateCodeWithSelection(
        code, position, codeLength, maxLength, isPrefix, prefixKeys
      )
      
      // 首次遇到該字符
      if (currentMaxLength === undefined) {
        full.set(char, [code])
        short.set(char, [code])
        fullWithSelection.set(char, [codeWithSelection])
        shortWithSelection.set(char, [codeWithSelection])
        maxCodeLengthMap.set(char, codeLength)
        minCodeLengthMap.set(char, codeLength)
        continue
      }
      
      // 如果新編碼長度嚴格大於當前最大編碼長度
      if (codeLength > currentMaxLength) {
        // 先刪除，再添加（保持順序）
        full.delete(char)
        fullWithSelection.delete(char)
        full.set(char, [code])
        fullWithSelection.set(char, [codeWithSelection])
        maxCodeLengthMap.set(char, codeLength)
      }
      
      // 如果新編碼長度嚴格小於當前最小編碼長度
      if (codeLength < currentMinLength!) {
        // 先刪除，再添加（保持順序）
        short.delete(char)
        shortWithSelection.delete(char)
        short.set(char, [code])
        shortWithSelection.set(char, [codeWithSelection])
        minCodeLengthMap.set(char, codeLength)
      }
    }
    
    this.processedTables = {
      full,
      short,
      fullWithSelection,
      shortWithSelection
    }
    
    return this.processedTables
  }
  
  /**
   * 生成带選重按键的編碼
   */
  private generateCodeWithSelection(
    code: string,
    position: number,
    codeLength: number,
    maxLength: number,
    isPrefix: boolean,
    prefixKeys?: string[]
  ): string {
    let processedCode = code
    
    // N選為1的特殊處理
    if (position === 1) {
      // 前綴碼的特殊處理邏輯
      if (isPrefix && prefixKeys && codeLength < maxLength) {
        const lastChar = code.slice(-1)
        const needsUnderscore = !prefixKeys.includes(lastChar) && lastChar !== '_'
        if (needsUnderscore) {
          processedCode = code + '_'
        }
      } else if (!isPrefix && codeLength < maxLength) {
        // 非前綴碼：首選且未達到最大碼長時補充下划線
        processedCode = code + '_'
      }
    }
    
    // 如果不是首選（position > 1），添加選擇鍵
    if (position > 1) {
      // 使用數字 2, 3, 4, 5, 6, 7, 8, 9...
      processedCode += position.toString()
    }
    
    return processedCode
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
   * 檢查是否有可用的處理结果
   */
  hasProcessedTables(): boolean {
    return this.processedTables !== null
  }

  /**
   * 獲取特定類型的碼表
   */
  getCodeTable(type: 'full' | 'short' | 'fullWithSelection' | 'shortWithSelection'): CodeTable | null {
    if (!this.processedTables) {
      return null
    }
    return this.processedTables[type]
  }
}

// 導出單例實例
export const codeTableProcessingService = CodeTableProcessingService.getInstance()
