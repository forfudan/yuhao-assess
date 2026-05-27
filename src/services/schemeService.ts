/**
 * 方案配置服務
 * 提供方案的加載、導出、驗證等功能
 */

import type { 方案配置介面 } from '../types/scheme'

/**
 * 從 public/schemes/ 加載方案配置
 */
export async function 加載方案(方案鍵名: string): Promise<方案配置介面> {
  try {
    const response = await fetch(`/schemes/${方案鍵名}.json`)

    if (!response.ok) {
      throw new Error(`加載方案失敗: ${response.status} ${response.statusText}`)
    }

    const 配置: 方案配置介面 = await response.json()

    // 驗證基本結構
    驗證方案(配置)

    return 配置
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`加載方案「${方案鍵名}」失敗: ${error.message}`)
    }
    throw new Error(`加載方案「${方案鍵名}」失敗`)
  }
}

/**
 * 内置方案配置接口
 */
export interface 内置方案配置 {
  key: string
  name: string
  description: string
}

/**
 * 列出所有可用的預設方案
 */
export async function 列出可用方案(): Promise<string[]> {
  try {
    console.log('🔵 [schemeService] 開始讀取 builtin-schemes.json')
    const response = await fetch('/settings/builtin-schemes.json')
    if (!response.ok) {
      throw new Error('無法加載内置方案列表')
    }
    const data = await response.json()
    console.log('🔵 [schemeService] 讀取到的原始數據:', data)
    console.log('🔵 [schemeService] schemes 數組:', data.schemes)
    const keys = data.schemes.map((scheme: 内置方案配置) => scheme.key)
    console.log('🔵 [schemeService] 提取的方案鍵名列表:', keys)
    return keys
  } catch (error) {
    console.error('❌ [schemeService] 加載内置方案列表失敗:', error)
    // 返回空數組而不是抛出錯誤，讓應用能繼續運行
    return []
  }
}

/**
 * 獲取所有内置方案的詳細信息
 */
export async function 獲取内置方案列表(): Promise<内置方案配置[]> {
  try {
    console.log('🔵 [schemeService] 獲取内置方案列表 - 開始讀取')
    const response = await fetch('/settings/builtin-schemes.json')
    if (!response.ok) {
      throw new Error('無法加載内置方案列表')
    }
    const data = await response.json()
    console.log('🔵 [schemeService] 獲取内置方案列表 - 讀取到:', data.schemes)
    console.log('🔵 [schemeService] 方案數量:', data.schemes.length)
    data.schemes.forEach((scheme: 内置方案配置, index: number) => {
      console.log(`  ${index + 1}. ${scheme.name} (${scheme.key}) - ${scheme.description}`)
    })
    return data.schemes
  } catch (error) {
    console.error('❌ [schemeService] 加載内置方案列表失敗:', error)
    return []
  }
}

/**
 * 驗證方案配置的完整性
 */
export function 驗證方案(配置: 方案配置介面): void {
  // 驗證元數據
  if (!配置.元數據) {
    throw new Error('缺少「元數據」字段')
  }

  if (!配置.元數據.方案名) {
    throw new Error('缺少「元數據.方案名」字段')
  }

  if (!配置.元數據.標識符) {
    throw new Error('缺少「元數據.標識符」字段')
  }

  if (!配置.元數據.版本) {
    throw new Error('缺少「元數據.版本」字段')
  }

  if (!配置.元數據.創建時間) {
    throw new Error('缺少「元數據.創建時間」字段')
  }

  if (!配置.元數據.更新時間) {
    throw new Error('缺少「元數據.更新時間」字段')
  }

  // 驗證方案參數
  if (!配置.方案參數) {
    throw new Error('缺少「方案參數」字段')
  }

  // 編碼終止指示符列表是可選的，無需驗證

  if (typeof 配置.方案參數.最大碼長 !== 'number' || 配置.方案參數.最大碼長 <= 0) {
    throw new Error('「方案參數.最大碼長」必須是正整數')
  }

  // 驗證碼表元數據（如果存在）
  if (配置.碼表元數據) {
    const 允許的分隔符 = ['空格', '製表符', '逗號', '分號']
    if (!允許的分隔符.includes(配置.碼表元數據.分隔符)) {
      throw new Error('「碼表元數據.分隔符」必須是「空格」、「製表符」、「逗號」或「分號」')
    }

    const 允許的第一列類型 = ['字符', '編碼']
    if (!允許的第一列類型.includes(配置.碼表元數據.第一列類型)) {
      throw new Error('「碼表元數據.第一列類型」必須是「字符」或「編碼」')
    }
  }
}

/**
 * 導出方案配置爲 JSON 字符串
 */
export function 導出JSON(配置: 方案配置介面, 格式化 = true): string {
  return JSON.stringify(配置, null, 格式化 ? 2 : 0)
}

/**
 * 從 JSON 字符串導入方案配置
 */
export function 從JSON導入(json文本: string): 方案配置介面 {
  try {
    const 配置: 方案配置介面 = JSON.parse(json文本)
    驗證方案(配置)
    // 對缺失的可選布爾字段補充默認值（false）
    配置.方案參數.選重編碼化 = 配置.方案參數.選重編碼化 ?? false
    配置.方案參數.出簡不出全 = 配置.方案參數.出簡不出全 ?? false
    return 配置
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('JSON 格式錯誤: ' + error.message)
    }
    throw error
  }
}

/**
 * 創建空白方案配置模板
 */
export function 創建空白方案(): 方案配置介面 {
  const 當前時間 = new Date().toISOString()

  return {
    元數據: {
      方案名: '宇宙無敵超強輸入法的草稿',
      作者: '無敵超強方案設計師',
      標識符: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      版本: 'v0.0.1',
      創建時間: 當前時間,
      更新時間: 當前時間,
    },
    方案參數: {
      最大碼長: 4,
      選重編碼化: false,
      出簡不出全: false,
    },
  }
}

/**
 * 更新方案的時間戳
 */
export function 更新方案時間戳(配置: 方案配置介面): 方案配置介面 {
  return {
    ...配置,
    元數據: {
      ...配置.元數據,
      更新時間: new Date().toISOString(),
    },
  }
}

/**
 * 檢查方案是否有測評結果
 */
export function 有測評結果(配置: 方案配置介面): boolean {
  return !!配置.測評結果 && Object.keys(配置.測評結果).length > 0
}

/**
 * 獲取方案的測評完成度（百分比）
 */
export function 獲取完成度(配置: 方案配置介面): number {
  if (!配置.測評結果) return 0

  const 總指標數 = 7 // 總共 7 個測評指標
  let 已完成數 = 0

  if (配置.測評結果.重碼分析) 已完成數++
  // 動態選重包含在重碼分析中
  if (配置.測評結果.候選個數分析) 已完成數++
  // 碼長分布（暫時保留，未來實現）
  if (配置.測評結果.速度當量分析) 已完成數++
  if (配置.測評結果.簡碼效率分析) 已完成數++
  if (配置.測評結果.鍵位熱力) 已完成數++

  return Math.round((已完成數 / 總指標數) * 100)
}
