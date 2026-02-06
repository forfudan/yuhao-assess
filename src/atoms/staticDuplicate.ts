/**
 * 靜態重碼分析狀態管理
 */

import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

/**
 * 某字符集的靜態重碼數據介面
 */
export interface 某字符集的靜態重碼數據介面 {
  全碼重碼字數: number
  簡碼重碼字數: number
  實際字符數: number
  理論字符數: number
  字集覆蓋率: number // 實際字符數 / 理論字符數
}

/**
 * 靜態重碼分析結果介面
 */
export interface 靜態重碼分析結果介面 {
  GB2312: 某字符集的靜態重碼數據介面
  通用規範: 某字符集的靜態重碼數據介面
  常用國字: 某字符集的靜態重碼數據介面
  CJK基本: 某字符集的靜態重碼數據介面
  到CJKA: 某字符集的靜態重碼數據介面
  到CJKB: 某字符集的靜態重碼數據介面
  到CJKC: 某字符集的靜態重碼數據介面
  到CJKD: 某字符集的靜態重碼數據介面
  到CJKE: 某字符集的靜態重碼數據介面
  到CJKF: 某字符集的靜態重碼數據介面
  到CJKG: 某字符集的靜態重碼數據介面
  到CJKH: 某字符集的靜態重碼數據介面
  到CJKI: 某字符集的靜態重碼數據介面
  到CJKJ: 某字符集的靜態重碼數據介面
  更新時間?: string
}

/**
 * 靜態重碼分析原子狀態
 * 存儲各字符集的靜態重碼數據
 */
export const 靜態重碼分析原子狀態 = atom<靜態重碼分析結果介面 | null>(null)
