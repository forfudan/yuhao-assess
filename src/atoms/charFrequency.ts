import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type { 頻率數據型别 } from '@/types'

/**
 * 字频表類型
 */
export type 字頻表類型 =
  | '北語簡體字頻'
  | '臺標繁體字頻'
  | '繁簡聯合字頻'
  | '知乎簡體字頻'
  | '古籍繁體字頻'

/**
 * 當前選中的字頻表類型（持久化）
 */
export const 當前字頻表類型原子狀態 = atomWithStorage<字頻表類型>(
  'current-char-frequency-type',
  '北語簡體字頻'
)

/**
 * 字頻表數據緩存
 */
export const 字頻表緩存原子狀態 = atom<Map<字頻表類型, 頻率數據型别>>(new Map())

/**
 * 字頻表加載中狀態
 */
export const 字頻表加載中原子狀態 = atom<boolean>(false)

/**
 * 字頻表錯誤信息
 */
export const 字頻表錯誤原子狀態 = atom<string | null>(null)
