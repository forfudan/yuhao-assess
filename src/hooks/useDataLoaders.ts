import { useState, useEffect } from 'react'
import { 加載JSON數據文件 } from '@/utils/data-loader'

/**
 * 字符頻數數據型别（Absolute Frequency）
 *
 * 鍵：單個字符
 * 值：該字符在語料庫中的出現次數（整數）
 */
export type CharAbsoluteFrequencyData = Record<string, number>

/**
 * 數據加載 Hook 的返回類型
 */
interface UseDataResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * 加載字符頻數數據
 *
 * @param 文件名 文件名（不含 .json 擴展名），如 'charAbsoluteFrequencySC'
 * @returns 包含數據、加載狀態、錯誤信息和重新加載函數的對象
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

        const 結果 = await 加載JSON數據文件<CharAbsoluteFrequencyData>(`${文件名}.json`)

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
 * 詞語頻數數據型别（Absolute Frequency）
 *
 * 鍵：詞語字符串
 * 值：該詞語在語料庫中的出現次數（整數）
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

        const 結果 = await 加載JSON數據文件<WordAbsoluteFrequencyData>(`${文件名}.json`)

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
 * 字符集數據結構
 */
export interface Charset {
  name: string
  chars: string[]
  description?: string
}

/**
 * 字符集數據類型
 *
 * 包含 GB2312、GBK、通用規範漢字表、BIG5 等字符集
 */
export type CharsetsData = Record<string, Charset>

/**
 * 加載字符集數據
 *
 * @returns 包含數據、加載狀態、錯誤信息和重新加載函數的對象
 */
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

        const 結果 = await 加載JSON數據文件<CharsetsData>('charsets.json')

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
