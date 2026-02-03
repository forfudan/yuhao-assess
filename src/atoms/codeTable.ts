import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type { CodeTable } from '@/types'

// 原始碼表數據
export const rawCodeTableAtom = atom<string>('')

// 解析後的碼表數據
export const codeTableAtom = atom<CodeTable | null>(null)

// 碼表元數據
export const codeTableMetaAtom = atomWithStorage('codeTableMeta', {
  name: '',
  uploadTime: 0,
  totalChars: 0,
})

// 碼表狀態
export const codeTableLoadingAtom = atom<boolean>(false)
export const codeTableErrorAtom = atom<string | null>(null)
