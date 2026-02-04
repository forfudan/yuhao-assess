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
} from './codeTable'

// 應用設置原子狀態
export { 設置原子狀態, 分析參數原子狀態 } from './settings'

// 重碼分析原子狀態
export { 重碼分析原子狀態 } from './duplicate'
export type { 重碼分析結果, 動態選重率結果, 靜態重碼結果 } from './duplicate'

// 字頻表原子狀態
export { 字頻表緩存原子狀態, 當前字頻表類型原子狀態 } from './charFrequency'
export type { 字頻表類型 } from './charFrequency'

// 字符集原子狀態
export { 字符集數據原子狀態, CJK區塊數據原子狀態 } from './charset'
export type { CharsetData, CharsetRecord, CJKBlockData } from './charset'
