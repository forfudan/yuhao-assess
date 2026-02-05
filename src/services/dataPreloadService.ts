/* eslint-disable no-undef */
import { getDefaultStore } from 'jotai'
import { 數據預加載狀態原子 } from '../atoms/dataPreload'
import { 字頻表服務類別 } from './charFrequencyService'
import { 加載JSON數據文件 } from '../utils/data-loader'
import { 字符集數據原子狀態 } from '../atoms/charset'
import type { CharsetData } from '../atoms/charset'

/**
 * 數據預加載服務
 * 在應用啓動時預加載常用數據，提升後續頁面加載速度
 */
export class 數據預加載服務類別 {
  /**
   * 預加載核心數據（簡體+繁體字頻+字符集）
   * 這是最常用的數據，在應用啓動時立即加載
   */
  static async 預加載核心數據(): Promise<void> {
    const store = getDefaultStore()
    const state = store.get(數據預加載狀態原子)

    // 更新狀態爲 loading
    store.set(數據預加載狀態原子, {
      ...state,
      北語簡體字頻: { 狀態: 'loading' },
      臺標繁體字頻: { 狀態: 'loading' },
      字符集數據: { 狀態: 'loading' },
    })

    try {
      // 並行加載簡體字頻、繁體字頻和字符集
      await Promise.all([
        字頻表服務類別.加載北語簡體字頻(),
        字頻表服務類別.加載臺標繁體字頻(),
        this.加載字符集數據(),
      ])

      // 更新狀態爲 loaded
      store.set(數據預加載狀態原子, {
        ...store.get(數據預加載狀態原子),
        北語簡體字頻: { 狀態: 'loaded', 加載完成時間戳: Date.now() },
        臺標繁體字頻: { 狀態: 'loaded', 加載完成時間戳: Date.now() },
        字符集數據: { 狀態: 'loaded', 加載完成時間戳: Date.now() },
      })
    } catch (error) {
      // 更新狀態爲 error
      const err = error instanceof Error ? error : new Error(String(error))
      store.set(數據預加載狀態原子, {
        ...store.get(數據預加載狀態原子),
        北語簡體字頻: { 狀態: 'error', 錯誤: err },
        臺標繁體字頻: { 狀態: 'error', 錯誤: err },
        字符集數據: { 狀態: 'error', 錯誤: err },
      })
      console.error('❌ 核心數據加載失敗:', error)
    }
  }

  /**
   * 加載字符集數據
   * 可被外部調用的公開方法
   */
  static async 加載字符集數據(): Promise<void> {
    const store = getDefaultStore()
    const existing = store.get(字符集數據原子狀態)
    if (existing) return

    const data = await 加載JSON數據文件<CharsetData>('charsets.json')
    store.set(字符集數據原子狀態, data)
  }

  /**
   * 預加載擴展數據（知乎+古籍+繁簡聯合字頻）
   * 在瀏覽器空閒時加載，不阻塞主要功能
   */
  static async 預加載擴展數據(): Promise<void> {
    const store = getDefaultStore()

    // 知乎字頻
    try {
      store.set(數據預加載狀態原子, {
        ...store.get(數據預加載狀態原子),
        知乎簡體字頻: { 狀態: 'loading' },
      })

      await 字頻表服務類別.加載知乎簡體字頻()

      store.set(數據預加載狀態原子, {
        ...store.get(數據預加載狀態原子),
        知乎簡體字頻: { 狀態: 'loaded', 加載完成時間戳: Date.now() },
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      store.set(數據預加載狀態原子, {
        ...store.get(數據預加載狀態原子),
        知乎簡體字頻: { 狀態: 'error', 錯誤: err },
      })
      console.error('⚠️ 知乎簡體字頻加載失敗:', error)
    }

    // 古籍字頻
    try {
      store.set(數據預加載狀態原子, {
        ...store.get(數據預加載狀態原子),
        古籍繁體字頻: { 狀態: 'loading' },
      })

      await 字頻表服務類別.加載古籍繁體字頻()

      store.set(數據預加載狀態原子, {
        ...store.get(數據預加載狀態原子),
        古籍繁體字頻: { 狀態: 'loaded', 加載完成時間戳: Date.now() },
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      store.set(數據預加載狀態原子, {
        ...store.get(數據預加載狀態原子),
        古籍繁體字頻: { 狀態: 'error', 錯誤: err },
      })
      console.error('⚠️ 古籍繁體字頻加載失敗:', error)
    }

    // 繁簡聯合字頻
    try {
      store.set(數據預加載狀態原子, {
        ...store.get(數據預加載狀態原子),
        繁簡聯合字頻: { 狀態: 'loading' },
      })

      await 字頻表服務類別.計算繁簡聯合字頻()

      store.set(數據預加載狀態原子, {
        ...store.get(數據預加載狀態原子),
        繁簡聯合字頻: { 狀態: 'loaded', 加載完成時間戳: Date.now() },
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      store.set(數據預加載狀態原子, {
        ...store.get(數據預加載狀態原子),
        繁簡聯合字頻: { 狀態: 'error', 錯誤: err },
      })
      console.error('⚠️ 繁簡聯合字頻加載失敗:', error)
    }
  }

  /**
   * 啓動智能預加載
   * 核心數據立即加載，擴展數據空閒時加載
   */
  static 啓動預加載(): void {
    // 立即加載核心數據
    console.log('🚀 開始預加載核心數據...')
    this.預加載核心數據().then(() => {
      console.log('✅ 核心數據加載完成')
    })

    // 空閒時加載擴展數據
    if ('requestIdleCallback' in window) {
      requestIdleCallback(
        () => {
          console.log('⏰ 瀏覽器空閒，開始加載擴展數據...')
          this.預加載擴展數據().then(() => {
            console.log('✅ 擴展數據加載完成')
          })
        },
        { timeout: 3000 } // 最多等待3秒
      )
    } else {
      // 不支持 requestIdleCallback 的瀏覽器，延遲2秒後加載
      setTimeout(() => {
        console.log('⏰ 延遲加載擴展數據...')
        this.預加載擴展數據()
      }, 2000)
    }
  }

  /**
   * 等待指定數據加載完成
   * @param dataKey 數據鍵名
   * @param timeout 超時時間（毫秒），默認10秒
   */
  static async 等待數據加載完成(
    dataKey: keyof ReturnType<typeof 數據預加載狀態原子.read>,
    timeout = 10000
  ): Promise<void> {
    const store = getDefaultStore()
    const startTime = Date.now()

    return new Promise((resolve, reject) => {
      const checkStatus = () => {
        const state = store.get(數據預加載狀態原子)
        const status = state[dataKey as keyof typeof state]?.狀態

        if (status === 'loaded') {
          resolve()
        } else if (status === 'error') {
          reject(new Error(`數據加載失敗: ${dataKey}`))
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`數據加載超時: ${dataKey}`))
        } else {
          // 繼續等待
          setTimeout(checkStatus, 100)
        }
      }

      checkStatus()
    })
  }
}
