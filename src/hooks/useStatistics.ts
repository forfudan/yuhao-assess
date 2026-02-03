/**
 * 統計計算 Hooks
 * 爲 React 組件提供統計服務的統一接口
 */

import { useState, useCallback } from 'react'
import type { CodeTable, CharFrequency, WordFrequency } from '@/types'
import {
  getStaticDupRate,
  getDynamicDupRate,
  getDynamicDupRateFromOriginalOrder,
  calculateCharsetDuplicates,
  type DuplicateStats,
} from '@/services'

/**
 * Hook 返回類型
 */
interface UseStatisticsResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  calculate: (...args: any[]) => Promise<void>
  reset: () => void
}

/**
 * 使用重碼統計 Hook
 *
 * @example
 * ```tsx
 * const { data, loading, error, calculate } = useDuplicateStats()
 *
 * // 計算靜態重碼率
 * await calculate('static', codeTable, charset)
 *
 * // 計算動態選重率
 * await calculate('dynamic', codeTable, charFrequency)
 * ```
 */
export function useDuplicateStats(): UseStatisticsResult<DuplicateStats> {
  const [數據, 設置數據] = useState<DuplicateStats | null>(null)
  const [加載中, 設置加載中] = useState(false)
  const [錯誤, 設置錯誤] = useState<string | null>(null)

  const 計算 = useCallback(
    async (
      類型: 'static' | 'dynamic' | 'charset',
      碼表: CodeTable,
      選項?: {
        字符集?: Set<string> | 'all'
        字頻數據?: CharFrequency
        排序依字頻?: boolean
        字符集類型?: string
      }
    ) => {
      try {
        設置加載中(true)
        設置錯誤(null)

        let 結果: DuplicateStats

        if (類型 === 'charset') {
          if (!選項?.字符集類型) {
            throw new Error('字符集重碼統計需要指定字符集類型')
          }
          結果 = await calculateCharsetDuplicates(碼表, 選項.字符集類型 as any)
        } else {
          // static 和 dynamic 類型需要手動構造 DuplicateStats
          throw new Error('請使用 charset 類型，或使用專門的靜態/動態重碼計算函數')
        }

        設置數據(結果)
      } catch (錯誤對象) {
        const 錯誤信息 = 錯誤對象 instanceof Error ? 錯誤對象.message : '計算失敗'
        設置錯誤(錯誤信息)
        console.error('重碼統計計算錯誤:', 錯誤對象)
      } finally {
        設置加載中(false)
      }
    },
    []
  )

  const 重置 = useCallback(() => {
    設置數據(null)
    設置錯誤(null)
    設置加載中(false)
  }, [])

  return {
    data: 數據,
    loading: 加載中,
    error: 錯誤,
    calculate: 計算,
    reset: 重置,
  }
}

/**
 * 使用碼長分布統計 Hook
 */
export function useCodeLengthDistribution() {
  const [數據, 設置數據] = useState<Record<number, number> | null>(null)
  const [加載中, 設置加載中] = useState(false)
  const [錯誤, 設置錯誤] = useState<string | null>(null)

  const 計算 = useCallback(async (碼表: CodeTable) => {
    try {
      設置加載中(true)
      設置錯誤(null)

      const 分布 = new Map<number, number>()

      for (const [, codes] of 碼表.entries()) {
        const code = codes[0]
        if (code) {
          const 長度 = code.length
          分布.set(長度, (分布.get(長度) || 0) + 1)
        }
      }

      const 結果: Record<number, number> = {}
      for (const [長度, 數量] of 分布.entries()) {
        結果[長度] = 數量
      }

      設置數據(結果)
    } catch (錯誤對象) {
      const 錯誤信息 = 錯誤對象 instanceof Error ? 錯誤對象.message : '計算失敗'
      設置錯誤(錯誤信息)
      console.error('碼長分布計算錯誤:', 錯誤對象)
    } finally {
      設置加載中(false)
    }
  }, [])

  const 重置 = useCallback(() => {
    設置數據(null)
    設置錯誤(null)
    設置加載中(false)
  }, [])

  return {
    data: 數據,
    loading: 加載中,
    error: 錯誤,
    calculate: 計算,
    reset: 重置,
  }
}

/**
 * 通用統計 Hook 工廠函數
 *
 * @param calculator 計算函數
 * @returns 統計 Hook
 */
export function createStatisticsHook<TInput, TOutput>(
  calculator: (input: TInput) => Promise<TOutput> | TOutput
): () => UseStatisticsResult<TOutput> {
  return () => {
    const [數據, 設置數據] = useState<TOutput | null>(null)
    const [加載中, 設置加載中] = useState(false)
    const [錯誤, 設置錯誤] = useState<string | null>(null)

    const 計算 = useCallback(async (input: TInput) => {
      try {
        設置加載中(true)
        設置錯誤(null)

        const 結果 = await Promise.resolve(calculator(input))
        設置數據(結果)
      } catch (錯誤對象) {
        const 錯誤信息 = 錯誤對象 instanceof Error ? 錯誤對象.message : '計算失敗'
        設置錯誤(錯誤信息)
        console.error('統計計算錯誤:', 錯誤對象)
      } finally {
        設置加載中(false)
      }
    }, [])

    const 重置 = useCallback(() => {
      設置數據(null)
      設置錯誤(null)
      設置加載中(false)
    }, [])

    return {
      data: 數據,
      loading: 加載中,
      error: 錯誤,
      calculate: 計算,
      reset: 重置,
    }
  }
}
