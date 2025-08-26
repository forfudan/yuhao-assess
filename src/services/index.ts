/**
 * 服务模块统一导出
 */

// 重码分析服务
export {
  getStaticDupRate,
  getDynamicDupRate,
  calculateCharsetDuplicates,
  type DuplicateStats
} from './duplicateAnalysisService'

// 速度分析服务
export {
  calculateCodePairFrequencies,
  calculateSpeedEquiv,
  calculateSpeedEquivFromCodeTable
} from './speedAnalysisService'

// 导出码表处理服务
export {
  cleanCodeTable,
  generateFullCodeTable,
  generateShortCodeTable,
  generateCompleteCharTable,
  validateCodeTable,
  getCodeTableStats
} from './codeTableCleanService'

// 导出数据服务
export {
  loadCharFrequency,
  loadCharFrequencySC,
  loadCharFrequencyTC,
  loadCharFrequencyUnified,
  loadAllCharFrequencies,
  loadEquivTable
} from './dataService'

// 导出UI服务
export {
  formatRate,
  formatNumber,
  formatEquiv,
  createTooltipManager,
  getCharacterTooltip
} from './uiService'

// 导出字符集服务
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

// 导出最大候选数服务
export {
  getMaximumCandidates,
  getAllMaximumCandidates,
  type MaximumCandidatesResult
} from './maximumCandidatesService'

// 导出内置码表服务
export {
  BuiltinCodeTableService,
  builtinCodeTableService
} from './builtinCodeTableService'

// 导出码表处理服务
export { codeTableProcessingService } from './codeTableProcessingService'

// 导出类型
export type {
  AnalysisParams,
  CodeTableMetrics,
  CharsetType,
  CodeTableCleanOptions,
  CleanResult
} from '../types/index'
