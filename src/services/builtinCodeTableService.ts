import type {
  CodeTableConfig,
  BuiltinCodeTable,
  RawCodeTable,
  CharFrequency,
  EquivTable,
} from '../types/index'
import { isInCJKToJ, loadCJKBlockData } from './charsetService'

/**
 * 内置碼表服務
 * 提供碼表配置加載、字頻數據加載、當量表加載等功能
 */
export class 内置碼表服務 {
  private 配置: CodeTableConfig | null = null
  private 當量表: EquivTable | null = null

  /**
   * 加載預設碼表配置
   */
  async 加載配置(): Promise<CodeTableConfig> {
    if (this.配置) {
      return this.配置
    }

    try {
      const 響應 = await fetch('/data/codeTableConfig.json')
      if (!響應.ok) {
        throw new Error('加載碼表配置失敗')
      }
      this.配置 = await 響應.json()
      return this.配置!
    } catch (錯誤) {
      console.error('加載碼表配置錯誤:', 錯誤)
      throw 錯誤
    }
  }

  // 字頻表加載已移至獨立的字頻服務和 atom 管理

  /**
   * 加載當量表
   */
  async 加載當量表(): Promise<EquivTable> {
    if (this.當量表) {
      return this.當量表
    }

    try {
      const 響應 = await fetch('/data/equivTable.json')
      if (!響應.ok) {
        throw new Error('加載當量表失敗')
      }
      this.當量表 = await 響應.json()
      return this.當量表!
    } catch (錯誤) {
      console.error('加載當量表錯誤:', 錯誤)
      throw 錯誤
    }
  }

  /**
   * 獲取所有可用的預設碼表
   */
  async 獲取所有預設碼表(): Promise<BuiltinCodeTable[]> {
    const 配置 = await this.加載配置()
    return 配置.builtinCodeTables.filter(碼表 => 碼表.enabled)
  }

  /**
   * 獲取可用的預設碼表列表（簡化信息）
   */
  獲取可用碼表列表(): Array<{ key: string; name: string; description: string }> {
    if (!this.配置) {
      return []
    }
    return this.配置.builtinCodeTables
      .filter(碼表 => 碼表.enabled)
      .map(碼表 => ({
        key: 碼表.key,
        name: 碼表.name,
        description: 碼表.description,
      }))
  }

  /**
   * 根據 key 獲取預設碼表配置
   */
  獲取碼表配置(鍵名: string): BuiltinCodeTable | null {
    if (!this.配置) {
      return null
    }
    return this.配置.builtinCodeTables.find(碼表 => 碼表.key === 鍵名) || null
  }

  /**
   * 根據 key 獲取預設碼表
   */
  async 獲取預設碼表(鍵名: string): Promise<BuiltinCodeTable | null> {
    const 碼表列表 = await this.獲取所有預設碼表()
    return 碼表列表.find(碼表 => 碼表.key === 鍵名) || null
  }

  /**
   * 解析碼表文本爲原始碼表（保持行順序）
   * @param 文本 碼表文本内容
   * @param 分隔符 分隔符類型（空格、製表符、逗號、分號）
   * @param 第一列類型 第一列類型（字符、編碼）
   */
  public static async 解析原始碼表(
    文本: string,
    分隔符: '空格' | '製表符' | '逗號' | '分號',
    第一列類型: '字符' | '編碼'
  ): Promise<{ rawCodeTable: RawCodeTable }> {
    // 先加載 CJK 區塊數據，確保 isInCJKToJ 可以正常工作
    await loadCJKBlockData()

    const rawCodeTable: RawCodeTable = new Map()
    const 行數組 = 文本.split('\n')
    let 行索引 = 0

    // 確定分隔符正則
    let 分隔符正則: RegExp
    switch (分隔符) {
      case '製表符':
        分隔符正則 = /\t+/
        break
      case '逗號':
        分隔符正則 = /,/
        break
      case '分號':
        分隔符正則 = /;/
        break
      case '空格':
      default:
        分隔符正則 = /\s+/
        break
    }

    // 第一遍：收集所有字符-編碼對
    const 臨時條目: Array<{ lineIndex: number; char: string; code: string }> = []

    for (const 行 of 行數組) {
      const 修剪後的行 = 行.trim()
      if (!修剪後的行 || 修剪後的行.startsWith('#') || 修剪後的行.startsWith('//')) {
        continue
      }

      const 部分 = 修剪後的行.split(分隔符正則)
      if (部分.length < 2) continue

      let 字符: string
      let 編碼: string

      if (第一列類型 === '字符') {
        字符 = 部分[0]
        編碼 = 部分[1]
      } else {
        編碼 = 部分[0]
        字符 = 部分[1]
      }

      if (!字符 || !編碼) continue

      // 只處理單個字符（包括 CJK 漢字）
      if (Array.from(字符).length === 1 && isInCJKToJ(字符)) {
        臨時條目.push({ lineIndex: 行索引++, char: 字符, code: 編碼 })
      }
    }

    // 第二遍：計算每個編碼下的 N 選位置
    const 編碼位置映射 = new Map<string, Map<string, number>>() // 編碼 -> 字符 -> 位置

    for (const 條目 of 臨時條目) {
      const { code: 編碼, char: 字符 } = 條目

      if (!編碼位置映射.has(編碼)) {
        編碼位置映射.set(編碼, new Map())
      }

      const 字符映射 = 編碼位置映射.get(編碼)!
      if (!字符映射.has(字符)) {
        // 當前編碼下已有的字符數量 + 1 就是這個字符的位置
        字符映射.set(字符, 字符映射.size + 1)
      }
    }

    // 第三遍：構建最終的 RawCodeTable，包含 N 選信息
    for (const 條目 of 臨時條目) {
      const { lineIndex: 行索引, char: 字符, code: 編碼 } = 條目
      const 位置 = 編碼位置映射.get(編碼)!.get(字符)!
      rawCodeTable.set(行索引, [字符, 編碼, 位置])
    }

    return { rawCodeTable }
  }
}

// 導出單例實例
export const 内置碼表服務實例 = new 内置碼表服務()

// 向後兼容的别名
export const builtinCodeTableService = 内置碼表服務實例
