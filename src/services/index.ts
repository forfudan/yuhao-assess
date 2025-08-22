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
  isSingleChar,
  isInGB2312,
  isInCommonChinese,
  isInGBK,
  isInCJKBasic,
  isInCJKToA,
  isInCJKToB,
  isInCJKToD,
  isInCJKToF,
  generateCharset,
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

// 導出測試函數（開發環境使用）
export {
  testStaticDupRate,
  testDynamicDupRate,
  testCalculateMetrics,
  runAllTests
} from './analysisService.test'

export {
  testCodeTableCleaning,
  testDuplicateAnalysis,
  runDuplicateAnalysisTests
} from './duplicateAnalysisService.test'

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
