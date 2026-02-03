import { useState, useEffect } from 'react'
import { loadDataJSON } from '@/utils/data-loader'

/**
 * 自定義 Hook - useCharAbsoluteFrequency
 *
 * 加載字符頻數數據（Absolute Frequency，出現次數）
 *
 * 爲什麽需要這個 Hook？
 * - 封裝數據加載邏輯，讓組件更簡潔
 * - 處理加載狀態（loading、error）
 * - 自動緩存數據，避免重複請求
 *
 * 使用方式：
 * ```tsx
 * const { data, loading, error } = useCharAbsoluteFrequency('charAbsoluteFrequencySC')
 *
 * if (loading) return <Spin />
 * if (error) return <Alert message={error} type="error" />
 * return <div>{data['我']}</div>  // 顯示「我」的頻數（出現次數）
 * ```
 */

// 字符頻數數據類型：字符 -> 頻數值（Absolute Frequency，出現次數）
export type CharAbsoluteFrequencyData = Record<string, number>

interface UseDataResult<T> {
  data: T | null // 加載的數據（null 表示尚未加載）
  loading: boolean // 是否正在加載
  error: string | null // 錯誤信息
  refetch: () => void // 手動重新加載函數
}

/**
 * 加載字符頻數數據
 * @param 文件名 文件名（如 'charAbsoluteFrequencySC', 'charAbsoluteFrequencyTC'）
 */
export function useCharAbsoluteFrequency(文件名: string): UseDataResult<CharAbsoluteFrequencyData> {
  const [數據, 設置數據] = useState<CharAbsoluteFrequencyData | null>(null)
  const [加載中, 設置加載中] = useState(false)
  const [錯誤, 設置錯誤] = useState<string | null>(null)

  useEffect(() => {
    if (!文件名) {
      設置數據(null)
      return
    }

    let 已取消 = false

    const 加載數據 = async () => {
      try {
        設置加載中(true)
        設置錯誤(null)

        const 結果 = await loadDataJSON<CharAbsoluteFrequencyData>(`${文件名}.json`)

        if (!已取消) {
          設置數據(結果)
        }
      } catch (錯誤對象) {
        if (!已取消) {
          設置錯誤(錯誤對象 instanceof Error ? 錯誤對象.message : '加載字符頻率數據失敗')
          console.error('加載字符頻率失敗:', 錯誤對象)
        }
      } finally {
        if (!已取消) {
          設置加載中(false)
        }
      }
    }

    加載數據()

    return () => {
      已取消 = true
    }
  }, [文件名])

  const 重新加載 = () => {
    設置數據(null)
    設置錯誤(null)
  }

  return { data: 數據, loading: 加載中, error: 錯誤, refetch: 重新加載 }
}

/**
 * 🎯 教學：詞語頻數 Hook
 *
 * 📖 功能：加載詞語頻數數據（Absolute Frequency，出現次數）
 * 結構與 useCharAbsoluteFrequency 相同，但數據格式不同
 */
export type WordAbsoluteFrequencyData = Record<string, number>

export function useWordAbsoluteFrequency(文件名: string): UseDataResult<WordAbsoluteFrequencyData> {
  const [數據, 設置數據] = useState<WordAbsoluteFrequencyData | null>(null)
  const [加載中, 設置加載中] = useState(false)
  const [錯誤, 設置錯誤] = useState<string | null>(null)

  useEffect(() => {
    if (!文件名) {
      設置數據(null)
      return
    }

    let 已取消 = false

    const 加載數據 = async () => {
      try {
        設置加載中(true)
        設置錯誤(null)

        const 結果 = await loadDataJSON<WordAbsoluteFrequencyData>(`${文件名}.json`)

        if (!已取消) {
          設置數據(結果)
        }
      } catch (錯誤對象) {
        if (!已取消) {
          設置錯誤(錯誤對象 instanceof Error ? 錯誤對象.message : '加載詞語頻數數據失敗')
          console.error('加載詞語頻數失敗:', 錯誤對象)
        }
      } finally {
        if (!已取消) {
          設置加載中(false)
        }
      }
    }

    加載數據()

    return () => {
      已取消 = true
    }
  }, [文件名])

  const 重新加載 = () => {
    設置數據(null)
    設置錯誤(null)
  }

  return { data: 數據, loading: 加載中, error: 錯誤, refetch: 重新加載 }
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
  const [數據, 設置數據] = useState<CharsetsData | null>(null)
  const [加載中, 設置加載中] = useState(false)
  const [錯誤, 設置錯誤] = useState<string | null>(null)

  useEffect(() => {
    let 已取消 = false

    const 加載數據 = async () => {
      try {
        設置加載中(true)
        設置錯誤(null)

        const 結果 = await loadDataJSON<CharsetsData>('charsets.json')

        if (!已取消) {
          設置數據(結果)
        }
      } catch (錯誤對象) {
        if (!已取消) {
          設置錯誤(錯誤對象 instanceof Error ? 錯誤對象.message : '加載字符集數據失敗')
          console.error('加載字符集失敗:', 錯誤對象)
        }
      } finally {
        if (!已取消) {
          設置加載中(false)
        }
      }
    }

    加載數據()

    return () => {
      已取消 = true
    }
  }, [])

  const 重新加載 = () => {
    設置數據(null)
    設置錯誤(null)
  }

  return { data: 數據, loading: 加載中, error: 錯誤, refetch: 重新加載 }
}
