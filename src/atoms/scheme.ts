/**
 * 方案配置狀態管理
 */

import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type { 方案配置介面 } from '../types/scheme'

/**
 * 帶 debounce 的 localStorage storage
 * 讀取和刪除立即執行，寫入延遲 400ms，
 * 避免用戶在主頁輸入框每次 onChange 都觸發 localStorage 寫入。
 */
function createDebouncedStorage<T>(key: string, delay = 400) {
  let timer: ReturnType<typeof setTimeout> | null = null
  return {
    getItem: (k: string, initialValue: T): T => {
      try {
        const raw = localStorage.getItem(k)
        return raw !== null ? (JSON.parse(raw) as T) : initialValue
      } catch {
        return initialValue
      }
    },
    setItem: (_k: string, value: T): void => {
      if (timer !== null) clearTimeout(timer)
      timer = setTimeout(() => {
        try {
          localStorage.setItem(key, JSON.stringify(value))
        } catch {
          // ignore quota errors
        }
      }, delay)
    },
    removeItem: (k: string): void => {
      if (timer !== null) clearTimeout(timer)
      localStorage.removeItem(k)
    },
  }
}

/**
 * 當前方案原子狀態
 * 使用帶 debounce 的 atomWithStorage，避免輸入框每次 onChange 都寫 localStorage
 */
export const 當前方案原子狀態 = atomWithStorage<方案配置介面 | null>(
  'yuhao-assess:current-scheme',
  null,
  createDebouncedStorage<方案配置介面 | null>('yuhao-assess:current-scheme')
)

/**
 * 方案列表原子狀態
 * 可用方案列表（從 public/schemes/ 加載）
 */
export const 方案列表原子狀態 = atom<方案配置介面[]>([])

/**
 * 加載中原子狀態
 * 是否正在加載方案
 */
export const 加載中原子狀態 = atom<boolean>(false)

/**
 * 錯誤信息原子狀態
 * 方案加載或操作的錯誤信息
 */
export const 錯誤信息原子狀態 = atom<string | null>(null)
