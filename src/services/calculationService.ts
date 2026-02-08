/**
 * 高性能計算服務
 * 提供碼表分析的核心計算功能
 */

import type { 碼表型别, 原始碼表型别 } from '../types/index'
import type { 細胞漢字集名稱型别, 累積漢字集名稱型别, 漢字集名稱型别 } from './charsetService'

// CJK塊數據類型定義
type CJKBlockData = {
  version: string
  description: string
  lastUpdated: string
  blocks:
    | Record<
        string,
        {
          name: string
          description: string
          start: string
          end: string
          comment: string
          note?: string
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }
      >
    | any
}

// 緩存結果避免重復計算
const charsetCache = new Map<string, Set<string>>()
const codeTableCache = new Map<string, any>()
let cjkBlockData: CJKBlockData | null = null

// 同步函數版本，使用預加載的數據
let cjkBlockRanges: Record<string, { start: number; end: number }> = {}

// 加載CJK區塊數據
async function loadCJKBlockData(): Promise<void> {
  if (cjkBlockData) return

  try {
    const response = await fetch('/settings/cjkBlocks.json')
    cjkBlockData = (await response.json()) as CJKBlockData
  } catch (error) {
    console.error('Failed to load CJK block data:', error)
    // 使用空數據作爲後備
    cjkBlockData = { version: '', description: '', lastUpdated: '', blocks: {} }
  }
}

// 初始化函數，預加載所有數據
export async function initializeCalculationService(): Promise<void> {
  await loadCJKBlockData()
  if (cjkBlockData) {
    for (const [blockName, block] of Object.entries(cjkBlockData.blocks)) {
      if (typeof block === 'object' && block !== null && 'start' in block && 'end' in block) {
        cjkBlockRanges[blockName] = {
          start: parseInt(block.start as string, 16),
          end: parseInt(block.end as string, 16),
        }
      }
    }
  }
}

/**
 * 批量計算最大候選數
 * 一次性處理所有字符集，避免重復遍歷
 * @deprecated TO DEPRECATE - 未被使用，可考慮删除
 */
export function calculateAllMaxCandidates(
  fullCodeTable: 碼表型别,
  charsetMap: Map<漢字集名稱型别, Set<string>>
): Record<string, number> {
  // 預先構建編碼到字符的映射，只遍歷一次
  const codeToCharsGlobal = new Map<string, string[]>()

  for (const [char, codes] of fullCodeTable.entries()) {
    if (codes && codes.length > 0) {
      const firstCode = codes[0]
      if (!firstCode) continue
      if (!codeToCharsGlobal.has(firstCode)) {
        codeToCharsGlobal.set(firstCode, [])
      }
      codeToCharsGlobal.get(firstCode)!.push(char)
    }
  }

  const results: Record<string, number> = {}

  // 爲每個字符集計算最大候選數
  const charsetTypes: 漢字集名稱型别[] = [
    'GB2312',
    '常用國字',
    'CJK基本',
    '到CJK擴A',
    '到CJK擴B',
    '到CJK擴F',
    '到CJK擴J',
  ]

  for (const charsetType of charsetTypes) {
    const charset = charsetMap.get(charsetType)
    if (!charset) continue

    let maxCount = 0

    // 只檢查相關的編碼
    for (const [code, chars] of codeToCharsGlobal.entries()) {
      // 計算該編碼在當前字符集中的字符數
      let charsetCount = 0
      for (const char of chars) {
        if (charset.has(char)) {
          charsetCount++
        }
      }

      if (charsetCount > maxCount) {
        maxCount = charsetCount
      }
    }

    results[`${charsetType}MaxCount`] = maxCount
  }

  return results
}

/**
 * 靜態重碼計算
 * 使用更高效的數據結構和算法
 * @deprecated TO DEPRECATE - 未被使用，可考慮删除
 */
export function calculateStaticDuplicates(
  fullCodeTable: 碼表型别,
  charsetMap: Map<漢字集名稱型别, Set<string>>
): Record<string, number> {
  const results: Record<string, number> = {}

  // 預先構建編碼到字符的映射
  const codeToChars = new Map<string, string[]>()
  for (const [char, codes] of fullCodeTable.entries()) {
    if (codes && codes.length > 0) {
      const firstCode = codes[0]
      if (!firstCode) continue
      if (!codeToChars.has(firstCode)) {
        codeToChars.set(firstCode, [])
      }
      codeToChars.get(firstCode)!.push(char)
    }
  }

  // 爲每個字符集計算重碼
  const charsetTypes: 漢字集名稱型别[] = [
    'GB2312',
    '通用規範',
    '常用國字',
    'CJK基本',
    '到CJK擴A',
    '到CJK擴B',
    '到CJK擴F',
    '到CJK擴J',
  ]

  for (const charsetType of charsetTypes) {
    const charset = charsetMap.get(charsetType)
    if (!charset) continue

    let duplicateCount = 0

    for (const chars of codeToChars.values()) {
      if (chars.length > 1) {
        // 計算該編碼組中屬於當前字符集的字符數
        let charsetCharsInGroup = 0
        for (const char of chars) {
          if (charset.has(char)) {
            charsetCharsInGroup++
          }
        }

        // 如果有多個字符在同一字符集中共享編碼，則計爲重碼
        if (charsetCharsInGroup > 1) {
          duplicateCount += charsetCharsInGroup
        }
      }
    }

    results[`${charsetType}DuplicateChars`] = duplicateCount
  }

  return results
}

/**
 * 優化的CJK到J區檢查
 * 使用位運算提高性能
 */
function isInCJKToJ(codePoint: number): boolean {
  const blocks: 細胞漢字集名稱型别[] = [
    'CJK基本',
    'CJK擴A',
    'CJK擴B',
    'CJK擴C',
    'CJK擴D',
    'CJK擴E',
    'CJK擴F',
    'CJK擴G',
    'CJK擴H',
    'CJK擴I',
    'CJK擴J',
  ]

  for (const blockName of blocks) {
    const range = cjkBlockRanges[blockName]
    if (range && codePoint >= range.start && codePoint <= range.end) {
      return true
    }
  }

  return false
}

/**
 * 修正的字符計數函數
 * 計算碼表中在CJK基本區到CJK-J範圍内的唯一字符數量
 * @deprecated TO DEPRECATE - 未被使用，可考慮删除
 */
export async function calculateCharCount(codeTable: 碼表型别): Promise<number> {
  // 確保數據已加載
  await initializeCalculationService()

  const uniqueChars = new Set<string>()

  // 收集所有唯一字符
  for (const char of codeTable.keys()) {
    // 正確處理Unicode字符，使用Array.from來處理可能的代理對
    const chars = Array.from(char)
    for (const c of chars) {
      uniqueChars.add(c)
    }
  }

  // 計算在CJK-J範圍内的字符數量
  let cjkCount = 0
  for (const char of uniqueChars) {
    const codePoint = char.codePointAt(0)
    if (codePoint && isInCJKToJ(codePoint)) {
      cjkCount++
    }
  }

  return cjkCount
}

/**
 * @deprecated TO DEPRECATE - 未被使用，可考慮删除
 */
export async function calculateCharCountFromRaw(原始碼表: 原始碼表型别): Promise<number> {
  // 確保數據已加載
  await initializeCalculationService()

  const uniqueChars = new Set<string>()

  // 收集所有唯一字符
  for (const [, [char, ,]] of 原始碼表) {
    // 正確處理Unicode字符，使用Array.from來處理可能的代理對
    const chars = Array.from(char as string)
    for (const c of chars) {
      uniqueChars.add(c)
    }
  }

  // 計算在CJK-J範圍内的字符數量
  let cjkCount = 0
  for (const char of uniqueChars) {
    const codePoint = char.codePointAt(0)
    if (codePoint && isInCJKToJ(codePoint)) {
      cjkCount++
    }
  }

  return cjkCount
}

/**
 * 清除緩存
 * @deprecated TO DEPRECATE - 未被使用，可考慮删除
 */
export function clearCache(): void {
  charsetCache.clear()
  codeTableCache.clear()
}
