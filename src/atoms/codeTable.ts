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

// 編碼預覽數據介面
export interface 編碼預覽項 {
  char: string
  fullCode: string
  shortCode: string
  全碼加選重鍵表: string
  簡碼加選重鍵表: string
}

// 編碼預覽數據（原子狀態）
export const 編碼預覽數據原子狀態 = atom<編碼預覽項[]>([])
