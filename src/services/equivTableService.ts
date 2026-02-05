/**
 * 當量表服務
 * 負責加載和管理當量表數據
 */

import { getDefaultStore } from 'jotai'
import { 當量表原子狀態, 當量表加載中原子狀態, 當量表錯誤原子狀態 } from '../atoms/equivTable'
import type { 當量表介面 } from '../types'

/**
 * 當量表服務類
 */
export class 當量表服務類 {
  private static instance: 當量表服務類

  private constructor() {}

  static getInstance(): 當量表服務類 {
    if (!當量表服務類.instance) {
      當量表服務類.instance = new 當量表服務類()
    }
    return 當量表服務類.instance
  }

  /**
   * 加載當量表並存入 atom
   */
  async 加載當量表(): Promise<Record<string, number>> {
    const store = getDefaultStore()
    const cached = store.get(當量表原子狀態)

    // 如果已缓存且有数据，直接返回
    if (cached && Object.keys(cached).length > 0) {
      return cached
    }

    store.set(當量表加載中原子狀態, true)
    store.set(當量表錯誤原子狀態, null)

    try {
      const 響應 = await fetch('/settings/equivTable.json')
      if (!響應.ok) {
        throw new Error(`HTTP error! status: ${響應.status}`)
      }
      const result: 當量表介面 = await 響應.json()
      const 當量表數據 = result.data || {}

      store.set(當量表原子狀態, 當量表數據)
      return 當量表數據
    } catch (錯誤) {
      const 錯誤信息 = 錯誤 instanceof Error ? 錯誤.message : '加載當量表失敗'
      store.set(當量表錯誤原子狀態, 錯誤信息)
      console.error('加載當量表錯誤:', 錯誤)
      throw 錯誤
    } finally {
      store.set(當量表加載中原子狀態, false)
    }
  }

  /**
   * 獲取已加載的當量表
   */
  獲取當量表(): Record<string, number> {
    const store = getDefaultStore()
    return store.get(當量表原子狀態)
  }

  /**
   * 清除緩存
   */
  清除緩存(): void {
    const store = getDefaultStore()
    store.set(當量表原子狀態, {})
  }
}

// 導出單例實例
export const 當量表服務實例 = 當量表服務類.getInstance()
