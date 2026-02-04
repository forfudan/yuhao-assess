/**
 * 服務模塊統一導出
 */

// 重碼分析服務
export {
  getStaticDupRate,
  getDynamicDupRate,
  getDynamicDupRateFromOriginalOrder,
  calculateCharsetDuplicates,
  type DuplicateStats,
} from './duplicateAnalysisService'

// 速度分析服務
export {
  calculateCodePairFrequencies,
  calculateSpeedEquiv,
  calculateSpeedEquivFromCodeTable,
} from './speedAnalysisService'

// 導出服務
export { ExportService } from './exportService'

// 導出碼表服務（統一服務）
export {
  碼表處理服務,
  碼表處理服務實例,
  清理碼表,
  驗證碼表,
  獲取碼表統計,
  type 處理後的碼表結果,
  type 碼表處理選項,
  type 碼表清理選項,
  type 清理結果,
} from './codeTableService'

// 導出當量表服務
export { 當量表服務, 當量表服務實例 } from './equivTableService'

// 導出字頻表服務
export { 字頻表服務 } from './charFrequencyService'

// 導出數據服務
export {
  loadCharFrequency,
  loadCharFrequencySC,
  loadCharFrequencyTC,
  loadCharFrequencyUnified,
  loadAllCharFrequencies,
  loadEquivTable,
  getFrequencyCharsUnion,
  clearFrequencyCharsCache,
} from './dataService'

// 導出UI服務
export {
  formatRate,
  formatNumber,
  formatEquiv,
  createTooltipManager,
  getCharacterTooltip,
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
  generateCharset,
} from './charsetService'

// 導出最大候選數服務
export {
  getMaximumCandidates,
  getAllMaximumCandidates,
  type 最大候選個數結果,
} from './maximumCandidatesService'

// 導出簡碼效率服務
export {
  calculateShortCodeEfficiency,
  calculateFullCodeAverageLength,
  calculateShortCodeAverageLength,
} from './shortCodeEfficiencyService'

// 導出類型
export type { AnalysisParams, CodeTableMetrics, CharsetType } from '../types/index'
