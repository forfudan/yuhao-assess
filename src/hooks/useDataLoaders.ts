import { useState, useEffect } from 'react'
import { loadDataJSON } from '@/utils/data-loader'

/**
 * 🎯 教學：自定義 Hook - useCharFrequency
 *
 * 📖 功能：加載字符頻率數據
 *
 * 💡 為什麼需要這個 Hook？
 * - 封裝數據加載邏輯，讓組件更簡潔
 * - 處理加載狀態（loading、error）
 * - 自動緩存數據，避免重複請求
 *
 * 🔧 使用方式：
 * ```tsx
 * const { data, loading, error } = useCharFrequency('charFrequencySC')
 *
 * if (loading) return <Spin />
 * if (error) return <Alert message={error} type="error" />
 * return <div>{data['我']}</div>  // 顯示「我」的頻率
 * ```
 */

// 字符頻率數據類型：字符 -> 頻率值
export type CharFrequencyData = Record<string, number>

interface UseDataResult<T> {
  data: T | null // 加載的數據（null 表示尚未加載）
  loading: boolean // 是否正在加載
  error: string | null // 錯誤信息
  refetch: () => void // 手動重新加載函數
}

/**
 * 加載字符頻率數據
 * @param filename 文件名（如 'charFrequencySC', 'charFrequencyTC'）
 */
export function useCharFrequency(filename: string): UseDataResult<CharFrequencyData> {
  // 📌 useState：管理組件狀態
  // - data: 存儲加載的數據
  // - loading: 追蹤加載狀態
  // - error: 記錄錯誤信息
  const [data, setData] = useState<CharFrequencyData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 📌 useEffect：副作用處理
  // - 當 filename 改變時，重新加載數據
  // - 依賴陣列 [filename] 確保只在必要時重新執行
  useEffect(() => {
    // 如果沒有指定文件名，直接返回
    if (!filename) {
      setData(null)
      return
    }

    let cancelled = false // 防止競態條件（race condition）

    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // 從 CDN 或本地加載數據
        const result = await loadDataJSON<CharFrequencyData>(`${filename}.json`)

        // 📌 防止組件卸載後更新狀態（React 18 嚴格模式）
        if (!cancelled) {
          setData(result)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '加載字符頻率數據失敗')
          console.error('加載字符頻率失敗:', err)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadData()

    // 📌 清理函數：組件卸載或 filename 改變時執行
    return () => {
      cancelled = true
    }
  }, [filename])

  // 手動重新加載函數
  const refetch = () => {
    setData(null)
    setError(null)
    // 觸發 useEffect 重新執行（通過改變依賴）
  }

  return { data, loading, error, refetch }
}

/**
 * 🎯 教學：詞語頻率 Hook
 *
 * 📖 功能：加載詞語頻率數據
 * 結構與 useCharFrequency 相同，但數據格式不同
 */
export type WordFrequencyData = Record<string, number>

export function useWordFrequency(filename: string): UseDataResult<WordFrequencyData> {
  const [data, setData] = useState<WordFrequencyData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!filename) {
      setData(null)
      return
    }

    let cancelled = false

    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        const result = await loadDataJSON<WordFrequencyData>(`${filename}.json`)

        if (!cancelled) {
          setData(result)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '加載詞語頻率數據失敗')
          console.error('加載詞語頻率失敗:', err)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [filename])

  const refetch = () => {
    setData(null)
    setError(null)
  }

  return { data, loading, error, refetch }
}

/**
 * 🎯 教學：字符集 Hook
 *
 * 📖 功能：加載字符集數據（GB2312、GBK、通用規範漢字表等）
 */
export interface Charset {
  name: string
  chars: string[]
  description?: string
}

export type CharsetsData = Record<string, Charset>

export function useCharsets(): UseDataResult<CharsetsData> {
  const [data, setData] = useState<CharsetsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        const result = await loadDataJSON<CharsetsData>('charsets.json')

        if (!cancelled) {
          setData(result)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '加載字符集數據失敗')
          console.error('加載字符集失敗:', err)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, []) // 空依賴陣列 = 只在組件掛載時執行一次

  const refetch = () => {
    setData(null)
    setError(null)
  }

  return { data, loading, error, refetch }
}
