import { atomWithStorage } from 'jotai/utils'

// 應用設置
export const settingsAtom = atomWithStorage('app-settings', {
  // 字符集設置
  charset: 'GB2312' as string,
  includeSimplified: true,
  includeTraditional: false,

  // 統計設置
  minCodeLength: 1,
  maxCodeLength: 4,
  topN: 500,

  // 顯示設置
  theme: 'light' as 'light' | 'dark',
  language: 'zh-TW' as 'zh-TW' | 'zh-CN',
})

// 分析參數
export const analysisParamsAtom = atomWithStorage('analysis-params', {
  charFrequency: 'charFrequencySC' as string,
  wordFrequency: 'wordFrequencySC' as string,
  enableWordFrequency: true,
})
