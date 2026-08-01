#!/usr/bin/env node
/**
 * 從本地 yuhao-assess-data 文件夾複製數據文件到 public/data/
 * 用於開發環境的本地數據同步
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 本地數據源路徑（假設在同級目錄）
const LOCAL_DATA_SOURCE = path.resolve(__dirname, '../../yuhao-assess-data')
const PUBLIC_DIR = path.resolve(__dirname, '../public')

/**
 * 從 builtin-schemes.json 讀取啟用的方案列表
 */
function getEnabledSchemes() {
  const builtinSchemesPath = path.resolve(__dirname, '../public/settings/builtin-schemes.json')

  if (!fs.existsSync(builtinSchemesPath)) {
    console.warn('⚠️  找不到 builtin-schemes.json')
    return []
  }

  try {
    const builtinSchemes = JSON.parse(fs.readFileSync(builtinSchemesPath, 'utf-8'))
    return builtinSchemes.schemes
      .filter(scheme => scheme.enabled)
      .map(scheme => `${scheme.key}.json`)
  } catch (error) {
    console.error('❌ 解析 builtin-schemes.json 失敗:', error.message)
    return []
  }
}

/**
 * 遞歸複製目錄
 */
function copyDir(sourceDir, targetDir) {
  // 確保目標目錄存在
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }

  const entries = fs.readdirSync(sourceDir, { withFileTypes: true })

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name)
    const targetPath = path.join(targetDir, entry.name)

    if (entry.isDirectory()) {
      // 遞歸複製子目錄
      copyDir(sourcePath, targetPath)
    } else {
      // 複製文件
      try {
        const stats = fs.statSync(sourcePath)
        fs.copyFileSync(sourcePath, targetPath)
        const size = (stats.size / 1024).toFixed(2)
        console.log(`✅ 複製: ${entry.name} (${size} KB)`)
      } catch (error) {
        console.error(`❌ 失敗: ${entry.name} - ${error.message}`)
      }
    }
  }
}

/**
 * 主函數
 */
function main() {
  console.log('🚀 從本地複製數據文件...')
  console.log(`📦 源路徑: ${LOCAL_DATA_SOURCE}`)
  console.log('')

  // 檢查源目錄是否存在
  if (!fs.existsSync(LOCAL_DATA_SOURCE)) {
    console.error('❌ 錯誤: 找不到本地數據源目錄')
    console.error(`   路徑: ${LOCAL_DATA_SOURCE}`)
    console.error('')
    console.error('💡 請確保 yuhao-assess-data 文件夾與 yuhao-assess 在同一目錄下')
    process.exit(1)
  }

  // 檢查 data 和 schemes 文件夾是否存在
  const dataSource = path.join(LOCAL_DATA_SOURCE, 'data')
  const schemesSource = path.join(LOCAL_DATA_SOURCE, 'schemes')
  const textsSource = path.join(LOCAL_DATA_SOURCE, 'texts')

  if (!fs.existsSync(dataSource)) {
    console.error('❌ 錯誤: 找不到 data 目錄')
    console.error(`   路徑: ${dataSource}`)
    process.exit(1)
  }

  if (!fs.existsSync(schemesSource)) {
    console.error('❌ 錯誤: 找不到 schemes 目錄')
    console.error(`   路徑: ${schemesSource}`)
    process.exit(1)
  }

  // 確保 public 目錄存在
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true })
  }

  try {
    // 複製 data 文件夾
    console.log('📦 複製 data 文件夾...')
    const dataTarget = path.join(PUBLIC_DIR, 'data')
    copyDir(dataSource, dataTarget)

    console.log('')
    console.log('📦 複製 texts 文件夾...')
    if (fs.existsSync(textsSource)) {
      copyDir(textsSource, path.join(PUBLIC_DIR, 'texts'))
    } else {
      console.warn('⚠️  找不到 texts 目錄，跳過連續文本語料')
    }

    console.log('')
    console.log('📦 複製 schemes 文件夾...')
    const schemesTarget = path.join(PUBLIC_DIR, 'schemes')

    // 確保目標目錄存在
    if (!fs.existsSync(schemesTarget)) {
      fs.mkdirSync(schemesTarget, { recursive: true })
    }

    // 獲取啟用的方案列表
    const enabledSchemes = getEnabledSchemes()
    if (enabledSchemes.length === 0) {
      console.warn('⚠️  沒有找到啟用的方案')
    } else {
      console.log(`   找到 ${enabledSchemes.length} 個啟用的方案`)
      for (const schemeFile of enabledSchemes) {
        const sourcePath = path.join(schemesSource, schemeFile)
        const targetPath = path.join(schemesTarget, schemeFile)

        if (fs.existsSync(sourcePath)) {
          try {
            const stats = fs.statSync(sourcePath)
            fs.copyFileSync(sourcePath, targetPath)
            const size = (stats.size / 1024).toFixed(2)
            console.log(`✅ 複製: ${schemeFile} (${size} KB)`)
          } catch (error) {
            console.error(`❌ 失敗: ${schemeFile} - ${error.message}`)
          }
        } else {
          console.error(`❌ 找不到: ${schemeFile}`)
        }
      }
    }

    console.log('')
    console.log('🎉 所有文件複製完成！')
    console.log('💡 現在可以運行 pnpm run dev 啟動開發服務器')
    process.exit(0)
  } catch (error) {
    console.error('')
    console.error('❌ 複製失敗:', error.message)
    process.exit(1)
  }
}

main()
