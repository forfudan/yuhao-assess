/**
 * 數據加載工具
 *
 * 開發環境：從本地 public/data/ 加載
 * 生産環境：從 GitHub Pages CDN 加載
 */

// 數據倉庫 CDN 地址
const DATA_CDN_URL = 'https://forfudan.github.io/yuhao-assess-data/'

// 根據環境決定數據源
const DATA_BASE_URL = import.meta.env.DEV
  ? '/data/' // 開發：本地文件
  : DATA_CDN_URL // 生産：CDN

/**
 * 加載 JSON 數據文件
 * @param filename 文件名（如 'charFrequencySC.json'）
 */
export async function 加載JSON數據文件<T = any>(filename: string): Promise<T> {
  const url = DATA_BASE_URL + filename

  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`加載失敗: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`無法加載數據文件: ${filename}`, error)
    throw error
  }
}

/**
 * 帶緩存的數據加載（使用 localStorage）
 * @param filename 文件名
 * @param cacheKey 緩存鍵名
 * @param ttl 緩存時間（毫秒），默認 7 天
 */
export async function 帶緩存地加載JSON數據文件<T = any>(
  filename: string,
  cacheKey: string,
  ttl: number = 7 * 24 * 60 * 60 * 1000
): Promise<T> {
  const cacheEntry = localStorage.getItem(cacheKey)

  if (cacheEntry) {
    try {
      const { data, timestamp } = JSON.parse(cacheEntry)

      // 檢查緩存是否過期
      if (Date.now() - timestamp < ttl) {
        console.log(`[緩存命中] ${filename}`)
        return data
      }
    } catch (e) {
      console.warn('緩存解析失敗，重新加載', e)
    }
  }

  // 加載新數據
  const data = await 加載JSON數據文件<T>(filename)

  // 保存到緩存
  localStorage.setItem(
    cacheKey,
    JSON.stringify({
      data,
      timestamp: Date.now(),
    })
  )

  return data
}

/**
 * 預定義的數據文件加載器
 */
export const dataLoaders = {
  /** 知乎字頻數 */
  charAbsoluteFrequencyZhihu: () =>
    帶緩存地加載JSON數據文件('charAbsoluteFrequencyZhihu.json', 'charAbsFreq-zhihu'),

  /** 北語簡體字頻數 */
  charAbsoluteFrequencySC: () =>
    帶緩存地加載JSON數據文件('charAbsoluteFrequencySC.json', 'charAbsFreq-sc'),

  /** 臺灣繁體字頻數 */
  charAbsoluteFrequencyTC: () =>
    帶緩存地加載JSON數據文件('charAbsoluteFrequencyTC.json', 'charAbsFreq-tc'),

  /** 古籍字頻數 */
  charAbsoluteFrequencyGuji: () =>
    帶緩存地加載JSON數據文件('charAbsoluteFrequencyGuji.json', 'charAbsFreq-guji'),

  /** 簡體詞頻數 */
  wordAbsoluteFrequencySC: () =>
    帶緩存地加載JSON數據文件('wordAbsoluteFrequencySC.json', 'wordAbsFreq-sc'),

  /** 字符集 */
  charsets: () => 帶緩存地加載JSON數據文件('charsets.json', 'charsets'),

  /** CJK 區塊 */
  cjkBlocks: () => 加載JSON數據文件('cjkBlocks.json'),

  /** 碼表配置 */
  codeTableConfig: () => 加載JSON數據文件('codeTableConfig.json'),

  /** 等價字表 */
  equivTable: () => 加載JSON數據文件('equivTable.json'),
}

/**
 * 清除所有數據緩存
 */
export function clearDataCache(): void {
  const keys = [
    'charFreq-zhihu',
    'charFreq-sc',
    'charFreq-tc',
    'charFreq-guji',
    'wordFreq-sc',
    'charsets',
  ]

  keys.forEach(key => localStorage.removeItem(key))
  console.log('數據緩存已清除')
}
