import type { CodeTableConfig, BuiltinCodeTable, CodeTable, CodeTableFormat, CharFrequency, EquivTable } from '../types/index'

export class BuiltinCodeTableService {
  private config: CodeTableConfig | null = null
  private charFrequency: CharFrequency | null = null
  private equivTable: EquivTable | null = null

  // 加載內置碼表配置
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
      const response = await fetch('/data/charFrequency.json')
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

  // 獲取所有內置碼表
  async getBuiltinCodeTables(): Promise<BuiltinCodeTable[]> {
    const config = await this.loadConfig()
    return config.builtinCodeTables.filter(table => table.enabled)
  }

  // 獲取可用的內置碼表列表
  getAvailableTables(): Array<{key: string, name: string, description: string}> {
    if (!this.config) {
      return []
    }
    return this.config.builtinCodeTables.map(table => ({
      key: table.key,
      name: table.name,
      description: table.description
    }))
  }

  // 根據key獲取內置碼表
  async getBuiltinCodeTable(key: string): Promise<BuiltinCodeTable | null> {
    const tables = await this.getBuiltinCodeTables()
    return tables.find(table => table.key === key) || null
  }

  // 下載並解析內置碼表
  async downloadCodeTable(key: string): Promise<{ codeTable: CodeTable; fileName: string; format: CodeTableFormat }> {
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
      const codeTable = this.parseCodeTable(text, table.format)
      
      return {
        codeTable,
        fileName: table.name,
        format: table.format
      }
    } catch (error) {
      console.error('Error downloading code table:', error)
      throw error
    }
  }

  // 解析碼表文本
  private parseCodeTable(text: string, format: CodeTableFormat): CodeTable {
    const codeTable = new Map<string, string[]>()
    const lines = text.split('\n')

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

      if (!codeTable.has(char)) {
        codeTable.set(char, [])
      }
      
      const codes = codeTable.get(char)!
      if (codes.indexOf(code) === -1) {
        codes.push(code)
      }
    }

    return codeTable
  }

  // 分析字符類型
  analyzeCharacterType(char: string): {
    isRegular: boolean
    isGBK: boolean
    cjkBlock: string | null
  } {
    const codePoint = char.codePointAt(0)
    if (!codePoint) {
      return { isRegular: false, isGBK: false, cjkBlock: null }
    }

    // 通規漢字 (常用漢字)
    const isRegular = (codePoint >= 0x4E00 && codePoint <= 0x9FFF)

    // GBK漢字範圍 (簡化判斷)
    const isGBK = (codePoint >= 0x4E00 && codePoint <= 0x9FBF)

    // CJK區塊判斷
    let cjkBlock: string | null = null
    if (codePoint >= 0x4E00 && codePoint <= 0x9FFF) {
      cjkBlock = 'A' // CJK基本漢字
    } else if (codePoint >= 0x3400 && codePoint <= 0x4DBF) {
      cjkBlock = 'B' // CJK擴展A
    } else if (codePoint >= 0x20000 && codePoint <= 0x2A6DF) {
      cjkBlock = 'C' // CJK擴展B
    } else if (codePoint >= 0x2A700 && codePoint <= 0x2B73F) {
      cjkBlock = 'D' // CJK擴展C
    } else if (codePoint >= 0x2B740 && codePoint <= 0x2B81F) {
      cjkBlock = 'E' // CJK擴展D
    } else if (codePoint >= 0x2B820 && codePoint <= 0x2CEAF) {
      cjkBlock = 'F' // CJK擴展E
    } else if (codePoint >= 0x2CEB0 && codePoint <= 0x2EBEF) {
      cjkBlock = 'G' // CJK擴展F
    } else if (codePoint >= 0x30000 && codePoint <= 0x3134F) {
      cjkBlock = 'H' // CJK擴展G
    } else if (codePoint >= 0x31350 && codePoint <= 0x323AF) {
      cjkBlock = 'I' // CJK擴展H
    }

    return { isRegular, isGBK, cjkBlock }
  }
}

export const builtinCodeTableService = new BuiltinCodeTableService()
