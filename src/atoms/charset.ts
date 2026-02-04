import { atom } from 'jotai'

/**
 * 字符集記録類型
 */
export type CharsetRecord = {
  is_gb2312: boolean
  is_guozi: boolean
  is_tonggui: boolean
}

export type CharsetData = Record<string, CharsetRecord>

/**
 * CJK區塊數據類型
 */
export type CJKBlockData = {
  version: string
  description: string
  lastUpdated: string
  blocks: Record<
    string,
    {
      name: string
      description: string
      start: string
      end: string
      comment: string
      note?: string
    }
  >
}

/**
 * 字符集數據全局緩存
 * 記載每個字符在哪些字符集中（GB2312、通規、國字等）
 */
export const 字符集數據原子狀態 = atom<CharsetData | null>(null)

/**
 * CJK區塊數據全局緩存
 * 記載 CJK Unicode 區塊的範圍信息
 */
export const CJK區塊數據原子狀態 = atom<CJKBlockData | null>(null)
