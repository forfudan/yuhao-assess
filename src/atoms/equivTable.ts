/**
 * 当量表的 Atom 状态管理
 */
import { atom } from 'jotai'

/**
 * 当量表数据缓存（按键组合 -> 当量值）
 */
export const 當量表原子狀態 = atom<Record<string, number>>({})

/**
 * 当量表加载状态
 */
export const 當量表加載中原子狀態 = atom<boolean>(false)

/**
 * 当量表错误信息
 */
export const 當量表錯誤原子狀態 = atom<string | null>(null)
