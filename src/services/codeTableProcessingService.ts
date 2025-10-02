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
   * 直接从 RawCodeTable 生成四个辅助码表，避免中间层
   * 
   * @param rawCodeTable 原始码表（行号 -> [字符, 编码]）
   * @param options 处理选项
   */
  async processRawCodeTable(
    rawCodeTable: RawCodeTable,
    options?: {
      isPrefix?: boolean
      maxLength?: number
      prefixKeys?: string[]
    }
  ): Promise<ProcessedCodeTables> {
    
    // 第一步：从 RawCodeTable 生成基础的 full 和 short 表
    const { full, short, maxLength: calculatedMaxLength } = this.generateBaseTablesFromRaw(rawCodeTable)
    
    // 使用传入的最大码长或计算的最大码长
    const maxLength = options?.maxLength || calculatedMaxLength
    const isPrefix = options?.isPrefix || false
    const prefixKeys = options?.prefixKeys
    
    // 保存处理选项
    this.processingOptions = { isPrefix, maxLength }
    
    // 第二步：并行获取字频字符集合用于优化
    const frequencyChars = await getFrequencyCharsUnion().catch(() => {
      console.warn('無法獲取字頻字符並集，將使用完整碼表（性能較低）')
      return null
    })
    
    // 第三步：生成加选重按键的码表（直接实现，保持原始顺序）
    const fullWithSelection = await this.generateCodeTableWithSelectionFromRaw(
      rawCodeTable, full, maxLength, isPrefix, frequencyChars, prefixKeys
    )
    const shortWithSelection = await this.generateCodeTableWithSelectionFromRaw(
      rawCodeTable, short, maxLength, isPrefix, frequencyChars, prefixKeys
    )
    
    this.processedTables = {
      full,
      short,
      fullWithSelection,
      shortWithSelection
    }
    

    
    return this.processedTables
  }

  /**
   * 从 RawCodeTable 生成基础的 full 和 short 码表
   */
  private generateBaseTablesFromRaw(rawCodeTable: RawCodeTable): {
    full: CodeTable
    short: CodeTable
    maxLength: number
  } {
    // 为每个字符选择最长和最短编码，记录对应的行号
    const charToSelectedCodes = new Map<string, {
      longest: { code: string, lineIndex: number },
      shortest: { code: string, lineIndex: number }
    }>()
    
    let maxLength = 0
    
    for (const [lineIndex, [char, code, ]] of rawCodeTable) {
      // 只处理单个 CJK 汉字
      if (Array.from(char).length !== 1 || !isInCJKToJ(char)) {
        continue
      }
      
      // 计算最大码长
      maxLength = Math.max(maxLength, code.length)
      
      if (!charToSelectedCodes.has(char)) {
        charToSelectedCodes.set(char, {
          longest: { code, lineIndex },
          shortest: { code, lineIndex }
        })
      } else {
        const selected = charToSelectedCodes.get(char)!
        
        // 更新最长编码
        if (code.length > selected.longest.code.length) {
          selected.longest = { code, lineIndex }
        }
        
        // 更新最短编码
        if (code.length < selected.shortest.code.length) {
          selected.shortest = { code, lineIndex }
        }
      }
    }

    // 生成原始顺序码表（按汉字-编码对的行号顺序排序）
    const full: CodeTable = new Map()
    const short: CodeTable = new Map()
    
    // 按选中编码的行号排序
    const fullEntries = Array.from(charToSelectedCodes.entries())
      .sort((a, b) => a[1].longest.lineIndex - b[1].longest.lineIndex)
    
    const shortEntries = Array.from(charToSelectedCodes.entries())
      .sort((a, b) => a[1].shortest.lineIndex - b[1].shortest.lineIndex)
    
    for (const [char, selected] of fullEntries) {
      full.set(char, [selected.longest.code])
    }
    
    for (const [char, selected] of shortEntries) {
      short.set(char, [selected.shortest.code])
    }


    return { full, short, maxLength: maxLength || 4 }
  }

  /**
   * 从 RawCodeTable 生成加选重按键的码表（保持原始输入顺序）
   */
  private async generateCodeTableWithSelectionFromRaw(
    rawCodeTable: RawCodeTable,
    baseTable: CodeTable,
    maxLength: number,
    isPrefix: boolean,
    frequencyChars: Set<string> | null = null,
    prefixKeys?: string[]
  ): Promise<CodeTable> {
    const processedTable = new Map<string, string[]>()
    
    // 统计信息
    let totalChars = 0
    let filteredChars = 0
    
    // 第一步：从 RawCodeTable 按原始顺序收集 编码->字符 的映射
    const codeToCharsInOrder = new Map<string, string[]>()
    
    // 按行号顺序遍历，保持原始输入顺序
    const sortedEntries = Array.from(rawCodeTable.entries()).sort((a, b) => a[0] - b[0])
    
    for (const [, [char, code]] of sortedEntries) {
      // 只处理单字符且在 CJK 范围内的汉字
      if (Array.from(char).length !== 1 || !isInCJKToJ(char)) {
        continue
      }
      
      // 只处理在基础表中的字符
      if (!baseTable.has(char)) {
        continue
      }
      
      totalChars++
      
      // 如果提供了字频字符集合，只处理在其中的字符
      if (frequencyChars && !frequencyChars.has(char)) {
        filteredChars++
        continue
      }
      
      // 按原始输入顺序添加字符到对应编码
      if (!codeToCharsInOrder.has(code)) {
        codeToCharsInOrder.set(code, [])
      }
      const charList = codeToCharsInOrder.get(code)!
      if (!charList.includes(char)) {
        charList.push(char)
      }
    }
    
    // 第二步：为基础表中的每个字符生成加选重的编码
    for (const [char, codes] of baseTable.entries()) {
      if (codes.length === 0) continue
      
      // 字频过滤：只处理在字频表中的字符
      if (frequencyChars && !frequencyChars.has(char)) {
        continue
      }
      
      const processedCodes: string[] = []
      
      for (const code of codes) {
        const charsWithThisCode = codeToCharsInOrder.get(code) || []
        const charIndex = charsWithThisCode.indexOf(char)
        const isFirstCandidate = charIndex === 0
        
        let processedCode = code
        
        // 前缀码的特殊处理逻辑
        if (isPrefix && prefixKeys && code.length < maxLength) {
          const lastChar = code.slice(-1)
          const needsUnderscore = !prefixKeys.includes(lastChar) && lastChar !== '_'
          if (needsUnderscore) {
            processedCode = code + '_'
          }
        } else if (!isPrefix && code.length < maxLength && isFirstCandidate) {
          // 非前缀码：首选且未达到最大码长时补充下划线
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

    }
    
    return processedTable
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
   * 检查是否有可用的处理结果
   */
  hasProcessedTables(): boolean {
    return this.processedTables !== null
  }

  /**
   * 获取特定类型的码表
   */
  getCodeTable(type: 'full' | 'short' | 'fullWithSelection' | 'shortWithSelection'): CodeTable | null {
    if (!this.processedTables) {
      return null
    }
    return this.processedTables[type]
  }
}

// 导出单例实例
export const codeTableProcessingService = CodeTableProcessingService.getInstance()
