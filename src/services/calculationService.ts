/**
 * 高性能計算服務
 * 提供碼表分析的核心計算功能
 */

import type { CodeTable, RawCodeTable } from '../types/index'
import type { CharsetType } from './charsetService'

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
 * 字符集生成函數
 * 使用位運算和緩存來提高性能
 */
export async function generateCharset(
  charsetType: CharsetType,
  allChars: Set<string>
): Promise<Set<string>> {
  // 確保數據已加載
  await initializeCalculationService()

  const cacheKey = `${charsetType}-${allChars.size}`
  if (charsetCache.has(cacheKey)) {
    return charsetCache.get(cacheKey)!
  }

  const charset = new Set<string>()

  // 使用批量處理和位運算優化
  const chars = Array.from(allChars)

  switch (charsetType) {
    case 'cjk_basic': {
      // 批量處理CJK基本區字符
      const basicRange = cjkBlockRanges['cjk_basic']
      if (basicRange) {
        for (let i = 0; i < chars.length; i++) {
          const codePoint = chars[i].codePointAt(0)
          if (codePoint && codePoint >= basicRange.start && codePoint <= basicRange.end) {
            charset.add(chars[i])
          }
        }
      }
      break
    }

    case 'cjk_to_a': {
      // 優化的CJK到A區檢查
      const basicRangeA = cjkBlockRanges['cjk_basic']
      const aRange = cjkBlockRanges['cjk_a']
      if (basicRangeA && aRange) {
        for (let i = 0; i < chars.length; i++) {
          const codePoint = chars[i].codePointAt(0)
          if (
            codePoint &&
            ((codePoint >= basicRangeA.start && codePoint <= basicRangeA.end) ||
              (codePoint >= aRange.start && codePoint <= aRange.end))
          ) {
            charset.add(chars[i])
          }
        }
      }
      break
    }

    case 'cjk_to_b': {
      const basicRangeB = cjkBlockRanges['cjk_basic']
      const aRangeB = cjkBlockRanges['cjk_a']
      const bRange = cjkBlockRanges['cjk_b']
      if (basicRangeB && aRangeB && bRange) {
        for (let i = 0; i < chars.length; i++) {
          const codePoint = chars[i].codePointAt(0)
          if (
            codePoint &&
            ((codePoint >= basicRangeB.start && codePoint <= basicRangeB.end) ||
              (codePoint >= aRangeB.start && codePoint <= aRangeB.end) ||
              (codePoint >= bRange.start && codePoint <= bRange.end))
          ) {
            charset.add(chars[i])
          }
        }
      }
      break
    }

    case 'cjk_to_f': {
      const ranges = ['cjk_basic', 'cjk_a', 'cjk_b', 'cjk_c', 'cjk_d', 'cjk_e', 'cjk_f']
      for (let i = 0; i < chars.length; i++) {
        const codePoint = chars[i].codePointAt(0)
        if (codePoint) {
          for (const rangeName of ranges) {
            const range = cjkBlockRanges[rangeName]
            if (range && codePoint >= range.start && codePoint <= range.end) {
              charset.add(chars[i])
              break
            }
          }
        }
      }
      break
    }

    case 'cjk_to_j': {
      const allRanges = [
        'cjk_basic',
        'cjk_a',
        'cjk_b',
        'cjk_c',
        'cjk_d',
        'cjk_e',
        'cjk_f',
        'cjk_g',
        'cjk_h',
        'cjk_i',
        'cjk_j',
      ]
      for (let i = 0; i < chars.length; i++) {
        const codePoint = chars[i].codePointAt(0)
        if (codePoint) {
          for (const rangeName of allRanges) {
            const range = cjkBlockRanges[rangeName]
            if (range && codePoint >= range.start && codePoint <= range.end) {
              charset.add(chars[i])
              break
            }
          }
        }
      }
      break
    }
  }

  charsetCache.set(cacheKey, charset)
  return charset
}

/**
 * 批量計算最大候選數
 * 一次性處理所有字符集，避免重復遍歷
 */
export function calculateAllMaxCandidates(
  fullCodeTable: CodeTable,
  charsetMap: Map<CharsetType, Set<string>>
): Record<string, number> {
  // 預先構建編碼到字符的映射，只遍歷一次
  const codeToCharsGlobal = new Map<string, string[]>()

  for (const [char, codes] of fullCodeTable.entries()) {
    if (codes && codes.length > 0) {
      const firstCode = codes[0]
      if (!codeToCharsGlobal.has(firstCode)) {
        codeToCharsGlobal.set(firstCode, [])
      }
      codeToCharsGlobal.get(firstCode)!.push(char)
    }
  }

  const results: Record<string, number> = {}

  // 爲每個字符集計算最大候選數
  const charsetTypes: CharsetType[] = [
    'gb2312',
    'guozi',
    'cjk_basic',
    'cjk_to_a',
    'cjk_to_b',
    'cjk_to_f',
    'cjk_to_j',
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
 */
export function calculateStaticDuplicates(
  fullCodeTable: CodeTable,
  charsetMap: Map<CharsetType, Set<string>>
): Record<string, number> {
  const results: Record<string, number> = {}

  // 預先構建編碼到字符的映射
  const codeToChars = new Map<string, string[]>()
  for (const [char, codes] of fullCodeTable.entries()) {
    if (codes && codes.length > 0) {
      const code = codes[0]
      if (!codeToChars.has(code)) {
        codeToChars.set(code, [])
      }
      codeToChars.get(code)!.push(char)
    }
  }

  // 爲每個字符集計算重碼
  const charsetTypes: CharsetType[] = [
    'gb2312',
    'tonggui',
    'guozi',
    'cjk_basic',
    'cjk_to_a',
    'cjk_to_b',
    'cjk_to_f',
    'cjk_to_j',
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
  const blocks = [
    'cjk_basic',
    'cjk_a',
    'cjk_b',
    'cjk_c',
    'cjk_d',
    'cjk_e',
    'cjk_f',
    'cjk_g',
    'cjk_h',
    'cjk_i',
    'cjk_j',
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
 */
export async function calculateCharCount(codeTable: CodeTable): Promise<number> {
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

export async function calculateCharCountFromRaw(rawCodeTable: RawCodeTable): Promise<number> {
  // 確保數據已加載
  await initializeCalculationService()

  const uniqueChars = new Set<string>()

  // 收集所有唯一字符
  for (const [, [char, ,]] of rawCodeTable) {
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
 * 批量預處理函數
 * 一次性完成所有字符集生成和映射構建
 */
export async function preprocessCodeTable(codeTable: CodeTable): Promise<{
  allUniqueChars: Set<string>
  charsetMap: Map<CharsetType, Set<string>>
  fullCodeTable: CodeTable
  codeToCharsMap: Map<string, string[]>
}> {
  // 確保數據已加載
  await initializeCalculationService()

  // 1. 批量提取所有字符
  const allUniqueChars = new Set<string>()
  for (const key of codeTable.keys()) {
    for (const char of key) {
      allUniqueChars.add(char)
    }
  }

  // 2. 生成全碼表（這裏假設已有generateFullCodeTable函數）
  const fullCodeTable = new Map<string, string[]>(codeTable)

  // 3. 批量生成所有需要的字符集
  const charsetMap = new Map<CharsetType, Set<string>>()
  const charsetTypes: CharsetType[] = [
    'gb2312',
    'guozi',
    'cjk_basic',
    'cjk_to_a',
    'cjk_to_b',
    'cjk_to_f',
    'cjk_to_j',
  ]

  for (const charsetType of charsetTypes) {
    charsetMap.set(charsetType, await generateCharset(charsetType, allUniqueChars))
  }

  // 4. 預構建編碼到字符的映射
  const codeToCharsMap = new Map<string, string[]>()
  for (const [char, codes] of fullCodeTable.entries()) {
    if (codes && codes.length > 0) {
      const code = codes[0]
      if (!codeToCharsMap.has(code)) {
        codeToCharsMap.set(code, [])
      }
      codeToCharsMap.get(code)!.push(char)
    }
  }

  return {
    allUniqueChars,
    charsetMap,
    fullCodeTable,
    codeToCharsMap,
  }
}

/**
 * 一次性計算所有指標
 * 避免重復遍歷和計算
 */
export async function calculateAllMetrics(preprocessedData: {
  allUniqueChars: Set<string>
  charsetMap: Map<CharsetType, Set<string>>
  fullCodeTable: CodeTable
  codeToCharsMap: Map<string, string[]>
}): Promise<{
  staticDuplicates: Record<string, number>
  maxCandidates: Record<string, number>
  charCount: number
}> {
  const { charsetMap, fullCodeTable } = preprocessedData

  // 一次性計算所有指標
  const staticDuplicates = calculateStaticDuplicates(fullCodeTable, charsetMap)
  const maxCandidates = calculateAllMaxCandidates(fullCodeTable, charsetMap)
  const charCount = await calculateCharCount(fullCodeTable)

  return {
    staticDuplicates,
    maxCandidates,
    charCount,
  }
}

/**
 * 清除緩存
 */
export function clearCache(): void {
  charsetCache.clear()
  codeTableCache.clear()
}
