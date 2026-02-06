#!/usr/bin/env node
/**
 * 從 yuhao-assess-data CDN 下載數據文件到 public/data/
 * 用於開發環境的數據同步
 */

import fs from 'fs'
import path from 'path'
import https from 'https'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const CDN_BASE = 'https://zhuyuhao.com/yuhao-assess-data/'
const DATA_DIR = path.resolve(__dirname, '../public/data')
const SCHEMES_DIR = path.resolve(__dirname, '../public/schemes')

// 需要下載的數據文件列表
const DATA_FILES = [
  'charAbsoluteFrequencyZhihu.json',
  'charAbsoluteFrequencySC.json',
  'charAbsoluteFrequencyTC.json',
  'charAbsoluteFrequencyGuji.json',
  'wordAbsoluteFrequencySC.json',
  'charsets.json',
]

// 需要下載的方案文件列表
const SCHEME_FILES = [
  'schemes/yuhao-joy.json',
  'schemes/yuhao-ming.json',
  'schemes/yuhao-ling.json',
  'schemes/yuhao-star.json',
  'schemes/snow-qingyun.json',
]

/**
 * 下載單個文件
 */
function downloadFile(filename, targetDir) {
  return new Promise((resolve, reject) => {
    const url = CDN_BASE + filename
    const targetPath = path.join(targetDir, path.basename(filename))

    console.log(`📥 下載: ${filename}`)

    https
      .get(url, { followRedirects: true }, (response) => {
        // 处理重定向
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location
          https.get(redirectUrl, (redirectResponse) => {
            if (redirectResponse.statusCode !== 200) {
              reject(new Error(`HTTP ${redirectResponse.statusCode}: ${redirectUrl}`))
              return
            }

            const fileStream = fs.createWriteStream(targetPath)
            redirectResponse.pipe(fileStream)

            fileStream.on('finish', () => {
              fileStream.close()
              const stats = fs.statSync(targetPath)
              const size = (stats.size / 1024).toFixed(2)
              console.log(`✅ 完成: ${filename} (${size} KB)`)
              resolve()
            })
          }).on('error', reject)
          return
        }

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${url}`))
          return
        }

        const fileStream = fs.createWriteStream(targetPath)
        response.pipe(fileStream)

        fileStream.on('finish', () => {
          fileStream.close()
          const stats = fs.statSync(targetPath)
          const size = (stats.size / 1024).toFixed(2)
          console.log(`✅ 完成: ${filename} (${size} KB)`)
          resolve()
        })
      })
      .on('error', (err) => {
        reject(err)
      })
  })
}

/**
 * 主函數
 */
async function main() {
  console.log('🚀 從 CDN 下載數據文件...')
  console.log(`📦 CDN: ${CDN_BASE}`)
  console.log('')

  // 確保目標目錄存在
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    console.log(`✅ 創建目錄: ${DATA_DIR}`)
  }
  if (!fs.existsSync(SCHEMES_DIR)) {
    fs.mkdirSync(SCHEMES_DIR, { recursive: true })
    console.log(`✅ 創建目錄: ${SCHEMES_DIR}`)
  }
  console.log('')

  // 下載所有數據文件
  try {
    console.log('📦 下載數據文件...')
    for (const filename of DATA_FILES) {
      await downloadFile(filename, DATA_DIR)
    }

    console.log('')
    console.log('📦 下載內置方案...')
    for (const filename of SCHEME_FILES) {
      await downloadFile(filename, SCHEMES_DIR)
    }

    console.log('')
    console.log('🎉 所有文件下載完成！')
    console.log('💡 現在可以運行 pnpm run dev 啟動開發服務器')
    process.exit(0) // 顯式退出，避免卡住
  } catch (error) {
    console.error('')
    console.error('❌ 下載失敗:', error.message)
    console.error('')
    console.error('💡 請確保：')
    console.error('   1. yuhao-assess-data 已推送到 GitHub')
    console.error('   2. GitHub Pages 已啟用（Settings → Pages → main branch）')
    console.error('   3. 網絡連接正常')
    process.exit(1)
  }
}

main()
