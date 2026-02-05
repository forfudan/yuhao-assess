import { atom } from 'jotai'

/**
 * 數據加載狀態類型
 */
export type 加載狀態 = 'idle' | 'loading' | 'loaded' | 'error'

/**
 * 單個數據項的加載狀態
 */
export interface 數據加載狀態介面 {
  status: 加載狀態
  error?: Error
  loadedAt?: number // 加載完成時間戳
}

/**
 * 所有數據的加載狀態
 */
export interface 數據預加載狀態介面 {
  北語簡體字頻: 數據加載狀態介面
  臺標繁體字頻: 數據加載狀態介面
  知乎簡體字頻: 數據加載狀態介面
  古籍繁體字頻: 數據加載狀態介面
  繁簡聯合字頻: 數據加載狀態介面
  字符集數據: 數據加載狀態介面
}

/**
 * 初始狀態
 */
const initialState: 數據預加載狀態介面 = {
  北語簡體字頻: { status: 'idle' },
  臺標繁體字頻: { status: 'idle' },
  知乎簡體字頻: { status: 'idle' },
  古籍繁體字頻: { status: 'idle' },
  繁簡聯合字頻: { status: 'idle' },
  字符集數據: { status: 'idle' },
}

/**
 * 數據預加載狀態原子
 * 用於跟蹤所有數據文件的加載狀態
 */
export const 數據預加載狀態原子 = atom<數據預加載狀態介面>(initialState)

/**
 * 是否正在預加載（只讀）
 */
export const 是否正在預加載 = atom(get => {
  const state = get(數據預加載狀態原子)
  return Object.values(state).some(item => item.status === 'loading')
})

/**
 * 核心數據是否已加載（簡體+繁體+字符集）
 */
export const 核心數據已加載 = atom(get => {
  const state = get(數據預加載狀態原子)
  return (
    state.北語簡體字頻.status === 'loaded' &&
    state.臺標繁體字頻.status === 'loaded' &&
    state.字符集數據.status === 'loaded'
  )
})

/**
 * 所有數據是否已加載
 */
export const 所有數據已加載 = atom(get => {
  const state = get(數據預加載狀態原子)
  return Object.values(state).every(item => item.status === 'loaded')
})
