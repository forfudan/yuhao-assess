/**
 * Jotai 原子狀態統一導出
 */

// 碼表相關原子狀態
export {
  原始碼表原子狀態,
  碼表原子狀態,
  碼表元數據原子狀態,
  碼表加載中原子狀態,
  碼表錯誤原子狀態,
  編碼預覽數據原子狀態,
} from './codeTable'
export type { 編碼預覽項 } from './codeTable'

// 應用設置原子狀態
export { 設置原子狀態, 分析參數原子狀態 } from './settings'

// 重碼分析原子狀態
export { 重碼分析原子狀態, 動態選重分析原子狀態 } from './dynamicDuplicate'
export type {
  重碼分析結果介面,
  動態選重分析結果介面,
  動態選重結果介面,
  靜態重碼結果介面,
} from './dynamicDuplicate'

// 數據預加載原子狀態
export { 數據預加載狀態原子, 是否正在預加載, 核心數據已加載, 所有數據已加載 } from './dataPreload'
export type { 數據加載狀態介面, 數據預加載狀態介面, 加載狀態型别 } from './dataPreload'

// 字頻表原子狀態
export { 字頻表緩存原子狀態, 當前字頻表類型原子狀態 } from './charFrequency'
export type { 字頻表類型 } from './charFrequency'

// 字符集原子狀態
export { 字符集數據原子狀態, CJK區塊數據原子狀態 } from './charset'
export type { 字符集數據型别, 字符集記録型别, CJK區塊數據型别 } from './charset'

// 速度當量分析原子狀態
export { 速度當量分析原子狀態, 當量詳情原子狀態 } from './speedEquivalent'
export type { 速度當量分析結果介面, 當量例字信息介面, 當量詳情數據介面 } from './speedEquivalent'

// 連續文本當量分析原子狀態
export { 連續文本當量分析原子狀態 } from './continuousEquivalent'
export type { 連續文本當量分析結果介面, 連續文本當量碼表口徑 } from './continuousEquivalent'

// 鍵位熱力分析原子狀態
export { 鍵位熱力分析原子狀態 } from './keyboardHeatmap'
export type { 鍵位熱力分析結果介面 } from './keyboardHeatmap'

// 當量表原子狀態
export { 當量表原子狀態, 當量表加載中原子狀態, 當量表錯誤原子狀態 } from './equivTable'
