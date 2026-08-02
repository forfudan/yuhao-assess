/**
 * 静态重码分析
 * 复用 duplicateAnalysisService 中的 計算某字符集的重碼數據，转换返回结构
 */

import { 計算某字符集的重碼數據 } from '../../services/duplicateAnalysisService'
import type { 碼表型别 } from '../../types'
import type { 靜態重碼分析結果介面, 某字符集的靜態重碼數據介面 } from '../../atoms/staticDuplicate'
import type { 累積漢字集名稱型别 } from '../../services/charsetService'

const CHARSET_LIST: 累積漢字集名稱型别[] = [
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

export async function analyzeStaticDuplicate(
  fullCodeTable: 碼表型别,
  shortCodeTable: 碼表型别
): Promise<靜態重碼分析結果介面> {
  const results: Partial<靜態重碼分析結果介面> = {}

  for (const charsetName of CHARSET_LIST) {
    const [full, short] = await Promise.all([
      計算某字符集的重碼數據(fullCodeTable, charsetName),
      計算某字符集的重碼數據(shortCodeTable, charsetName),
    ])

    const data: 某字符集的靜態重碼數據介面 = {
      全碼重碼組數: full.duplicateGroupCount,
      簡碼重碼組數: short.duplicateGroupCount,
      全碼重碼字數: full.duplicateCount,
      簡碼重碼字數: short.duplicateCount,
      實際字符數: full.totalChars,
      理論字符數: full.theoreticalSize,
      字集覆蓋率: full.theoreticalSize > 0 ? full.totalChars / full.theoreticalSize : 0,
    }
    ;(results as Record<string, 某字符集的靜態重碼數據介面>)[charsetName] = data
  }

  results.更新時間 = new Date().toISOString()
  return results as 靜態重碼分析結果介面
}
