import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 讀取原始字頻數據
const inputPath = path.join(__dirname, '../public/data/charFrequency.json')
const outputPath = path.join(__dirname, '../public/data/charFrequency.json')

try {
  console.log('正在讀取字頻數據...')
  const rawData = fs.readFileSync(inputPath, 'utf8')
  const charFreq = JSON.parse(rawData)
  
  // 計算總頻數
  const totalCount = Object.values(charFreq).reduce((sum, count) => sum + count, 0)
  console.log(`總字符數量: ${Object.keys(charFreq).length}`)
  console.log(`總頻數: ${totalCount.toLocaleString()}`)
  
  // 標準化頻率：每個字符的頻率 * 1,000,000,000，然後四捨五入為整數
  const normalizedData = {}
  
  for (const [char, count] of Object.entries(charFreq)) {
    const frequency = count / totalCount
    const normalized = Math.round(frequency * 1000000000)
    normalizedData[char] = normalized
  }
  
  // 驗證結果
  const normalizedTotal = Object.values(normalizedData).reduce((sum, count) => sum + count, 0)
  console.log(`標準化後總和: ${normalizedTotal.toLocaleString()}`)
  
  // 顯示前10個字符的變化
  console.log('\n前10個字符的標準化結果:')
  const entries = Object.entries(charFreq).slice(0, 10)
  for (const [char, originalCount] of entries) {
    const originalFreq = originalCount / totalCount
    const normalized = normalizedData[char]
    console.log(`${char}: ${originalCount.toLocaleString()} → ${normalized.toLocaleString()} (頻率: ${(originalFreq * 100).toFixed(6)}%)`)
  }
  
  // 寫入標準化後的數據
  console.log('\n正在保存標準化數據...')
  fs.writeFileSync(outputPath, JSON.stringify(normalizedData, null, 2), 'utf8')
  
  console.log('✅ 字頻數據標準化完成！')
  
} catch (error) {
  console.error('❌ 處理字頻數據時出錯:', error.message)
  process.exit(1)
}
