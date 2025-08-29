/**
 * 服務模塊統一導出
 */

// 重碼分析服務
export {
  getStaticDupRate,
  getDynamicDupRate,
  calculateCharsetDuplicates,
  type DuplicateStats
} from './duplicateAnalysisService'

// 速度分析服務
export {
  calculateCodePairFrequencies,
  calculateSpeedEquiv,
  calculateSpeedEquivFromCodeTable
} from './speedAnalysisService'

// 导出服务
export { ExportService } from './exportService'

// 導出碼表處理服務
export {
  cleanCodeTable,
  generateFullCodeTable,
  generateShortCodeTable,
  generateCompleteCharTable,
  validateCodeTable,
  getCodeTableStats
} from './codeTableCleanService'

// 導出數據服務
export {
  loadCharFrequency,
  loadCharFrequencySC,
  loadCharFrequencyTC,
  loadCharFrequencyUnified,
  loadAllCharFrequencies,
  loadEquivTable,
  getFrequencyCharsUnion,
  clearFrequencyCharsCache
} from './dataService'

// 導出UI服務
export {
  formatRate,
  formatNumber,
  formatEquiv,
  createTooltipManager,
  getCharacterTooltip
} from './uiService'

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
  charsetInfo,
  getCharsetSize,
  getTheoreticalCharsetSize,
  generateCharset
} from './charsetService'

// 導出最大候選數服務
export {
  getMaximumCandidates,
  getAllMaximumCandidates,
  type MaximumCandidatesResult
} from './maximumCandidatesService'

// 導出預設碼表服務
export {
  BuiltinCodeTableService,
  builtinCodeTableService
} from './builtinCodeTableService'

// 導出碼表處理服務
export { codeTableProcessingService } from './codeTableProcessingService'

// 導出簡碼效率服務
export {
  calculateShortCodeEfficiency
} from './shortCodeEfficiencyService'

// 導出類型
export type {
  AnalysisParams,
  CodeTableMetrics,
  CharsetType,
  CodeTableCleanOptions,
  CleanResult
} from '../types/index'
