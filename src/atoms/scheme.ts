/**
 * 方案配置狀態管理
 */

import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type { 方案配置介面, 方案列表項介面 } from '../types/scheme'

/**
 * 帶 debounce 的 localStorage storage
 * 讀取和删除立即執行，寫入延遲 3000ms，
 * 避免用户在主頁輸入框每次 onChange 都觸發 localStorage 寫入。
 */
function createDebouncedStorage<T>(key: string, delay = 3000) {
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
 * 可用方案列表（從 public/schemes/ 加載），每項帶着它的文件名鍵名
 */
export const 方案列表原子狀態 = atom<方案列表項介面[]>([])

/**
 * 加載中原子狀態
 * 是否正在加載方案
 */
export const 加載中原子狀態 = atom<boolean>(false)

/**
 * 頂欄正在切換的預設方案名
 * 有值時主内容區顯示載入遮罩；null 表示没在切換
 */
export const 頂欄方案載入名原子狀態 = atom<string | null>(null)

/**
 * 錯誤信息原子狀態
 * 方案加載或操作的錯誤信息
 */
export const 錯誤信息原子狀態 = atom<string | null>(null)
