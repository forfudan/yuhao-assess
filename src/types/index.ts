// 原始碼表類型定義 - 保持行順序
export type RawCodeTable = Map<number, [string, string, number]> // number: 行號, [汉字, 編碼, N選]

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

// 上傳狀態類型
export interface UploadStatus {
  type: 'success' | 'error'
  message: string
}

// 码表解析结果
export interface ParseResult {
  codeTable: 碼表型别
  totalChars: number
  totalCodes: number
}

// 預設碼表配置
export interface BuiltinCodeTable {
  key: string
  name: string
  url: string
  description: string
  website: string
  category: string
  tags: string[]
  enabled: boolean
  isPrefix?: boolean // 前缀码标记
  prefixKeys?: string[] // 前缀码上屏键
}

// 碼表配置文件
export interface CodeTableConfig {
  version: string
  description: string
  defaultScheme: string
  builtinCodeTables: BuiltinCodeTable[]
  settings: {
    cacheTimeout: number
    maxRetries: number
    retryDelay: number
  }
}

// 當量表數據
export interface EquivTable {
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

// 碼表條目
export interface 碼表條目介面 {
  字符: string
  編碼: string
  頻率?: number
}

// 分析參數
export interface 分析參數介面 {
  碼表: 碼表型别
  字頻?: 頻率數據型别
  字符集?: Set<string> | 'all'
}

// 碼表指標結果
export interface CodeTableMetrics {
  // 重碼指標
  staticDupCount: number // 靜態重碼字符數
  dynamicDupRate: number | null // 動態重碼率（需要字頻數據）

  // 基本統計
  totalChars: number // 總字符數

  // 編碼統計
  codeStats: {
    totalCodes: number // 總編碼數
    avgCodeLength: number // 平均編碼長度
    minCodeLength: number // 最短編碼長度
    maxCodeLength: number // 最長編碼長度
  }
}

// 字符集類型
export type 字符集型别 =
  | 'gb2312'
  | 'common'
  | 'gbk'
  | 'cjk-basic'
  | 'cjk-a'
  | 'cjk-b'
  | 'cjk-d'
  | 'cjk-f'

// 重碼統計結果
export interface DuplicateStats {
  charset: 字符集型别
  charsetName: string
  description: string
  totalChars: number
  duplicateCount: number
  duplicateRate: number
  uniqueCodes: number
  codeEfficiency: number
}

// 碼表清理選項
export interface CodeTableCleanOptions {
  singleCharOnly?: boolean
  codeStrategy: 'longest' | 'shortest' | 'all'
  removeEmptyCodes?: boolean
  minCodeLength?: number
  maxCodeLength?: number
}

// 清理結果
export interface CleanResult {
  codeTable: 碼表型别
  stats: {
    originalChars: number
    cleanedChars: number
    removedChars: number
    originalCodes: number
    cleanedCodes: number
  }
  removedChars: string[]
}

// 碼表分析結果
export interface CodeTableAnalysis {
  totalChars: number
  totalCodes: number
  regularChars: number // 通規漢字數量
  gbkChars: number // GBK漢字數量
  cjkChars: {
    // CJK區塊統計
    A: number // CJK基本漢字
    B: number // CJK擴展A
    C: number // CJK擴展B
    D: number // CJK擴展C
    E: number // CJK擴展D
    F: number // CJK擴展E
    G: number // CJK擴展F
    H: number // CJK擴展G
    I: number // CJK擴展I
  }
  topEntries: Array<{
    char: string
    codes: string[]
  }>
}

// 鍵位熱力圖數據
export interface KeyData {
  key: string
  count: number
  frequency: number
  position: { x: number; y: number }
}

// 鍵盤佈局數據
export interface KeyboardLayout {
  rows: KeyRow[]
}

export interface KeyRow {
  keys: KeyInfo[]
  offset?: number // 行偏移量
}

export interface KeyInfo {
  key: string
  width?: 'normal' | 'wide' | 'extra-wide' // 鍵位寬度
  label?: string // 顯示標籤
  hidden?: boolean // 是否隐藏按键（用于布局对齐）
}

// 分析統計數據
export interface AnalysisStats {
  totalChars: number
  totalCodes: number
  avgCodeLength: number
  keyDistribution: Map<string, number>
  fingerLoad: Map<string, number>
  rowDistribution: Map<string, number>
  handBalance: {
    left: number
    right: number
  }
}
