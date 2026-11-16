/**
 * 鍵位熱力分析服務
 *
 * 從頁面中抽出的純計算部分，讓批量重算腳本
 * （scripts/recompute-schemes.mjs）能複用與頁面完全相同的邏輯。
 */

import { calculateKeyCounts } from '@forfudan/yuhao-metrics'

import type { 碼表型别 } from '../types'
import { 默認選重鍵表 } from '../types/scheme'
import type { 選重鍵表型别 } from '../types/scheme'

/**
 * 從碼表和字頻計算某模式的按鍵加權使用計數
 *
 * 算的是 `@forfudan/yuhao-metrics`（Rust → wasm）。本檔從前自己寫了一份，
 * 與庫裏的 `key_counts` 逐條同義——**同一個公式不留兩份**。
 *
 * 選重鍵按方案配置折算後再計數，否則二重、三重的擊鍵
 * 會全部堆在數字排上，與速度當量的口徑對不上。
 * ⚠️ 選重鍵表**一定要顯式傳下去**：庫那邊不給就是不折算，而這裏的缺省是
 * `默認選重鍵表`（2 → `;`、3 → `'`）。
 * @param 碼表 全碼加選重鍵表或簡碼加選重鍵表
 * @param 字頻 字符 → 相對頻率
 * @param 選重鍵表 第 n 選 → 實際按鍵
 * @returns 按鍵 → 加權計數（空格記爲 `space`）
 */
export async function 計算按鍵計數(
  碼表: 碼表型别,
  字頻: Record<string, number>,
  選重鍵表: 選重鍵表型别 = 默認選重鍵表
): Promise<Record<string, number>> {
  return calculateKeyCounts(碼表, 字頻, 選重鍵表)
}
