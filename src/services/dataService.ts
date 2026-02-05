/**
 * 數據服務
 *
 * 負責加載各種數據文件，包括字頻數據、當量表等
 */

import type { 頻率數據型别 } from '../types'
import { 字頻表服務類別 } from './charFrequencyService'

// =============================================================================
// 字頻數據加載
// =============================================================================

// 字頻表字符並集緩存（用於優化碼表生成）
let frequencyCharsCache: Set<string> | null = null
let frequencyCharsCachePromise: Promise<Set<string>> | null = null

/**
 * 獲取所有字頻表中字符的並集（高性能版本）
 * 包含在 charFrequencyZhihu.json, charFrequencySC.json, charFrequencyTC.json, charFrequencyGuji.json 中出現的字符
 * 用於優化「全碼加選重鍵」和「簡碼加選重鍵」的生成，排除字頻爲0的字符
 */
export async function getFrequencyCharsUnion(): Promise<Set<string>> {
  // 如果已經有緩存，直接返回
  if (frequencyCharsCache) {
    return frequencyCharsCache
  }

  // 如果正在加載中，等待已有的Promise
  if (frequencyCharsCachePromise) {
    return frequencyCharsCachePromise
  }

  // 開始加載並緩存Promise
  frequencyCharsCachePromise = loadFrequencyCharsUnion()

  try {
    frequencyCharsCache = await frequencyCharsCachePromise
    return frequencyCharsCache
  } catch (error) {
    // 如果加載失敗，清除Promise緩存以便重試
    frequencyCharsCachePromise = null
    throw error
  }
}

/**
 * 實際加載字頻表字符並集的函數
 */
async function loadFrequencyCharsUnion(): Promise<Set<string>> {
  console.time('加載字頻表字符並集')

  try {
    // 並行加載四個字頻表（不包含 unified，因爲它是合成的）
    const [zhihuFreq, scFreq, tcFreq, gujiFreq] = await Promise.all([
      加載知乎簡體字頻(), // charAbsoluteFrequencyZhihu.json
      加載北語簡體字頻(), // charAbsoluteFrequencySC.json
      加載臺標繁體字頻(), // charAbsoluteFrequencyTC.json
      加載古籍繁體字頻(), // charAbsoluteFrequencyGuji.json
    ])

    // 使用Set進行高性能去重和並集運算
    const allChars = new Set<string>()

    // 添加知乎字頻表中的字符
    for (const char in zhihuFreq) {
      const freq = zhihuFreq[char]
      if (freq && freq > 0) {
        // 只添加字頻大於0的字符
        allChars.add(char)
      }
    }

    // 添加簡體字頻表中的字符
    for (const char in scFreq) {
      const freq = scFreq[char]
      if (freq && freq > 0) {
        allChars.add(char)
      }
    }

    // 添加繁體字頻表中的字符
    for (const char in tcFreq) {
      const freq = tcFreq[char]
      if (freq && freq > 0) {
        allChars.add(char)
      }
    }

    // 添加古籍字頻表中的字符
    for (const char in gujiFreq) {
      const freq = gujiFreq[char]
      if (freq && freq > 0) {
        allChars.add(char)
      }
    }

    console.timeEnd('加載字頻表字符並集')

    return allChars
  } catch (error) {
    console.error('加載字頻表字符並集失敗:', error)
    throw error
  }
}

/**
 * 清除字頻字符緩存（用於重新加載）
 */
export function clearFrequencyCharsCache(): void {
  frequencyCharsCache = null
  frequencyCharsCachePromise = null
}

/**
 * 加載知乎字頻數據
 */
export async function 加載知乎簡體字頻(): Promise<頻率數據型别> {
  try {
    return await 字頻表服務類別.加載知乎簡體字頻()
  } catch (error) {
    console.error('加載知乎字頻數據失敗:', error)
    throw error
  }
}

/**
 * 加載簡體字頻數據
 */
export async function 加載北語簡體字頻(): Promise<頻率數據型别> {
  try {
    return await 字頻表服務類別.加載北語簡體字頻()
  } catch (error) {
    console.error('加載北語簡體字頻數據失敗:', error)
    throw error
  }
}

/**
 * 加載繁體字頻數據
 */
export async function 加載臺標繁體字頻(): Promise<頻率數據型别> {
  try {
    return await 字頻表服務類別.加載臺標繁體字頻()
  } catch (error) {
    console.error('加載臺標繁體字頻數據失敗:', error)
    throw error
  }
}

/**
 * 加載古籍字頻數據
 */
export async function 加載古籍繁體字頻(): Promise<頻率數據型别> {
  try {
    return await 字頻表服務類別.加載古籍繁體字頻()
  } catch (error) {
    console.error('加載古籍繁體字頻數據失敗:', error)
    throw error
  }
}

/**
 * 加載統一字頻數據
 */
export async function 計算繁簡聯合字頻(): Promise<頻率數據型别> {
  try {
    return await 字頻表服務類別.計算繁簡聯合字頻()
  } catch (error) {
    console.error('加載統一字頻數據失敗:', error)
    throw error
  }
}

/**
 * 並行加載所有字頻數據
 * @returns 包含所有字頻數據的對象
 */
export async function 加載所有字頻數據() {
  const [知乎簡體字頻, 北語簡體字頻, 臺標繁體字頻, 古籍繁體字頻, 繁簡聯合字頻] = await Promise.all([
    加載知乎簡體字頻(),
    加載北語簡體字頻(),
    加載臺標繁體字頻(),
    加載古籍繁體字頻(),
    計算繁簡聯合字頻(),
  ])

  return {
    知乎簡體字頻,
    北語簡體字頻,
    臺標繁體字頻,
    古籍繁體字頻,
    繁簡聯合字頻,
  }
}

// =============================================================================
// 當量表加載
// =============================================================================

/**
 * 加載當量表數據
 */
export async function 加載當量表(): Promise<Record<string, number>> {
  try {
    const response = await fetch('/settings/equivTable.json')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const equivTableData = await response.json()
    return equivTableData.data || {}
  } catch (error) {
    console.error('加載當量表失敗:', error)
    throw new Error('加載當量表失敗')
  }
}
