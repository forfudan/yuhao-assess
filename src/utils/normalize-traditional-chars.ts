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
  { tw: '羣', cn: '群', note: '異體' },
  { tw: '峯', cn: '峰', note: '異體' },
  { tw: '脈', cn: '脉', note: '異體' },
  { tw: '貓', cn: '猫', note: '異體' },
  { tw: '廈', cn: '厦', note: '異體' },
  { tw: '蝨', cn: '虱', note: '異體' },
  { tw: '諡', cn: '謚', note: '異體' },
  { tw: '夠', cn: '够', note: '異體' },
  { tw: '別', cn: '别', note: '異體' },
  { tw: '著', cn: '着', note: '異體' },
  { tw: '裡', cn: '裏', note: '異體' },
  { tw: '戶', cn: '户', note: '異體' },
  { tw: '沒', cn: '没', note: '異體' },
  { tw: '歿', cn: '殁', note: '異體' },
  { tw: '絕', cn: '絶', note: '異體' },
  { tw: '勻', cn: '匀', note: '異體' },
  { tw: '丟', cn: '丢', note: '異體' },
  { tw: '袞', cn: '衮', note: '異體' },
  { tw: '滾', cn: '滚', note: '異體' },
  { tw: '撐', cn: '撑', note: '異體' },
  { tw: '囪', cn: '囱', note: '異體' },
  { tw: '禿', cn: '秃', note: '異體' },
  { tw: '頹', cn: '頽', note: '異體' },
  { tw: '粵', cn: '粤', note: '異體' },
  { tw: '剎', cn: '刹', note: '異體' },
  { tw: '弒', cn: '弑', note: '異體' },
  { tw: '恥', cn: '耻', note: '異體' },
  { tw: '毀', cn: '毁', note: '異體' },
  { tw: '拋', cn: '抛', note: '異體' },
  { tw: '況', cn: '况', note: '異體' },
  { tw: '罵', cn: '駡', note: '異體' },
  { tw: '荊', cn: '荆', note: '異體' },
  { tw: '蒞', cn: '莅', note: '異體' },
  { tw: '嫺', cn: '嫻', note: '異體' },
  { tw: '溼', cn: '濕', note: '異體' },
  { tw: '祕', cn: '秘', note: '異體' },
  { tw: '抬', cn: '擡', note: '異體' },
  { tw: '奖', cn: '奬', note: '異體' },
  { tw: '詠', cn: '咏', note: '異體' },
  { tw: '啟', cn: '啓', note: '異體' },

  // 立部文部
  { tw: '彥', cn: '彦', note: '立/文' },
  { tw: '顏', cn: '顔', note: '立/文' },
  { tw: '產', cn: '産', note: '立/文' },

  // 䍃部
  { tw: '搖', cn: '摇', note: '䍃部' },
  { tw: '遙', cn: '遥', note: '䍃部' },
  { tw: '瑤', cn: '瑶', note: '䍃部' },
  { tw: '謠', cn: '謡', note: '䍃部' },

  // 兑部
  { tw: '兌', cn: '兑', note: '兑部' },
  { tw: '說', cn: '説', note: '兑部' },
  { tw: '悅', cn: '悦', note: '兑部' },
  { tw: '挩', cn: '捝', note: '兑部' },
  { tw: '敓', cn: '敚', note: '兑部' },
  { tw: '稅', cn: '税', note: '兑部' },
  { tw: '脫', cn: '脱', note: '兑部' },
  { tw: '涗', cn: '涚', note: '兑部' },
  { tw: '梲', cn: '棁', note: '兑部' },
  { tw: '閱', cn: '閲', note: '兑部' },
  { tw: '蛻', cn: '蜕', note: '兑部' },
  { tw: '銳', cn: '鋭', note: '兑部' },

  // 虚部
  { tw: '虛', cn: '虚', note: '虚部' },
  { tw: '噓', cn: '嘘', note: '虚部' },

  // 麽部
  { tw: '麼', cn: '麽', note: '麽部' },
  { tw: '嬤', cn: '嬷', note: '麽部' },
  { tw: '𢣗', cn: '懡', note: '麽部' },

  // 册部
  { tw: '冊', cn: '册', note: '册部' },
  { tw: '刪', cn: '删', note: '册部' },
  { tw: '姍', cn: '姗', note: '册部' },
  { tw: '柵', cn: '栅', note: '册部' },

  // 内部
  { tw: '內', cn: '内', note: '内部' },
  { tw: '吶', cn: '呐', note: '内部' },

  // 爲部
  { tw: '為', cn: '爲', note: '爲部' },
  { tw: '偽', cn: '僞', note: '爲部' },

  // 吴部
  { tw: '吳', cn: '吴', note: '吴部' },

  // 綠部
  { tw: '綠', cn: '緑', note: '綠部' },
  { tw: '錄', cn: '録', note: '綠部' },
  { tw: '剝', cn: '剥', note: '綠部' },

  // 黄部
  { tw: '黃', cn: '黄', note: '黄部' },
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
    console.log('  pnpm exec tsx src/utils/normalize-traditional-chars.ts src/App.vue')
    console.log('  pnpm exec tsx src/utils/normalize-traditional-chars.ts docs/*.md')
    console.log('  pnpm exec tsx src/utils/normalize-traditional-chars.ts src/**/*.ts')
    console.log('')
    console.log(`支持的映射: ${CHAR_MAPPINGS.length} 組字形轉換`)
    process.exit(0)
  }

  // 使用 fast-glob 展開文件模式，排除 src/utils 目錄
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
