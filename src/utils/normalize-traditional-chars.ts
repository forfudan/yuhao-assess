import { readFileSync, writeFileSync, existsSync } from 'fs'
import fg from 'fast-glob'

/**
 * 字形映射表
 */
interface CharMapping {
  /** 台灣字形 */
  tw: string
  /** 大陸通規字形 */
  cn: string
  /** 説明（可選） */
  note?: string
}

/**
 * 文件處理結果
 */
interface ProcessResult {
  /** 文件路徑 */
  filePath: string
  /** 是否修改 */
  modified: boolean
  /** 替換詳情 */
  replacements: Array<{
    from: string
    to: string
    count: number
  }>
}

/**
 * 台灣繁體到大陸通規繁體字映射表
 * 來源：https://github.com/forfudan/GujiCC
 */
const CHAR_MAPPINGS: readonly CharMapping[] = [
  // 異體字
  { tw: '群', cn: '群', note: '異體' },
  { tw: '峰', cn: '峰', note: '異體' },
  { tw: '脉', cn: '脉', note: '異體' },
  { tw: '猫', cn: '猫', note: '異體' },
  { tw: '厦', cn: '厦', note: '異體' },
  { tw: '虱', cn: '虱', note: '異體' },
  { tw: '謚', cn: '謚', note: '異體' },
  { tw: '够', cn: '够', note: '異體' },
  { tw: '别', cn: '别', note: '異體' },
  { tw: '着', cn: '着', note: '異體' },
  { tw: '裏', cn: '裏', note: '異體' },
  { tw: '户', cn: '户', note: '異體' },
  { tw: '没', cn: '没', note: '異體' },
  { tw: '殁', cn: '殁', note: '異體' },
  { tw: '絶', cn: '絶', note: '異體' },
  { tw: '匀', cn: '匀', note: '異體' },
  { tw: '丢', cn: '丢', note: '異體' },
  { tw: '衮', cn: '衮', note: '異體' },
  { tw: '滚', cn: '滚', note: '異體' },
  { tw: '撑', cn: '撑', note: '異體' },
  { tw: '囱', cn: '囱', note: '異體' },
  { tw: '秃', cn: '秃', note: '異體' },
  { tw: '頽', cn: '頽', note: '異體' },
  { tw: '粤', cn: '粤', note: '異體' },
  { tw: '刹', cn: '刹', note: '異體' },
  { tw: '弑', cn: '弑', note: '異體' },
  { tw: '耻', cn: '耻', note: '異體' },
  { tw: '毁', cn: '毁', note: '異體' },
  { tw: '抛', cn: '抛', note: '異體' },
  { tw: '况', cn: '况', note: '異體' },
  { tw: '駡', cn: '駡', note: '異體' },
  { tw: '荆', cn: '荆', note: '異體' },
  { tw: '莅', cn: '莅', note: '異體' },
  { tw: '嫻', cn: '嫻', note: '異體' },
  { tw: '濕', cn: '濕', note: '異體' },
  { tw: '秘', cn: '秘', note: '異體' },
  { tw: '擡', cn: '擡', note: '異體' },
  { tw: '奬', cn: '奬', note: '異體' },
  { tw: '咏', cn: '咏', note: '異體' },
  { tw: '啓', cn: '啓', note: '異體' },

  // 立部文部
  { tw: '彦', cn: '彦', note: '立/文' },
  { tw: '顔', cn: '顔', note: '立/文' },
  { tw: '産', cn: '産', note: '立/文' },

  // 䍃部
  { tw: '摇', cn: '摇', note: '䍃部' },
  { tw: '遥', cn: '遥', note: '䍃部' },
  { tw: '瑶', cn: '瑶', note: '䍃部' },
  { tw: '謡', cn: '謡', note: '䍃部' },

  // 兑部
  { tw: '兑', cn: '兑', note: '兑部' },
  { tw: '説', cn: '説', note: '兑部' },
  { tw: '悦', cn: '悦', note: '兑部' },
  { tw: '捝', cn: '捝', note: '兑部' },
  { tw: '敚', cn: '敚', note: '兑部' },
  { tw: '税', cn: '税', note: '兑部' },
  { tw: '脱', cn: '脱', note: '兑部' },
  { tw: '涚', cn: '涚', note: '兑部' },
  { tw: '棁', cn: '棁', note: '兑部' },
  { tw: '閲', cn: '閲', note: '兑部' },
  { tw: '蜕', cn: '蜕', note: '兑部' },
  { tw: '鋭', cn: '鋭', note: '兑部' },

  // 虚部
  { tw: '虚', cn: '虚', note: '虚部' },
  { tw: '嘘', cn: '嘘', note: '虚部' },

  // 麽部
  { tw: '麽', cn: '麽', note: '麽部' },
  { tw: '嬷', cn: '嬷', note: '麽部' },
  { tw: '懡', cn: '懡', note: '麽部' },

  // 册部
  { tw: '册', cn: '册', note: '册部' },
  { tw: '删', cn: '删', note: '册部' },
  { tw: '姗', cn: '姗', note: '册部' },
  { tw: '栅', cn: '栅', note: '册部' },

  // 内部
  { tw: '内', cn: '内', note: '内部' },
  { tw: '呐', cn: '呐', note: '内部' },

  // 爲部
  { tw: '爲', cn: '爲', note: '爲部' },
  { tw: '僞', cn: '僞', note: '爲部' },

  // 吴部
  { tw: '吴', cn: '吴', note: '吴部' },

  // 緑部
  { tw: '緑', cn: '緑', note: '緑部' },
  { tw: '録', cn: '録', note: '緑部' },
  { tw: '剥', cn: '剥', note: '緑部' },

  // 黄部
  { tw: '黄', cn: '黄', note: '黄部' },
] as const

/**
 * 获取字形映射表
 */
function getCharMappings(): Map<string, string> {
  const charMapping = new Map<string, string>()

  for (const { tw, cn } of CHAR_MAPPINGS) {
    if (tw !== cn) {
      charMapping.set(tw, cn)
    }
  }

  return charMapping
}

/**
 * 處理單個文件
 */
function processFile(filePath: string, charMapping: Map<string, string>): ProcessResult {
  if (!existsSync(filePath)) {
    throw new Error(`文件不存在: ${filePath}`)
  }

  let content = readFileSync(filePath, 'utf-8')
  let modified = false
  const replacements: ProcessResult['replacements'] = []

  for (const [tw, cn] of charMapping) {
    if (content.includes(tw)) {
      // 使用全局正則進行替換並計數
      const regex = new RegExp(escapeRegExp(tw), 'g')
      const matches = content.match(regex)
      const count = matches ? matches.length : 0

      content = content.replaceAll(tw, cn)
      replacements.push({ from: tw, to: cn, count })
      modified = true
    }
  }

  if (modified) {
    writeFileSync(filePath, content, 'utf-8')
  }

  return {
    filePath,
    modified,
    replacements,
  }
}

/**
 * 轉義正則表達式特殊字符
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 主函數
 */
function main(): void {
  const patterns = process.argv.slice(2)

  if (patterns.length === 0) {
    console.log('用法: pnpm exec tsx src/utils/normalize-traditional-chars.ts <文件1> <文件2> ...')
    console.log('')
    console.log('功能: 將臺灣繁體字形統一轉換爲大陸通規字形')
    console.log('')
    console.log('示例:')
    console.log('  pnpm exec tsx src/utils/normalize-traditional-chars.ts src/App.tsx')
    console.log('  pnpm exec tsx src/utils/normalize-traditional-chars.ts docs/*.md')
    console.log('  pnpm exec tsx src/utils/normalize-traditional-chars.ts src/**/*.ts')
    console.log('')
    console.log(`支持的映射: ${CHAR_MAPPINGS.length} 組字形轉換`)
    process.exit(0)
  }

  // 使用 fast-glob 展開文件模式，排除 src/utils 目録
  const allFiles = fg.sync(patterns, {
    absolute: false,
    ignore: ['**/node_modules/**', '**/dist/**', 'src/utils/**'],
  })

  if (allFiles.length === 0) {
    console.log('⚠ 未找到匹配的文件')
    process.exit(0)
  }

  // 加載字形映射表
  const charMapping = getCharMappings()
  console.log(`✓ 已加載 ${charMapping.size} 個字形映射`)
  console.log('')

  // 處理所有文件
  const results: ProcessResult[] = []
  let totalModified = 0

  for (const file of allFiles) {
    try {
      const result = processFile(file, charMapping)
      results.push(result)

      if (result.modified) {
        totalModified++
        console.log(`✓ 字形統一: ${result.filePath}`)
        result.replacements.forEach(({ from, to, count }) => {
          console.log(`  ${from} → ${to} (${count}次)`)
        })
      }
    } catch (error) {
      console.error(`⚠ 處理失敗: ${file}`)
      if (error instanceof Error) {
        console.error(`  ${error.message}`)
      }
    }
  }

  // 輸出總結
  console.log('')
  if (totalModified > 0) {
    console.log(`✓ 共處理 ${allFiles.length} 個文件，修改了 ${totalModified} 個`)
  } else {
    console.log(`✓ 檢查了 ${allFiles.length} 個文件，無需修改`)
  }
}

// 執行主函數
main()
