import type { 頻數數據型别, 頻率數據型别 } from '@/types'
import { getDefaultStore } from 'jotai'
import { 字頻表緩存原子狀態 } from '../atoms/charFrequency'
import { 加載JSON數據文件 } from '../utils/data-loader'

/**
 * 歸一化絶對頻數爲相對頻率
 */
function 歸一化頻數(頻數數據: 頻數數據型别): 頻率數據型别 {
  const 總頻數 = Object.values(頻數數據).reduce((sum, count) => sum + count, 0)
  const 頻率數據: 頻率數據型别 = {}

  for (const [字符, 頻數] of Object.entries(頻數數據)) {
    頻率數據[字符] = 頻數 / 總頻數
  }

  return 頻率數據
}

/**
 * 字頻表服務
 * 使用 Jotai atom 進行全局緩存，避免重複加載
 * 所有返回的字頻數據都是歸一化後的相對頻率
 */
export class 字頻表服務類别 {
  /**
   * 加載簡體漢字頻率表
   */
  static async 加載北語簡體字頻(): Promise<頻率數據型别> {
    const store = getDefaultStore()
    const cache = store.get(字頻表緩存原子狀態)
    const cached = cache.get('北語簡體字頻')
    if (cached) return cached

    // 動態加載絶對頻數數據並歸一化爲相對頻率
    const 簡體漢字頻數數據 = await 加載JSON數據文件<頻數數據型别>('charAbsoluteFrequencySC.json')
    const 簡體漢字頻率數據 = 歸一化頻數(簡體漢字頻數數據)
    cache.set('北語簡體字頻', 簡體漢字頻率數據)
    store.set(字頻表緩存原子狀態, cache)
    return 簡體漢字頻率數據
  }

  /**
   * 加載繁體漢字頻率表
   */
  static async 加載臺標繁體字頻(): Promise<頻率數據型别> {
    const store = getDefaultStore()
    const cache = store.get(字頻表緩存原子狀態)
    const cached = cache.get('臺標繁體字頻')
    if (cached) return cached

    // 動態加載絶對頻數數據並歸一化爲相對頻率
    const 繁體漢字頻數數據 = await 加載JSON數據文件<頻數數據型别>('charAbsoluteFrequencyTC.json')
    const 繁體漢字頻率數據 = 歸一化頻數(繁體漢字頻數數據)
    cache.set('臺標繁體字頻', 繁體漢字頻率數據)
    store.set(字頻表緩存原子狀態, cache)
    return 繁體漢字頻率數據
  }

  /**
   * 加載知乎漢字頻率表
   */
  static async 加載知乎簡體字頻(): Promise<頻率數據型别> {
    const store = getDefaultStore()
    const cache = store.get(字頻表緩存原子狀態)
    const cached = cache.get('知乎簡體字頻')
    if (cached) return cached

    // 動態加載絶對頻數數據並歸一化爲相對頻率
    const 知乎漢字頻數數據 = await 加載JSON數據文件<頻數數據型别>('charAbsoluteFrequencyZhihu.json')
    const 知乎漢字頻率數據 = 歸一化頻數(知乎漢字頻數數據)
    cache.set('知乎簡體字頻', 知乎漢字頻率數據)
    store.set(字頻表緩存原子狀態, cache)
    return 知乎漢字頻率數據
  }

  /**
   * 加載古籍漢字頻率表
   */
  static async 加載古籍繁體字頻(): Promise<頻率數據型别> {
    const store = getDefaultStore()
    const cache = store.get(字頻表緩存原子狀態)
    const cached = cache.get('古籍繁體字頻')
    if (cached) return cached

    // 動態加載絶對頻數數據並歸一化爲相對頻率
    const 古籍漢字頻數數據 = await 加載JSON數據文件<頻數數據型别>('charAbsoluteFrequencyGuji.json')
    const 古籍漢字頻率數據 = 歸一化頻數(古籍漢字頻數數據)
    cache.set('古籍繁體字頻', 古籍漢字頻率數據)
    store.set(字頻表緩存原子狀態, cache)
    return 古籍漢字頻率數據
  }

  /**
   * 計算繁簡聯合漢字頻率表（合併簡體和繁體）
   */
  static async 計算繁簡聯合字頻(): Promise<頻率數據型别> {
    const store = getDefaultStore()
    const cache = store.get(字頻表緩存原子狀態)
    const cached = cache.get('繁簡聯合字頻')
    if (cached) return cached

    const [簡體字頻, 繁體字頻] = await Promise.all([
      this.加載北語簡體字頻(),
      this.加載臺標繁體字頻(),
    ])

    // 合併字頻，取較大值
    const 合併字頻: 頻率數據型别 = { ...簡體字頻 }
    for (const [字符, 頻率] of Object.entries(繁體字頻)) {
      const 當前頻率 = 合併字頻[字符]
      if (!當前頻率 || 當前頻率 < 頻率) {
        合併字頻[字符] = 頻率
      }
    }

    // 緩存合併後的字頻數據
    cache.set('繁簡聯合字頻', 合併字頻)
    store.set(字頻表緩存原子狀態, cache)

    return 合併字頻
  }

  /**
   * 根據類型加載對應的漢字頻率表
   */
  static async 加載字頻表(
    類型: '北語簡體字頻' | '臺標繁體字頻' | '繁簡聯合字頻' | '知乎簡體字頻' | '古籍繁體字頻'
  ): Promise<頻率數據型别> {
    switch (類型) {
      case '北語簡體字頻':
        return this.加載北語簡體字頻()
      case '臺標繁體字頻':
        return this.加載臺標繁體字頻()
      case '繁簡聯合字頻':
        return this.計算繁簡聯合字頻()
      case '知乎簡體字頻':
        return this.加載知乎簡體字頻()
      case '古籍繁體字頻':
        return this.加載古籍繁體字頻()
      default:
        throw new Error(`未知的字頻表類型: ${類型}`)
    }
  }
}
