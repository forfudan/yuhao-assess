import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import { 數據預加載狀態介面, 數據預加載狀態原子 } from '../atoms/dataPreload'
import { 字頻表服務 } from '../services/charFrequencyService'
import { DataPreloadService } from '../services/dataPreloadService'

/**
 * 使用數據預加載狀態的 Hook
 * 返回當前的加載狀態，方便頁面組件判斷是否可以開始計算
 */
export function useDataPreload() {
  const state = useAtomValue(數據預加載狀態原子)

  return {
    state,
    isLoading: Object.values(state).some(item => item.status === 'loading'),
    isReady:
      state.北語簡體字頻.status === 'loaded' &&
      state.臺標繁體字頻.status === 'loaded' &&
      state.字符集數據.status === 'loaded',
    allLoaded: Object.values(state).every(item => item.status === 'loaded'),
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
  const state = useAtomValue(數據預加載狀態原子)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadData = async () => {
      // 檢查哪些數據需要加載
      const needsLoading = requiredData.filter(key => {
        const status = state[key].status
        return status === 'idle' || status === 'error'
      })

      if (needsLoading.length === 0) {
        // 檢查是否都已加載完成
        const allLoaded = requiredData.every(key => state[key].status === 'loaded')
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
                return 字頻表服務.加載北語簡體字頻()
              case '臺標繁體字頻':
                return 字頻表服務.加載臺標繁體字頻()
              case '知乎簡體字頻':
                return 字頻表服務.加載知乎簡體字頻()
              case '古籍繁體字頻':
                return 字頻表服務.加載古籍繁體字頻()
              case '繁簡聯合字頻':
                return 字頻表服務.計算繁簡聯合字頻()
              case '字符集數據':
                return DataPreloadService.加載字符集數據()
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
  }, [requiredData, state])

  // 檢查所需數據是否都已加載
  const ready = requiredData.every(key => state[key].status === 'loaded')

  return { loading, error, ready }
}
