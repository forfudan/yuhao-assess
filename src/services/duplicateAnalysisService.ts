/**
 * 重碼數據模塊
 * 
 * 計算各種字符集下的靜態重碼數據
 */

import { getStaticDupRate } from './analysisService'
import { generateCharset, type CharsetType, charsetInfo } from './charsetService'
import { generateFullCodeTable } from './codeTableCleanService'
import type { CodeTable } from '../types/index'

/**
 * 重碼統計結果
 */
export interface DuplicateStats {
  charset: CharsetType
  charsetName: string
  description: string
  totalChars: number        // 該字符集中的總字符數
  duplicateCount: number    // 重碼字符數
  duplicateRate: number     // 重碼率 (重碼字符數 / 總字符數)
  uniqueCodes: number       // 該字符集中的唯一編碼數
  codeEfficiency: number    // 編碼效率 (唯一編碼數 / 總字符數)
}

/**
 * 完整重碼報告
 */
export interface DuplicateReport {
  // 輸入法基本信息
  inputMethodName?: string
  analysisDate: string
  
  // 碼表統計
  codeTableStats: {
    originalChars: number     // 原始碼表字符數
    cleanedChars: number      // 清理後字符數 (單字全碼表)
    avgCodeLength: number     // 平均編碼長度
  }
  
  // 各字符集重碼統計
  charsetStats: DuplicateStats[]
  
  // 總結
  summary: {
    bestCharset: CharsetType     // 重碼率最低的字符集
    worstCharset: CharsetType    // 重碼率最高的字符集
    overallDuplicateRate: number // 全字符集重碼率
  }
}

/**
 * 計算指定字符集的重碼統計
 * 
 * @param fullCodeTable - 單字全碼表
 * @param charsetType - 字符集類型
 * @returns 重碼統計結果
 */
export async function calculateCharsetDuplicates(
  fullCodeTable: CodeTable,
  charsetType: CharsetType
): Promise<DuplicateStats> {
  // 生成字符集
  const allChars = new Set(fullCodeTable.keys())
  const charset = await generateCharset(charsetType, allChars)
  
  // 計算重碼數
  const duplicateCount = getStaticDupRate(fullCodeTable, charset)
  const totalChars = charset.size
  
  // 計算該字符集中的唯一編碼數
  const codesInCharset = new Set<string>()
  for (const char of charset) {
    const codes = fullCodeTable.get(char)
    if (codes && codes.length > 0) {
      codesInCharset.add(codes[0]) // 單字全碼表每字符只有一個編碼
    }
  }
  
  const info = charsetInfo[charsetType]
  
  return {
    charset: charsetType,
    charsetName: info.name,
    description: info.description,
    totalChars,
    duplicateCount,
    duplicateRate: totalChars > 0 ? duplicateCount / totalChars : 0,
    uniqueCodes: codesInCharset.size,
    codeEfficiency: totalChars > 0 ? codesInCharset.size / totalChars : 0
  }
}

/**
 * 生成完整的重碼數據報告
 * 
 * @param rawCodeTable - 原始碼表
 * @param inputMethodName - 輸入法名稱（可選）
 * @returns 完整重碼報告
 */
export async function generateDuplicateReport(
  rawCodeTable: CodeTable,
  inputMethodName?: string
): Promise<DuplicateReport> {
  // 1. 生成單字全碼表
  const cleanResult = generateFullCodeTable(rawCodeTable)
  const fullCodeTable = cleanResult.codeTable
  
  // 2. 計算平均編碼長度
  let totalCodeLength = 0
  let codeCount = 0
  for (const codes of fullCodeTable.values()) {
    for (const code of codes) {
      totalCodeLength += code.length
      codeCount++
    }
  }
  const avgCodeLength = codeCount > 0 ? totalCodeLength / codeCount : 0
  
  // 3. 計算各字符集的重碼統計
  const charsetTypes: CharsetType[] = [
    'gb2312',
    'guozi',
    'cjk_basic',
    'cjk_b',
    'cjk_d',
    'cjk_f'
  ]
  
  const charsetStats: DuplicateStats[] = await Promise.all(
    charsetTypes.map(type => calculateCharsetDuplicates(fullCodeTable, type))
  )
  
  // 4. 計算總體重碼率
  const overallDuplicateCount = getStaticDupRate(fullCodeTable, 'all')
  const overallDuplicateRate = fullCodeTable.size > 0 ? overallDuplicateCount / fullCodeTable.size : 0
  
  // 5. 找出最佳和最差字符集
  let bestCharset: CharsetType = 'gb2312'
  let worstCharset: CharsetType = 'gb2312'
  let lowestRate = 1
  let highestRate = 0
  
  for (const stat of charsetStats) {
    if (stat.totalChars > 0) { // 只考慮有字符的字符集
      if (stat.duplicateRate < lowestRate) {
        lowestRate = stat.duplicateRate
        bestCharset = stat.charset
      }
      if (stat.duplicateRate > highestRate) {
        highestRate = stat.duplicateRate
        worstCharset = stat.charset
      }
    }
  }
  
  return {
    inputMethodName,
    analysisDate: new Date().toISOString(),
    codeTableStats: {
      originalChars: cleanResult.stats.originalChars,
      cleanedChars: cleanResult.stats.cleanedChars,
      avgCodeLength: Math.round(avgCodeLength * 100) / 100
    },
    charsetStats,
    summary: {
      bestCharset,
      worstCharset,
      overallDuplicateRate
    }
  }
}

/**
 * 格式化重碼報告為可讀文本
 * 
 * @param report - 重碼報告
 * @returns 格式化的文本
 */
export function formatDuplicateReport(report: DuplicateReport): string {
  const lines: string[] = []
  
  lines.push('='.repeat(60))
  lines.push(`重碼數據報告`)
  if (report.inputMethodName) {
    lines.push(`輸入法: ${report.inputMethodName}`)
  }
  lines.push(`分析時間: ${new Date(report.analysisDate).toLocaleString('zh-TW')}`)
  lines.push('='.repeat(60))
  
  // 碼表統計
  lines.push('\n📊 碼表統計:')
  lines.push(`原始字符數: ${report.codeTableStats.originalChars.toLocaleString()}`)
  lines.push(`單字全碼數: ${report.codeTableStats.cleanedChars.toLocaleString()}`)
  lines.push(`平均編碼長度: ${report.codeTableStats.avgCodeLength}`)
  
  // 各字符集統計
  lines.push('\n📋 各字符集重碼統計:')
  lines.push('-'.repeat(80))
  lines.push('字符集'.padEnd(15) + '總字符數'.padEnd(12) + '重碼數'.padEnd(10) + '重碼率'.padEnd(10) + '編碼效率')
  lines.push('-'.repeat(80))
  
  for (const stat of report.charsetStats) {
    if (stat.totalChars > 0) {
      const charsetName = stat.charsetName.padEnd(15)
      const totalChars = stat.totalChars.toLocaleString().padEnd(12)
      const dupCount = stat.duplicateCount.toLocaleString().padEnd(10)
      const dupRate = `${(stat.duplicateRate * 100).toFixed(2)}%`.padEnd(10)
      const efficiency = `${(stat.codeEfficiency * 100).toFixed(2)}%`
      
      lines.push(`${charsetName}${totalChars}${dupCount}${dupRate}${efficiency}`)
    }
  }
  
  // 總結
  lines.push('\n📈 分析總結:')
  const bestStat = report.charsetStats.find(s => s.charset === report.summary.bestCharset)
  const worstStat = report.charsetStats.find(s => s.charset === report.summary.worstCharset)
  
  if (bestStat) {
    lines.push(`✅ 重碼率最低: ${bestStat.charsetName} (${(bestStat.duplicateRate * 100).toFixed(2)}%)`)
  }
  if (worstStat) {
    lines.push(`⚠️  重碼率最高: ${worstStat.charsetName} (${(worstStat.duplicateRate * 100).toFixed(2)}%)`)
  }
  lines.push(`🔍 總體重碼率: ${(report.summary.overallDuplicateRate * 100).toFixed(2)}%`)
  
  lines.push('\n' + '='.repeat(60))
  
  return lines.join('\n')
}

/**
 * 生成重碼數據的 JSON 報告
 * 
 * @param report - 重碼報告
 * @returns JSON 字符串
 */
export function exportDuplicateReportJSON(report: DuplicateReport): string {
  return JSON.stringify(report, null, 2)
}

/**
 * 生成重碼數據的 CSV 報告
 * 
 * @param report - 重碼報告
 * @returns CSV 字符串
 */
export function exportDuplicateReportCSV(report: DuplicateReport): string {
  const headers = [
    '字符集',
    '字符集名稱', 
    '描述',
    '總字符數',
    '重碼字符數',
    '重碼率(%)',
    '唯一編碼數',
    '編碼效率(%)'
  ]
  
  const rows = report.charsetStats.map(stat => [
    stat.charset,
    stat.charsetName,
    stat.description,
    stat.totalChars.toString(),
    stat.duplicateCount.toString(),
    (stat.duplicateRate * 100).toFixed(2),
    stat.uniqueCodes.toString(),
    (stat.codeEfficiency * 100).toFixed(2)
  ])
  
  const csvLines = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ]
  
  return csvLines.join('\n')
}
