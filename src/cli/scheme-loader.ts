/**
 * 方案配置加载模块
 *
 * 负责：
 * - 解析 JSONC 格式（JSON with Comments），使用 jsonc-parser 库
 * - 加载并验证方案配置文件
 * - 生成默认方案配置模板（JSONC 格式，含注释）
 * - 提取码表元数据（含默认值填充）
 */

import { promises as fs } from 'node:fs'
import { parse as jsoncParse, type ParseError } from 'jsonc-parser'
import type { 方案配置介面, 方案碼表元數據介面 } from '../types/scheme'

/**
 * 解析 JSONC 文本（JSON with Comments）
 * 使用 jsonc-parser 库，支持 // 单行注释、块注释及尾随逗号。
 *
 * @param text - JSONC 格式的文本
 * @returns 解析后的 JavaScript 值
 * @throws 当文本包含解析错误时抛出包含错误详情的 Error
 */
export function parseJsonc(text: string): unknown {
  const errors: ParseError[] = []
  const result = jsoncParse(text, errors, {
    allowTrailingComma: true,
    allowEmptyContent: false,
    disallowComments: false,
  })

  if (errors.length > 0) {
    const details = errors
      .map(e => `offset ${e.offset}, length ${e.length}, code ${e.error}`)
      .join('; ')
    throw new Error('JSONC 解析错误：' + details)
  }

  return result
}

/**
 * 生成默认方案配置模板（JSONC 格式，含详细注释）
 * 模板中创建时间和更新时间填入当前 ISO 8601 时间。
 *
 * @returns JSONC 格式的模板字符串
 */
export function generateSchemeTemplate(): string {
  const now = new Date().toISOString()
  const lines = [
    '{',
    '  // 方案元数据',
    '  "元數據": {',
    '    // 方案名称，如「靈明」',
    '    "方案名": "",',
    '    // 唯一标识符（通常与文件名一致），如「yuling」',
    '    "標識符": "",',
    '    // 作者姓名（可选）',
    '    "作者": "",',
    '    // 版本号（语义版本），如「1.0.0」',
    '    "版本": "1.0.0",',
    '    // 官网 URL（可选）',
    '    "官網": "",',
    '    // 方案描述（可选）',
    '    "描述": "",',
    '    // 标签列表，如 ["形碼", "前綴碼", "五碼"]（可选）',
    '    "標籤": [],',
    '    // 相关资源链接列表（教程、社群等）（可选）',
    '    "相關資源鏈接": [],',
    '    // 码表下载链接（可选）',
    '    "碼表下載鏈接": "",',
    '    // 创建时间（ISO 8601 格式）',
    '    "創建時間": "' + now + '",',
    '    // 更新时间（ISO 8601 格式）',
    '    "更新時間": "' + now + '"',
    '  },',
    '  // 方案参数',
    '  "方案參數": {',
    '    // 最大编码长度，如 4 或 5',
    '    "最大碼長": 4,',
    '    // 编码终止指示符列表，如 ["a", "o", "e", "i", "u", "_"]（可选）',
    '    "編碼終止指示符列表": [],',
    '    // 选重键是否计入编码长度（默认 false）',
    '    "選重編碼化": false,',
    '    // 是否「出简不出全」（默认 false）',
    '    "出簡不出全": false',
    '  },',
    '  // 码表元数据',
    '  "碼表元數據": {',
    '    // 码表列分隔符，可选值：製表符、空格、逗號、分號',
    '    "分隔符": "製表符",',
    '    // 码表第一列的含义，可选值：字符、編碼',
    '    "第一列類型": "字符"',
    '  }',
    '}',
    '',
  ]
  return lines.join('\n')
}

/**
 * 加载并验证方案配置文件
 *
 * - 若文件不存在：自动生成模板文件，向 stderr 输出提示，然后 process.exit(0)
 * - 若文件存在但内容无效：抛出错误
 * - 若必填字段缺失：抛出说明缺失字段的错误
 *
 * @param filePath - 方案配置文件路径
 * @returns 解析并验证后的方案配置对象
 */
export async function loadScheme(filePath: string): Promise<方案配置介面> {
  let text: string

  try {
    text = await fs.readFile(filePath, 'utf-8')
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === 'ENOENT') {
      const template = generateSchemeTemplate()
      await fs.writeFile(filePath, template, 'utf-8')
      process.stderr.write(
        '[提示] 方案配置文件不存在，已在以下路径生成模板文件，请填写后重新运行：\n  ' +
          filePath +
          '\n'
      )
      process.exit(0)
    }
    throw err
  }

  // 解析 JSONC
  let parsed: unknown
  try {
    parsed = parseJsonc(text)
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err)
    throw new Error('方案配置文件解析失败（' + filePath + '）：' + detail)
  }

  // 验证顶层结构
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('方案配置文件格式错误（' + filePath + '）：顶层必须是 JSON 对象')
  }

  const obj = parsed as Record<string, unknown>

  // 验证必填字段
  const missingFields: string[] = []
  if (typeof obj['元數據'] !== 'object' || obj['元數據'] === null) {
    missingFields.push('元數據')
  }
  if (typeof obj['方案參數'] !== 'object' || obj['方案參數'] === null) {
    missingFields.push('方案參數')
  }

  if (missingFields.length > 0) {
    throw new Error('方案配置文件缺少必填字段（' + filePath + '）：' + missingFields.join('、'))
  }

  return parsed as 方案配置介面
}

/**
 * 从方案配置中提取码表元数据，并填充默认值
 *
 * 默认值：分隔符 = 製表符，第一列類型 = 字符
 *
 * @param scheme - 方案配置对象
 * @returns 填充了默认值的码表元数据
 */
export function getCodeTableMeta(scheme: 方案配置介面): 方案碼表元數據介面 {
  const meta = scheme.碼表元數據
  return {
    分隔符: meta?.分隔符 ?? '製表符',
    第一列類型: meta?.第一列類型 ?? '字符',
    總字符數: meta?.總字符數,
    哈希值: meta?.哈希值,
  }
}

// ─── 工具函数 ────────────────────────────────────────────────────────────────

function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && 'code' in err
}
