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
  width?: number // 鍵位寬度倍數
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
