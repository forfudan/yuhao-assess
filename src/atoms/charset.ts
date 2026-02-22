import { atom } from 'jotai'

/**
 * 字符集記録型别
 *
 * 記録每个字符在哪些字符集中（GB2312、通規、國字等）
 *
 * 例如：{is_gb2312: true, is_guozi: true, is_tonggui: true }
 */
export type 字符集記録型别 = {
  is_gb2312: boolean
  is_guozi: boolean
  is_tonggui: boolean
}

/**
 * 字符集數據型别
 *
 * key 是字符，value 是該字符的字符集記録
 * 例如：{
 *   '你': { is_gb2312: true, is_guozi: true, is_tonggui: true },
 *   '好': { is_gb2312: true, is_guozi: true, is_tonggui: true },
 */
export type 字符集數據型别 = Record<string, 字符集記録型别>

/**
 * CJK區塊數據型别
 */
export type CJK區塊數據型别 = {
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
export const 字符集數據原子狀態 = atom<字符集數據型别 | null>(null)

/**
 * CJK區塊數據全局緩存
 * 記載 CJK Unicode 區塊的範圍信息
 */
export const CJK區塊數據原子狀態 = atom<CJK區塊數據型别 | null>(null)
