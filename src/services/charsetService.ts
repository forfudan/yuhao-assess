// 类型定义
type CharsetRecord = {
  is_gb2312: boolean
  is_guozi: boolean
}

type CharsetData = Record<string, CharsetRecord>

// 字符集数据缓存
let charsetData: CharsetData | null = null

// 加载字符集数据
async function loadCharsetData(): Promise<void> {
  if (charsetData) return
  
  try {
    const response = await fetch('/data/charsets.json')
    charsetData = await response.json() as CharsetData
  } catch (error) {
    console.error('Failed to load charset data:', error)
    // 使用空数据作为后备
    charsetData = {}
  }
}

// 字符集检查函数
export async function isInGB2312(char: string): Promise<boolean> {
  await loadCharsetData()
  return charsetData?.[char]?.is_gb2312 ?? false
}

export async function isInGuozi(char: string): Promise<boolean> {
  await loadCharsetData()
  return charsetData?.[char]?.is_guozi ?? false
}

// CJK Unicode范围检查函数
export function isInCJKToBasic(char: string): boolean {
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  return codePoint >= 0x4E00 && codePoint <= 0x9FFF
}

export function isInCJKToA(char: string): boolean {
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  return codePoint >= 0x3400 && codePoint <= 0x4DBF
}

export function isInCJKToB(char: string): boolean {
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  return codePoint >= 0x20000 && codePoint <= 0x2A6DF
}

export function isInCJKToC(char: string): boolean {
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  return codePoint >= 0x2A700 && codePoint <= 0x2B73F
}

export function isInCJKToD(char: string): boolean {
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  return codePoint >= 0x2B740 && codePoint <= 0x2B81F
}

export function isInCJKToE(char: string): boolean {
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  return codePoint >= 0x2B820 && codePoint <= 0x2CEAF
}

export function isInCJKToF(char: string): boolean {
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  return codePoint >= 0x2CEB0 && codePoint <= 0x2EBEF
}

export function isInCJKToG(char: string): boolean {
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  return codePoint >= 0x30000 && codePoint <= 0x3134F
}

export function isInCJKToH(char: string): boolean {
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  return codePoint >= 0x31350 && codePoint <= 0x323AF
}

export function isInCJKToI(char: string): boolean {
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  return codePoint >= 0x2EBF0 && codePoint <= 0x2EE5F
}

// 字符集检查器映射
export const charsetCheckers = {
  'gb2312': isInGB2312,
  'guozi': isInGuozi,
  'cjk_basic': isInCJKToBasic,
  'cjk_a': isInCJKToA,
  'cjk_b': isInCJKToB,
  'cjk_c': isInCJKToC,
  'cjk_d': isInCJKToD,
  'cjk_e': isInCJKToE,
  'cjk_f': isInCJKToF,
  'cjk_g': isInCJKToG,
  'cjk_h': isInCJKToH,
  'cjk_i': isInCJKToI
}

export type CharsetType = keyof typeof charsetCheckers

// 字符集信息
export const charsetInfo: Record<CharsetType, { name: string; description: string }> = {
  'gb2312': { name: 'GB2312', description: 'GB2312 简体中文字符集' },
  'guozi': { name: '常用国字', description: '常用国字标准字体表' },
  'cjk_basic': { name: 'CJK基本区', description: 'CJK统一汉字基本区 (U+4E00-U+9FFF)' },
  'cjk_a': { name: 'CJK-A', description: 'CJK统一汉字扩展A区 (U+3400-U+4DBF)' },
  'cjk_b': { name: 'CJK-B', description: 'CJK统一汉字扩展B区 (U+20000-U+2A6DF)' },
  'cjk_c': { name: 'CJK-C', description: 'CJK统一汉字扩展C区 (U+2A700-U+2B73F)' },
  'cjk_d': { name: 'CJK-D', description: 'CJK统一汉字扩展D区 (U+2B740-U+2B81F)' },
  'cjk_e': { name: 'CJK-E', description: 'CJK统一汉字扩展E区 (U+2B820-U+2CEAF)' },
  'cjk_f': { name: 'CJK-F', description: 'CJK统一汉字扩展F区 (U+2CEB0-U+2EBEF)' },
  'cjk_g': { name: 'CJK-G', description: 'CJK统一汉字扩展G区 (U+30000-U+3134F)' },
  'cjk_h': { name: 'CJK-H', description: 'CJK统一汉字扩展H区 (U+31350-U+323AF)' },
  'cjk_i': { name: 'CJK-I', description: 'CJK统一汉字扩展I区 (U+2EBF0-U+2EE5F)' }
}

// 获取字符集大小的函数
export async function getCharsetSize(charsetType: CharsetType): Promise<number> {
  await loadCharsetData()
  if (!charsetData) return 0
  
  let count = 0
  for (const record of Object.values(charsetData)) {
    switch (charsetType) {
      case 'gb2312':
        if (record.is_gb2312) count++
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

// 生成字符集的函数
export async function generateCharset(charsetType: CharsetType, allChars: Set<string>): Promise<Set<string>> {
  const charset = new Set<string>()
  const checker = charsetCheckers[charsetType]
  
  for (const char of allChars) {
    if (await checker(char)) {
      charset.add(char)
    }
  }
  
  return charset
}
