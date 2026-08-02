/**
 * 候选个数分析
 * 计算 14 个字符集下全码编码的最大候选个数
 */

import { 過濾自定義字符集, type 累積漢字集名稱型别 } from '../../services/charsetService'
import type { 碼表型别 } from '../../types'
import type { 最大候選個數分析結果 } from '../../atoms/maximumCandidates'

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

export async function analyzeMaximumCandidates(
  fullCodeTable: 碼表型别
): Promise<最大候選個數分析結果> {
  const allChars = new Set(fullCodeTable.keys())
  const result: Partial<最大候選個數分析結果> = {}

  for (const charsetName of CHARSET_LIST) {
    const charset = await 過濾自定義字符集(charsetName, allChars)

    const codeToChars = new Map<string, string[]>()
    for (const char of charset) {
      const codes = fullCodeTable.get(char)
      if (!codes || codes.length === 0) continue
      const code = codes[0]
      if (!code) continue
      if (!codeToChars.has(code)) codeToChars.set(code, [])
      codeToChars.get(code)!.push(char)
    }

    let maxCandidates = 0
    for (const chars of codeToChars.values()) {
      if (chars.length > maxCandidates) maxCandidates = chars.length
    }

    const codeList: string[] = []
    for (const [code, chars] of codeToChars.entries()) {
      if (chars.length === maxCandidates) codeList.push(code)
    }

    ;(result as Record<string, { 最大候選個數: number; 編碼列表: string[] }>)[charsetName] = {
      最大候選個數: maxCandidates,
      編碼列表: codeList,
    }
  }

  result.字符數 = fullCodeTable.size
  result.更新時間 = new Date().toISOString()
  return result as 最大候選個數分析結果
}
