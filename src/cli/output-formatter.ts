/**
 * 输出格式化模块
 * 负责将分析结果格式化为 JSON 或 table 格式输出
 */

/**
 * 递归对对象键名按 Unicode 码点字母序排序。
 * 数组元素顺序不变，但数组内每个对象的键名会被排序。
 */
export function sortObjectKeys<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(item => sortObjectKeys(item)) as unknown as T
  }
  if (obj !== null && typeof obj === 'object') {
    const sorted: Record<string, unknown> = {}
    const keys = Object.keys(obj as Record<string, unknown>).sort((a, b) =>
      a < b ? -1 : a > b ? 1 : 0
    )
    for (const key of keys) {
      sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key])
    }
    return sorted as unknown as T
  }
  return obj
}

/**
 * 格式化单个值为 table 格式的字符串：
 * - string：输出原始字符串（不加引号）
 * - number/boolean：输出 JSON 字符串表示
 * - null：输出字面量 "null"
 * - 数组：输出单行 JSON，逗号后加一个空格（如 `["a", "b", "c"]`）
 */
export function formatTableValue(value: unknown): string {
  if (value === null) {
    return 'null'
  }
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    // 输出单行 JSON，逗号后加一个空格
    return JSON.stringify(value).replace(/,(?=\S)/g, ', ')
  }
  // 兜底：其他类型用 JSON.stringify
  return JSON.stringify(value)
}

/**
 * 将嵌套对象展开为 [path, value] 对列表。
 * 数组作为原子值处理（不递归展开数组内容）。
 * 对象递归展开，路径用 "." 连接。
 */
export function flattenToTable(obj: unknown, prefix?: string): Array<[string, string]> {
  const rows: Array<[string, string]> = []

  if (Array.isArray(obj)) {
    // 数组作为原子值处理
    const path = prefix ?? ''
    rows.push([path, formatTableValue(obj)])
    return rows
  }

  if (obj !== null && typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const path = prefix !== undefined && prefix !== '' ? `${prefix}.${key}` : key
      if (Array.isArray(value)) {
        // 数组作为原子值
        rows.push([path, formatTableValue(value)])
      } else if (value !== null && typeof value === 'object') {
        // 递归展开嵌套对象
        rows.push(...flattenToTable(value, path))
      } else {
        // 标量叶节点
        rows.push([path, formatTableValue(value)])
      }
    }
    return rows
  }

  // 顶层为标量（不常见，但处理一下）
  const path = prefix ?? ''
  rows.push([path, formatTableValue(obj)])
  return rows
}

/**
 * 生成最终输出字符串。
 * - JSON 格式：先 sortObjectKeys，再用 2 空格缩进 JSON.stringify
 * - table 格式：先 sortObjectKeys，再 flattenToTable，按路径字母序排序，
 *   输出 `<path>\t<value>` 行（换行符连接）
 */
export function formatOutput(result: unknown, format: 'json' | 'table'): string {
  const sorted = sortObjectKeys(result)

  if (format === 'json') {
    return JSON.stringify(sorted, null, 2)
  }

  // table 格式
  const rows = flattenToTable(sorted)
  rows.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  return rows.map(([path, value]) => `${path}\t${value}`).join('\n')
}
