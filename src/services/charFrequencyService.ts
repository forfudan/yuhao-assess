import type { CharFrequency } from '@/types'

/**
 * 字頻表服務
 * 負責從 /data 目録加載各種字頻數據
 */
export class 字頻表服務 {
  private static 基礎路徑 = '/data'

  /**
   * 加載簡體字頻表
   */
  static async 加載簡體字頻(): Promise<CharFrequency> {
    const 響應 = await fetch(`${this.基礎路徑}/charFrequencySC.json`)
    if (!響應.ok) {
      throw new Error(`加載簡體字頻失敗: ${響應.statusText}`)
    }
    return 響應.json()
  }

  /**
   * 加載繁體字頻表
   */
  static async 加載繁體字頻(): Promise<CharFrequency> {
    const 響應 = await fetch(`${this.基礎路徑}/charFrequencyTC.json`)
    if (!響應.ok) {
      throw new Error(`加載繁體字頻失敗: ${響應.statusText}`)
    }
    return 響應.json()
  }

  /**
   * 加載知乎字頻表
   */
  static async 加載知乎字頻(): Promise<CharFrequency> {
    const 響應 = await fetch(`${this.基礎路徑}/charFrequencyZhihu.json`)
    if (!響應.ok) {
      throw new Error(`加載知乎字頻失敗: ${響應.statusText}`)
    }
    return 響應.json()
  }

  /**
   * 加載古籍字頻表
   */
  static async 加載古籍字頻(): Promise<CharFrequency> {
    const 響應 = await fetch(`${this.基礎路徑}/charFrequencyGuji.json`)
    if (!響應.ok) {
      throw new Error(`加載古籍字頻失敗: ${響應.statusText}`)
    }
    return 響應.json()
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
