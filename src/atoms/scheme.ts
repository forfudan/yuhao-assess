/**
 * 方案配置狀態管理
 */

import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type { 方案配置介面, 方案列表項介面 } from '../types/scheme'

/**
 * 當前方案原子狀態
 * 使用 atomWithStorage 持久化到 localStorage
 */
export const 當前方案原子狀態 = atomWithStorage<方案配置介面 | null>(
  'yuhao-assess:current-scheme',
  null
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
 * 錯誤信息原子狀態
 * 方案加載或操作的錯誤信息
 */
export const 錯誤信息原子狀態 = atom<string | null>(null)
