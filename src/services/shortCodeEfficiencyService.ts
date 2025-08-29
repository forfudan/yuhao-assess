import type { CodeTable, CharFrequency } from '../types'

interface CodeTableRow {
  char: string
  code: string
}

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
 */
export function calculateShortCodeEfficiency(
  codeTable: CodeTableRow[],
  charFrequency: CharFrequency,
  maxLen: number = 4,
  isPrefix: boolean = false
): EfficiencyResult[] {
  // 预处理码表数据
  const processedData = preprocessCodeTable(codeTable, charFrequency, maxLen, isPrefix)
  
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

function preprocessCodeTable(
  codeTable: CodeTableRow[],
  charFrequency: CharFrequency,
  maxLen: number,
  isPrefix: boolean
): ProcessedChar[] {
  // 按漢字分組，處理簡碼和全碼
  const charMap = new Map<string, CodeTableRow[]>()
  
  for (const row of codeTable) {
    if (!charMap.has(row.char)) {
      charMap.set(row.char, [])
    }
    charMap.get(row.char)!.push(row)
  }
  
  const processedChars: ProcessedChar[] = []
  
  for (const [char, codes] of charMap) {
    // 按码长排序
    codes.sort((a, b) => a.code.length - b.code.length)
    
    // 計算碼長（考慮前綴碼邏輯）
    const codesWithLen = codes.map(row => ({
      ...row,
      actualLen: calculateActualLength(row.code, maxLen, isPrefix)
    }))
    
    // 处理选重（同码长的非首选字符+1）
    const codeGroups = new Map<string, typeof codesWithLen>()
    for (const code of codesWithLen) {
      if (!codeGroups.has(code.code)) {
        codeGroups.set(code.code, [])
      }
      codeGroups.get(code.code)!.push(code)
    }
    
    // 为非首选字符增加选重码长
    for (const group of codeGroups.values()) {
      for (let i = 1; i < group.length; i++) {
        group[i].actualLen += 1
      }
    }
    
    // 去重并排序
    const uniqueCodes = Array.from(new Map(
      codesWithLen.map(code => [`${code.char}_${code.actualLen}`, code])
    ).values()).sort((a, b) => a.actualLen - b.actualLen)
    
    if (uniqueCodes.length === 0) continue
    
    // 簡碼（最短）和全碼（最長）
    const shortCode = uniqueCodes[0]
    const fullCode = uniqueCodes[uniqueCodes.length - 1]
    
    const freq = charFrequency[char] || 0
    const lenDiff = fullCode.actualLen - shortCode.actualLen
    
    processedChars.push({
      char,
      codeShort: shortCode.code,
      codeFull: fullCode.code,
      lenShort: shortCode.actualLen,
      lenFull: fullCode.actualLen,
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
  // 只考慮簡碼長度小於全碼長度的漢字
  const validShortCodeChars = processedChars.filter(char => char.lenShort < char.lenFull)
  
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

/**
 * 計算全碼平均長度（N=0時的基準）
 */
export function calculateFullCodeAverageLength(
  codeTable: CodeTableRow[],
  charFrequency: CharFrequency,
  maxLen: number = 4,
  isPrefix: boolean = false
): number {
  const processedData = preprocessCodeTable(codeTable, charFrequency, maxLen, isPrefix)
  return calculateEfficiencyForN(processedData, 0).efficiency
}

/**
 * 計算簡碼平均長度（全部使用簡碼）
 */
export function calculateShortCodeAverageLength(
  codeTable: CodeTableRow[],
  charFrequency: CharFrequency,
  maxLen: number = 4,
  isPrefix: boolean = false
): number {
  const processedData = preprocessCodeTable(codeTable, charFrequency, maxLen, isPrefix)
  
  // 全部使用簡碼
  let totalFreqLen = 0
  let totalFreq = 0
  
  for (const char of processedData) {
    totalFreqLen += char.freq * char.lenShort
    totalFreq += char.freq
  }
  
  return totalFreq > 0 ? totalFreqLen / totalFreq : 0
}
