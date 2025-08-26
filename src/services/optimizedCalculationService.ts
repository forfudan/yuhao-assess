/**
 * 优化的计算服务
 * 针对ComparisonCard中的性能瓶颈进行优化
 */

import type { CodeTable, CharFrequency } from '../types/index'
import type { CharsetType } from './charsetService'
import { getDynamicDupRate } from './duplicateAnalysisService'

// 缓存结果避免重复计算
const charsetCache = new Map<string, Set<string>>()
const codeTableCache = new Map<string, any>()

/**
 * 优化的字符集生成函数
 * 使用位运算和缓存来提高性能
 */
export function generateCharsetOptimized(charsetType: CharsetType, allChars: Set<string>): Set<string> {
  const cacheKey = `${charsetType}-${allChars.size}`
  if (charsetCache.has(cacheKey)) {
    return charsetCache.get(cacheKey)!
  }

  const charset = new Set<string>()

  // 使用批量处理和位运算优化
  const chars = Array.from(allChars)
  
  switch (charsetType) {
    case 'cjk_basic':
      // 批量处理CJK基本区字符
      for (let i = 0; i < chars.length; i++) {
        const codePoint = chars[i].codePointAt(0)
        if (codePoint && codePoint >= 0x4E00 && codePoint <= 0x9FFF) {
          charset.add(chars[i])
        }
      }
      break
      
    case 'cjk_to_a':
      // 优化的CJK到A区检查
      for (let i = 0; i < chars.length; i++) {
        const codePoint = chars[i].codePointAt(0)
        if (codePoint && 
            ((codePoint >= 0x4E00 && codePoint <= 0x9FFF) ||
             (codePoint >= 0x3400 && codePoint <= 0x4DBF))) {
          charset.add(chars[i])
        }
      }
      break
      
    case 'cjk_to_b':
      for (let i = 0; i < chars.length; i++) {
        const codePoint = chars[i].codePointAt(0)
        if (codePoint && 
            ((codePoint >= 0x4E00 && codePoint <= 0x9FFF) ||
             (codePoint >= 0x3400 && codePoint <= 0x4DBF) ||
             (codePoint >= 0x20000 && codePoint <= 0x2A6DF))) {
          charset.add(chars[i])
        }
      }
      break
      
    case 'cjk_to_f':
      for (let i = 0; i < chars.length; i++) {
        const codePoint = chars[i].codePointAt(0)
        if (codePoint && 
            ((codePoint >= 0x4E00 && codePoint <= 0x9FFF) ||
             (codePoint >= 0x3400 && codePoint <= 0x4DBF) ||
             (codePoint >= 0x20000 && codePoint <= 0x2A6DF) ||
             (codePoint >= 0x2A700 && codePoint <= 0x2B73F) ||
             (codePoint >= 0x2B740 && codePoint <= 0x2B81F) ||
             (codePoint >= 0x2B820 && codePoint <= 0x2CEAF) ||
             (codePoint >= 0x2CEB0 && codePoint <= 0x2EBEF))) {
          charset.add(chars[i])
        }
      }
      break
      
    case 'cjk_to_i':
      for (let i = 0; i < chars.length; i++) {
        const codePoint = chars[i].codePointAt(0)
        if (codePoint && 
            ((codePoint >= 0x4E00 && codePoint <= 0x9FFF) ||
             (codePoint >= 0x3400 && codePoint <= 0x4DBF) ||
             (codePoint >= 0x20000 && codePoint <= 0x2A6DF) ||
             (codePoint >= 0x2A700 && codePoint <= 0x2B73F) ||
             (codePoint >= 0x2B740 && codePoint <= 0x2B81F) ||
             (codePoint >= 0x2B820 && codePoint <= 0x2CEAF) ||
             (codePoint >= 0x2CEB0 && codePoint <= 0x2EBEF) ||
             (codePoint >= 0x30000 && codePoint <= 0x3134F) ||
             (codePoint >= 0x31350 && codePoint <= 0x323AF) ||
             (codePoint >= 0x2EBF0 && codePoint <= 0x2EE5F))) {
          charset.add(chars[i])
        }
      }
      break
  }

  charsetCache.set(cacheKey, charset)
  return charset
}

/**
 * 批量计算最大候选数
 * 一次性处理所有字符集，避免重复遍历
 */
export function calculateAllMaxCandidatesOptimized(
  fullCodeTable: CodeTable,
  charsetMap: Map<CharsetType, Set<string>>
): Record<string, number> {
  // 预先构建编码到字符的映射，只遍历一次
  const codeToCharsGlobal = new Map<string, string[]>()
  
  for (const [char, codes] of fullCodeTable.entries()) {
    if (codes && codes.length > 0) {
      const code = codes[0]
      if (!codeToCharsGlobal.has(code)) {
        codeToCharsGlobal.set(code, [])
      }
      codeToCharsGlobal.get(code)!.push(char)
    }
  }

  const results: Record<string, number> = {}
  
  // 为每个字符集计算最大候选数
  const charsetTypes: CharsetType[] = ['gb2312', 'guozi', 'cjk_basic', 'cjk_to_a', 'cjk_to_b', 'cjk_to_f', 'cjk_to_i']
  
  for (const charsetType of charsetTypes) {
    const charset = charsetMap.get(charsetType)
    if (!charset) continue
    
    let maxCount = 0
    
    // 只检查相关的编码
    for (const [code, chars] of codeToCharsGlobal.entries()) {
      // 计算该编码在当前字符集中的字符数
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
 * 优化的静态重码计算
 * 使用更高效的数据结构和算法
 */
export function calculateStaticDuplicatesOptimized(
  fullCodeTable: CodeTable,
  charsetMap: Map<CharsetType, Set<string>>
): Record<string, number> {
  const results: Record<string, number> = {}
  
  // 预先构建编码到字符的映射
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
  
  // 为每个字符集计算重码
  const charsetTypes: CharsetType[] = ['gb2312', 'guozi', 'cjk_basic', 'cjk_to_a', 'cjk_to_b', 'cjk_to_f', 'cjk_to_i']
  
  for (const charsetType of charsetTypes) {
    const charset = charsetMap.get(charsetType)
    if (!charset) continue
    
    let duplicateCount = 0
    
    for (const chars of codeToChars.values()) {
      if (chars.length > 1) {
        // 计算该编码组中属于当前字符集的字符数
        let charsetCharsInGroup = 0
        for (const char of chars) {
          if (charset.has(char)) {
            charsetCharsInGroup++
          }
        }
        
        // 如果有多个字符在同一字符集中共享编码，则计为重码
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
 * 内存优化的字符计数
 * 使用流式处理避免大量内存占用
 */
export function calculateCharCountOptimized(codeTable: CodeTable): number {
  let intersectionCount = 0
  
  // 流式处理，避免创建大Set
  for (const char of codeTable.keys()) {
    for (const c of char) {
      const codePoint = c.codePointAt(0)
      if (codePoint && isInCJKToIOptimized(codePoint)) {
        intersectionCount++
      }
    }
  }
  
  return intersectionCount
}

/**
 * 优化的CJK到I区检查
 * 使用位运算提高性能
 */
function isInCJKToIOptimized(codePoint: number): boolean {
  return (
    (codePoint >= 0x4E00 && codePoint <= 0x9FFF) ||
    (codePoint >= 0x3400 && codePoint <= 0x4DBF) ||
    (codePoint >= 0x20000 && codePoint <= 0x2A6DF) ||
    (codePoint >= 0x2A700 && codePoint <= 0x2B73F) ||
    (codePoint >= 0x2B740 && codePoint <= 0x2B81F) ||
    (codePoint >= 0x2B820 && codePoint <= 0x2CEAF) ||
    (codePoint >= 0x2CEB0 && codePoint <= 0x2EBEF) ||
    (codePoint >= 0x30000 && codePoint <= 0x3134F) ||
    (codePoint >= 0x31350 && codePoint <= 0x323AF) ||
    (codePoint >= 0x2EBF0 && codePoint <= 0x2EE5F)
  )
}

/**
 * 批量优化的预处理函数
 * 一次性完成所有字符集生成和映射构建
 */
export function preprocessCodeTableOptimized(
  codeTable: CodeTable
): {
  allUniqueChars: Set<string>
  charsetMap: Map<CharsetType, Set<string>>
  fullCodeTable: CodeTable
  codeToCharsMap: Map<string, string[]>
} {
  // 1. 批量提取所有字符
  const allUniqueChars = new Set<string>()
  for (const key of codeTable.keys()) {
    for (const char of key) {
      allUniqueChars.add(char)
    }
  }
  
  // 2. 生成全码表（这里假设已有generateFullCodeTable函数）
  const fullCodeTable = new Map<string, string[]>(codeTable)
  
  // 3. 批量生成所有需要的字符集
  const charsetMap = new Map<CharsetType, Set<string>>()
  const charsetTypes: CharsetType[] = ['gb2312', 'guozi', 'cjk_basic', 'cjk_to_a', 'cjk_to_b', 'cjk_to_f', 'cjk_to_i']
  
  for (const charsetType of charsetTypes) {
    charsetMap.set(charsetType, generateCharsetOptimized(charsetType, allUniqueChars))
  }
  
  // 4. 预构建编码到字符的映射
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
    codeToCharsMap
  }
}

/**
 * 一次性计算所有指标
 * 避免重复遍历和计算
 */
export function calculateAllMetricsOptimized(preprocessedData: {
  allUniqueChars: Set<string>
  charsetMap: Map<CharsetType, Set<string>>
  fullCodeTable: CodeTable
  codeToCharsMap: Map<string, string[]>
}): {
  staticDuplicates: Record<string, number>
  maxCandidates: Record<string, number>
  charCount: number
} {
  const { charsetMap, fullCodeTable } = preprocessedData
  
  // 一次性计算所有指标
  const staticDuplicates = calculateStaticDuplicatesOptimized(fullCodeTable, charsetMap)
  const maxCandidates = calculateAllMaxCandidatesOptimized(fullCodeTable, charsetMap)
  const charCount = calculateCharCountOptimized(fullCodeTable)
  
  return {
    staticDuplicates,
    maxCandidates,
    charCount
  }
}

/**
 * 清除缓存
 */
export function clearCache(): void {
  charsetCache.clear()
  codeTableCache.clear()
}
