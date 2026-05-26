/**
 * 本地多方案管理原子狀態
 *
 * 直接使用 方案配置介面 存儲本地方案列表，
 * 以 元數據.標識符 作為唯一鍵，克隆時生成唯一標識符。
 */

import { atomWithStorage } from 'jotai/utils'
import type { 方案配置介面 } from '../types/scheme'

/** 本地方案列表（持久化）。每個元素為完整的 方案配置介面，含 測評結果。 */
export const 本地方案列表原子狀態 = atomWithStorage<方案配置介面[]>(
  'yuhao-assess:local-schemes',
  []
)

/** 當前激活的本地方案標識符。null 表示未激活任何本地方案。 */
export const 當前本地方案標識符原子狀態 = atomWithStorage<string | null>(
  'yuhao-assess:current-local-scheme-id',
  null
)

/** 方案對比頁選中參與對比的本地方案標識符列表（持久化）。 */
export const 選中對比本地方案標識符列表原子狀態 = atomWithStorage<string[]>(
  'yuhao-assess:comparison-local-schemes',
  []
)

/** 生成本地方案唯一標識符 */
export function 生成本地標識符(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** 生成克隆方案名稱後綴，格式：Copy on yyyy-mm-dd HH:MM:SS */
export function 生成克隆後綴(): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const HH = String(now.getHours()).padStart(2, '0')
  const MM = String(now.getMinutes()).padStart(2, '0')
  const SS = String(now.getSeconds()).padStart(2, '0')
  return ` Copy on ${yyyy}-${mm}-${dd} ${HH}:${MM}:${SS}`
}
