/**
 * 速度当量分析结果的 Atom 状态管理
 */
import { atom } from 'jotai'

/**
 * 速度当量分析结果数据结构
 */
export interface 速度当量分析结果 {
  // 單字全碼當量
  zhihuEquiv: number
  scEquiv: number
  tcEquiv: number
  gujiEquiv: number
  unifiedEquiv: number

  // 單字一簡當量
  zhihuFirstShortEquiv: number
  scFirstShortEquiv: number
  tcFirstShortEquiv: number
  gujiFirstShortEquiv: number
  unifiedFirstShortEquiv: number

  // 單字二簡當量
  zhihuSecondShortEquiv: number
  scSecondShortEquiv: number
  tcSecondShortEquiv: number
  gujiSecondShortEquiv: number
  unifiedSecondShortEquiv: number

  // 單字全簡當量
  zhihuShortEquiv: number
  scShortEquiv: number
  tcShortEquiv: number
  gujiShortEquiv: number
  unifiedShortEquiv: number

  // 詞語全碼當量（可選）
  scWordEquiv?: number
  // 詞語一簡當量（可選）
  scWordFirstShortEquiv?: number
  // 詞語二簡當量（可選）
  scWordSecondShortEquiv?: number
  // 詞語全簡當量（可選）
  scWordShortEquiv?: number

  // 元數據
  更新時間?: string
  碼表哈希?: string
}

/**
 * 當量例字信息
 */
export interface 當量例字信息 {
  字符: string
  編碼: string
  按鍵組合: string
  當量值: number
  字頻: number
}

/**
 * 當量詳情數據（點擊表格單元格時顯示）
 */
export interface 當量詳情數據 {
  字頻類型: string // 'zhihu' | 'sc' | 'tc' | 'guji' | 'unified'
  碼表類型: string // 'full' | 'firstShort' | 'secondShort' | 'short'
  例字列表: 當量例字信息[]
}

/**
 * 速度當量分析結果
 * 存儲所有字頻類型和碼表類型的當量計算結果
 */
export const 速度當量分析原子狀態 = atom<速度当量分析结果 | null>(null)

/**
 * 當量詳情數據（用於 Modal 展示）
 * 存儲當前選中的當量例字信息
 */
export const 當量詳情原子狀態 = atom<當量詳情數據 | null>(null)
