/**
 * 連續文本當量分析服務
 *
 * 「連續文本當量」衡量一個方案在成段文本（而非孤立單字）下的擊鍵速度。
 * 做法：把語料映射爲按鍵序列，用蒙特卡洛抽樣截取固定長度的窗口，
 * 逐窗口計算相鄰碼對的平均當量，得到當量的分佈。
 */

import type { 碼表型别 } from '../types'
import { 默認選重鍵表 } from '../types/scheme'
import type { 選重鍵表型别 } from '../types/scheme'
import { 替換選重鍵 } from './speedEquivalentService'

/** 連續文本語料路徑（由 pnpm run fetch / fetchlocal 同步到 public/texts/） */
const 語料路徑 = '/texts/literature.txt'

/** 文本中保留的標點及其對應按鍵 */
const 標點按鍵映射: Record<string, string> = {
  '，': ',',
  '。': '.',
}

/** 單個窗口的計算結果 */
export interface 窗口當量結果介面 {
  /** 窗口的平均當量 */
  當量: number
  /** 窗口內相鄰碼對總數 */
  碼對數: number
  /** 其中能在當量表中查到的碼對數 */
  有效碼對數: number
}

/** 連續文本當量的分佈直方（當量值 → 樣本個數） */
export interface 分佈項介面 {
  當量值: number
  個數: number
}

/** 連續文本當量統計結果 */
export interface 連續文本當量統計介面 {
  /** 有效樣本數 */
  樣本數: number
  平均數: number
  中位數: number
  /** 右側 90% 分位數（VaR）：只有 10% 的樣本比它更慢 */
  九零分位數: number
  /** 右側 90% 條件分位數（CVaR）：超過 90% VaR 的那批樣本的平均值 */
  九零條件分位數: number
  標準差: number
  最小值: number
  最大值: number
  /** 分佈：當量值（保留三位小數）→ 樣本個數，按當量值升序 */
  分佈: 分佈項介面[]
  /** 清洗後語料的字符數（漢字 + 逗號句號） */
  語料字數: number
  /** 窗口長度（字符數） */
  窗口長度: number
  /** 碼表覆蓋不到的語料字符數（未參與計算） */
  未編碼字數: number
  /** 當量表能查到的碼對佔比（0-1） */
  碼對覆蓋率: number
}

/** 蒙特卡洛抽樣參數 */
export interface 抽樣選項介面 {
  /** 窗口長度（連續取多少個字符），默認 100 */
  窗口長度?: number
  /** 抽樣次數，默認 20000 */
  樣本數?: number
  /** 隨機種子，給定後結果可復現 */
  隨機種子?: number
  /** 第 n 選 → 實際按鍵，缺省用 默認選重鍵表 */
  選重鍵表?: 選重鍵表型别
}

/** 語料緩存，避免重複請求 */
let 語料緩存: string | null = null

/**
 * 加載連續文本語料
 */
export async function 加載連續文本(強制重新加載 = false): Promise<string> {
  if (語料緩存 !== null && !強制重新加載) return 語料緩存

  const 響應 = await fetch(語料路徑)
  if (!響應.ok) {
    throw new Error(`加載連續文本語料失敗: HTTP ${響應.status}`)
  }
  語料緩存 = await 響應.text()
  return 語料緩存
}

/**
 * 清洗語料：只保留漢字、逗號和句號，其餘字符一律刪除
 * @param 原始文本 語料原文
 * @returns 只含漢字與「，。」的字符串
 */
export function 清洗連續文本(原始文本: string): string {
  let 結果 = ''
  for (const 字符 of 原始文本) {
    if (標點按鍵映射[字符] !== undefined || /\p{Script=Han}/u.test(字符)) {
      結果 += 字符
    }
  }
  return 結果
}

/**
 * 爲語料中出現的每個字符預先查好按鍵串，避免抽樣時重複查表
 * @param 清洗後文本 只含漢字與「，。」的字符串
 * @param 碼表 全碼加選重鍵表或簡碼加選重鍵表
 * @param 選重鍵表 第 n 選 → 實際按鍵
 * @returns 字符 → 按鍵串的映射，以及碼表覆蓋不到的字符集合
 */
export function 構建字符按鍵映射(
  清洗後文本: string,
  碼表: 碼表型别,
  選重鍵表: 選重鍵表型别 = 默認選重鍵表
): { 按鍵映射: Map<string, string>; 未編碼字符: Set<string> } {
  const 按鍵映射 = new Map<string, string>()
  const 未編碼字符 = new Set<string>()

  for (const 字符 of 清洗後文本) {
    if (按鍵映射.has(字符) || 未編碼字符.has(字符)) continue

    const 標點按鍵 = 標點按鍵映射[字符]
    if (標點按鍵 !== undefined) {
      按鍵映射.set(字符, 標點按鍵)
      continue
    }

    const 編碼 = 碼表.get(字符)?.[0]
    if (編碼) {
      按鍵映射.set(字符, 替換選重鍵(編碼, 選重鍵表))
    } else {
      未編碼字符.add(字符)
    }
  }

  return { 按鍵映射, 未編碼字符 }
}

/**
 * 把一段文本映射爲按鍵序列
 * @param 文本 只含漢字與「，。」的字符串
 * @param 按鍵映射 由 構建字符按鍵映射 得到
 * @returns 只含字母、`,` `.` `/` `;` `_` 和選重數字的按鍵串
 */
export function 文本轉按鍵序列(文本: string, 按鍵映射: Map<string, string>): string {
  let 序列 = ''
  for (const 字符 of 文本) {
    const 按鍵 = 按鍵映射.get(字符)
    if (按鍵 !== undefined) 序列 += 按鍵
  }
  return 序列
}

/**
 * 計算一段按鍵序列的平均速度當量
 *
 * 與 speedEquivalentService 的口徑一致：當量表中查不到的碼對
 * （例如選重鍵數字 2-9）不計入分子分母。
 * @param 按鍵序列 按鍵串
 * @param 當量表 碼對 → 當量值
 */
export function 計算序列當量(按鍵序列: string, 當量表: Record<string, number>): 窗口當量結果介面 {
  let 總當量 = 0
  let 有效碼對數 = 0
  const 碼對數 = Math.max(0, 按鍵序列.length - 1)

  for (let i = 0; i < 碼對數; i++) {
    const 當量值 = 當量表[按鍵序列.substring(i, i + 2)]
    if (當量值 !== undefined) {
      總當量 += 當量值
      有效碼對數++
    }
  }

  return {
    當量: 有效碼對數 > 0 ? 總當量 / 有效碼對數 : 0,
    碼對數,
    有效碼對數,
  }
}

/**
 * 簡單的可復現僞隨機數發生器（mulberry32）
 */
function 創建隨機發生器(種子: number): () => number {
  let 狀態 = 種子 >>> 0
  return () => {
    狀態 = (狀態 + 0x6d2b79f5) >>> 0
    let t = 狀態
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * 蒙特卡洛計算連續文本當量分佈
 *
 * 在清洗後的語料（共 M 字）中隨機取起點 i ∈ [0, M-N]，
 * 截取 [i, i+N) 共 N 個字符，映射爲按鍵序列後計算平均當量。
 * 不足 N 字的尾部不參與計算。
 *
 * @param 清洗後文本 只含漢字與「，。」的字符串
 * @param 碼表 全碼加選重鍵表或簡碼加選重鍵表
 * @param 當量表 碼對 → 當量值
 * @param 選項 抽樣參數
 */
export function 蒙特卡洛連續文本當量(
  清洗後文本: string,
  碼表: 碼表型别,
  當量表: Record<string, number>,
  選項: 抽樣選項介面 = {}
): 連續文本當量統計介面 {
  const 窗口長度 = 選項.窗口長度 ?? 100
  const 樣本數 = 選項.樣本數 ?? 20000
  const 隨機 = 創建隨機發生器(選項.隨機種子 ?? 20260801)

  const M = 清洗後文本.length
  if (M < 窗口長度) {
    throw new Error(`語料僅 ${M} 字，不足一個窗口（${窗口長度} 字）`)
  }

  const { 按鍵映射, 未編碼字符 } = 構建字符按鍵映射(清洗後文本, 碼表, 選項.選重鍵表 ?? 默認選重鍵表)

  // 統計未編碼字數（按出現次數計，而非去重）
  let 未編碼字數 = 0
  if (未編碼字符.size > 0) {
    for (const 字符 of 清洗後文本) {
      if (未編碼字符.has(字符)) 未編碼字數++
    }
  }

  const 起點上限 = M - 窗口長度 // 起點取 [0, 起點上限]
  const 樣本值: number[] = []
  let 累計碼對數 = 0
  let 累計有效碼對數 = 0

  for (let k = 0; k < 樣本數; k++) {
    const 起點 = Math.floor(隨機() * (起點上限 + 1))
    const 窗口文本 = 清洗後文本.substring(起點, 起點 + 窗口長度)
    const 按鍵序列 = 文本轉按鍵序列(窗口文本, 按鍵映射)
    const 結果 = 計算序列當量(按鍵序列, 當量表)

    累計碼對數 += 結果.碼對數
    累計有效碼對數 += 結果.有效碼對數
    if (結果.有效碼對數 > 0) 樣本值.push(結果.當量)
  }

  if (樣本值.length === 0) {
    throw new Error('沒有得到任何有效樣本，請檢查碼表與當量表')
  }

  樣本值.sort((a, b) => a - b)

  const 樣本個數 = 樣本值.length
  const 平均數 = 樣本值.reduce((和, 值) => 和 + 值, 0) / 樣本個數
  const 方差 = 樣本值.reduce((和, 值) => 和 + (值 - 平均數) ** 2, 0) / 樣本個數

  // 分佈：當量值保留三位小數後歸併計數
  const 計數 = new Map<number, number>()
  for (const 值 of 樣本值) {
    const 鍵 = Math.round(值 * 1000) / 1000
    計數.set(鍵, (計數.get(鍵) ?? 0) + 1)
  }
  const 分佈 = [...計數.entries()]
    .map(([當量值, 個數]) => ({ 當量值, 個數 }))
    .sort((a, b) => a.當量值 - b.當量值)

  const 九零分位數 = 取分位數(樣本值, 0.9)

  return {
    樣本數: 樣本個數,
    平均數,
    中位數: 取分位數(樣本值, 0.5),
    九零分位數,
    九零條件分位數: 取條件尾部均值(樣本值, 九零分位數),
    標準差: Math.sqrt(方差),
    最小值: 樣本值[0] as number,
    最大值: 樣本值[樣本個數 - 1] as number,
    分佈,
    語料字數: M,
    窗口長度,
    未編碼字數,
    碼對覆蓋率: 累計碼對數 > 0 ? 累計有效碼對數 / 累計碼對數 : 0,
  }
}

/**
 * 取右尾條件均值（CVaR）：所有不小於門檻值的樣本的平均數
 *
 * 當量越大打得越慢，所以右尾是「最難打的那一批文本」。
 * CVaR 回答的是「碰上這批文本時，平均有多慢」，
 * 比 VaR 只給一個門檻更能反映尾部的嚴重程度。
 * @param 升序樣本 已升序排列的樣本
 * @param 門檻 通常傳 90% 分位數
 */
function 取條件尾部均值(升序樣本: number[], 門檻: number): number {
  // 升序數組中第一個 ≥ 門檻的位置，用二分查找
  let 左 = 0
  let 右 = 升序樣本.length
  while (左 < 右) {
    const 中 = (左 + 右) >> 1
    if ((升序樣本[中] as number) < 門檻) 左 = 中 + 1
    else 右 = 中
  }

  // 尾部爲空時（樣本全部相等）退化爲門檻本身
  if (左 >= 升序樣本.length) return 門檻

  let 和 = 0
  for (let i = 左; i < 升序樣本.length; i++) 和 += 升序樣本[i] as number
  return 和 / (升序樣本.length - 左)
}

/**
 * 取升序數組的分位數（線性插值）
 */
function 取分位數(升序樣本: number[], 分位: number): number {
  const n = 升序樣本.length
  if (n === 0) return 0
  if (n === 1) return 升序樣本[0] as number

  const 位置 = (n - 1) * 分位
  const 下標 = Math.floor(位置)
  const 餘數 = 位置 - 下標
  const 下值 = 升序樣本[下標] as number
  const 上值 = 升序樣本[Math.min(下標 + 1, n - 1)] as number
  return 下值 + (上值 - 下值) * 餘數
}

/** 繪圖用的分箱項 */
export interface 分箱項介面 {
  下界: number
  上界: number
  中心: number
  /** 平滑後的個數（繪柱高用） */
  個數: number
  /** 平滑後的佔比 */
  佔比: number
  /** 未平滑的真實樣本個數（提示框顯示用） */
  原始個數: number
}

/**
 * 把細粒度分佈重新分箱，用於繪圖
 *
 * 樣本值是「0.1 的整數倍之和 ÷ 碼對數」，落在一個間距約 0.1/碼對數 的格點上。
 * 當箱寬不是格點間距的整數倍時，相鄰箱會分到 n 或 n+1 個格點，
 * 直方圖因此出現規則的鋸齒（並非真實的多峰）。所以默認做一次
 * 三角核（1-2-1）平滑，把這種取樣鋸齒抹平，形狀本身不受影響。
 *
 * @param 分佈 由 蒙特卡洛連續文本當量 得到的分佈
 * @param 箱數 目標箱數
 * @param 範圍 繪圖用的統一 x 軸範圍，缺省時取分佈自身的極值
 * @param 平滑 是否做三角核平滑，默認 true
 */
export function 分佈重新分箱(
  分佈: 分佈項介面[],
  箱數: number,
  範圍?: { 最小值: number; 最大值: number },
  平滑 = true
): 分箱項介面[] {
  if (分佈.length === 0) return []

  const 最小值 = 範圍?.最小值 ?? (分佈[0] as 分佈項介面).當量值
  const 最大值 = 範圍?.最大值 ?? (分佈[分佈.length - 1] as 分佈項介面).當量值
  const 跨度 = 最大值 - 最小值
  // 語料極短時分佈可能退化爲單點，給一個最小跨度避免除零
  const 有效跨度 = 跨度 > 1e-9 ? 跨度 : 0.001
  const 箱寬 = 有效跨度 / 箱數

  const 計數 = new Array<number>(箱數).fill(0)
  let 總數 = 0
  for (const { 當量值, 個數 } of 分佈) {
    const 下標 = Math.min(箱數 - 1, Math.max(0, Math.floor((當量值 - 最小值) / 箱寬)))
    計數[下標] = (計數[下標] as number) + 個數
    總數 += 個數
  }

  // 三角核平滑（權重 1-2-1），總量守恆
  const 顯示計數 = 平滑
    ? 計數.map((值, i) => {
        const 左 = 計數[i - 1] ?? 值
        const 右 = 計數[i + 1] ?? 值
        return (左 + 2 * 值 + 右) / 4
      })
    : 計數

  return 顯示計數.map((個數, i) => ({
    下界: 最小值 + i * 箱寬,
    上界: 最小值 + (i + 1) * 箱寬,
    中心: 最小值 + (i + 0.5) * 箱寬,
    個數,
    佔比: 總數 > 0 ? 個數 / 總數 : 0,
    原始個數: 計數[i] as number,
  }))
}
