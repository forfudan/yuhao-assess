/**
 * 靜態重碼分析狀態管理
 */

import { 累積漢字集名稱型别 } from '@/services/charsetService'
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

/**
 * 某字符集的靜態重碼數據介面
 */
export interface 某字符集的靜態重碼數據介面 {
  全碼重碼組數: number
  簡碼重碼組數: number
  全碼重碼字數: number
  簡碼重碼字數: number
  實際字符數: number
  理論字符數: number
  字集覆蓋率: number // 實際字符數 / 理論字符數
}

/**
 * 靜態重碼分析結果介面
 */
export interface 靜態重碼分析結果介面 {
  GB2312: 某字符集的靜態重碼數據介面
  通用規範: 某字符集的靜態重碼數據介面
  常用國字: 某字符集的靜態重碼數據介面
  CJK基本: 某字符集的靜態重碼數據介面
  到CJK擴A: 某字符集的靜態重碼數據介面
  到CJK擴B: 某字符集的靜態重碼數據介面
  到CJK擴C: 某字符集的靜態重碼數據介面
  到CJK擴D: 某字符集的靜態重碼數據介面
  到CJK擴E: 某字符集的靜態重碼數據介面
  到CJK擴F: 某字符集的靜態重碼數據介面
  到CJK擴G: 某字符集的靜態重碼數據介面
  到CJK擴H: 某字符集的靜態重碼數據介面
  到CJK擴I: 某字符集的靜態重碼數據介面
  到CJK擴J: 某字符集的靜態重碼數據介面
  更新時間?: string
}

/**
 * 驗證靜態重碼數據結構是否正確
 */
export function 驗證靜態重碼數據(data: any): data is 靜態重碼分析結果介面 {
  if (!data || typeof data !== 'object') return false

  // 必需的字符集鍵名
  const 必需鍵名: 累積漢字集名稱型别[] = [
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

  // 檢查是否所有必需的鍵都存在
  for (const key of 必需鍵名) {
    if (!(key in data)) {
      console.warn(`⚠️ 靜態重碼數據缺少字符集: ${key}，將清除舊數據`)
      return false
    }

    const charsetData = data[key]
    // 檢查每個字符集的數據結構
    if (
      !charsetData ||
      typeof charsetData.全碼重碼組數 !== 'number' ||
      typeof charsetData.簡碼重碼組數 !== 'number' ||
      typeof charsetData.全碼重碼字數 !== 'number' ||
      typeof charsetData.簡碼重碼字數 !== 'number' ||
      typeof charsetData.實際字符數 !== 'number' ||
      typeof charsetData.理論字符數 !== 'number' ||
      typeof charsetData.字集覆蓋率 !== 'number'
    ) {
      console.warn(`⚠️ 字符集 ${key} 的數據結構不正確，將清除舊數據`)
      return false
    }
  }

  return true
}

/**
 * 靜態重碼分析原子狀態
 * 存儲各字符集的靜態重碼數據
 * 使用 atomWithStorage 支持本地存儲和導入導出
 * 包含數據驗證，當數據結構不匹配時自動清除舊數據
 */
export const 靜態重碼分析原子狀態 = atomWithStorage<靜態重碼分析結果介面 | null>(
  '靜態重碼分析結果',
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
        if (驗證靜態重碼數據(parsedValue)) {
          console.log('✅ 靜態重碼數據驗證通過')
          return parsedValue
        } else {
          // 數據結構不匹配，清除舊數據並返回null
          console.warn('🔄 檢測到舊版本數據格式，已清除localStorage')
          localStorage.removeItem(key)
          return null
        }
      } catch (error) {
        console.error('❌ 讀取靜態重碼數據失敗:', error)
        localStorage.removeItem(key)
        return null
      }
    },
    setItem: (key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch (error) {
        console.error('❌ 保存靜態重碼數據失敗:', error)
      }
    },
    removeItem: key => {
      localStorage.removeItem(key)
    },
  }
)
