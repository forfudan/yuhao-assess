/**
 * 分析服務模塊導出
 * 
 * 統一導出所有分析相關的函數和類型
 */

// 導出主要分析函數
export {
  getStaticDupRate,
  getDynamicDupRate,
  calculateCodeTableMetrics,
  codeTableToEntries,
  filterCharFrequency
} from './analysisService'

// 導出碼表清理函數
export {
  cleanCodeTable,
  generateFullCodeTable,
  generateShortCodeTable,
  generateCompleteCharTable,
  validateCodeTable,
  getCodeTableStats
} from './codeTableCleanService'

// 導出字符集服務
export {
  isInGB2312,
  isInGuozi,
  isInCJKToBasic,
  isInCJKToA,
  isInCJKToB,
  isInCJKToC,
  isInCJKToD,
  isInCJKToE,
  isInCJKToF,
  isInCJKToG,
  isInCJKToH,
  isInCJKToI,
  charsetCheckers,
  charsetInfo
} from './charsetService'

// 導出重碼分析函數
export {
  calculateCharsetDuplicates,
  generateDuplicateReport,
  formatDuplicateReport,
  exportDuplicateReportJSON,
  exportDuplicateReportCSV
} from './duplicateAnalysisService'

// 重新導出相關類型
export type {
  CodeTable,
  CharFrequency,
  CodeTableEntry,
  AnalysisParams,
  CodeTableMetrics,
  CharsetType,
  DuplicateStats,
  CodeTableCleanOptions,
  CleanResult
} from '../types/index'
