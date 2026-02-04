import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type { CharFrequency } from '@/types'

/**
 * 字频表類型
 */
export type 字頻表類型 = '简体字频' | '繁体字频' | '繁简联合' | '知乎字频' | '古籍字频'

/**
 * 當前選中的字頻表類型（持久化）
 */
export const 當前字頻表類型原子狀態 = atomWithStorage<字頻表類型>(
  'current-char-frequency-type',
  '简体字频'
)

/**
 * 字頻表數據緩存
 */
export const 字頻表緩存原子狀態 = atom<Map<字頻表類型, CharFrequency>>(new Map())

/**
 * 字頻表加載中狀態
 */
export const 字頻表加載中原子狀態 = atom<boolean>(false)

/**
 * 字頻表錯誤信息
 */
export const 字頻表錯誤原子狀態 = atom<string | null>(null)
