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

// CJK Unicode范围检查函数 - 單個區域
export function isInCJKBasic(char: string): boolean {
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  return codePoint >= 0x4E00 && codePoint <= 0x9FFF // CJK基本区
}

export function isInCJKA(char: string): boolean {
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  return codePoint >= 0x3400 && codePoint <= 0x4DBF // CJK擴展A区
}

export function isInCJKB(char: string): boolean {
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  return codePoint >= 0x20000 && codePoint <= 0x2A6DF // CJK擴展B区
}

export function isInCJKC(char: string): boolean {
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  return codePoint >= 0x2A700 && codePoint <= 0x2B73F // CJK擴展C区
}

export function isInCJKD(char: string): boolean {
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  return codePoint >= 0x2B740 && codePoint <= 0x2B81F // CJK擴展D区
}

export function isInCJKE(char: string): boolean {
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  return codePoint >= 0x2B820 && codePoint <= 0x2CEAF // CJK擴展E区
}

export function isInCJKF(char: string): boolean {
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  return codePoint >= 0x2CEB0 && codePoint <= 0x2EBEF // CJK擴展F区
}

export function isInCJKG(char: string): boolean {
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  return codePoint >= 0x30000 && codePoint <= 0x3134F // CJK擴展G区
}

export function isInCJKH(char: string): boolean {
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  return codePoint >= 0x31350 && codePoint <= 0x323AF // CJK擴展H区
}

export function isInCJKI(char: string): boolean {
  const codePoint = char.codePointAt(0)
  if (!codePoint) return false
  return codePoint >= 0x2EBF0 && codePoint <= 0x2EE5F // CJK擴展I区（部首補充）
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

// 字符集检查器映射
export const charsetCheckers = {
  'gb2312': isInGB2312,
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
  'cjk_to_basic': isInCJKToBasic,
  'cjk_to_a': isInCJKToA,
  'cjk_to_b': isInCJKToB,
  'cjk_to_c': isInCJKToC,
  'cjk_to_d': isInCJKToD,
  'cjk_to_e': isInCJKToE,
  'cjk_to_f': isInCJKToF,
  'cjk_to_g': isInCJKToG,
  'cjk_to_h': isInCJKToH,
  'cjk_to_i': isInCJKToI
}

export type CharsetType = keyof typeof charsetCheckers

// 字符集信息
export const charsetInfo: Record<CharsetType, { name: string; description: string }> = {
  'gb2312': { name: 'GB2312', description: 'GB2312 简体中文字符集' },
  'guozi': { name: '常用国字', description: '常用国字标准字体表' },
  'cjk_basic': { name: 'CJK基本区', description: 'CJK统一汉字基本区 (U+4E00-U+9FFF)' },
  'cjk_a': { name: 'CJK擴展A区', description: 'CJK統一漢字擴展A區 (U+3400-U+4DBF)' },
  'cjk_b': { name: 'CJK擴展B区', description: 'CJK統一漢字擴展B區 (U+20000-U+2A6DF)' },
  'cjk_c': { name: 'CJK擴展C区', description: 'CJK統一漢字擴展C區 (U+2A700-U+2B73F)' },
  'cjk_d': { name: 'CJK擴展D区', description: 'CJK統一漢字擴展D區 (U+2B740-U+2B81F)' },
  'cjk_e': { name: 'CJK擴展E区', description: 'CJK統一漢字擴展E區 (U+2B820-U+2CEAF)' },
  'cjk_f': { name: 'CJK擴展F区', description: 'CJK統一漢字擴展F區 (U+2CEB0-U+2EBEF)' },
  'cjk_g': { name: 'CJK擴展G区', description: 'CJK統一漢字擴展G區 (U+30000-U+3134F)' },
  'cjk_h': { name: 'CJK擴展H区', description: 'CJK統一漢字擴展H區 (U+31350-U+323AF)' },
  'cjk_i': { name: 'CJK擴展I区', description: 'CJK統一漢字擴展I區 (U+2EBF0-U+2EE5F)' },
  'cjk_to_basic': { name: '到CJK基本区', description: 'CJK基本區' },
  'cjk_to_a': { name: '到CJK-A区', description: 'CJK基本區+擴展A區' },
  'cjk_to_b': { name: '到CJK-B区', description: 'CJK基本區+擴展A+B區' },
  'cjk_to_c': { name: '到CJK-C区', description: 'CJK基本區+擴展A+B+C區' },
  'cjk_to_d': { name: '到CJK-D区', description: 'CJK基本區+擴展A+B+C+D區' },
  'cjk_to_e': { name: '到CJK-E区', description: 'CJK基本區+擴展A+B+C+D+E區' },
  'cjk_to_f': { name: '到CJK-F区', description: 'CJK基本區+擴展A+B+C+D+E+F區' },
  'cjk_to_g': { name: '到CJK-G区', description: 'CJK基本區+擴展A+B+C+D+E+F+G區' },
  'cjk_to_h': { name: '到CJK-H区', description: 'CJK基本區+擴展A+B+C+D+E+F+G+H區' },
  'cjk_to_i': { name: '到CJK-I区', description: 'CJK基本區+擴展A+B+C+D+E+F+G+H+I區' }
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
  
  // 对于 gb2312 和 guozi，直接从字符集数据中过滤
  if (charsetType === 'gb2312' || charsetType === 'guozi') {
    await loadCharsetData()
    if (!charsetData) return charset
    
    for (const char of allChars) {
      const record = charsetData[char]
      if (record) {
        if (charsetType === 'gb2312' && record.is_gb2312) {
          charset.add(char)
        } else if (charsetType === 'guozi' && record.is_guozi) {
          charset.add(char)
        }
      }
    }
  } else {
    // 对于其他字符集，使用Unicode范围检查
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
