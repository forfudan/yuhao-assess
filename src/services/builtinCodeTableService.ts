import type { CodeTableConfig, BuiltinCodeTable, CodeTable, CodeTableFormat, CharFrequency, EquivTable } from '../types/index'

// CJK塊數據類型定義
type CJKBlockData = {
  version: string
  description: string
  lastUpdated: string
  blocks: Record<string, {
    name: string
    description: string
    start: string
    end: string
    comment: string
    note?: string
  }>
}

export class BuiltinCodeTableService {
  private config: CodeTableConfig | null = null
  private charFrequency: CharFrequency | null = null
  private equivTable: EquivTable | null = null
  private cjkBlockData: CJKBlockData | null = null

  // 加載CJK區塊數據
  async loadCJKBlockData(): Promise<void> {
    if (this.cjkBlockData) return
    
    try {
      const response = await fetch('/data/cjkBlocks.json')
      this.cjkBlockData = await response.json() as CJKBlockData
    } catch (error) {
      console.error('Failed to load CJK block data:', error)
      // 使用空數據作爲後備
      this.cjkBlockData = { version: '', description: '', lastUpdated: '', blocks: {} }
    }
  }

  // 獲取塊的起始和結束範圍
  private getBlockRange(blockName: string): { start: number, end: number } | null {
    if (!this.cjkBlockData) return null
    const block = this.cjkBlockData.blocks[blockName]
    if (!block) return null
    return {
      start: parseInt(block.start, 16),
      end: parseInt(block.end, 16)
    }
  }

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
        this.loadCharFrequencyTC()
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

  // 下載並解析預設碼表
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
  // 字符分類函數
  async classifyChar(char: string): Promise<{
    isRegular: boolean
    isGBK: boolean
    cjkBlock: string | null
  }> {
    await this.loadCJKBlockData()
    
    const codePoint = char.codePointAt(0)
    if (!codePoint) {
      return { isRegular: false, isGBK: false, cjkBlock: null }
    }

    // 獲取CJK基本區範圍
    const basicRange = this.getBlockRange('cjk_basic')
    
    // 通規漢字 (常用漢字)
    const isRegular = basicRange ? (codePoint >= basicRange.start && codePoint <= basicRange.end) : false

    // GBK漢字範圍 (簡化判斷) - 這裏保持原有邏輯，使用0x9FBF作爲結束點
    const isGBK = basicRange ? (codePoint >= basicRange.start && codePoint <= 0x9FBF) : false

    // CJK區塊判斷
    let cjkBlock: string | null = null
    
    const basicRangeCheck = this.getBlockRange('cjk_basic')
    const aRangeCheck = this.getBlockRange('cjk_a')
    const bRangeCheck = this.getBlockRange('cjk_b')
    const cRangeCheck = this.getBlockRange('cjk_c')
    const dRangeCheck = this.getBlockRange('cjk_d')
    const eRangeCheck = this.getBlockRange('cjk_e')
    const fRangeCheck = this.getBlockRange('cjk_f')
    const gRangeCheck = this.getBlockRange('cjk_g')
    const hRangeCheck = this.getBlockRange('cjk_h')
    
    if (basicRangeCheck && codePoint >= basicRangeCheck.start && codePoint <= basicRangeCheck.end) {
      cjkBlock = 'A' // CJK基本漢字
    } else if (aRangeCheck && codePoint >= aRangeCheck.start && codePoint <= aRangeCheck.end) {
      cjkBlock = 'B' // CJK擴展A
    } else if (bRangeCheck && codePoint >= bRangeCheck.start && codePoint <= bRangeCheck.end) {
      cjkBlock = 'C' // CJK擴展B
    } else if (cRangeCheck && codePoint >= cRangeCheck.start && codePoint <= cRangeCheck.end) {
      cjkBlock = 'D' // CJK擴展C
    } else if (dRangeCheck && codePoint >= dRangeCheck.start && codePoint <= dRangeCheck.end) {
      cjkBlock = 'E' // CJK擴展D
    } else if (eRangeCheck && codePoint >= eRangeCheck.start && codePoint <= eRangeCheck.end) {
      cjkBlock = 'F' // CJK擴展E
    } else if (fRangeCheck && codePoint >= fRangeCheck.start && codePoint <= fRangeCheck.end) {
      cjkBlock = 'G' // CJK擴展F
    } else if (gRangeCheck && codePoint >= gRangeCheck.start && codePoint <= gRangeCheck.end) {
      cjkBlock = 'H' // CJK擴展G
    } else if (hRangeCheck && codePoint >= hRangeCheck.start && codePoint <= hRangeCheck.end) {
      cjkBlock = 'I' // CJK擴展H
    }

    return { isRegular, isGBK, cjkBlock }
  }
}

export const builtinCodeTableService = new BuiltinCodeTableService()
