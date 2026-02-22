// 字頻來源型别
export type 字頻來源型别 = '知乎簡體' | '北語簡體' | '臺標繁體' | '古籍繁體' | '繁簡聯合'

// 全碼簡碼型别
export type 全碼簡碼型别 = '全碼' | '簡碼'

// 原始碼表類型定義 - 保持行順序
export type 原始碼表型别 = Map<number, [string, string, number]> // number: 行號, [汉字, 編碼, N選]

// 碼表類型定義
export type 碼表型别 = Map<string, string[]>

// 處理後的碼表結果接口
export interface 處理後的碼表結果介面 {
  全碼表: 碼表型别 // 全碼表（每個字符只保留最長編碼，保持原始順序）
  簡碼表: 碼表型别 // 簡碼表（每個字符只保留最短編碼，保持原始順序）
  全碼加選重鍵表: 碼表型别 // 全碼加選重按鍵表（用於當量計算等，保持原始順序）
  簡碼加選重鍵表: 碼表型别 // 簡碼加選重按鍵表（補空格+選重鍵，保持原始順序）
  詞語全碼加選重鍵表?: 碼表型别 // 詞語全碼加選重按鍵表（詞語編碼使用單字全碼）
  詞語簡碼加選重鍵表?: 碼表型别 // 詞語簡碼加選重按鍵表（單字詞使用簡碼，多字詞用全碼截取）
}

// 方案配置相關類型
export * from './scheme'

// 當量表數據
export interface 當量表介面 {
  name: string
  description: string
  source: string
  version: string
  data: Record<string, number>
}

// 絶對頻數數據（原始數據，未歸一化）
export type 頻數數據型别 = Record<string, number>

// 相對頻率數據（歸一化後，用於計算）
export type 頻率數據型别 = Record<string, number>
