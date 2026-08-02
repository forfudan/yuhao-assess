/**
 * 方案狀態服务
 * 提供清空所有原子状态、以及把一份方案 JSON 套進所有原子状态的公共函数
 */

import { 從JSON導入 } from './schemeService'
import { 展開連續文本當量結果 } from '@/atoms/continuousEquivalent'
import type { 方案配置介面 } from '@/types/scheme'

export interface AtomSetters {
  設置碼表數據: (value: any) => void
  設置原始碼表: (value: string) => void
  設置編碼預覽數據: (value: any[]) => void
  設置靜態重碼分析結果: (value: any) => void
  設置動態選重分析結果: (value: any) => void
  設置候選個數分析結果: (value: any) => void
  設置速度當量分析結果: (value: any) => void
  設置當量詳情: (value: any) => void
  設置連續文本當量分析結果: (value: any) => void
  設置簡碼效率分析結果: (value: any) => void
  設置鍵位熱力分析結果: (value: any) => void
}

/**
 * 清空所有原子状态
 */
export function 清空所有Atom(setters: AtomSetters) {
  setters.設置碼表數據(null)
  setters.設置原始碼表('')
  setters.設置編碼預覽數據([])
  setters.設置靜態重碼分析結果(null)
  setters.設置動態選重分析結果(null)
  setters.設置候選個數分析結果(null)
  setters.設置速度當量分析結果(null)
  setters.設置當量詳情(null)
  // 連續文本當量必須一併清空：它不會隨碼表變化自動失效，
  // 漏清就會在新方案的頁面上繼續顯示上一個方案的分佈圖
  setters.設置連續文本當量分析結果(null)
  setters.設置簡碼效率分析結果(null)
  setters.設置鍵位熱力分析結果(null)
}

/** 套用方案時還要改當前方案本身，比單純清空多這一個 setter */
export interface 方案應用Setters extends AtomSetters {
  設置當前方案: (value: 方案配置介面 | null) => void
}

/**
 * 把一份方案 JSON（含測評結果）套進所有原子状态
 *
 * 首頁的下拉選單、頂欄的下拉選單、頂欄的「導入」按鈕做的是同一件事，
 * 邏輯抄三份遲早會漏掉某一項結果，所以統一收在這裡。
 *
 * @param 導入數據 方案 JSON 解析後的對象（方案配置 + 可選的 測評結果）
 * @returns 驗證後的方案，以及實際載入到的測評結果名稱（供調用方拼提示語）
 */
export function 應用方案數據(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  導入數據: any,
  setters: 方案應用Setters
): { 方案: 方案配置介面; 已載入結果: string[] } {
  // 先清空，免得上一個方案的結果殘留在這一個方案的頁面上
  清空所有Atom(setters)

  const { 測評結果, ...方案配置 } = 導入數據

  // 驗證方案配置（格式不對會抛出，此時 atom 已清空，不會留下半套狀態）
  const 方案 = 從JSON導入(JSON.stringify(方案配置))
  setters.設置當前方案(方案)

  // 存檔裡的分佈是緊湊格點形式，展開後才能直接餵給圖表
  const 數據中的連續文本當量結果 = 展開連續文本當量結果(測評結果?.連續文本當量)

  const 各項結果: Array<{ 名稱: string; 值: unknown; 寫入: (value: any) => void }> = [
    { 名稱: '靜態重碼分析', 值: 測評結果?.靜態重碼分析, 寫入: setters.設置靜態重碼分析結果 },
    { 名稱: '動態選重分析', 值: 測評結果?.動態選重分析, 寫入: setters.設置動態選重分析結果 },
    { 名稱: '候選個數分析', 值: 測評結果?.候選個數分析, 寫入: setters.設置候選個數分析結果 },
    { 名稱: '速度當量分析', 值: 測評結果?.速度當量分析, 寫入: setters.設置速度當量分析結果 },
    { 名稱: '簡碼效率分析', 值: 測評結果?.簡碼效率分析, 寫入: setters.設置簡碼效率分析結果 },
    { 名稱: '鍵位熱力分析', 值: 測評結果?.鍵位熱力, 寫入: setters.設置鍵位熱力分析結果 },
    {
      名稱: '連續文本當量分析',
      值: 數據中的連續文本當量結果,
      寫入: setters.設置連續文本當量分析結果,
    },
  ]

  const 已載入結果: string[] = []
  for (const { 名稱, 值, 寫入 } of 各項結果) {
    寫入(值 ?? null)
    if (值) 已載入結果.push(名稱)
  }

  return { 方案, 已載入結果 }
}
