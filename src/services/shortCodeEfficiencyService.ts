/**
 * 簡碼效率分析服務
 *
 * 核心概念：
 * - 簡碼效率值 = 字頻加權平均碼長
 * - 值越小越好（表示平均每個字需要按的鍵數越少）
 * - N 值表示使用簡碼的字符個數，例如 N=500 表示前 500 個最有效率的字使用簡碼
 * - 通過比較不同 N 值下的效率，可以找到最佳的簡碼字選擇方案
 */
import type { 頻率數據型别 } from '../types'

/**
 * 碼表條目介面
 *
 * 表示碼表中的一行數據，包含漢字和對應的編碼
 */
interface 碼表條目介面 {
  char: string
  code: string
}

/**
 * 簡碼效率結果介面
 *
 * 表示在特定 N 值下的簡碼效率分析結果
 *
 * @property 最有效率的簡碼個數 - 使用簡碼的字符個數（N值），例如 500 表示前 500 個字使用簡碼
 * @property 簡碼效率值 - 字頻加權平均碼長，值越小越好（表示平均每個字的按鍵數）
 * @property 對應字符列表 - 這 N 個使用簡碼的字符列表，按效率排序
 */
interface 簡碼效率結果介面 {
  最有效率的簡碼個數: number
  簡碼效率值: number
  對應字符列表: string[]
}

/**
 * 計算簡碼效率
 * @param codeTable 碼表數據
 * @param charFrequency 字頻數據
 * @param maxLen 最大碼長
 * @param 是否存在編碼終止指示符 是否爲前綴碼方案
 */
export function calculateShortCodeEfficiency(
  codeTable: 碼表條目介面[],
  charFrequency: 頻率數據型别,
  maxLen: number = 4,
  是否存在編碼終止指示符: boolean = false
): 簡碼效率結果介面[] {
  const processedData = preprocessCodeTable(
    codeTable,
    charFrequency,
    maxLen,
    是否存在編碼終止指示符
  )

  const 最有效率的簡碼個數列表 = [0, 25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
  const 結果: 簡碼效率結果介面[] = []

  for (const 最有效率的簡碼個數 of 最有效率的簡碼個數列表) {
    const 簡碼效率結果 = calculateEfficiencyForN(processedData, 最有效率的簡碼個數, maxLen)
    結果.push({
      最有效率的簡碼個數,
      簡碼效率值: 簡碼效率結果.efficiency,
      對應字符列表: 簡碼效率結果.selectedChars,
    })
  }

  return 結果
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
  codeTable: 碼表條目介面[],
  charFrequency: 頻率數據型别,
  maxLen: number,
  是否存在編碼終止指示符: boolean
): ProcessedChar[] {
  // 按漢字分組，處理簡碼和全碼
  const charMap = new Map<string, 碼表條目介面[]>()

  for (const row of codeTable) {
    // 過濾條件：
    // 1. 必須是單字- 使用 Array.from 正確處理 Unicode Codepoint
    // 2. 必須在字频表中存在
    if (
      Array.from(row.char).length === 1 &&
      Object.prototype.hasOwnProperty.call(charFrequency, row.char)
    ) {
      if (!charMap.has(row.char)) {
        charMap.set(row.char, [])
      }
      charMap.get(row.char)!.push(row)
    }
  }

  const processedChars: ProcessedChar[] = []

  for (const [char, codes] of charMap) {
    // 按码长排序
    codes.sort((a, b) => a.code.length - b.code.length)

    // 計算碼長（考慮前綴碼邏輯）
    const codesWithLen = codes.map(row => ({
      ...row,
      actualLen: calculateActualLength(row.code, maxLen, 是否存在編碼終止指示符),
    }))

    // 處理選重（同码长的非首选字符+1）
    const codeGroups = new Map<string, typeof codesWithLen>()
    for (const code of codesWithLen) {
      if (!codeGroups.has(code.code)) {
        codeGroups.set(code.code, [])
      }
      codeGroups.get(code.code)!.push(code)
    }

    // 为非首选字符增加選重码长
    for (const group of codeGroups.values()) {
      for (let i = 1; i < group.length; i++) {
        const item = group[i]
        if (item) {
          item.actualLen += 1
        }
      }
    }

    // 去重并排序
    const uniqueCodes = Array.from(
      new Map(codesWithLen.map(code => [`${code.char}_${code.actualLen}`, code])).values()
    ).sort((a, b) => a.actualLen - b.actualLen)

    if (uniqueCodes.length === 0) continue

    // 簡碼（最短）和全碼（最長）
    const shortCode = uniqueCodes[0]
    const fullCode = uniqueCodes[uniqueCodes.length - 1]
    if (!shortCode || !fullCode) continue

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
      freqLenDiff: freq * lenDiff,
    })
  }

  return processedChars
}

function calculateActualLength(
  code: string,
  maxLen: number,
  是否存在編碼終止指示符: boolean
): number {
  let len = code.length

  if (是否存在編碼終止指示符) {
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

function calculateEfficiencyForN(
  processedChars: ProcessedChar[],
  N: number,
  maxLen: number
): { efficiency: number; selectedChars: string[] } {
  // 只考慮簡碼長度小於全碼長度且小於最大碼長的漢字
  const validShortCodeChars = processedChars.filter(
    char => char.lenShort < char.lenFull && char.lenShort < maxLen
  )

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
  codeTable: 碼表條目介面[],
  charFrequency: 頻率數據型别,
  maxLen: number = 4,
  是否存在編碼終止指示符: boolean = false
): number {
  const processedData = preprocessCodeTable(
    codeTable,
    charFrequency,
    maxLen,
    是否存在編碼終止指示符
  )
  return calculateEfficiencyForN(processedData, 0, maxLen).efficiency
}

/**
 * 計算簡碼平均長度（全部使用簡碼）
 */
export function calculateShortCodeAverageLength(
  codeTable: 碼表條目介面[],
  charFrequency: 頻率數據型别,
  maxLen: number = 4,
  是否存在編碼終止指示符: boolean = false
): number {
  const processedData = preprocessCodeTable(
    codeTable,
    charFrequency,
    maxLen,
    是否存在編碼終止指示符
  )

  // 全部使用簡碼
  let totalFreqLen = 0
  let totalFreq = 0

  for (const char of processedData) {
    totalFreqLen += char.freq * char.lenShort
    totalFreq += char.freq
  }

  return totalFreq > 0 ? totalFreqLen / totalFreq : 0
}

/**
 * 計算簡碼效率（簡化版）
 *
 * 這個函數接受已處理好的簡碼和全碼映射，適合在已經完成碼表解析後使用。
 * 相比 calculateShortCodeEfficiency，這個版本不需要處理選重邏輯，因爲輸入的 Map 已經包含了選重信息。
 *
 * @param 字頻數據 - 字符到字頻的映射（歸一化後的頻率，總和爲 1）
 * @param 簡碼映射 - 字符到簡碼的映射（已包含選重鍵）
 * @param 全碼映射 - 字符到全碼的映射（已包含選重鍵）
 * @param 最大碼長 - 方案的最大碼長（例如 4），用於判斷簡碼是否有效
 * @param N值列表 - 要計算的 N 值列表，例如 [0, 5, 10, 25, 50, ..., 2000]
 * @returns 不同 N 值下的簡碼效率結果數組，包含 28 個數據點
 *
 * @example
 * // 計算知乎簡體字頻下的簡碼效率
 * const 結果 = 計算簡碼效率簡化版(
 *   知乎簡體字頻,
 *   簡碼加選重鍵表,
 *   全碼加選重鍵表,
 *   4
 * )
 * // 結果[0] = { 最有效率的簡碼個數: 0, 簡碼效率值: 4.2, 對應字符列表: [] }  // 全部用全碼
 * // 結果[5] = { 最有效率的簡碼個數: 100, 簡碼效率值: 3.1, 對應字符列表: ['的', '一', ...] }  // 前100個用簡碼
 */
export function 計算指定字頻下之簡碼效率(
  字頻數據: 頻率數據型别,
  簡碼映射: Map<string, string>,
  全碼映射: Map<string, string>,
  最大碼長: number,
  N值列表: number[]
): 簡碼效率結果介面[] {
  // 步驟 1：預處理字符數據
  // 爲每個字符準備計算所需的信息
  const 處理後字符: Array<{
    字符: string // 漢字本身
    簡碼長度: number // 簡碼的長度（已包含選重鍵）
    全碼長度: number // 全碼的長度（已包含選重鍵）
    碼長差值: number // 全碼長度 - 簡碼長度，表示使用簡碼能節省多少按鍵
    字頻: number // 字符的使用頻率（歸一化）
    字頻碼長乘積: number // 字頻 × 碼長差值，用於排序（值越大表示使用簡碼的收益越高）
  }> = []

  for (const [字符, 字頻] of Object.entries(字頻數據)) {
    // 過濾字頻爲 0 或負數的字符
    if (字頻 <= 0) continue

    const 簡碼 = 簡碼映射.get(字符)
    const 全碼 = 全碼映射.get(字符)

    // 跳過没有簡碼或全碼的字符
    if (!簡碼 || !全碼) continue

    const 簡碼長度 = 簡碼.length
    const 全碼長度 = 全碼.length
    const 碼長差值 = 全碼長度 - 簡碼長度

    處理後字符.push({
      字符,
      簡碼長度,
      全碼長度,
      碼長差值,
      字頻,
      字頻碼長乘積: 字頻 * 碼長差值,
    })
  }

  // 步驟 2：計算不同 N 值下的效率
  // N 值表示使用簡碼的字符個數，例如 N=500 表示前 500 個最有效率的字使用簡碼
  const 結果: 簡碼效率結果介面[] = []

  for (const N of N值列表) {
    // 篩選有效的簡碼字符：
    // 1. 簡碼長度 < 全碼長度（使用簡碼確實能節省按鍵）
    // 2. 簡碼長度 < 最大碼長（簡碼不能等於最大碼長，否則就不是簡碼了）
    const 有效簡碼字符 = 處理後字符.filter(c => c.簡碼長度 < c.全碼長度 && c.簡碼長度 < 最大碼長)

    // 按字頻碼長乘積排序（降序）
    // 字頻碼長乘積 = 字頻 × (全碼長度 - 簡碼長度)
    // 這個值越大，表示使用簡碼的收益越高（高頻字 + 節省按鍵多）
    const 按乘積排序 = [...有效簡碼字符].sort((a, b) => b.字頻碼長乘積 - a.字頻碼長乘積)

    // 選擇前 N 個字符使用簡碼
    // 注意：實際數量可能小於 N（如果有效簡碼字符不足 N 個）
    const 實際選中數量 = Math.min(N, 按乘積排序.length)
    const 選中字符列表 = 按乘積排序.slice(0, 實際選中數量).map(c => c.字符)
    const 選中字符集 = new Set(選中字符列表)

    // 步驟 3：計算字頻加權平均碼長
    // 這是簡碼效率的核心指標：平均每個字需要按多少個鍵
    // 公式：Σ(字頻 × 碼長) / Σ(字頻)
    // 其中，前 N 個字使用簡碼，其餘字符使用全碼
    let 總字頻碼長 = 0
    let 總字頻 = 0

    for (const 字符 of 處理後字符) {
      // 如果這個字符在選中列表中，使用簡碼長度；否則使用全碼長度
      const 最終碼長 = 選中字符集.has(字符.字符) ? 字符.簡碼長度 : 字符.全碼長度
      總字頻碼長 += 字符.字頻 * 最終碼長
      總字頻 += 字符.字頻
    }

    // 計算加權平均碼長（簡碼效率值）
    const 簡碼效率值 = 總字頻 > 0 ? 總字頻碼長 / 總字頻 : 0

    結果.push({
      最有效率的簡碼個數: N,
      簡碼效率值,
      對應字符列表: 選中字符列表,
    })
  }

  return 結果
}
