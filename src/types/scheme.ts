/**
 * 方案配置系統類型定義
 *
 * 朱批：我們這裏直接導入原子狀態的介面定義。如此，可避免重複定義。
 * 如果將來原子狀態的結構發生變化，這裏也會自動更新，保持一致性。
 * 原子狀態的格式會直接導出到方案配置中。
 * 這樣導入和導出都非常方便，且不需要額外的轉換邏輯。
 */

import type { 重碼分析結果介面 } from '../atoms/dynamicDuplicate'
import type { 最大候選個數分析結果 } from '../atoms/maximumCandidates'
import type { 速度當量分析結果介面 } from '../atoms/speedEquivalent'
import type { 簡碼效率分析結果介面 } from '../atoms/shortCodeEfficiency'
import type { 鍵位熱力分析結果介面 } from '../atoms/keyboardHeatmap'

/**
 * 方案元數據
 */
export interface 方案元數據介面 {
  方案名: string // 方案名稱（如「靈明」）
  標識符: string // 唯一標識（文件名，如「yuling」）
  作者?: string // 作者（如「朱宇浩」）
  版本: string // 版本號（語義版本，如「1.0.0」）
  官網?: string // 官網（如「https://shurufa.app」）
  相關資源鏈接?: string[] // 相關資源鏈接列表（如教程、社群等）
  碼表下載鏈接?: string // 碼表下載鏈接
  描述?: string // 描述
  標籤?: string[] // 標籤（如 ['形碼', '前綴碼', '五碼']）
  創建時間: string // 創建時間（ISO 8601）
  更新時間: string // 更新時間（ISO 8601）
}

/**
 * 方案參數
 */
export interface 方案參數介面 {
  編碼終止指示符列表?: string[] // 編碼終止指示符（如 ['a','o','e','i','u','_']）
  最大碼長: number // 最大碼長（如 4 或 5）
  選重編碼化?: boolean // 選重鍵是否計入編碼長度（默認 false）
  出簡不出全?: boolean // 是否「出簡不出全」（默認 false）
  編碼規則?: {
    單字編碼規則?: string // 單字編碼規則描述
    詞語編碼規則?: string // 詞語編碼規則描述
  }
}

/**
 * 方案碼表元數據
 */
export interface 方案碼表元數據介面 {
  分隔符: '空格' | '製表符' | '逗號' | '分號' // 碼表分隔符
  第一列類型: '字符' | '編碼' // 第一列類型
  總字符數?: number // 碼表總字符數（解析後實際值）
  哈希值?: string // 碼表 SHA-256（用於驗證一致性）
}

/**
 * 方案測評結果介面
 *
 * 直接使用各個 Atom 的類型定義，確保與應用中的數據結構保持同步
 */
export interface 方案測評結果介面 {
  // 動態選重分析（按字頻重排和保持原序）
  動態選重分析?: import('@/atoms/dynamicDuplicate').動態選重分析結果介面

  // 靜態重碼分析（各字符集的靜態重碼數據）
  靜態重碼分析?: import('@/atoms/staticDuplicate').靜態重碼分析結果介面

  // 重碼分析（已廢棄，僅用於向後兼容）
  重碼分析?: 重碼分析結果介面

  // 最大候選數分析
  候選個數分析?: 最大候選個數分析結果

  // 速度當量分析
  速度當量分析?: 速度當量分析結果介面

  // 簡碼效率分析
  簡碼效率分析?: 簡碼效率分析結果介面

  // 鍵位熱力分析
  鍵位熱力?: 鍵位熱力分析結果介面
}

/**
 * 方案配置完整結構
 */
export interface 方案配置介面 {
  元數據: 方案元數據介面
  方案參數: 方案參數介面
  碼表元數據?: 方案碼表元數據介面
  測評結果?: 方案測評結果介面
}
