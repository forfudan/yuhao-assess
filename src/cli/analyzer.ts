/**
 * 分析协调器
 * 按顺序调用六项分析，汇总结果，并通过回调报告进度
 */

import { loadCharFrequency, loadEquivTable } from './node-adapter'
import { analyzeStaticDuplicate } from './analyses/static-duplicate'
import { analyzeDynamicDuplicate } from './analyses/dynamic-duplicate'
import { analyzeMaximumCandidates } from './analyses/maximum-candidates'
import { analyzeSpeedEquivalent } from './analyses/speed-equivalent'
import { analyzeShortCodeEfficiency } from './analyses/short-code-efficiency'
import { analyzeKeyboardHeatmap } from './analyses/keyboard-heatmap'
import type { 方案測評結果介面 } from '../types/scheme'
import type { 處理後的碼表結果介面 } from '../types'
import type { 頻率數據型别 } from '../types'

export interface AnalyzerOptions {
  processedCodeTable: 處理後的碼表結果介面
  maxCodeLength: number
  onStepStart: (step: string) => void
  onStepDone: (step: string, ms: number) => void
}

export async function runAllAnalyses(options: AnalyzerOptions): Promise<方案測評結果介面> {
  const { processedCodeTable, maxCodeLength, onStepStart, onStepDone } = options
  const { 全碼表, 簡碼表, 全碼加選重鍵表, 簡碼加選重鍵表 } = processedCodeTable

  // 预加载所有字频数据
  const [知乎, 北語, 臺標, 古籍, 繁簡, equivTable] = await Promise.all([
    loadCharFrequency('知乎簡體字頻'),
    loadCharFrequency('北語簡體字頻'),
    loadCharFrequency('臺標繁體字頻'),
    loadCharFrequency('古籍繁體字頻'),
    loadCharFrequency('繁簡聯合字頻'),
    loadEquivTable(),
  ])

  const charFrequencies: Record<string, 頻率數據型别> = {
    知乎簡體字頻: 知乎,
    北語簡體字頻: 北語,
    臺標繁體字頻: 臺標,
    古籍繁體字頻: 古籍,
    繁簡聯合字頻: 繁簡,
  }

  const result: 方案測評結果介面 = {}

  // 1. 静态重码分析
  {
    const step = '静态重码分析'
    onStepStart(step)
    const t0 = Date.now()
    result.靜態重碼分析 = await analyzeStaticDuplicate(全碼表, 簡碼表)
    onStepDone(step, Date.now() - t0)
  }

  // 2. 动态选重分析
  {
    const step = '动态选重分析'
    onStepStart(step)
    const t0 = Date.now()
    result.動態選重分析 = await analyzeDynamicDuplicate(
      全碼表,
      簡碼表,
      全碼加選重鍵表,
      簡碼加選重鍵表,
      charFrequencies
    )
    onStepDone(step, Date.now() - t0)
  }

  // 3. 候选个数分析
  {
    const step = '候选个数分析'
    onStepStart(step)
    const t0 = Date.now()
    result.候選個數分析 = await analyzeMaximumCandidates(全碼表)
    onStepDone(step, Date.now() - t0)
  }

  // 4. 速度当量分析
  {
    const step = '速度当量分析'
    onStepStart(step)
    const t0 = Date.now()
    result.速度當量分析 = await analyzeSpeedEquivalent(
      全碼加選重鍵表,
      簡碼加選重鍵表,
      charFrequencies,
      equivTable
    )
    onStepDone(step, Date.now() - t0)
  }

  // 5. 简码效率分析
  {
    const step = '简码效率分析'
    onStepStart(step)
    const t0 = Date.now()
    result.簡碼效率分析 = await analyzeShortCodeEfficiency(
      簡碼加選重鍵表,
      全碼加選重鍵表,
      charFrequencies,
      maxCodeLength
    )
    onStepDone(step, Date.now() - t0)
  }

  // 6. 键位热力分析
  {
    const step = '键位热力分析'
    onStepStart(step)
    const t0 = Date.now()
    result.鍵位熱力 = await analyzeKeyboardHeatmap(全碼加選重鍵表, 簡碼加選重鍵表, 北語)
    onStepDone(step, Date.now() - t0)
  }

  return result
}
