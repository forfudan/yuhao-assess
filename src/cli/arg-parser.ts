/**
 * CLI 参数解析模块
 * 使用纯 Node.js 实现，不依赖任何第三方库
 */

export interface CliArgs {
  /** 位置参数：码表文件路径（必填） */
  codeTablePath: string
  /** --scheme <path>：方案配置文件路径（必填） */
  schemePath: string
  /** --format <json|table>：输出格式（默认 'json'） */
  format: 'json' | 'table'
  /** --output <path>：输出文件路径（可选，默认输出到 stdout） */
  outputPath: string | null
  /** --help：显示帮助信息 */
  help: boolean
}

/**
 * 解析命令行参数
 *
 * @param argv - process.argv 数组（通常从第 2 个元素开始为用户参数）
 * @returns 解析后的 CliArgs 对象
 * @throws 当必填参数缺失或参数值无效时抛出错误
 */
export function parseArgs(argv: string[]): CliArgs {
  // argv[0] 是 node/tsx 可执行文件路径，argv[1] 是脚本路径
  // 用户参数从 argv[2] 开始
  const args = argv.slice(2)

  let codeTablePath = ''
  let schemePath = ''
  let format: 'json' | 'table' = 'json'
  let outputPath: string | null = null
  let help = false

  let i = 0
  while (i < args.length) {
    const arg = args[i]
    if (arg === undefined) {
      i++
      continue
    }

    if (arg === '--help' || arg === '-h') {
      help = true
      i++
    } else if (arg === '--scheme') {
      const next = args[i + 1]
      if (i + 1 >= args.length || !next || next.startsWith('-')) {
        throw new Error('--scheme 选项需要一个路径参数')
      }
      schemePath = next
      i += 2
    } else if (arg.startsWith('--scheme=')) {
      schemePath = arg.slice('--scheme='.length)
      if (!schemePath) {
        throw new Error('--scheme 选项需要一个路径参数')
      }
      i++
    } else if (arg === '--format') {
      const next = args[i + 1]
      if (i + 1 >= args.length || !next || next.startsWith('-')) {
        throw new Error('--format 选项需要一个值（json 或 table）')
      }
      if (next !== 'json' && next !== 'table') {
        throw new Error('--format 的值无效：' + next + '，有效值为：json、table')
      }
      format = next
      i += 2
    } else if (arg.startsWith('--format=')) {
      const val = arg.slice('--format='.length)
      if (val !== 'json' && val !== 'table') {
        throw new Error('--format 的值无效：' + val + '，有效值为：json、table')
      }
      format = val
      i++
    } else if (arg === '--output') {
      const next = args[i + 1]
      if (i + 1 >= args.length || !next || next.startsWith('-')) {
        throw new Error('--output 选项需要一个文件路径参数')
      }
      outputPath = next
      i += 2
    } else if (arg.startsWith('--output=')) {
      outputPath = arg.slice('--output='.length)
      if (!outputPath) {
        throw new Error('--output 选项需要一个文件路径参数')
      }
      i++
    } else if (arg.startsWith('-')) {
      throw new Error('未知选项：' + arg)
    } else {
      // 位置参数
      if (codeTablePath) {
        throw new Error('意外的位置参数：' + arg)
      }
      codeTablePath = arg
      i++
    }
  }

  // 如果是 --help，不校验必填参数
  if (help) {
    return { codeTablePath, schemePath, format, help }
  }

  // 只校验 --scheme（码表路径在 index.ts 中延迟校验，因为 scheme 不存在时会生成模板并退出）
  if (!schemePath) {
    throw new Error('缺少必填选项：--scheme <path>')
  }

  return { codeTablePath, schemePath, format, outputPath, help }
}

/**
 * 输出帮助信息到 stdout
 */
export function printHelp(): void {
  const helpText = `用法：tsx src/cli/index.ts <码表文件路径> --scheme <方案配置文件路径> [选项]

参数：
  <码表文件路径>              码表文件路径（必填），支持 .txt、.csv、.tsv、.yaml、.yml 格式

选项：
  --scheme <path>            方案配置文件路径（必填），JSONC 格式
                             若文件不存在，将自动生成带注释的模板文件
  --format <json|table>      输出格式（默认：json）
                               json   — 格式化 JSON，2 空格缩进，键名按 Unicode 码点排序
                               table  — 扁平化键值对，制表符分隔，按路径字母序排序
  --output <path>            输出文件路径（可选，默认输出到 stdout）
  --help, -h                 显示此帮助信息并退出

示例：
  tsx src/cli/index.ts ./rime-ice.dict.yaml --scheme ./my-scheme.jsonc
  tsx src/cli/index.ts ./table.txt --scheme ./scheme.jsonc --format table
  tsx src/cli/index.ts ./table.txt --scheme ./scheme.jsonc --output ./result.json
`
  process.stdout.write(helpText)
}
