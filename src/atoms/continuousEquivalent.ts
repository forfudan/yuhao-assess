/**
 * 連續文本當量分析結果的 Atom 狀態管理
 */
import { atom } from 'jotai'
import type { 連續文本當量統計介面 } from '../services/continuousEquivalentService'

/** 參與連續文本當量分析的碼表口徑 */
export type 連續文本當量碼表口徑 = '全碼加選重' | '全部簡碼加選重'

/**
 * 連續文本當量分析結果
 */
export interface 連續文本當量分析結果介面 {
  /** 各碼表口徑對應的統計結果 */
  統計: Partial<Record<連續文本當量碼表口徑, 連續文本當量統計介面>>
  /** 抽樣樣本數 */
  樣本數: number
  /** 窗口長度（字符數） */
  窗口長度: number
  更新時間: string
}

/**
 * 連續文本當量分析結果原子狀態
 */
export const 連續文本當量分析原子狀態 = atom<連續文本當量分析結果介面 | null>(null)
