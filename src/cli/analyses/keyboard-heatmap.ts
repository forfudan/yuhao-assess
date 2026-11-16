/**
 * 鍵位熱力分析
 * 使用北語簡體字頻計算全碼和簡碼各按鍵的加權使用計數
 *
 * 計數本身走 services/keyboardHeatmapService 的 `計算按鍵計數`，與網頁端同一支。
 * （本檔原先自己實現了一份，理由是「該函數定義在頁面組件内未提取爲 service」；
 * 後來它被提取出來了，而提取出來的那一支會先按方案的 選重鍵表 折算——
 * 自己那一份不折算，於是二重、三重的擊鍵全記在數字鍵 `2`、`3` 上。
 * 虎碼實測：鍵 `2` 佔了 15.6%，而正確的口徑應該記到 `;` 上。）
 */

import { 計算按鍵計數 } from '../../services/keyboardHeatmapService'
import type { 碼表型别, 頻率數據型别 } from '../../types'
import type { 選重鍵表型别 } from '../../types/scheme'
import type { 鍵位熱力分析結果介面 } from '../../atoms/keyboardHeatmap'

export async function analyzeKeyboardHeatmap(
  fullCodeWithSelectionTable: 碼表型别,
  shortCodeWithSelectionTable: 碼表型别,
  charFreq: 頻率數據型别,
  選重鍵表?: 選重鍵表型别
): Promise<鍵位熱力分析結果介面> {
  return {
    全碼: await 計算按鍵計數(fullCodeWithSelectionTable, charFreq, 選重鍵表),
    簡碼: await 計算按鍵計數(shortCodeWithSelectionTable, charFreq, 選重鍵表),
    更新時間: new Date().toISOString(),
  }
}
