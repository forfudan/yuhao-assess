import { atomWithStorage } from 'jotai/utils'

// 應用設置（持久化原子狀態）
export const 設置原子狀態 = atomWithStorage('app-settings', {
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

// 分析參數（持久化原子狀態）
export const 分析參數原子狀態 = atomWithStorage('analysis-params', {
  charFrequency: 'charAbsoluteFrequencySC' as string,
  wordFrequency: 'wordAbsoluteFrequencySC' as string,
  enableWordFrequency: true,
})
