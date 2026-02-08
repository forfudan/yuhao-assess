// 導入 Jotai atom
import { getDefaultStore } from 'jotai'
import { 字符集數據原子狀態, CJK區塊數據原子狀態 } from '../atoms/charset'
import type { 字符集數據型别, CJK區塊數據型别 } from '../atoms/charset'
import { 加載JSON數據文件 } from '../utils/data-loader'

// 加載字符集數據（使用 atom 全局緩存）
async function loadCharsetData(): Promise<void> {
  const store = getDefaultStore()
  const existing = store.get(字符集數據原子狀態)
  if (existing) return

  const data = await 加載JSON數據文件<字符集數據型别>('charsets.json')
  store.set(字符集數據原子狀態, data)
}

// 加載CJK區塊數據（使用 atom 全局緩存）
export async function loadCJKBlockData(): Promise<void> {
  const store = getDefaultStore()
  const existing = store.get(CJK區塊數據原子狀態)
  if (existing) return

  // cjkBlocks.json 在 settings 文件夹，不在 data 文件夹
  const response = await fetch('/settings/cjkBlocks.json')
  const CJK區塊數據 = (await response.json()) as CJK區塊數據型别
  store.set(CJK區塊數據原子狀態, CJK區塊數據)
}

// 字符集檢查函數
export async function isInGB2312(char: string): Promise<boolean> {
  await loadCharsetData()
  const store = getDefaultStore()
  const charsetData = store.get(字符集數據原子狀態)
  return charsetData?.[char]?.is_gb2312 ?? false
}

export async function isInGuozi(char: string): Promise<boolean> {
  await loadCharsetData()
  const store = getDefaultStore()
  const charsetData = store.get(字符集數據原子狀態)
  return charsetData?.[char]?.is_guozi ?? false
}

export async function isInTonggui(char: string): Promise<boolean> {
  await loadCharsetData()
  const store = getDefaultStore()
  const charsetData = store.get(字符集數據原子狀態)
  return charsetData?.[char]?.is_tonggui ?? false
}

// CJK Unicode範圍檢查函數 - 使用 atom 獲取數據
export function isInCJKBasic(char: string): boolean {
  const store = getDefaultStore()
  const cjkBlockData = store.get(CJK區塊數據原子狀態)
  if (!cjkBlockData) return false

  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  const block = cjkBlockData.blocks.cjk_basic
  if (!block) return false
  const start = parseInt(block.start, 16)
  const end = parseInt(block.end, 16)
  return codePoint >= start && codePoint <= end
}

export function isInCJKA(char: string): boolean {
  const store = getDefaultStore()
  const cjkBlockData = store.get(CJK區塊數據原子狀態)
  if (!cjkBlockData) return false

  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  const block = cjkBlockData.blocks.cjk_a
  if (!block) return false
  const start = parseInt(block.start, 16)
  const end = parseInt(block.end, 16)
  return codePoint >= start && codePoint <= end
}

export function isInCJKB(char: string): boolean {
  const store = getDefaultStore()
  const cjkBlockData = store.get(CJK區塊數據原子狀態)
  if (!cjkBlockData) return false

  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  const block = cjkBlockData.blocks.cjk_b
  if (!block) return false
  const start = parseInt(block.start, 16)
  const end = parseInt(block.end, 16)
  return codePoint >= start && codePoint <= end
}

export function isInCJKC(char: string): boolean {
  const store = getDefaultStore()
  const cjkBlockData = store.get(CJK區塊數據原子狀態)
  if (!cjkBlockData) return false

  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  const block = cjkBlockData.blocks.cjk_c
  if (!block) return false
  const start = parseInt(block.start, 16)
  const end = parseInt(block.end, 16)
  return codePoint >= start && codePoint <= end
}

export function isInCJKD(char: string): boolean {
  const store = getDefaultStore()
  const cjkBlockData = store.get(CJK區塊數據原子狀態)
  if (!cjkBlockData) return false

  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  const block = cjkBlockData.blocks.cjk_d
  if (!block) return false
  const start = parseInt(block.start, 16)
  const end = parseInt(block.end, 16)
  return codePoint >= start && codePoint <= end
}

export function isInCJKE(char: string): boolean {
  const store = getDefaultStore()
  const cjkBlockData = store.get(CJK區塊數據原子狀態)
  if (!cjkBlockData) return false

  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  const block = cjkBlockData.blocks.cjk_e
  if (!block) return false
  const start = parseInt(block.start, 16)
  const end = parseInt(block.end, 16)
  return codePoint >= start && codePoint <= end
}

export function isInCJKF(char: string): boolean {
  const store = getDefaultStore()
  const cjkBlockData = store.get(CJK區塊數據原子狀態)
  if (!cjkBlockData) return false

  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  const block = cjkBlockData.blocks.cjk_f
  if (!block) return false
  const start = parseInt(block.start, 16)
  const end = parseInt(block.end, 16)
  return codePoint >= start && codePoint <= end
}

export function isInCJKG(char: string): boolean {
  const store = getDefaultStore()
  const cjkBlockData = store.get(CJK區塊數據原子狀態)
  if (!cjkBlockData) return false

  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  const block = cjkBlockData.blocks.cjk_g
  if (!block) return false
  const start = parseInt(block.start, 16)
  const end = parseInt(block.end, 16)
  return codePoint >= start && codePoint <= end
}

export function isInCJKH(char: string): boolean {
  const store = getDefaultStore()
  const cjkBlockData = store.get(CJK區塊數據原子狀態)
  if (!cjkBlockData) return false

  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  const block = cjkBlockData.blocks.cjk_h
  if (!block) return false
  const start = parseInt(block.start, 16)
  const end = parseInt(block.end, 16)
  return codePoint >= start && codePoint <= end
}

export function isInCJKI(char: string): boolean {
  const store = getDefaultStore()
  const cjkBlockData = store.get(CJK區塊數據原子狀態)
  if (!cjkBlockData) return false

  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  const block = cjkBlockData.blocks.cjk_i
  if (!block) return false
  const start = parseInt(block.start, 16)
  const end = parseInt(block.end, 16)
  return codePoint >= start && codePoint <= end
}

export function isInCJKJ(char: string): boolean {
  const store = getDefaultStore()
  const cjkBlockData = store.get(CJK區塊數據原子狀態)
  if (!cjkBlockData) return false

  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  const block = cjkBlockData.blocks.cjk_j
  if (!block) return false
  const start = parseInt(block.start, 16)
  const end = parseInt(block.end, 16)
  return codePoint >= start && codePoint <= end
}

// 累積的CJK範圍檢查函數 - "到X區"
export function isInCJKToBasic(char: string): boolean {
  return isInCJKBasic(char)
}

export function isInCJKToA(char: string): boolean {
  return isInCJKBasic(char) || isInCJKA(char)
}

export function isInCJKToB(char: string): boolean {
  return isInCJKBasic(char) || isInCJKA(char) || isInCJKB(char)
}

export function isInCJKToC(char: string): boolean {
  return isInCJKBasic(char) || isInCJKA(char) || isInCJKB(char) || isInCJKC(char)
}

export function isInCJKToD(char: string): boolean {
  return isInCJKBasic(char) || isInCJKA(char) || isInCJKB(char) || isInCJKC(char) || isInCJKD(char)
}

export function isInCJKToE(char: string): boolean {
  return (
    isInCJKBasic(char) ||
    isInCJKA(char) ||
    isInCJKB(char) ||
    isInCJKC(char) ||
    isInCJKD(char) ||
    isInCJKE(char)
  )
}

export function isInCJKToF(char: string): boolean {
  return (
    isInCJKBasic(char) ||
    isInCJKA(char) ||
    isInCJKB(char) ||
    isInCJKC(char) ||
    isInCJKD(char) ||
    isInCJKE(char) ||
    isInCJKF(char)
  )
}

export function isInCJKToG(char: string): boolean {
  return (
    isInCJKBasic(char) ||
    isInCJKA(char) ||
    isInCJKB(char) ||
    isInCJKC(char) ||
    isInCJKD(char) ||
    isInCJKE(char) ||
    isInCJKF(char) ||
    isInCJKG(char)
  )
}

export function isInCJKToH(char: string): boolean {
  return (
    isInCJKBasic(char) ||
    isInCJKA(char) ||
    isInCJKB(char) ||
    isInCJKC(char) ||
    isInCJKD(char) ||
    isInCJKE(char) ||
    isInCJKF(char) ||
    isInCJKG(char) ||
    isInCJKH(char)
  )
}

export function isInCJKToI(char: string): boolean {
  return (
    isInCJKBasic(char) ||
    isInCJKA(char) ||
    isInCJKB(char) ||
    isInCJKC(char) ||
    isInCJKD(char) ||
    isInCJKE(char) ||
    isInCJKF(char) ||
    isInCJKG(char) ||
    isInCJKH(char) ||
    isInCJKI(char)
  )
}

export function isInCJKToJ(char: string): boolean {
  return (
    isInCJKBasic(char) ||
    isInCJKA(char) ||
    isInCJKB(char) ||
    isInCJKC(char) ||
    isInCJKD(char) ||
    isInCJKE(char) ||
    isInCJKF(char) ||
    isInCJKG(char) ||
    isInCJKH(char) ||
    isInCJKI(char) ||
    isInCJKJ(char)
  )
}

// 字符集檢查器映射
const 細胞漢字集檢查器映射 = {
  GB2312: isInGB2312,
  通用規範: isInTonggui,
  常用國字: isInGuozi,
  CJK基本: isInCJKBasic,
  CJK擴A: isInCJKA,
  CJK擴B: isInCJKB,
  CJK擴C: isInCJKC,
  CJK擴D: isInCJKD,
  CJK擴E: isInCJKE,
  CJK擴F: isInCJKF,
  CJK擴G: isInCJKG,
  CJK擴H: isInCJKH,
  CJK擴I: isInCJKI,
  CJK擴J: isInCJKJ,
}

const 累積漢字集檢查器映射 = {
  GB2312: isInGB2312,
  通用規範: isInTonggui,
  常用國字: isInGuozi,
  CJK基本: isInCJKBasic,
  到CJK擴A: isInCJKToA,
  到CJK擴B: isInCJKToB,
  到CJK擴C: isInCJKToC,
  到CJK擴D: isInCJKToD,
  到CJK擴E: isInCJKToE,
  到CJK擴F: isInCJKToF,
  到CJK擴G: isInCJKToG,
  到CJK擴H: isInCJKToH,
  到CJK擴I: isInCJKToI,
  到CJK擴J: isInCJKToJ,
}

export const 漢字集檢查器映射 = {
  ...細胞漢字集檢查器映射,
  ...累積漢字集檢查器映射,
}

/**
 * 細胞漢字集，指的是單獨的字符集，如 GB2312、CJK基本區、CJK擴展A區等。
 */
export type 細胞漢字集名稱型别 = keyof typeof 細胞漢字集檢查器映射
/**
 * 累積漢字集，指的是從CJK基本區開始，逐步累積擴展區的字符集，外加GB2312等。
 * 如 "GB2312"、"到CJK擴A區"、"到CJK擴B區" 等。
 */
export type 累積漢字集名稱型别 = keyof typeof 累積漢字集檢查器映射
/**
 * 包含所有字符集的聯合型别，既包括細胞漢字集，也包括累積漢字集。
 */
export type 漢字集名稱型别 = keyof typeof 漢字集檢查器映射

// 字符集信息
// TO DEPRECATE
export const charsetInfo: Record<漢字集名稱型别, { name: string; description: string }> = {
  GB2312: { name: 'GB2312', description: 'GB2312 簡體中文字符集' },
  通用規範: { name: '通用規範漢字表', description: '通用規範漢字表' },
  常用國字: { name: '常用國字', description: '常用國字標準字體表' },
  CJK基本: { name: 'CJK基本區', description: 'CJK統一漢字基本區 (U+4E00-U+9FFF)' },
  CJK擴A: { name: 'CJK擴展A區', description: 'CJK統一漢字擴展A區 (U+3400-U+4DBF)' },
  CJK擴B: { name: 'CJK擴展B區', description: 'CJK統一漢字擴展B區 (U+20000-U+2A6DF)' },
  CJK擴C: { name: 'CJK擴展C區', description: 'CJK統一漢字擴展C區 (U+2A700-U+2B73F)' },
  CJK擴D: { name: 'CJK擴展D区', description: 'CJK統一漢字擴展D區 (U+2B740-U+2B81F)' },
  CJK擴E: { name: 'CJK擴展E区', description: 'CJK統一漢字擴展E區 (U+2B820-U+2CEAF)' },
  CJK擴F: { name: 'CJK擴展F区', description: 'CJK統一漢字擴展F區 (U+2CEB0-U+2EBEF)' },
  CJK擴G: { name: 'CJK擴展G区', description: 'CJK統一漢字擴展G區 (U+30000-U+3134F)' },
  CJK擴H: { name: 'CJK擴展H区', description: 'CJK統一漢字擴展H區 (U+31350-U+323AF)' },
  CJK擴I: { name: 'CJK擴展I区', description: 'CJK統一漢字擴展I區 (U+2EBF0-U+2EE5F)' },
  CJK擴J: { name: 'CJK擴展J区', description: 'CJK統一漢字擴展J區 (U+323B0-U+3247B)' },
  到CJK擴A: { name: '到CJK擴A區', description: 'CJK基本區+擴展A區' },
  到CJK擴B: { name: '到CJK擴B區', description: 'CJK基本區+擴展A+B區' },
  到CJK擴C: { name: '到CJK擴C區', description: 'CJK基本區+擴展A+B+C區' },
  到CJK擴D: { name: '到CJK擴D區', description: 'CJK基本區+擴展A+B+C+D區' },
  到CJK擴E: { name: '到CJK擴E區', description: 'CJK基本區+擴展A+B+C+D+E區' },
  到CJK擴F: { name: '到CJK擴F區', description: 'CJK基本區+擴展A+B+C+D+E+F區' },
  到CJK擴G: { name: '到CJK擴G區', description: 'CJK基本區+擴展A+B+C+D+E+F+G區' },
  到CJK擴H: { name: '到CJK擴H區', description: 'CJK基本區+擴展A+B+C+D+E+F+G+H區' },
  到CJK擴I: { name: '到CJK擴I區', description: 'CJK基本區+擴展A+B+C+D+E+F+G+H+I區' },
  到CJK擴J: { name: '到CJK擴J區', description: 'CJK基本區+擴展A+B+C+D+E+F+G+H+I+J區' },
}

// 獲取字符集大小的函數
export async function getCharsetSize(charsetType: 漢字集名稱型别): Promise<number> {
  await loadCharsetData()
  const store = getDefaultStore()
  const charsetData = store.get(字符集數據原子狀態)
  if (!charsetData) return 0

  let count = 0
  for (const record of Object.values(charsetData)) {
    switch (charsetType) {
      case 'GB2312':
        if (record.is_gb2312) count++
        break
      case '通用規範':
        if (record.is_tonggui) count++
        break
      case '常用國字':
        if (record.is_guozi) count++
        break
      default:
        break
    }
  }
  return count
}

// 獲取理論字符集大小
export async function getTheoreticalCharsetSize(charsetType: 漢字集名稱型别): Promise<number> {
  await loadCJKBlockData()

  switch (charsetType) {
    case 'GB2312':
    case '通用規範':
    case '常用國字':
      // 對於GB2312、通規和國字，從JSON文件獲取總字符數
      return await getCharsetSize(charsetType)

    case 'CJK基本': {
      const store = getDefaultStore()
      const cjkBlockData = store.get(CJK區塊數據原子狀態)
      if (!cjkBlockData) return 0
      const basicBlock = cjkBlockData.blocks.cjk_basic
      if (!basicBlock) return 0
      return parseInt(basicBlock.end, 16) - parseInt(basicBlock.start, 16) + 1
    }

    case 'CJK擴A': {
      const store = getDefaultStore()
      const cjkBlockData = store.get(CJK區塊數據原子狀態)
      if (!cjkBlockData) return 0
      const aBlock = cjkBlockData.blocks.cjk_a
      if (!aBlock) return 0
      return parseInt(aBlock.end, 16) - parseInt(aBlock.start, 16) + 1
    }

    case 'CJK擴B': {
      const store = getDefaultStore()
      const cjkBlockData = store.get(CJK區塊數據原子狀態)
      if (!cjkBlockData) return 0
      const bBlock = cjkBlockData.blocks.cjk_b
      if (!bBlock) return 0
      return parseInt(bBlock.end, 16) - parseInt(bBlock.start, 16) + 1
    }

    case 'CJK擴C': {
      const store = getDefaultStore()
      const cjkBlockData = store.get(CJK區塊數據原子狀態)
      if (!cjkBlockData) return 0
      const cBlock = cjkBlockData.blocks.cjk_c
      if (!cBlock) return 0
      return parseInt(cBlock.end, 16) - parseInt(cBlock.start, 16) + 1
    }

    case 'CJK擴D': {
      const store = getDefaultStore()
      const cjkBlockData = store.get(CJK區塊數據原子狀態)
      if (!cjkBlockData) return 0
      const dBlock = cjkBlockData.blocks.cjk_d
      if (!dBlock) return 0
      return parseInt(dBlock.end, 16) - parseInt(dBlock.start, 16) + 1
    }

    case 'CJK擴E': {
      const store = getDefaultStore()
      const cjkBlockData = store.get(CJK區塊數據原子狀態)
      if (!cjkBlockData) return 0
      const eBlock = cjkBlockData.blocks.cjk_e
      if (!eBlock) return 0
      return parseInt(eBlock.end, 16) - parseInt(eBlock.start, 16) + 1
    }

    case 'CJK擴F': {
      const store = getDefaultStore()
      const cjkBlockData = store.get(CJK區塊數據原子狀態)
      if (!cjkBlockData) return 0
      const fBlock = cjkBlockData.blocks.cjk_f
      if (!fBlock) return 0
      return parseInt(fBlock.end, 16) - parseInt(fBlock.start, 16) + 1
    }

    case 'CJK擴G': {
      const store = getDefaultStore()
      const cjkBlockData = store.get(CJK區塊數據原子狀態)
      if (!cjkBlockData) return 0
      const gBlock = cjkBlockData.blocks.cjk_g
      if (!gBlock) return 0
      return parseInt(gBlock.end, 16) - parseInt(gBlock.start, 16) + 1
    }

    case 'CJK擴H': {
      const store = getDefaultStore()
      const cjkBlockData = store.get(CJK區塊數據原子狀態)
      if (!cjkBlockData) return 0
      const hBlock = cjkBlockData.blocks.cjk_h
      if (!hBlock) return 0
      return parseInt(hBlock.end, 16) - parseInt(hBlock.start, 16) + 1
    }

    case 'CJK擴I': {
      const store = getDefaultStore()
      const cjkBlockData = store.get(CJK區塊數據原子狀態)
      if (!cjkBlockData) return 0
      const iBlock = cjkBlockData.blocks.cjk_i
      if (!iBlock) return 0
      return parseInt(iBlock.end, 16) - parseInt(iBlock.start, 16) + 1
    }

    case 'CJK擴J': {
      const store = getDefaultStore()
      const cjkBlockData = store.get(CJK區塊數據原子狀態)
      if (!cjkBlockData) return 0
      const jBlock = cjkBlockData.blocks.cjk_j
      if (!jBlock) return 0
      return parseInt(jBlock.end, 16) - parseInt(jBlock.start, 16) + 1
    }

    // 累積字符集
    case '到CJK擴A':
      return (
        (await getTheoreticalCharsetSize('CJK基本')) + (await getTheoreticalCharsetSize('CJK擴A'))
      )

    case '到CJK擴B':
      return (
        (await getTheoreticalCharsetSize('到CJK擴A')) + (await getTheoreticalCharsetSize('CJK擴B'))
      )

    case '到CJK擴C':
      return (
        (await getTheoreticalCharsetSize('到CJK擴B')) + (await getTheoreticalCharsetSize('CJK擴C'))
      )

    case '到CJK擴D':
      return (
        (await getTheoreticalCharsetSize('到CJK擴C')) + (await getTheoreticalCharsetSize('CJK擴D'))
      )

    case '到CJK擴E':
      return (
        (await getTheoreticalCharsetSize('到CJK擴D')) + (await getTheoreticalCharsetSize('CJK擴E'))
      )

    case '到CJK擴F':
      return (
        (await getTheoreticalCharsetSize('到CJK擴E')) + (await getTheoreticalCharsetSize('CJK擴F'))
      )

    case '到CJK擴G':
      return (
        (await getTheoreticalCharsetSize('到CJK擴F')) + (await getTheoreticalCharsetSize('CJK擴G'))
      )

    case '到CJK擴H':
      return (
        (await getTheoreticalCharsetSize('到CJK擴G')) + (await getTheoreticalCharsetSize('CJK擴H'))
      )

    case '到CJK擴I':
      return (
        (await getTheoreticalCharsetSize('到CJK擴H')) + (await getTheoreticalCharsetSize('CJK擴I'))
      )

    case '到CJK擴J':
      return (
        (await getTheoreticalCharsetSize('到CJK擴I')) + (await getTheoreticalCharsetSize('CJK擴J'))
      )

    default:
      console.error(`未知的字符集類型: ${charsetType}`)
      return 0
  }
}

/**
 * 過濾自定義字符集
 * 從一個自定義字符集合中，過濾出存在於預設字符集中的字符。
 * @param 預設字符集，可以是 "gb2312"、"tonggui"、"guozi" 或 CJK 區塊類型
 * @param 自定義字符集
 * @returns 過濾後的字符集
 */
export async function 過濾自定義字符集(
  預設字符集: 漢字集名稱型别,
  自定義字符集: Set<string>
): Promise<Set<string>> {
  const charset = new Set<string>()

  // 對於 gb2312、tonggui 和 guozi，直接從字符集數據中過濾
  if (預設字符集 === 'GB2312' || 預設字符集 === '通用規範' || 預設字符集 === '常用國字') {
    await loadCharsetData()
    const store = getDefaultStore()
    const charsetData = store.get(字符集數據原子狀態)
    if (!charsetData) return charset

    for (const char of 自定義字符集) {
      const record = charsetData[char]
      if (record) {
        if (預設字符集 === 'GB2312' && record.is_gb2312) {
          charset.add(char)
        } else if (預設字符集 === '通用規範' && record.is_tonggui) {
          charset.add(char)
        } else if (預設字符集 === '常用國字' && record.is_guozi) {
          charset.add(char)
        }
      }
    }
  } else {
    // 對於其他字符集，加載CJK塊數據並使用Unicode範圍檢查
    await loadCJKBlockData()
    const checker = 漢字集檢查器映射[預設字符集]
    if (!checker) {
      console.error(`找不到字符集檢查器: ${預設字符集}`)
      return charset
    }

    for (const char of 自定義字符集) {
      if (checker(char)) {
        charset.add(char)
      }
    }
  }

  return charset
}
