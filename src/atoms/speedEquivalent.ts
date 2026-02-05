/**
 * 速度當量分析結果的 Atom 狀態管理
 */
import { atom } from 'jotai'

/**
 * 速度當量分析結果數據結構
 */
export interface 速度當量分析結果 {
  // 單字全碼當量
  知乎簡體字頻全碼速度當量: number
  北語簡體字頻全碼速度當量: number
  臺標繁體字頻全碼速度當量: number
  古籍繁體字頻全碼速度當量: number
  繁简联合字頻全碼速度當量: number

  // 單字一級簡碼當量
  知乎簡體字頻一級簡碼速度當量: number
  北語簡體字頻一級簡碼速度當量: number
  臺標繁體字頻一級簡碼速度當量: number
  古籍繁體字頻一級簡碼速度當量: number
  繁简联合字頻一級簡碼速度當量: number

  // 單字二級簡碼當量
  知乎簡體字頻二級簡碼速度當量: number
  北語簡體字頻二級簡碼速度當量: number
  臺標繁體字頻二級簡碼速度當量: number
  古籍繁體字頻二級簡碼速度當量: number
  繁简联合字頻二級簡碼速度當量: number

  // 單字全簡當量
  知乎簡體字頻全部簡碼速度當量: number
  北語簡體字頻全部簡碼速度當量: number
  臺標繁體字頻全部簡碼速度當量: number
  古籍繁體字頻全部簡碼速度當量: number
  繁简联合字頻全部簡碼速度當量: number

  // 詞語全碼當量（可選）
  scWordEquiv?: number
  // 詞語一簡當量（可選）
  scWordFirstShortEquiv?: number
  // 詞語二簡當量（可選）
  scWordSecondShortEquiv?: number
  // 詞語全簡當量（可選）
  scWordShortEquiv?: number

  // 元數據
  更新時間?: string
  碼表哈希?: string
}

/**
 * 當量例字信息
 */
export interface 當量例字信息 {
  字符: string
  編碼: string
  按鍵組合: string
  當量值: number
  字頻: number
}

/**
 * 當量詳情數據（點擊表格單元格時顯示）
 */
export interface 當量詳情數據 {
  字頻類型: string // 'zhihu' | 'sc' | 'tc' | 'guji' | 'unified'
  碼表類型: string // 'full' | 'firstShort' | 'secondShort' | 'short'
  例字列表: 當量例字信息[]
}

/**
 * 速度當量分析結果
 * 存儲所有字頻類型和碼表類型的當量計算結果
 */
export const 速度當量分析原子狀態 = atom<速度當量分析結果 | null>(null)

/**
 * 當量詳情數據（用於 Modal 展示）
 * 存儲當前選中的當量例字信息
 */
export const 當量詳情原子狀態 = atom<當量詳情數據 | null>(null)
