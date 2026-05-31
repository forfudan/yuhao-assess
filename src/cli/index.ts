/**
 * yuhao-assess CLI 入口
 *
 * 用法：
 *   tsx src/cli/index.ts <码表文件路径> --scheme <方案配置文件路径> [--format json|table]
 */

import { promises as fs } from 'node:fs'
import { extname } from 'node:path'
import { parseArgs, printHelp } from './arg-parser'
import { loadScheme, getCodeTableMeta } from './scheme-loader'
import { initAdapter } from './node-adapter'
import { 碼表處理服務實例 } from '../services/codeTableService'
import { runAllAnalyses } from './analyzer'
import { formatOutput } from './output-formatter'
import type { 方案配置介面 } from '../types/scheme'

// ─── 进度输出（输出到 stderr）────────────────────────────────────────────────

function timestamp(): string {
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return '[' + hh + ':' + mm + ':' + ss + ']'
}

function logProgress(step: string): void {
  process.stderr.write(timestamp() + ' 开始：' + step + '\n')
}

function logStepDone(step: string, ms: number): void {
  process.stderr.write(timestamp() + ' 完成：' + step + ' +' + ms + 'ms\n')
}

// ─── 支持的文件扩展名 ─────────────────────────────────────────────────────────

const SUPPORTED_EXTENSIONS = new Set(['.txt', '.csv', '.tsv', '.yaml', '.yml'])

// ─── 主流程 ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const totalStart = Date.now()

  // 1. 解析参数（只校验 --scheme 必填，码表路径延迟校验）
  let args
  try {
    args = parseArgs(process.argv)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    process.stderr.write('[错误] ' + msg + '\n')
    process.stderr.write('运行 --help 查看使用说明\n')
    process.exit(1)
  }

  if (args.help) {
    printHelp()
    process.exit(0)
  }

  // 2. 加载方案配置
  //    - 文件不存在时：生成模板并 exit(0)，无需码表路径
  //    - 文件存在时：继续后续流程
  let scheme: 方案配置介面
  try {
    scheme = await loadScheme(args.schemePath)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    process.stderr.write('[错误] ' + msg + '\n')
    process.exit(1)
  }

  // 3. scheme 文件存在，现在才校验码表路径
  if (!args.codeTablePath) {
    process.stderr.write(
      '[错误] 缺少必填参数：码表文件路径（位置参数）\n运行 --help 查看使用说明\n'
    )
    process.exit(1)
  }

  // 4. 验证码表文件扩展名
  const ext = extname(args.codeTablePath).toLowerCase()
  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    process.stderr.write(
      '[错误] 不支持的文件格式：' +
        ext +
        '\n支持的格式：' +
        Array.from(SUPPORTED_EXTENSIONS).join('、') +
        '\n'
    )
    process.exit(1)
  }

  // 5. 验证码表文件存在
  try {
    await fs.access(args.codeTablePath)
  } catch {
    process.stderr.write('[错误] 码表文件不存在或不可读：' + args.codeTablePath + '\n')
    process.exit(1)
  }

  // 6. 初始化 Node.js 适配层（注入 Jotai store）
  try {
    await initAdapter()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    process.stderr.write('[错误] 初始化失败：' + msg + '\n')
    process.exit(1)
  }

  // 7. 读取并解析码表文件
  const meta = getCodeTableMeta(scheme)
  let codeTableText: string
  try {
    codeTableText = await fs.readFile(args.codeTablePath, 'utf-8')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    process.stderr.write('[错误] 读取码表文件失败：' + msg + '\n')
    process.exit(1)
  }

  process.stderr.write(timestamp() + ' 解析码表文件...\n')
  let parseResult
  try {
    parseResult = await 碼表處理服務實例.解析原始碼表文本(
      codeTableText,
      meta.分隔符,
      meta.第一列類型
    )
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    process.stderr.write('[错误] 码表解析失败：' + msg + '\n')
    process.exit(1)
  }

  if (!parseResult.rawCodeTable || parseResult.rawCodeTable.size === 0) {
    process.stderr.write('[错误] 码表解析后不包含任何有效字符-编码对，请检查文件格式和分隔符设置\n')
    process.exit(1)
  }

  // 8. 处理码表（生成四张辅助码表）
  let processedCodeTable
  try {
    processedCodeTable = await 碼表處理服務實例.處理原始碼表(parseResult.rawCodeTable, {
      最大碼長: scheme.方案參數.最大碼長,
      編碼終止指示符列表: scheme.方案參數.編碼終止指示符列表,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    process.stderr.write('[错误] 码表处理失败：' + msg + '\n')
    process.exit(1)
  }

  process.stderr.write(
    timestamp() + ' 码表解析完成，共 ' + processedCodeTable.全碼表.size + ' 个字符\n'
  )

  // 9. 执行六项分析
  let analysisResult
  try {
    analysisResult = await runAllAnalyses({
      processedCodeTable,
      maxCodeLength: scheme.方案參數.最大碼長,
      onStepStart: logProgress,
      onStepDone: logStepDone,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    process.stderr.write('[错误] 分析计算失败：' + msg + '\n')
    process.exit(1)
  }

  const totalMs = Date.now() - totalStart
  process.stderr.write(timestamp() + ' 全部分析完成，总耗时 ' + totalMs + 'ms\n')

  // 10. 组装输出数据并写入 stdout 或文件
  const output: 方案配置介面 = {
    ...scheme,
    測評結果: analysisResult,
  }
  const formatted = formatOutput(output, args.format)

  if (args.outputPath) {
    try {
      await fs.writeFile(args.outputPath, formatted + '\n', 'utf-8')
      process.stderr.write('[完成] 结果已写入：' + args.outputPath + '\n')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      process.stderr.write('[错误] 写入输出文件失败：' + msg + '\n')
      process.exit(1)
    }
  } else {
    process.stdout.write(formatted + '\n')
  }
}

// ─── 顶层错误处理 ─────────────────────────────────────────────────────────────

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err)
  process.stderr.write('[错误] ' + msg + '\n')
  process.exit(1)
})
