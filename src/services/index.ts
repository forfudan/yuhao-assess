/**
 * 服務模塊統一導出
 */

// 重碼分析服務
export {
  計算靜態重碼數,
  計算動態選重率,
  計算原始碼表的動態選重率,
  計算某字符集的重碼數據,
  type 某字符集的重碼數據介面,
} from './duplicateAnalysisService'

// 速度分析服務
export {
  計算編碼對頻率,
  從編碼對頻率計算加權速度當量,
  從碼表計算加權速度當量,
} from './speedEquivalentService'

// 連續文本當量分析服務
export {
  加載連續文本,
  清洗連續文本,
  構建字符按鍵映射,
  文本轉按鍵序列,
  計算序列當量,
  蒙特卡洛連續文本當量,
  分佈重新分箱,
} from './continuousEquivalentService'
export type {
  連續文本當量統計介面,
  窗口當量結果介面,
  分佈項介面,
  抽樣選項介面,
} from './continuousEquivalentService'

// 導出碼表服務（統一服務）
export {
  碼表處理服務,
  碼表處理服務實例,
  清理碼表,
  驗證碼表,
  獲取碼表統計,
  type 碼表處理選項介面,
  type 碼表清理選項,
  type 清理結果,
} from './codeTableService'
// 處理後的碼表結果類型從 types 導入
export type { 處理後的碼表結果介面 } from '../types'

// 導出當量表服務
export { 當量表服務類, 當量表服務實例 } from './equivTableService'

// 導出字頻表服務
export { 字頻表服務類别 } from './charFrequencyService'

// 導出數據服務
export {
  加載知乎簡體字頻,
  加載北語簡體字頻,
  加載臺標繁體字頻,
  計算繁簡聯合字頻,
  加載所有字頻數據,
  加載當量表,
  getFrequencyCharsUnion,
  clearFrequencyCharsCache,
} from './dataService'

// 導出UI服務
export { formatRate, formatNumber, formatEquiv, getCharacterTooltip } from './uiService'

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
  漢字集檢查器映射,
  charsetInfo,
  getCharsetSize,
  getTheoreticalCharsetSize,
  過濾自定義字符集,
} from './charsetService'

// 導出最大候選數服務
export {
  getMaximumCandidates,
  getAllMaximumCandidates,
  type 最大候選個數結果,
} from './maximumCandidatesService'

// 導出簡碼效率服務
export { 計算指定字頻下之簡碼效率 } from './shortCodeEfficiencyService'
