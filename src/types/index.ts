// 原始碼表類型定義 - 保持行順序
export type RawCodeTable = Map<number, [string, string, number]> // number: 行號, [汉字, 編碼, N選]

// 碼表類型定義
export type CodeTable = Map<string, string[]>

// 處理後的四個輔助碼表
export interface ProcessedCodeTables {
  full: CodeTable                    // 全碼表
  short: CodeTable                   // 簡碼表  
  fullWithSelection: CodeTable       // 全碼加選重表
  shortWithSelection: CodeTable      // 簡碼加選重表
  wordFullCodeWithSelection?: CodeTable  // 詞語全碼加選重表（可選）
}

// 碼表格式類型
export type CodeTableFormat = 'char_first' | 'code_first'

// 上傳狀態類型
export interface UploadStatus {
  type: 'success' | 'error'
  message: string
}

// 码表解析结果
export interface ParseResult {
  codeTable: CodeTable
  totalChars: number
  totalCodes: number
  format: CodeTableFormat
}

// 預設碼表配置
export interface BuiltinCodeTable {
  key: string
  name: string
  url: string
  format: CodeTableFormat
  description: string
  website: string
  category: string
  tags: string[]
  enabled: boolean
  isPrefix?: boolean  // 前缀码标记
  prefixKeys?: string[]  // 前缀码上屏键
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

// 字頻數據
export type CharFrequency = Record<string, number>

// 詞頻數據
export type WordFrequency = Record<string, number>

// 碼表條目
export interface CodeTableEntry {
  char: string
  code: string
  frequency?: number
}

// 分析參數
export interface AnalysisParams {
  codeTable: CodeTable
  charFrequency?: CharFrequency
  charset?: Set<string> | 'all'
}

// 碼表指標結果
export interface CodeTableMetrics {
  // 重碼指標
  staticDupCount: number        // 靜態重碼字符數
  dynamicDupRate: number | null // 動態重碼率（需要字頻數據）
  
  // 基本統計
  totalChars: number            // 總字符數
  
  // 編碼統計
  codeStats: {
    totalCodes: number          // 總編碼數
    avgCodeLength: number       // 平均編碼長度
    minCodeLength: number       // 最短編碼長度
    maxCodeLength: number       // 最長編碼長度
  }
}

// 字符集類型
export type CharsetType = 'gb2312' | 'common' | 'gbk' | 'cjk-basic' | 'cjk-a' | 'cjk-b' | 'cjk-d' | 'cjk-f'

// 重碼統計結果
export interface DuplicateStats {
  charset: CharsetType
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
  codeTable: CodeTable
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
  regularChars: number  // 通規漢字數量
  gbkChars: number      // GBK漢字數量
  cjkChars: {           // CJK區塊統計
    A: number           // CJK基本漢字
    B: number           // CJK擴展A
    C: number           // CJK擴展B
    D: number           // CJK擴展C
    E: number           // CJK擴展D
    F: number           // CJK擴展E
    G: number           // CJK擴展F
    H: number           // CJK擴展G
    I: number           // CJK擴展I
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
