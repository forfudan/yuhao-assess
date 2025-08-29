import type { CodeTable, CharFrequency } from '../types'

interface EfficiencyResult {
  N: number
  efficiency: number
  selectedChars: string[]  // 新增：被選中使用簡碼的字
}

/**
 * 計算簡碼效率
 * 
 * 算法說明：
 * 1. 對於每個簡碼數量N，選擇頻率加權碼長差值最大的前N個漢字使用簡碼
 * 2. 頻率差值 = 漢字頻率 * (全碼長度 - 簡碼長度)
 * 3. 計算使用N個簡碼後的平均碼長
 * 
 * @param shortWithSelectionTable 简码加选重键表
 * @param fullWithSelectionTable 全码加选重键表
 * @param charFrequency 字频数据
 */
export function calculateShortCodeEfficiency(
  shortWithSelectionTable: CodeTable,
  fullWithSelectionTable: CodeTable,
  charFrequency: CharFrequency
): EfficiencyResult[] {
  // 预处理码表数据
  const processedData = preprocessCodeTableFromTables(shortWithSelectionTable, fullWithSelectionTable, charFrequency)
  
  // 計算不同N值下的效率
  const nValues = [0, 25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
  const results: EfficiencyResult[] = []
  
  for (const N of nValues) {
    const result = calculateEfficiencyForN(processedData, N)
    results.push({ N, efficiency: result.efficiency, selectedChars: result.selectedChars })
  }
  
  return results
}

interface ProcessedChar {
  char: string
  codeShort: string
  codeFull: string
  lenShort: number
  lenFull: number
  lenDiff: number
  freq: number
  freqLenDiff: number
}

function preprocessCodeTableFromTables(
  shortWithSelectionTable: CodeTable,
  fullWithSelectionTable: CodeTable,
  charFrequency: CharFrequency
): ProcessedChar[] {
  const processedChars: ProcessedChar[] = []
  
  // 获取所有在简码表中的字符
  for (const [char, shortCodes] of shortWithSelectionTable) {
    // 获取对应的全码
    const fullCodes = fullWithSelectionTable.get(char)
    if (!fullCodes || fullCodes.length === 0) continue
    
    // 取最短的简码和最短的全码（因为表中可能有多个选重）
    const shortCode = shortCodes.reduce((a, b) => a.length <= b.length ? a : b)
    const fullCode = fullCodes.reduce((a, b) => a.length <= b.length ? a : b)
    
    const lenShort = shortCode.length
    const lenFull = fullCode.length
    
    // 只有简码长度严格小于全码长度的字符才有效
    if (lenShort >= lenFull) continue
    
    const freq = charFrequency[char] || 0
    const lenDiff = lenFull - lenShort
    
    processedChars.push({
      char,
      codeShort: shortCode,
      codeFull: fullCode,
      lenShort,
      lenFull,
      lenDiff,
      freq,
      freqLenDiff: freq * lenDiff
    })
  }
  
  return processedChars
}

function calculateActualLength(code: string, maxLen: number, isPrefix: boolean): number {
  let len = code.length
  
  if (isPrefix) {
    // 前綴碼邏輯：不以韻母結尾且長度小於最大長度時+1
    const vowels = ['a', 'e', 'i', 'o', 'u']
    const notEndsWithVowel = !vowels.includes(code.charAt(code.length - 1))
    if (notEndsWithVowel && len < maxLen) {
      len += 1
    }
  } else {
    // 普通邏輯：長度小於最大長度時+1
    if (len < maxLen) {
      len += 1
    }
  }
  
  return len
}

function calculateEfficiencyForN(processedChars: ProcessedChar[], N: number): { efficiency: number; selectedChars: string[] } {
  // 已经在预处理时筛选了简码长度小于全码长度的汉字
  const validShortCodeChars = processedChars
  
  // 按頻率差值排序，選擇前N個字符使用簡碼（但實際數量可能小於N）
  const sortedByFreqDiff = [...validShortCodeChars].sort((a, b) => b.freqLenDiff - a.freqLenDiff)
  const actualSelectedCount = Math.min(N, sortedByFreqDiff.length)
  const selectedCharsList = sortedByFreqDiff.slice(0, actualSelectedCount).map(c => c.char)
  const selectedChars = new Set(selectedCharsList)
  
  // 計算加權平均碼長
  let totalFreqLen = 0
  let totalFreq = 0
  
  for (const char of processedChars) {
    const finalLen = selectedChars.has(char.char) ? char.lenShort : char.lenFull
    totalFreqLen += char.freq * finalLen
    totalFreq += char.freq
  }
  
  const efficiency = totalFreq > 0 ? totalFreqLen / totalFreq : 0
  return { efficiency, selectedChars: selectedCharsList }
}
