import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type { 碼表型别 } from '@/types'

// 原始碼表數據（原子狀態）
export const 原始碼表原子狀態 = atom<string>('')

// 解析後的碼表數據（原子狀態）
export const 碼表原子狀態 = atom<碼表型别 | null>(null)

// 碼表元數據（持久化原子狀態）
export const 碼表元數據原子狀態 = atomWithStorage('codeTableMeta', {
  uploadTime: 0,
})

// 碼表狀態（原子狀態）
export const 碼表加載中原子狀態 = atom<boolean>(false)
export const 碼表錯誤原子狀態 = atom<string | null>(null)
