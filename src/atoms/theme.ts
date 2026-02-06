import { atom } from 'jotai'
import type { 主题配置 } from '@/types/theme'
import { 默认主题配置 } from '@/types/theme'

/**
 * 主题配置 Atom（每次刷新恢复默认，不持久化）
 */
export const 主题配置原子 = atom<主题配置>(默认主题配置)

/**
 * 重置主题配置为默认值
 */
export const 重置主题配置原子 = atom(null, (_get, set) => {
  set(主题配置原子, 默认主题配置)
})
