/**
 * 方案配置服務
 * 提供方案的加載、導出、驗證等功能
 */

import type { 方案配置 } from '../types/scheme'

/**
 * 從 public/schemes/ 加載方案配置
 */
export async function 加載方案(方案鍵名: string): Promise<方案配置> {
  try {
    const response = await fetch(`/schemes/${方案鍵名}.json`)

    if (!response.ok) {
      throw new Error(`加載方案失敗: ${response.status} ${response.statusText}`)
    }

    const 配置: 方案配置 = await response.json()

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
 * 列出所有可用的預設方案
 */
export async function 列出可用方案(): Promise<string[]> {
  // 預設方案列表（未來可以從 manifest.json 動態加載）
  return ['yuhao-ming', 'yuhao-star', 'yuhao-ling']
}

/**
 * 驗證方案配置的完整性
 */
export function 驗證方案(配置: 方案配置): void {
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
export function 導出JSON(配置: 方案配置, 格式化 = true): string {
  return JSON.stringify(配置, null, 格式化 ? 2 : 0)
}

/**
 * 從 JSON 字符串導入方案配置
 */
export function 從JSON導入(json文本: string): 方案配置 {
  try {
    const 配置: 方案配置 = JSON.parse(json文本)
    驗證方案(配置)
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
export function 創建空白方案(): 方案配置 {
  const 當前時間 = new Date().toISOString()

  return {
    元數據: {
      方案名: '新方案',
      標識符: 'new-scheme',
      版本: '1.0.0',
      創建時間: 當前時間,
      更新時間: 當前時間,
    },
    方案參數: {
      最大碼長: 4,
    },
  }
}

/**
 * 更新方案的時間戳
 */
export function 更新方案時間戳(配置: 方案配置): 方案配置 {
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
export function 有測評結果(配置: 方案配置): boolean {
  return !!配置.測評結果 && Object.keys(配置.測評結果).length > 0
}

/**
 * 獲取方案的測評完成度（百分比）
 */
export function 獲取完成度(配置: 方案配置): number {
  if (!配置.測評結果) return 0

  const 總指標數 = 7 // 總共 7 個測評指標
  let 已完成數 = 0

  if (配置.測評結果.重碼分析) 已完成數++
  if (配置.測評結果.動態選重) 已完成數++
  if (配置.測評結果.最大候選數) 已完成數++
  if (配置.測評結果.碼長分布) 已完成數++
  if (配置.測評結果.速度當量) 已完成數++
  if (配置.測評結果.簡碼效率) 已完成數++
  if (配置.測評結果.鍵位熱力) 已完成數++

  return Math.round((已完成數 / 總指標數) * 100)
}
