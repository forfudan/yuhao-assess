// 碼表類型定義
export type CodeTable = Map<string, string[]>

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

// 內置碼表配置
export interface BuiltinCodeTable {
  key: string
  name: string
  url: string
  format: CodeTableFormat
  description: string
  website: string
  category: string
  enabled: boolean
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
}

// 分析統計數據
export interface AnalysisStats {
  totalChars: number
  totalCodes: number
  avgCodeLength: number
  keyDistribution: Map<string, number>
  fingerLoad: Map<string, number>
  handBalance: {
    left: number
    right: number
  }
}
