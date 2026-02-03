import type {
  CodeTableConfig,
  BuiltinCodeTable,
  RawCodeTable,
  CodeTableFormat,
  CharFrequency,
  EquivTable,
} from '../types/index'
import { isInCJKToJ, loadCJKBlockData } from './charsetService'

export class BuiltinCodeTableService {
  private config: CodeTableConfig | null = null
  private charFrequency: CharFrequency | null = null
  private equivTable: EquivTable | null = null

  // 加載預設碼表配置
  async loadConfig(): Promise<CodeTableConfig> {
    if (this.config) {
      return this.config
    }

    try {
      const response = await fetch('/data/codeTableConfig.json')
      if (!response.ok) {
        throw new Error('Failed to load code table config')
      }
      this.config = await response.json()
      return this.config!
    } catch (error) {
      console.error('Error loading code table config:', error)
      throw error
    }
  }

  // 加載字頻數據
  async loadCharFrequency(): Promise<CharFrequency> {
    if (this.charFrequency) {
      return this.charFrequency
    }

    try {
      const response = await fetch('/data/charFrequencyZhihu.json')
      if (!response.ok) {
        throw new Error('Failed to load character frequency data')
      }
      this.charFrequency = await response.json()
      return this.charFrequency!
    } catch (error) {
      console.error('Error loading character frequency data:', error)
      throw error
    }
  }

  // 加載簡體字頻數據
  async loadCharFrequencySC(): Promise<CharFrequency> {
    try {
      const response = await fetch('/data/charFrequencySC.json')
      if (!response.ok) {
        throw new Error('Failed to load SC character frequency data')
      }
      return await response.json()
    } catch (error) {
      console.error('Error loading SC character frequency data:', error)
      throw error
    }
  }

  // 加載繁體字頻數據
  async loadCharFrequencyTC(): Promise<CharFrequency> {
    try {
      const response = await fetch('/data/charFrequencyTC.json')
      if (!response.ok) {
        throw new Error('Failed to load TC character frequency data')
      }
      return await response.json()
    } catch (error) {
      console.error('Error loading TC character frequency data:', error)
      throw error
    }
  }

  // 加載古籍字頻數據
  async loadCharFrequencyGuji(): Promise<CharFrequency> {
    try {
      const response = await fetch('/data/charFrequencyGuji.json')
      if (!response.ok) {
        throw new Error('Failed to load Guji character frequency data')
      }
      return await response.json()
    } catch (error) {
      console.error('Error loading Guji character frequency data:', error)
      throw error
    }
  }

  // 創建繁簡聯合字頻表
  async loadCharFrequencyUnified(): Promise<CharFrequency> {
    try {
      const [scFreq, tcFreq] = await Promise.all([
        this.loadCharFrequencySC(),
        this.loadCharFrequencyTC(),
      ])

      const unifiedFreq: CharFrequency = {}

      // 合併簡體字頻
      for (const [char, freq] of Object.entries(scFreq)) {
        unifiedFreq[char] = freq
      }

      // 合併繁體字頻，如果字符已存在則相加頻數
      for (const [char, freq] of Object.entries(tcFreq)) {
        if (unifiedFreq[char]) {
          unifiedFreq[char] += freq
        } else {
          unifiedFreq[char] = freq
        }
      }

      return unifiedFreq
    } catch (error) {
      console.error('Error creating unified character frequency data:', error)
      throw error
    }
  }

  // 加載當量表
  async loadEquivTable(): Promise<EquivTable> {
    if (this.equivTable) {
      return this.equivTable
    }

    try {
      const response = await fetch('/data/equivTable.json')
      if (!response.ok) {
        throw new Error('Failed to load equivalence table')
      }
      this.equivTable = await response.json()
      return this.equivTable!
    } catch (error) {
      console.error('Error loading equivalence table:', error)
      throw error
    }
  }

  // 獲取所有預設碼表
  async getBuiltinCodeTables(): Promise<BuiltinCodeTable[]> {
    const config = await this.loadConfig()
    return config.builtinCodeTables.filter(table => table.enabled)
  }

  // 獲取可用的預設碼表列表
  getAvailableTables(): Array<{ key: string; name: string; description: string }> {
    if (!this.config) {
      return []
    }
    return this.config.builtinCodeTables
      .filter(table => table.enabled)
      .map(table => ({
        key: table.key,
        name: table.name,
        description: table.description,
      }))
  }

  // 根據key獲取預設碼表配置
  getTableConfig(key: string): BuiltinCodeTable | null {
    if (!this.config) {
      return null
    }
    return this.config.builtinCodeTables.find(table => table.key === key) || null
  }

  // 根據key獲取預設碼表
  async getBuiltinCodeTable(key: string): Promise<BuiltinCodeTable | null> {
    const tables = await this.getBuiltinCodeTables()
    return tables.find(table => table.key === key) || null
  }

  /**
   * 解析碼表文本爲原始碼表（保持行順序）
   */
  public static async parseRawCodeTable(
    text: string,
    format: CodeTableFormat
  ): Promise<{ rawCodeTable: RawCodeTable }> {
    // 先加載 CJK 區塊數據，確保 isInCJKToJ 可以正常工作
    await loadCJKBlockData()

    const rawCodeTable: RawCodeTable = new Map()
    const lines = text.split('\n')
    let lineIndex = 0

    // 第一遍：收集所有字符-編碼對
    const tempEntries: Array<{ lineIndex: number; char: string; code: string }> = []

    for (const line of lines) {
      const trimmedLine = line.trim()
      if (!trimmedLine || trimmedLine.startsWith('#') || trimmedLine.startsWith('//')) {
        continue
      }

      const parts = trimmedLine.split(/\s+/)
      if (parts.length < 2) continue

      let char: string
      let code: string

      if (format === 'char_first') {
        char = parts[0]
        code = parts[1]
      } else {
        code = parts[0]
        char = parts[1]
      }

      if (!char || !code) continue

      // 只處理單個字符（包括 CJK 漢字）
      if (Array.from(char).length === 1 && isInCJKToJ(char)) {
        tempEntries.push({ lineIndex: lineIndex++, char, code })
      }
    }

    // 第二遍：計算每個編碼下的 N 選位置
    const codePositionMap = new Map<string, Map<string, number>>() // code -> char -> position

    for (const entry of tempEntries) {
      const { code, char } = entry

      if (!codePositionMap.has(code)) {
        codePositionMap.set(code, new Map())
      }

      const charMap = codePositionMap.get(code)!
      if (!charMap.has(char)) {
        // 當前編碼下已有的字符數量 + 1 就是這個字符的位置
        charMap.set(char, charMap.size + 1)
      }
    }

    // 第三遍：構建最終的 RawCodeTable，包含 N 選信息
    for (const entry of tempEntries) {
      const { lineIndex, char, code } = entry
      const position = codePositionMap.get(code)!.get(char)!
      rawCodeTable.set(lineIndex, [char, code, position])
    }

    return { rawCodeTable }
  }

  /**
   * 下載並解析預設碼表，返回 RawCodeTable
   */
  async downloadRawCodeTable(key: string): Promise<{
    rawCodeTable: RawCodeTable
    fileName: string
    format: CodeTableFormat
  }> {
    const table = await this.getBuiltinCodeTable(key)
    if (!table) {
      throw new Error(`Unknown code table: ${key}`)
    }

    try {
      const response = await fetch(table.url)
      if (!response.ok) {
        throw new Error(`Failed to download code table: ${response.statusText}`)
      }

      const text = await response.text()
      const { rawCodeTable } = await BuiltinCodeTableService.parseRawCodeTable(text, table.format)

      return {
        rawCodeTable,
        fileName: table.name,
        format: table.format,
      }
    } catch (error) {
      console.error('Error downloading code table:', error)
      throw error
    }
  }
}

export const builtinCodeTableService = new BuiltinCodeTableService()
