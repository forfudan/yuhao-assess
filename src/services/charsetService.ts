// 類型定義
type CharsetRecord = {
  is_gb2312: boolean
  is_guozi: boolean
  is_tonggui: boolean
}

type CharsetData = Record<string, CharsetRecord>

type CJKBlockData = {
  version: string
  description: string
  lastUpdated: string
  blocks: Record<string, {
    name: string
    description: string
    start: string
    end: string
    comment: string
    note?: string
  }>
}

// 字符集數據緩存
let charsetData: CharsetData | null = null
let cjkBlockData: CJKBlockData | null = null

// 加載字符集數據
async function loadCharsetData(): Promise<void> {
  if (charsetData) return
  
  try {
    const response = await fetch('/data/charsets.json')
    charsetData = await response.json() as CharsetData
  } catch (error) {
    console.error('Failed to load charset data:', error)
    // 使用空數據作爲後備
    charsetData = {}
  }
}

// 加載CJK區塊數據
async function loadCJKBlockData(): Promise<void> {
  if (cjkBlockData) return
  
  try {
    const response = await fetch('/data/cjkBlocks.json')
    cjkBlockData = await response.json() as CJKBlockData
  } catch (error) {
    console.error('Failed to load CJK block data:', error)
    // 使用空數據作爲後備
    cjkBlockData = { version: '', description: '', lastUpdated: '', blocks: {} }
  }
}

// 字符集檢查函數
export async function isInGB2312(char: string): Promise<boolean> {
  await loadCharsetData()
  return charsetData?.[char]?.is_gb2312 ?? false
}

export async function isInGuozi(char: string): Promise<boolean> {
  await loadCharsetData()
  return charsetData?.[char]?.is_guozi ?? false
}

export async function isInTonggui(char: string): Promise<boolean> {
  await loadCharsetData()
  return charsetData?.[char]?.is_tonggui ?? false
}

// CJK Unicode範圍檢查函數 - 單個區域
export function isInCJKBasic(char: string): boolean {
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  if (!cjkBlockData) return false
  const block = cjkBlockData.blocks.cjk_basic
  if (!block) return false
  const start = parseInt(block.start, 16)
  const end = parseInt(block.end, 16)
  return codePoint >= start && codePoint <= end
}

export function isInCJKA(char: string): boolean {
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  if (!cjkBlockData) return false
  const block = cjkBlockData.blocks.cjk_a
  if (!block) return false
  const start = parseInt(block.start, 16)
  const end = parseInt(block.end, 16)
  return codePoint >= start && codePoint <= end
}

export function isInCJKB(char: string): boolean {
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  if (!cjkBlockData) return false
  const block = cjkBlockData.blocks.cjk_b
  if (!block) return false
  const start = parseInt(block.start, 16)
  const end = parseInt(block.end, 16)
  return codePoint >= start && codePoint <= end
}

export function isInCJKC(char: string): boolean {
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  if (!cjkBlockData) return false
  const block = cjkBlockData.blocks.cjk_c
  if (!block) return false
  const start = parseInt(block.start, 16)
  const end = parseInt(block.end, 16)
  return codePoint >= start && codePoint <= end
}

export function isInCJKD(char: string): boolean {
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  if (!cjkBlockData) return false
  const block = cjkBlockData.blocks.cjk_d
  if (!block) return false
  const start = parseInt(block.start, 16)
  const end = parseInt(block.end, 16)
  return codePoint >= start && codePoint <= end
}

export function isInCJKE(char: string): boolean {
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  if (!cjkBlockData) return false
  const block = cjkBlockData.blocks.cjk_e
  if (!block) return false
  const start = parseInt(block.start, 16)
  const end = parseInt(block.end, 16)
  return codePoint >= start && codePoint <= end
}

export function isInCJKF(char: string): boolean {
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  if (!cjkBlockData) return false
  const block = cjkBlockData.blocks.cjk_f
  if (!block) return false
  const start = parseInt(block.start, 16)
  const end = parseInt(block.end, 16)
  return codePoint >= start && codePoint <= end
}

export function isInCJKG(char: string): boolean {
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  if (!cjkBlockData) return false
  const block = cjkBlockData.blocks.cjk_g
  if (!block) return false
  const start = parseInt(block.start, 16)
  const end = parseInt(block.end, 16)
  return codePoint >= start && codePoint <= end
}

export function isInCJKH(char: string): boolean {
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  if (!cjkBlockData) return false
  const block = cjkBlockData.blocks.cjk_h
  if (!block) return false
  const start = parseInt(block.start, 16)
  const end = parseInt(block.end, 16)
  return codePoint >= start && codePoint <= end
}

export function isInCJKI(char: string): boolean {
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  if (!cjkBlockData) return false
  const block = cjkBlockData.blocks.cjk_i
  if (!block) return false
  const start = parseInt(block.start, 16)
  const end = parseInt(block.end, 16)
  return codePoint >= start && codePoint <= end
}

export function isInCJKJ(char: string): boolean {
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  if (!cjkBlockData) return false
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
  return isInCJKBasic(char) || isInCJKA(char) || isInCJKB(char) || isInCJKC(char) || isInCJKD(char) || isInCJKE(char)
}

export function isInCJKToF(char: string): boolean {
  return isInCJKBasic(char) || isInCJKA(char) || isInCJKB(char) || isInCJKC(char) || isInCJKD(char) || isInCJKE(char) || isInCJKF(char)
}

export function isInCJKToG(char: string): boolean {
  return isInCJKBasic(char) || isInCJKA(char) || isInCJKB(char) || isInCJKC(char) || isInCJKD(char) || isInCJKE(char) || isInCJKF(char) || isInCJKG(char)
}

export function isInCJKToH(char: string): boolean {
  return isInCJKBasic(char) || isInCJKA(char) || isInCJKB(char) || isInCJKC(char) || isInCJKD(char) || isInCJKE(char) || isInCJKF(char) || isInCJKG(char) || isInCJKH(char)
}

export function isInCJKToI(char: string): boolean {
  return isInCJKBasic(char) || isInCJKA(char) || isInCJKB(char) || isInCJKC(char) || isInCJKD(char) || isInCJKE(char) || isInCJKF(char) || isInCJKG(char) || isInCJKH(char) || isInCJKI(char)
}

export function isInCJKToJ(char: string): boolean {
  return isInCJKBasic(char) || isInCJKA(char) || isInCJKB(char) || isInCJKC(char) || isInCJKD(char) || isInCJKE(char) || isInCJKF(char) || isInCJKG(char) || isInCJKH(char) || isInCJKI(char) || isInCJKJ(char)
}

// 字符集檢查器映射
export const charsetCheckers = {
  'gb2312': isInGB2312,
  'tonggui': isInTonggui,
  'guozi': isInGuozi,
  'cjk_basic': isInCJKBasic,
  'cjk_a': isInCJKA,
  'cjk_b': isInCJKB,
  'cjk_c': isInCJKC,
  'cjk_d': isInCJKD,
  'cjk_e': isInCJKE,
  'cjk_f': isInCJKF,
  'cjk_g': isInCJKG,
  'cjk_h': isInCJKH,
  'cjk_i': isInCJKI,
  'cjk_j': isInCJKJ,
  'cjk_to_basic': isInCJKToBasic,
  'cjk_to_a': isInCJKToA,
  'cjk_to_b': isInCJKToB,
  'cjk_to_c': isInCJKToC,
  'cjk_to_d': isInCJKToD,
  'cjk_to_e': isInCJKToE,
  'cjk_to_f': isInCJKToF,
  'cjk_to_g': isInCJKToG,
  'cjk_to_h': isInCJKToH,
  'cjk_to_i': isInCJKToI,
  'cjk_to_j': isInCJKToJ
}

export type CharsetType = keyof typeof charsetCheckers

// 字符集信息
export const charsetInfo: Record<CharsetType, { name: string; description: string }> = {
  'gb2312': { name: 'GB2312', description: 'GB2312 簡體中文字符集' },
  'tonggui': { name: '通用規範漢字表', description: '通用規範漢字表' },
  'guozi': { name: '常用國字', description: '常用國字標準字體表' },
  'cjk_basic': { name: 'CJK基本區', description: 'CJK統一漢字基本區 (U+4E00-U+9FFF)' },
  'cjk_a': { name: 'CJK擴展A區', description: 'CJK統一漢字擴展A區 (U+3400-U+4DBF)' },
  'cjk_b': { name: 'CJK擴展B區', description: 'CJK統一漢字擴展B區 (U+20000-U+2A6DF)' },
  'cjk_c': { name: 'CJK擴展C區', description: 'CJK統一漢字擴展C區 (U+2A700-U+2B73F)' },
  'cjk_d': { name: 'CJK擴展D区', description: 'CJK統一漢字擴展D區 (U+2B740-U+2B81F)' },
  'cjk_e': { name: 'CJK擴展E区', description: 'CJK統一漢字擴展E區 (U+2B820-U+2CEAF)' },
  'cjk_f': { name: 'CJK擴展F区', description: 'CJK統一漢字擴展F區 (U+2CEB0-U+2EBEF)' },
  'cjk_g': { name: 'CJK擴展G区', description: 'CJK統一漢字擴展G區 (U+30000-U+3134F)' },
  'cjk_h': { name: 'CJK擴展H区', description: 'CJK統一漢字擴展H區 (U+31350-U+323AF)' },
  'cjk_i': { name: 'CJK擴展I区', description: 'CJK統一漢字擴展I區 (U+2EBF0-U+2EE5F)' },
  'cjk_j': { name: 'CJK擴展J区', description: 'CJK統一漢字擴展J區 (U+323B0-U+3247B)' },
  'cjk_to_basic': { name: '到CJK基本区', description: 'CJK基本區' },
  'cjk_to_a': { name: '到CJK-A区', description: 'CJK基本區+擴展A區' },
  'cjk_to_b': { name: '到CJK-B区', description: 'CJK基本區+擴展A+B區' },
  'cjk_to_c': { name: '到CJK-C区', description: 'CJK基本區+擴展A+B+C區' },
  'cjk_to_d': { name: '到CJK-D区', description: 'CJK基本區+擴展A+B+C+D區' },
  'cjk_to_e': { name: '到CJK-E区', description: 'CJK基本區+擴展A+B+C+D+E區' },
  'cjk_to_f': { name: '到CJK-F区', description: 'CJK基本區+擴展A+B+C+D+E+F區' },
  'cjk_to_g': { name: '到CJK-G区', description: 'CJK基本區+擴展A+B+C+D+E+F+G區' },
  'cjk_to_h': { name: '到CJK-H区', description: 'CJK基本區+擴展A+B+C+D+E+F+G+H區' },
  'cjk_to_i': { name: '到CJK-I区', description: 'CJK基本區+擴展A+B+C+D+E+F+G+H+I區' },
  'cjk_to_j': { name: '到CJK-J区', description: 'CJK基本區+擴展A+B+C+D+E+F+G+H+I+J區' }
}

// 獲取字符集大小的函數
export async function getCharsetSize(charsetType: CharsetType): Promise<number> {
  await loadCharsetData()
  if (!charsetData) return 0
  
  let count = 0
  for (const record of Object.values(charsetData)) {
    switch (charsetType) {
      case 'gb2312':
        if (record.is_gb2312) count++
        break
      case 'tonggui':
        if (record.is_tonggui) count++
        break
      case 'guozi':
        if (record.is_guozi) count++
        break
      default:
        break
    }
  }
  return count
}

// 獲取理論字符集大小
export async function getTheoreticalCharsetSize(charsetType: CharsetType): Promise<number> {
  await loadCJKBlockData()
  
  switch (charsetType) {
    case 'gb2312':
    case 'tonggui':
    case 'guozi':
      // 對於GB2312、通規和國字，從JSON文件獲取總字符數
      return await getCharsetSize(charsetType)
    
    case 'cjk_basic':
      if (!cjkBlockData) return 0
      const basicBlock = cjkBlockData.blocks.cjk_basic
      if (!basicBlock) return 0
      return parseInt(basicBlock.end, 16) - parseInt(basicBlock.start, 16) + 1
    
    case 'cjk_a':
      if (!cjkBlockData) return 0
      const aBlock = cjkBlockData.blocks.cjk_a
      if (!aBlock) return 0
      return parseInt(aBlock.end, 16) - parseInt(aBlock.start, 16) + 1
    
    case 'cjk_b':
      if (!cjkBlockData) return 0
      const bBlock = cjkBlockData.blocks.cjk_b
      if (!bBlock) return 0
      return parseInt(bBlock.end, 16) - parseInt(bBlock.start, 16) + 1
    
    case 'cjk_c':
      if (!cjkBlockData) return 0
      const cBlock = cjkBlockData.blocks.cjk_c
      if (!cBlock) return 0
      return parseInt(cBlock.end, 16) - parseInt(cBlock.start, 16) + 1
    
    case 'cjk_d':
      if (!cjkBlockData) return 0
      const dBlock = cjkBlockData.blocks.cjk_d
      if (!dBlock) return 0
      return parseInt(dBlock.end, 16) - parseInt(dBlock.start, 16) + 1
    
    case 'cjk_e':
      if (!cjkBlockData) return 0
      const eBlock = cjkBlockData.blocks.cjk_e
      if (!eBlock) return 0
      return parseInt(eBlock.end, 16) - parseInt(eBlock.start, 16) + 1
    
    case 'cjk_f':
      if (!cjkBlockData) return 0
      const fBlock = cjkBlockData.blocks.cjk_f
      if (!fBlock) return 0
      return parseInt(fBlock.end, 16) - parseInt(fBlock.start, 16) + 1
    
    case 'cjk_g':
      if (!cjkBlockData) return 0
      const gBlock = cjkBlockData.blocks.cjk_g
      if (!gBlock) return 0
      return parseInt(gBlock.end, 16) - parseInt(gBlock.start, 16) + 1
    
    case 'cjk_h':
      if (!cjkBlockData) return 0
      const hBlock = cjkBlockData.blocks.cjk_h
      if (!hBlock) return 0
      return parseInt(hBlock.end, 16) - parseInt(hBlock.start, 16) + 1
    
    case 'cjk_i':
      if (!cjkBlockData) return 0
      const iBlock = cjkBlockData.blocks.cjk_i
      if (!iBlock) return 0
      return parseInt(iBlock.end, 16) - parseInt(iBlock.start, 16) + 1
    
    case 'cjk_j':
      if (!cjkBlockData) return 0
      const jBlock = cjkBlockData.blocks.cjk_j
      if (!jBlock) return 0
      return parseInt(jBlock.end, 16) - parseInt(jBlock.start, 16) + 1
    
    // 累積字符集
    case 'cjk_to_a':
      return await getTheoreticalCharsetSize('cjk_basic') + await getTheoreticalCharsetSize('cjk_a')
    
    case 'cjk_to_b':
      return await getTheoreticalCharsetSize('cjk_to_a') + await getTheoreticalCharsetSize('cjk_b')
    
    case 'cjk_to_c':
      return await getTheoreticalCharsetSize('cjk_to_b') + await getTheoreticalCharsetSize('cjk_c')
    
    case 'cjk_to_d':
      return await getTheoreticalCharsetSize('cjk_to_c') + await getTheoreticalCharsetSize('cjk_d')
    
    case 'cjk_to_e':
      return await getTheoreticalCharsetSize('cjk_to_d') + await getTheoreticalCharsetSize('cjk_e')
    
    case 'cjk_to_f':
      return await getTheoreticalCharsetSize('cjk_to_e') + await getTheoreticalCharsetSize('cjk_f')
    
    case 'cjk_to_g':
      return await getTheoreticalCharsetSize('cjk_to_f') + await getTheoreticalCharsetSize('cjk_g')
    
    case 'cjk_to_h':
      return await getTheoreticalCharsetSize('cjk_to_g') + await getTheoreticalCharsetSize('cjk_h')
    
    case 'cjk_to_i':
      return await getTheoreticalCharsetSize('cjk_to_h') + await getTheoreticalCharsetSize('cjk_i')

    case 'cjk_to_j':
      return await getTheoreticalCharsetSize('cjk_to_i') + await getTheoreticalCharsetSize('cjk_j')
    
    default:
      console.error(`未知的字符集類型: ${charsetType}`)
      return 0
  }
}

export async function generateCharset(charsetType: CharsetType, allChars: Set<string>): Promise<Set<string>> {
  const charset = new Set<string>()
  
  // 對於 gb2312、tonggui 和 guozi，直接從字符集數據中過濾
  if (charsetType === 'gb2312' || charsetType === 'tonggui' || charsetType === 'guozi') {
    await loadCharsetData()
    if (!charsetData) return charset
    
    for (const char of allChars) {
      const record = charsetData[char]
      if (record) {
        if (charsetType === 'gb2312' && record.is_gb2312) {
          charset.add(char)
        } else if (charsetType === 'tonggui' && record.is_tonggui) {
          charset.add(char)
        } else if (charsetType === 'guozi' && record.is_guozi) {
          charset.add(char)
        }
      }
    }
  } else {
    // 對於其他字符集，加載CJK塊數據並使用Unicode範圍檢查
    await loadCJKBlockData()
    const checker = charsetCheckers[charsetType]
    if (!checker) {
      console.error(`找不到字符集檢查器: ${charsetType}`)
      return charset
    }
    
    for (const char of allChars) {
      if (checker(char)) {
        charset.add(char)
      }
    }
  }
  
  return charset
}
