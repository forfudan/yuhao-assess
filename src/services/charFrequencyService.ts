import type { CharFrequency } from '@/types'
import { getDefaultStore } from 'jotai'
import { 字頻表緩存原子狀態 } from '../atoms/charFrequency'

// 直接導入 JSON 文件（使用絶對頻率文件）
import 簡體字頻數據 from '../../public/data/charAbsoluteFrequencySC.json'
import 繁體字頻數據 from '../../public/data/charAbsoluteFrequencyTC.json'
import 知乎字頻數據 from '../../public/data/charAbsoluteFrequencyZhihu.json'
import 古籍字頻數據 from '../../public/data/charAbsoluteFrequencyGuji.json'

/**
 * 字頻表服務
 * 使用 Jotai atom 進行全局緩存，避免重複加載
 */
export class 字頻表服務 {
  /**
   * 加載簡體字頻表
   */
  static async 加載簡體字頻(): Promise<CharFrequency> {
    const store = getDefaultStore()
    const cache = store.get(字頻表緩存原子狀態)
    const cached = cache.get('简体字频')
    if (cached) return cached

    const data = 簡體字頻數據 as CharFrequency
    cache.set('简体字频', data)
    store.set(字頻表緩存原子狀態, cache)
    return data
  }

  /**
   * 加載繁體字頻表
   */
  static async 加載繁體字頻(): Promise<CharFrequency> {
    const store = getDefaultStore()
    const cache = store.get(字頻表緩存原子狀態)
    const cached = cache.get('繁体字频')
    if (cached) return cached

    const data = 繁體字頻數據 as CharFrequency
    cache.set('繁体字频', data)
    store.set(字頻表緩存原子狀態, cache)
    return data
  }

  /**
   * 加載知乎字頻表
   */
  static async 加載知乎字頻(): Promise<CharFrequency> {
    const store = getDefaultStore()
    const cache = store.get(字頻表緩存原子狀態)
    const cached = cache.get('知乎字频')
    if (cached) return cached

    const data = 知乎字頻數據 as CharFrequency
    cache.set('知乎字频', data)
    store.set(字頻表緩存原子狀態, cache)
    return data
  }

  /**
   * 加載古籍字頻表
   */
  static async 加載古籍字頻(): Promise<CharFrequency> {
    const store = getDefaultStore()
    const cache = store.get(字頻表緩存原子狀態)
    const cached = cache.get('古籍字频')
    if (cached) return cached

    const data = 古籍字頻數據 as CharFrequency
    cache.set('古籍字频', data)
    store.set(字頻表緩存原子狀態, cache)
    return data
  }

  /**
   * 加載繁簡聯合字頻表（合併簡體和繁體）
   */
  static async 加載繁簡聯合字頻(): Promise<CharFrequency> {
    const [簡體字頻, 繁體字頻] = await Promise.all([this.加載簡體字頻(), this.加載繁體字頻()])

    // 合併字頻，取較大值
    const 合併字頻: CharFrequency = { ...簡體字頻 }
    for (const [字符, 頻率] of Object.entries(繁體字頻)) {
      if (!合併字頻[字符] || 合併字頻[字符] < 頻率) {
        合併字頻[字符] = 頻率
      }
    }

    return 合併字頻
  }

  /**
   * 根據類型加載對應的字頻表
   */
  static async 加載字頻表(
    類型: '简体字频' | '繁体字频' | '繁简联合' | '知乎字频' | '古籍字频'
  ): Promise<CharFrequency> {
    switch (類型) {
      case '简体字频':
        return this.加載簡體字頻()
      case '繁体字频':
        return this.加載繁體字頻()
      case '繁简联合':
        return this.加載繁簡聯合字頻()
      case '知乎字频':
        return this.加載知乎字頻()
      case '古籍字频':
        return this.加載古籍字頻()
      default:
        throw new Error(`未知的字頻表類型: ${類型}`)
    }
  }
}
