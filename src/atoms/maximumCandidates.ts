/**
 * 候選個數分析原子狀態
 * 存儲候選個數分析的統計結果（可導出到 JSON）
 */

import { 累積漢字集名稱型别 } from '@/services/charsetService'
import { atomWithStorage } from 'jotai/utils'

/**
 * 單個字符集的最大候選項結果
 */
export interface 最大候選個數結果 {
  最大候選個數: number
  編碼列表: string[] // 只存儲編碼，字符在需要時從碼表實時計算
}

/**
 * 最大候選個數分析完整結果
 * 這些數據會持久化，可以導出到 JSON
 */
export interface 最大候選個數分析結果 {
  // 各字符集的候選個數
  GB2312?: 最大候選個數結果
  通用規範?: 最大候選個數結果
  常用國字?: 最大候選個數結果
  CJK基本?: 最大候選個數結果
  到CJK擴A?: 最大候選個數結果
  到CJK擴B?: 最大候選個數結果
  到CJK擴C?: 最大候選個數結果
  到CJK擴D?: 最大候選個數結果
  到CJK擴E?: 最大候選個數結果
  到CJK擴F?: 最大候選個數結果
  到CJK擴G?: 最大候選個數結果
  到CJK擴H?: 最大候選個數結果
  到CJK擴I?: 最大候選個數結果
  到CJK擴J?: 最大候選個數結果

  // 元數據
  字符數?: number // 總字符數
  更新時間?: string
  碼表哈希?: string // 用於判斷碼表是否變化
}

/**
 * 驗證候選個數數據結構是否正確
 */
export function 驗證候選個數數據(data: any): data is 最大候選個數分析結果 {
  if (!data || typeof data !== 'object') return false

  // 檢查是否至少有一個有效的字符集數據
  const 有效鍵名: 累積漢字集名稱型别[] = [
    'GB2312',
    '通用規範',
    '常用國字',
    'CJK基本',
    '到CJK擴A',
    '到CJK擴B',
    '到CJK擴C',
    '到CJK擴D',
    '到CJK擴E',
    '到CJK擴F',
    '到CJK擴G',
    '到CJK擴H',
    '到CJK擴I',
    '到CJK擴J',
  ]

  // 檢查每個存在的字符集數據結構
  for (const key of Object.keys(data)) {
    // 跳過元數據字段
    if (key === '更新時間' || key === '碼表哈希' || key === '字符數') continue

    // 檢查是否是有效的字符集鍵名
    if (!有效鍵名.includes(key as 累積漢字集名稱型别)) {
      console.warn(`⚠️ 候選個數數據包含無效字符集: ${key}，將清除舊數據`)
      return false
    }

    const charsetData = data[key]
    // 檢查數據結構
    if (
      !charsetData ||
      typeof charsetData.最大候選個數 !== 'number' ||
      !Array.isArray(charsetData.編碼列表)
    ) {
      console.warn(`⚠️ 字符集 ${key} 的候選個數數據結構不正確，將清除舊數據`)
      return false
    }
  }

  return true
}

/**
 * 候選個數分析原子狀態（持久化到 localStorage）
 */
export const 候選個數分析原子狀態 = atomWithStorage<最大候選個數分析結果 | null>(
  'maximumCandidatesAnalysis',
  null,
  {
    getItem: (key, initialValue) => {
      try {
        const storedValue = localStorage.getItem(key)
        if (storedValue === null) {
          return initialValue
        }

        const parsedValue = JSON.parse(storedValue)

        // 驗證數據結構
        if (驗證候選個數數據(parsedValue)) {
          console.log('✅ 候選個數數據驗證通過')
          return parsedValue
        } else {
          // 數據結構不匹配，清除舊數據並返回null
          console.warn('🔄 檢測到舊版本候選個數數據格式，已清除localStorage')
          localStorage.removeItem(key)
          return null
        }
      } catch (error) {
        console.error('❌ 讀取候選個數數據失敗:', error)
        localStorage.removeItem(key)
        return null
      }
    },
    setItem: (key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch (error) {
        console.error('❌ 保存候選個數數據失敗:', error)
      }
    },
    removeItem: key => {
      localStorage.removeItem(key)
    },
  }
)
