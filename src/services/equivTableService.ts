/**
 * 當量表服務
 * 負責加載和管理當量表數據
 */

import type { EquivTable } from '../types'

/**
 * 當量表服務類
 */
export class 當量表服務 {
  private static instance: 當量表服務
  private 當量表: EquivTable | null = null

  private constructor() {}

  static getInstance(): 當量表服務 {
    if (!當量表服務.instance) {
      當量表服務.instance = new 當量表服務()
    }
    return 當量表服務.instance
  }

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
        throw new Error(`加載當量表失敗: ${響應.statusText}`)
      }
      this.當量表 = await 響應.json()
      return this.當量表!
    } catch (錯誤) {
      console.error('加載當量表錯誤:', 錯誤)
      throw 錯誤
    }
  }

  /**
   * 獲取已加載的當量表
   */
  獲取當量表(): EquivTable | null {
    return this.當量表
  }

  /**
   * 清除緩存
   */
  清除緩存(): void {
    this.當量表 = null
  }
}

// 導出單例實例
export const 當量表服務實例 = 當量表服務.getInstance()
