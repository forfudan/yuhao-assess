# Design Document: yuhao-assess-cli

## Overview

为 yuhao-assess 形码测评网站添加 CLI 工具，使用户能够在命令行环境中对输入法码表进行全套测评分析。

### 核心挑战

现有分析逻辑分散在 `src/atoms/` 和 `src/services/` 中，深度依赖浏览器 API：

- `fetch` — 用于加载 `public/data/` 和 `public/settings/` 下的 JSON 文件
- `localStorage` — 用于 Jotai `atomWithStorage` 的持久化缓存
- `getDefaultStore()` — Jotai 全局 store，用于跨模块共享状态
- Web Crypto API — 用于计算码表哈希

CLI 工具不能修改现有文件，必须通过适配层在 Node.js 环境中提供等价实现。

### 设计决策

**不复用现有 atoms，直接提取计算逻辑**：现有 atoms 的计算逻辑与 Jotai 状态管理深度耦合，在 Node.js 中运行需要 mock 整个 Jotai store。更好的方案是将纯计算逻辑提取为独立函数，在 `src/cli/` 中实现，不修改任何现有文件。

**适配层替代浏览器 API**：在 `src/cli/node-adapter.ts` 中实现 Node.js 版本的数据加载，使用 `fs.promises.readFile` 替代 `fetch`，使用进程内存 Map 替代 `localStorage`。

**直接导入现有服务的纯函数部分**：`codeTableService.ts` 中的 `碼表處理服務` 类本身不依赖浏览器 API（除了通过 `charsetService` 间接依赖），可以在适配层初始化后直接使用。

## Architecture

````mermaid
graph TD
    A[src/cli/index.ts<br/>CLI 入口] --> B[src/cli/arg-parser.ts<br/>参数解析]
    A --> C[src/cli/scheme-loader.ts<br/>方案配置加载]
    A --> D[src/cli/node-adapter.ts<br/>Node.js 适配层]
    A --> E[src/cli/analyzer.ts<br/>分析协调器]
    A --> F[src/cli/output-formatter.ts<br/>输出格式化]

    D --> G[fs.promises.readFile<br/>替代 fetch]
    D --> H[进程内存 Map<br/>替代 localStorage]

    E --> I[src/cli/analyses/<br/>静态重码分析]
    E --> J[src/cli/analyses/<br/>动态选重分析]
    E --> K[src/cli/analyses/<br/>候选个数分析]
    E --> L[src/cli/analyses/<br/>速度当量分析]
    E --> M[src/cli/analyses/<br/>简码效率分析]
    E --> N[src/cli/analyses/<br/>键位热力分析]

    I --> O[src/services/codeTableService.ts<br/>现有服务（只读）]
    I --> P[src/services/charsetService.ts<br/>现有服务（只读）]
```typescript

### 数据流

```mermaid
sequenceDiagram
    participant CLI as index.ts
    participant Adapter as node-adapter.ts
    participant Loader as scheme-loader.ts
    participant Analyzer as analyzer.ts
    participant Output as output-formatter.ts

    CLI->>Adapter: 初始化（注入 fs 读取函数）
    CLI->>Loader: 加载方案配置（JSONC 解析）
    CLI->>Adapter: 加载码表文件
    Adapter->>Adapter: 读取 public/data/ 数据文件
    CLI->>Analyzer: 执行六项分析
    Analyzer->>Adapter: 获取字频/字符集数据
    Analyzer-->>CLI: 返回分析结果
    CLI->>Output: 格式化输出（JSON/table）
    Output-->>CLI: 写入 stdout
```typescript

## Components and Interfaces

### 1. `src/cli/index.ts` — CLI 入口

主入口，负责：
- 解析命令行参数（使用 Node.js 内置 `process.argv`，无需第三方库）
- 协调各模块的初始化和执行顺序
- 处理顶层错误，确保错误信息输出到 stderr 并以退出码 1 退出

```typescript
// 主流程
async function main(): Promise<void>

// 进度输出（输出到 stderr）
function logProgress(step: string): void
function logStepDone(ms: number): void
```typescript

### 2. `src/cli/arg-parser.ts` — 参数解析

```typescript
export interface CliArgs {
  codeTablePath: string        // 位置参数（必填）
  schemePath: string           // --scheme <path>（必填）
  format: 'json' | 'table'    // --format（默认 'json'）
  help: boolean                // --help
}

export function parseArgs(argv: string[]): CliArgs
export function printHelp(): void
```typescript

参数解析使用纯 Node.js 实现，不依赖 `commander` 等第三方库。

### 3. `src/cli/scheme-loader.ts` — 方案配置加载

```typescript
import type { 方案配置介面, 方案碼表元數據介面 } from '../types/scheme'

// 解析 JSONC（去除注释后解析）
export function parseJsonc(text: string): unknown

// 加载并验证方案配置文件
export async function loadScheme(path: string): Promise<方案配置介面>

// 生成默认方案配置模板（JSONC 格式，含注释）
export function generateSchemeTemplate(): string

// 从方案配置中提取码表元数据（含默认值）
export function getCodeTableMeta(scheme: 方案配置介面): Required<方案碼表元數據介面>
```typescript

JSONC 解析策略：使用 `jsonc-parser` 库（Microsoft 出品，VS Code 内置使用的同款库）解析 JSONC 文件。该库已被广泛使用，支持完整的 JSONC 语法，包括单行注释、块注释和尾随逗号。需添加到 `devDependencies`（CLI 工具通过 `tsx` 运行，`devDependencies` 中的包在开发环境可用）。

### 4. `src/cli/node-adapter.ts` — Node.js 适配层

这是整个 CLI 的核心适配模块，解决浏览器 API 依赖问题。

```typescript
import type { 頻率數據型别 } from '../types'
import type { 字符集數據型别, CJK區塊數據型别 } from '../atoms/charset'

// 进程内存缓存（替代 localStorage）
const memoryCache = new Map<string, unknown>()

// 数据文件根目录（相对于 CLI 入口文件定位）
// 使用 import.meta.url 定位到 public/ 目录
export function getPublicDataDir(): string
export function getPublicSettingsDir(): string

// 替代 fetch 的文件读取函数
export async function readJsonFile<T>(filePath: string): Promise<T>

// 字频数据加载（替代 charFrequencyService.ts 中的 Jotai 版本）
export async function loadCharFrequency(
  type: '北語簡體字頻' | '臺標繁體字頻' | '繁簡聯合字頻' | '知乎簡體字頻' | '古籍繁體字頻'
): Promise<頻率數據型别>

// 字符集数据加载（替代 charsetService.ts 中的 Jotai 版本）
export async function loadCharsetData(): Promise<字符集數據型别>
export async function loadCJKBlockData(): Promise<CJK區塊數據型别>

// 当量表加载
export async function loadEquivTable(): Promise<Record<string, number>>

// 初始化适配层（预加载 CJK 区块数据，供 charsetService 使用）
export async function initAdapter(): Promise<void>
```typescript

**关键设计**：`charsetService.ts` 中的 `isInCJKToJ` 等函数通过 `getDefaultStore()` 读取 Jotai atom。适配层需要在调用这些函数前，将数据注入到 Jotai 的默认 store 中。这样可以复用现有的字符集检查逻辑，无需重写。

```typescript
// 将数据注入 Jotai store（使 charsetService 的同步函数可用）
import { getDefaultStore } from 'jotai'
import { 字符集數據原子狀態, CJK區塊數據原子狀態 } from '../atoms/charset'

export async function initAdapter(): Promise<void> {
  const store = getDefaultStore()
  const cjkData = await loadCJKBlockData()
  store.set(CJK區塊數據原子狀態, cjkData)
  const charsetData = await loadCharsetData()
  store.set(字符集數據原子狀態, charsetData)
}
```typescript

### 5. `src/cli/analyses/` — 六项分析模块

每个分析模块导出一个纯异步函数，接受码表和配置，返回对应的结果类型。

#### `static-duplicate.ts` — 静态重码分析

```typescript
import type { 碼表型别 } from '../../types'
import type { 靜態重碼分析結果介面 } from '../../atoms/staticDuplicate'

export async function analyzeStaticDuplicate(
  fullCodeTable: 碼表型别,
  shortCodeTable: 碼表型别
): Promise<靜態重碼分析結果介面>
```typescript

算法：对每个字符集，遍历码表中属于该字符集的字符，统计同一编码下出现多次的情况。

#### `dynamic-duplicate.ts` — 动态选重分析

```typescript
import type { 碼表型别 } from '../../types'
import type { 動態選重分析結果介面 } from '../../atoms/dynamicDuplicate'
import type { 頻率數據型别 } from '../../types'

export async function analyzeDynamicDuplicate(
  fullCodeWithSelectionTable: 碼表型别,
  shortCodeWithSelectionTable: 碼表型别,
  charFrequencies: Record<string, 頻率數據型别>
): Promise<動態選重分析結果介面>
```typescript

算法：按字频对字符排序（或保持原序），模拟输入过程，统计需要选重（编码末尾有数字）的字符的字频之和。

#### `maximum-candidates.ts` — 候选个数分析

```typescript
import type { 碼表型别 } from '../../types'
import type { 最大候選個數分析結果 } from '../../atoms/maximumCandidates'

export async function analyzeMaximumCandidates(
  fullCodeTable: 碼表型别
): Promise<最大候選個數分析結果>
```typescript

算法：对每个字符集，构建编码到字符列表的映射，找出候选数最多的编码。

#### `speed-equivalent.ts` — 速度当量分析

```typescript
import type { 碼表型别 } from '../../types'
import type { 速度當量分析結果介面 } from '../../atoms/speedEquivalent'
import type { 頻率數據型别 } from '../../types'

export async function analyzeSpeedEquivalent(
  fullCodeWithSelectionTable: 碼表型别,
  shortCodeWithSelectionTable: 碼表型别,
  charFrequencies: Record<string, 頻率數據型别>,
  equivTable: Record<string, number>
): Promise<速度當量分析結果介面>
```typescript

算法：对每个字符，查找其编码中每个按键的当量值，按字频加权求和。

#### `short-code-efficiency.ts` — 简码效率分析

```typescript
import type { 碼表型别 } from '../../types'
import type { 簡碼效率分析結果介面 } from '../../atoms/shortCodeEfficiency'
import type { 頻率數據型别 } from '../../types'

const N_VALUES = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000,
                  1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000,
                  6000, 7000, 8000, 9000, 10000, 12000, 15000, 20000, 30000, 50000]

export async function analyzeShortCodeEfficiency(
  shortCodeTable: 碼表型别,
  charFrequencies: Record<string, 頻率數據型别>
): Promise<簡碼效率分析結果介面>
```typescript

算法：按字频降序排列字符，对每个 N 值，取前 N 个字符，计算字频加权平均码长。

#### `keyboard-heatmap.ts` — 键位热力分析

```typescript
import type { 碼表型别 } from '../../types'
import type { 鍵位熱力分析結果介面 } from '../../atoms/keyboardHeatmap'
import type { 頻率數據型别 } from '../../types'

export async function analyzeKeyboardHeatmap(
  fullCodeWithSelectionTable: 碼表型别,
  shortCodeWithSelectionTable: 碼表型别,
  charFrequency: 頻率數據型别
): Promise<鍵位熱力分析結果介面>
```typescript

算法：遍历码表中每个字符的编码，将每个按键字符（小写化，`_` 转为空格）的字频累加到对应按键的计数中。

### 6. `src/cli/output-formatter.ts` — 输出格式化

```typescript
// 递归对对象键名按 Unicode 码点字母序排序
export function sortObjectKeys<T>(obj: T): T

// 将嵌套对象展开为 [path, value] 对列表（table 格式）
export function flattenToTable(obj: unknown, prefix?: string): Array<[string, string]>

// 格式化单个值为 table 格式的字符串
export function formatTableValue(value: unknown): string

// 生成最终输出
export function formatOutput(
  result: unknown,
  format: 'json' | 'table'
): string
```typescript

**table 格式规则**：
- string 值：输出原始字符串（不加引号）
- number/boolean：输出 JSON 字符串表示
- null：输出字面量 `null`
- 数组：输出单行 JSON，逗号后加一个空格（如 `["a", "b", "c"]`）
- 对象：递归展开，路径用 `.` 连接
- 输出行按路径 Unicode 码点字母序排序

### 7. `src/cli/analyzer.ts` — 分析协调器

```typescript
import type { 方案配置介面 } from '../types/scheme'
import type { 方案測評結果介面 } from '../types/scheme'
import type { 碼表型别 } from '../types'
import type { 處理後的碼表結果介面 } from '../types'

export interface AnalyzerOptions {
  scheme: 方案配置介面
  processedCodeTable: 處理後的碼表結果介面
  onStepStart: (step: string) => void
  onStepDone: (ms: number) => void
}

export async function runAllAnalyses(options: AnalyzerOptions): Promise<方案測評結果介面>
```typescript

## Data Models

### 输入数据模型

```typescript
// 码表文件解析后的中间格式（复用现有类型）
type 原始碼表型别 = Map<number, [string, string, number]>
// key: 行索引, value: [字符, 编码, N选位置]

// 处理后的四张码表（复用现有类型）
interface 處理後的碼表結果介面 {
  全碼表: 碼表型别              // 字符 -> [最长编码]
  簡碼表: 碼表型别              // 字符 -> [最短编码]
  全碼加選重鍵表: 碼表型别      // 字符 -> [最长编码+选重键]
  簡碼加選重鍵表: 碼表型别      // 字符 -> [最短编码+选重键]
}
```typescript

### 输出数据模型

输出 JSON 的顶层结构与 `方案配置介面` 完全一致，`测评结果` 字段填入六项分析结果：

```typescript
interface OutputJson extends 方案配置介面 {
  测评结果: {
    静态重码分析: 靜態重碼分析結果介面
    动态选重分析: 動態選重分析結果介面
    候选个数分析: 最大候選個數分析結果
    速度当量分析: 速度當量分析結果介面
    简码效率分析: 簡碼效率分析結果介面
    键位热力: 鍵位熱力分析結果介面
  }
}
```typescript

注意：输出 JSON 的所有对象键名按 Unicode 码点字母序递归排序。

### 默认方案配置模板结构

```jsonc
{
  // 方案元数据
  "元數據": {
    "方案名": "",        // 方案名称，如「靈明」
    "標識符": "",        // 唯一标识符（文件名），如「yuling」
    "作者": "",          // 作者
    "版本": "1.0.0",     // 版本号（语义版本）
    "官網": "",          // 官网 URL
    "描述": "",          // 方案描述
    "標籤": [],          // 标签列表，如 ["形碼", "前綴碼"]
    "創建時間": "",      // ISO 8601 格式
    "更新時間": ""       // ISO 8601 格式
  },
  // 方案参数
  "方案參數": {
    "最大碼長": 4,                    // 最大编码长度
    "編碼終止指示符列表": [],          // 编码终止指示符列表
    "選重編碼化": false,              // 选重键是否计入编码长度
    "出簡不出全": false               // 是否出简不出全
  },
  // 码表元数据
  "碼表元數據": {
    // 分隔符类型，可选值：製表符、空格、逗號、分號
    "分隔符": "製表符",
    // 第一列类型，可选值：字符、編碼
    "第一列類型": "字符"
  }
}
```typescript

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 文件扩展名验证的完备性

*For any* 文件路径字符串，扩展名验证函数应当接受所有支持的扩展名（`.txt`、`.csv`、`.tsv`、`.yaml`、`.yml`，大小写不敏感），拒绝所有不在支持列表中的扩展名，且接受/拒绝的判断与路径中其他部分无关。

> 验证需求：Requirements 1.2

### Property 2: JSONC 解析的注释透明性

*For any* 有效 JSON 对象，将其序列化后在任意位置（键名前后、值前后、行尾、块注释）插入任意合法的 `//` 或 `/* */` 注释，`parseJsonc` 的解析结果应与原始 `JSON.parse` 的结果深度相等。

> 验证需求：Requirements 2.2

### Property 3: 对象键名排序的有序性与幂等性

*For any* 任意深度嵌套的 JSON 对象，`sortObjectKeys` 函数应满足：
1. 每个对象的键名按 Unicode 码点升序排列
2. 对已排序的对象再次排序，结果不变（幂等性）
3. 数组内元素的顺序不变

> 验证需求：Requirements 10.3, 11.5

### Property 4: 静态重码结果的数学不变量

*For any* 有效码表（全码表和简码表），对任意字符集，静态重码分析结果应满足：
1. `重码字数 <= 实际字符数`
2. `重码组数 <= 重码字数`
3. `字集覆盖率 ∈ [0, 1]`
4. `实际字符数 <= 理论字符数`

> 验证需求：Requirements 4.1, 4.2

### Property 5: 动态选重率的范围约束

*For any* 有效码表和字频数据，动态选重分析结果中所有 20 个选重率数值均应在 `[0, 1]` 范围内，且结果对象包含所有 20 个字段（5 种字频 × 2 种模式 × 2 种码表）。

> 验证需求：Requirements 5.1, 5.2

### Property 6: 候选个数与编码列表的一致性

*For any* 有效码表，对任意非空字符集，最大候选个数分析结果应满足：编码列表中每个编码在全码表中恰好有 `最大候选个数` 个不同字符映射到该编码，且不存在其他编码有更多候选字符。

> 验证需求：Requirements 6.1, 6.2

### Property 7: table 格式展开的完备性

*For any* 任意嵌套的 JSON 对象（不含循环引用），`flattenToTable` 展开后的行数应等于所有标量叶节点（string、number、boolean、null）的数量加上所有数组节点的数量（数组作为原子值处理）。

> 验证需求：Requirements 11.2

### Property 8: table 格式值的格式化规则

*For any* 标量值或数组值，`formatTableValue` 应满足：
1. string 值：输出原始字符串（不加引号）
2. number/boolean：输出与 `JSON.stringify` 相同的字符串
3. null：输出字面量 `"null"`
4. 数组：输出单行 JSON，且每个逗号后恰好有一个空格

> 验证需求：Requirements 11.3

## Error Handling

### 错误分类与处理策略

| 错误类型 | 触发条件 | 处理方式 |
| --------- | --------- | --------- |
| 参数缺失 | 未提供码表路径或 `--scheme` | stderr 输出错误信息，退出码 1 |
| 文件不存在 | 码表文件或方案配置文件路径不存在 | stderr 输出含路径的错误信息，退出码 1 |
| 格式不支持 | 码表文件扩展名不在支持列表 | stderr 列出所有支持扩展名，退出码 1 |
| JSONC 解析失败 | 方案配置文件不是有效 JSONC | stderr 输出解析错误详情，退出码 1 |
| 必填字段缺失 | 方案配置缺少 `元數據` 或 `方案參數` | stderr 说明缺失字段，退出码 1 |
| 数据文件缺失 | `public/data/` 或 `public/settings/` 下文件缺失 | stderr 提示运行 `pnpm run fetch`，退出码 1 |
| 码表为空 | 解析后无有效字符-编码对 | stderr 输出错误信息，退出码 1 |
| 方案文件不存在 | `--scheme` 路径不存在 | 生成模板文件，stderr 提示，退出码 0 |
| 未知错误 | 其他运行时错误 | stderr 输出错误信息，退出码 1 |

### 错误信息格式

所有错误信息输出到 stderr，格式为：

```text
[错误] <错误描述>
```typescript

数据文件缺失时额外提示：

```text
[错误] 数据文件缺失: charAbsoluteFrequencySC.json
请运行 pnpm run fetch 下载数据文件
```typescript

### 进度信息格式

```text
[HH:MM:SS] 开始：静态重码分析
[HH:MM:SS] 完成：静态重码分析 +1234ms
...
[HH:MM:SS] 全部分析完成，总耗时 5678ms
```typescript

## Testing Strategy

### 单元测试

针对以下纯函数编写单元测试：

- `parseJsonc`：测试各种注释格式（行注释、块注释、字符串内的注释字符）
- `sortObjectKeys`：测试嵌套对象、数组内对象、空对象
- `flattenToTable` / `formatTableValue`：测试各种值类型和嵌套结构
- 各分析函数：使用小型构造码表测试边界条件（空字符集、单字符、全重码）

### 属性测试

使用 [fast-check](https://github.com/dubzzz/fast-check) 进行属性测试，每个属性测试运行最少 100 次迭代。

**安装**（已在 devDependencies 中，无需新增）：项目已有 `tsx`，可直接运行测试文件。

> 注意：fast-check 需要添加到 devDependencies。但根据需求 13.3，CLI 工具本身不新增依赖；fast-check 仅用于测试，可在测试阶段添加。

每个属性测试用注释标注对应的设计属性：

```typescript
// Feature: yuhao-assess-cli, Property 2: JSONC 解析的注释透明性
test.prop([fc.jsonValue(), fc.array(fc.string())])(
  'parseJsonc ignores comments',
  (obj, comments) => { ... }
)
```typescript

### 集成测试

使用真实的 `public/data/` 数据文件（需先运行 `pnpm run fetch`）：

- 端到端测试：使用示例码表文件运行完整 CLI，验证输出 JSON 结构
- 数据文件加载：验证适配层能正确读取所有必要文件
- 输出格式：验证 JSON 和 table 两种格式的输出符合规范

### 测试文件结构

```text
src/cli/
├── __tests__/
│   ├── arg-parser.test.ts
│   ├── scheme-loader.test.ts      # 含 JSONC 解析属性测试
│   ├── output-formatter.test.ts   # 含键名排序、table 格式属性测试
│   ├── analyses/
│   │   ├── static-duplicate.test.ts   # 含静态重码不变量属性测试
│   │   ├── dynamic-duplicate.test.ts  # 含选重率范围属性测试
│   │   ├── maximum-candidates.test.ts # 含候选数一致性属性测试
│   │   ├── speed-equivalent.test.ts
│   │   ├── short-code-efficiency.test.ts
│   │   └── keyboard-heatmap.test.ts
│   └── integration/
│       └── cli.test.ts
```typescript
````
