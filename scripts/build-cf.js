#!/usr/bin/env node
/**
 * Cloudflare Pages 構建模擬腳本
 *
 * 模擬 Cloudflare Pages 環境：
 * 1. 暫時移走 public/data/ 目錄（模擬沒有運行 pnpm fetch 的情況）
 * 2. 運行 tsc 和 vite build
 * 3. 恢復 public/data/ 目錄
 *
 * 用途：在本地測試代碼能否在沒有 public/data/ 的情況下構建成功
 */

import { execSync } from 'child_process'
import { existsSync, renameSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')
const publicDataDir = join(rootDir, 'public/data')
const backupDataDir = join(rootDir, 'public/data.backup')

console.log('🚀 Cloudflare Pages 構建模擬開始...\n')

// 檢查是否存在 public/data 目錄
const hasDataDir = existsSync(publicDataDir)
if (hasDataDir) {
  console.log('📦 暫時移走 public/data/ -> public/data.backup/')
  renameSync(publicDataDir, backupDataDir)
} else {
  console.log('ℹ️  public/data/ 目錄不存在（符合 Cloudflare Pages 環境）')
}

let buildSuccess = false
try {
  console.log('\n🔨 運行 TypeScript 編譯...')
  execSync('pnpm tsc', {
    cwd: rootDir,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' },
  })

  console.log('\n📦 運行 Vite 構建...')
  execSync('pnpm vite build', {
    cwd: rootDir,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' },
  })

  buildSuccess = true
  console.log('\n✅ 構建成功！代碼可以在 Cloudflare Pages 環境中構建。')
} catch (error) {
  console.error('\n❌ 構建失敗！請檢查錯誤信息。')
  buildSuccess = false
} finally {
  // 恢復 public/data 目錄
  if (hasDataDir && existsSync(backupDataDir)) {
    console.log('\n🔄 恢復 public/data/ 目錄...')

    // 如果构建过程中创建了 public/data，先删除它
    if (existsSync(publicDataDir)) {
      execSync(`rm -rf "${publicDataDir}"`, { cwd: rootDir })
    }

    renameSync(backupDataDir, publicDataDir)
    console.log('✅ public/data/ 已恢復')
  }
}

console.log('\n' + '='.repeat(60))
if (buildSuccess) {
  console.log('✅ Cloudflare Pages 構建模擬完成：成功')
  console.log('\n提示：這意味著代碼可以在 Cloudflare Pages 上正常部署')
  process.exit(0)
} else {
  console.log('❌ Cloudflare Pages 構建模擬完成：失敗')
  console.log('\n請修復以上錯誤後再試')
  process.exit(1)
}
