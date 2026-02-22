/**
 * 方案對比原子狀態
 * 用於持久化保存選中的對比方案列表
 */

import { atomWithStorage } from 'jotai/utils'

/**
 * 選中的對比方案鍵名列表
 * 保存到 localStorage，切換頁面不會丢失
 */
export const 選中對比方案鍵名列表原子狀態 = atomWithStorage<string[]>(
  'yuhao-assess:comparison-schemes',
  []
)
