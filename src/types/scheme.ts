/**
 * 方案配置系統類型定義
 */

/**
 * 方案元數據
 */
export interface 方案元數據 {
  方案名: string // 方案名稱（如「靈明」）
  標識符: string // 唯一標識（文件名，如「yuling」）
  作者?: string // 作者（如「朱宇浩」）
  版本: string // 版本號（語義版本，如「1.0.0」）
  官網?: string // 官網（如「https://shurufa.app」）
  碼表下載鏈接?: string // 碼表下載鏈接
  描述?: string // 描述
  標籤?: string[] // 標籤（如 ['形碼', '前綴碼', '五碼']）
  創建時間: string // 創建時間（ISO 8601）
  更新時間: string // 更新時間（ISO 8601）
}

/**
 * 方案參數
 */
export interface 方案參數 {
  編碼終止指示符列表?: string[] // 編碼終止指示符（如 ['a','o','e','i','u','_']）
  最大碼長: number // 最大碼長（如 4 或 5）
  編碼規則?: {
    單字編碼規則?: string // 單字編碼規則描述
    詞語編碼規則?: string // 詞語編碼規則描述
  }
}

/**
 * 方案碼表元數據
 */
export interface 方案碼表元數據 {
  分隔符: '空格' | '製表符' | '逗號' | '分號' // 碼表分隔符
  第一列類型: '字符' | '編碼' // 第一列類型
  哈希值?: string // 碼表 SHA-256（用於驗證一致性）
}

/**
 * 靜態重碼結果
 */
export interface 靜態重碼結果 {
  重碼率: number
  重碼字數: number
  總字數: number
}

/**
 * 動態選重結果
 */
export interface 動態選重結果 {
  動態選重率: number
  平均選重次數: number
  總字數: number
}

/**
 * 速度當量結果
 */
export interface 速度當量結果 {
  當量: number
  平均按鍵數: number
}

/**
 * 簡碼效率結果
 */
export interface 簡碼效率結果 {
  覆蓋率: number
  效率: number
}

/**
 * 鍵位熱力結果
 */
export interface 鍵位熱力結果 {
  按鍵頻率: Record<string, number> // { 'a': 0.15, 'o': 0.12, ... }
  左右手平衡: { 左手: number; 右手: number }
}

/**
 * 方案測評結果
 */
export interface 方案測評結果 {
  // 重碼分析
  重碼分析?: {
    靜態重碼: {
      gb2312?: 靜態重碼結果
      通規?: 靜態重碼結果
      國字?: 靜態重碼結果
      cjk基本?: 靜態重碼結果
      cjk擴A?: 靜態重碼結果
      cjk擴B?: 靜態重碼結果
      cjk擴F?: 靜態重碼結果
      cjk擴J?: 靜態重碼結果
    }
    更新時間: string
  }

  // 動態選重率
  動態選重?: {
    知乎?: 動態選重結果
    簡體?: 動態選重結果
    繁體?: 動態選重結果
    古籍?: 動態選重結果
    混合?: 動態選重結果
    更新時間: string
  }

  // 最大候選數
  最大候選數?: {
    gb2312?: number
    通規?: number
    國字?: number
    cjk基本?: number
    cjk擴A?: number
    cjk擴B?: number
    cjk擴F?: number
    cjk擴J?: number
    更新時間: string
  }

  // 碼長分布
  碼長分布?: {
    分布: Record<number, number> // { 1: 26, 2: 650, 3: 5000, 4: 20000 }
    平均碼長: number
    更新時間: string
  }

  // 速度當量
  速度當量?: {
    知乎?: 速度當量結果
    簡體?: 速度當量結果
    繁體?: 速度當量結果
    更新時間: string
  }

  // 簡碼效率
  簡碼效率?: {
    知乎?: 簡碼效率結果
    簡體?: 簡碼效率結果
    繁體?: 簡碼效率結果
    更新時間: string
  }

  // 鍵位熱力
  鍵位熱力?: {
    按鍵頻率: Record<string, number>
    左右手平衡: { 左手: number; 右手: number }
    更新時間: string
  }
}

/**
 * 方案配置完整結構
 */
export interface 方案配置 {
  元數據: 方案元數據
  方案參數: 方案參數
  碼表元數據?: 方案碼表元數據
  測評結果?: 方案測評結果
}
