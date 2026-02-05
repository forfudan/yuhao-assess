import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import { 數據預加載狀態介面, 數據預加載狀態原子 } from '../atoms/dataPreload'
import { 字頻表服務類别 } from '../services/charFrequencyService'
import { 數據預加載服務類别 } from '../services/dataPreloadService'

/**
 * 使用數據預加載狀態的 Hook
 * 返回當前的加載狀態，方便頁面組件判斷是否可以開始計算
 */
export function useDataPreload() {
  const 數據預加載狀態 = useAtomValue(數據預加載狀態原子)

  return {
    數據預加載狀態,
    isLoading: Object.values(數據預加載狀態).some(item => item.狀態 === 'loading'),
    isReady:
      數據預加載狀態.北語簡體字頻.狀態 === 'loaded' &&
      數據預加載狀態.臺標繁體字頻.狀態 === 'loaded' &&
      數據預加載狀態.字符集數據.狀態 === 'loaded',
    allLoaded: Object.values(數據預加載狀態).every(item => item.狀態 === 'loaded'),
  }
}

/**
 * 確保指定字頻數據已加載的 Hook
 * 如果數據未加載，會自動觸發加載
 *
 * @param requiredData 需要的數據類型數組
 * @returns loading 狀態和 error
 */
export function useEnsureDataLoaded(requiredData: Array<keyof 數據預加載狀態介面>): {
  loading: boolean
  error: Error | null
  ready: boolean
} {
  const 數據預加載狀態 = useAtomValue(數據預加載狀態原子)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadData = async () => {
      // 檢查哪些數據需要加載
      const needsLoading = requiredData.filter(key => {
        const status = 數據預加載狀態[key].狀態
        return status === 'idle' || status === 'error'
      })

      if (needsLoading.length === 0) {
        // 檢查是否都已加載完成
        const allLoaded = requiredData.every(key => 數據預加載狀態[key].狀態 === 'loaded')
        if (allLoaded) {
          setLoading(false)
          setError(null)
        }
        return
      }

      setLoading(true)
      setError(null)

      try {
        // 並行加載需要的數據
        await Promise.all(
          needsLoading.map(key => {
            switch (key) {
              case '北語簡體字頻':
                return 字頻表服務類别.加載北語簡體字頻()
              case '臺標繁體字頻':
                return 字頻表服務類别.加載臺標繁體字頻()
              case '知乎簡體字頻':
                return 字頻表服務類别.加載知乎簡體字頻()
              case '古籍繁體字頻':
                return 字頻表服務類别.加載古籍繁體字頻()
              case '繁簡聯合字頻':
                return 字頻表服務類别.計算繁簡聯合字頻()
              case '字符集數據':
                return 數據預加載服務類别.加載字符集數據()
              default:
                return Promise.resolve()
            }
          })
        )
        setLoading(false)
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        setLoading(false)
      }
    }

    loadData()
  }, [requiredData, 數據預加載狀態])

  // 檢查所需數據是否都已加載
  const ready = requiredData.every(key => 數據預加載狀態[key].狀態 === 'loaded')

  return { loading, error, ready }
}
