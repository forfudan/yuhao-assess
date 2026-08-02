/**
 * 速度当量分析
 * 计算 5 种字频下全码、一级简码、二级简码、全部简码的速度当量
 */

import {
  從碼表計算加權速度當量,
  生成一級簡碼加選重鍵表,
  生成二級簡碼加選重鍵表,
} from '../../services/speedEquivalentService'
import type { 碼表型别, 頻率數據型别 } from '../../types'
import type { 速度當量分析結果介面 } from '../../atoms/speedEquivalent'

const FREQ_TYPES = [
  '知乎簡體字頻',
  '北語簡體字頻',
  '臺標繁體字頻',
  '古籍繁體字頻',
  '繁簡聯合字頻',
] as const

type FreqType = (typeof FREQ_TYPES)[number]

const PREFIX_MAP: Record<FreqType, string> = {
  知乎簡體字頻: '知乎簡體字頻',
  北語簡體字頻: '北語簡體字頻',
  臺標繁體字頻: '臺標繁體字頻',
  古籍繁體字頻: '古籍繁體字頻',
  繁簡聯合字頻: '繁簡聯合字頻',
}

export async function analyzeSpeedEquivalent(
  fullCodeWithSelectionTable: 碼表型别,
  shortCodeWithSelectionTable: 碼表型别,
  charFrequencies: Record<string, 頻率數據型别>,
  equivTable: Record<string, number>
): Promise<速度當量分析結果介面> {
  // 生成一级和二级简码表（不传上屏键，使用默认空格键）
  const firstShortTable = 生成一級簡碼加選重鍵表(
    shortCodeWithSelectionTable,
    fullCodeWithSelectionTable,
    []
  )
  const secondShortTable = 生成二級簡碼加選重鍵表(
    shortCodeWithSelectionTable,
    fullCodeWithSelectionTable,
    []
  )

  const result: Partial<速度當量分析結果介面> = {}

  for (const freqType of FREQ_TYPES) {
    const freq = charFrequencies[freqType] || {}
    const prefix = PREFIX_MAP[freqType]

    ;(result as Record<string, number>)[prefix + '全碼速度當量'] = 從碼表計算加權速度當量(
      fullCodeWithSelectionTable,
      freq,
      equivTable
    )
    ;(result as Record<string, number>)[prefix + '一級簡碼速度當量'] = 從碼表計算加權速度當量(
      firstShortTable,
      freq,
      equivTable
    )
    ;(result as Record<string, number>)[prefix + '二級簡碼速度當量'] = 從碼表計算加權速度當量(
      secondShortTable,
      freq,
      equivTable
    )
    ;(result as Record<string, number>)[prefix + '全部簡碼速度當量'] = 從碼表計算加權速度當量(
      shortCodeWithSelectionTable,
      freq,
      equivTable
    )
  }

  result.更新時間 = new Date().toISOString()
  return result as 速度當量分析結果介面
}
