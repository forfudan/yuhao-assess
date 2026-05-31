# Implementation Plan: yuhao-assess-cli

## Overview

将 yuhao-assess 形码测评网站的分析能力封装为 CLI 工具。实现分为以下阶段：基础工具模块（参数解析、输出格式化）→ Node.js 适配层 → 方案配置加载 → 六项分析模块 → 分析协调器 → CLI 入口与集成。

## Tasks

- [x] 1. 添加 fast-check 测试依赖并配置测试框架
  - 在 `package.json` 的 `devDependencies` 中添加 `fast-check`（用于属性测试）和 `vitest`（测试运行器）
  - 在 `package.json` 的 `scripts` 中添加 `"test": "vitest --run"` 脚本
  - 创建 `vitest.config.ts`，配置测试环境为 `node`，包含 `src/cli/__tests__/**` 路径
  - _Requirements: 13.3（仅 devDependencies，不影响运行时依赖）_

- [x] 2. 实现参数解析模块
  - [x] 2.1 创建 `src/cli/arg-parser.ts`
    - 实现 `CliArgs` 接口（`codeTablePath`、`schemePath`、`format`、`help`）
    - 实现 `parseArgs(argv: string[]): CliArgs`，使用纯 Node.js 解析 `process.argv`，不依赖第三方库
    - 实现 `printHelp(): void`，输出命令格式、所有选项名称、描述和默认值到 stdout
    - 处理 `--help`、`--scheme <path>`、`--format <json|table>` 选项及位置参数
    - _Requirements: 1.1, 2.1, 2.9, 11.1, 11.4, 13.1, 13.4_

  - [ ]\* 2.2 为参数解析编写单元测试
    - 创建 `src/cli/__tests__/arg-parser.test.ts`
    - 测试：缺少位置参数、缺少 `--scheme`、无效 `--format` 值、`--help` 标志
    - 测试：各种合法参数组合的正确解析
    - _Requirements: 1.1, 2.1, 2.9, 11.4_

- [x] 3. 实现输出格式化模块
  - [x] 3.1 创建 `src/cli/output-formatter.ts`
    - 实现 `sortObjectKeys<T>(obj: T): T`，递归对所有对象键名按 Unicode 码点字母序排序，数组元素顺序不变
    - 实现 `formatTableValue(value: unknown): string`，按规则格式化标量值和数组（string 不加引号，number/boolean 用 JSON 表示，null 输出 `"null"`，数组逗号后加空格）
    - 实现 `flattenToTable(obj: unknown, prefix?: string): Array<[string, string]>`，将嵌套对象展开为 `[path, value]` 对列表，数组作为原子值处理
    - 实现 `formatOutput(result: unknown, format: 'json' | 'table'): string`，JSON 格式用 2 空格缩进，table 格式按路径字母序排序后输出 `<path>\t<value>` 行
    - _Requirements: 10.2, 10.3, 11.2, 11.3, 11.5_

  - [ ]\* 3.2 为 `sortObjectKeys` 编写属性测试（Property 3）
    - 创建 `src/cli/__tests__/output-formatter.test.ts`
    - **Property 3: 对象键名排序的有序性与幂等性**
    - **Validates: Requirements 10.3, 11.5**
    - 使用 `fast-check` 生成任意深度嵌套 JSON 对象，验证：每个对象键名按 Unicode 码点升序排列；对已排序对象再次排序结果不变（幂等性）；数组内元素顺序不变

  - [ ]\* 3.3 为 `flattenToTable` 和 `formatTableValue` 编写属性测试（Property 7、Property 8）
    - 在 `src/cli/__tests__/output-formatter.test.ts` 中追加
    - **Property 7: table 格式展开的完备性**
    - **Validates: Requirements 11.2**
    - 使用 `fast-check` 生成任意嵌套 JSON 对象，验证展开后行数等于标量叶节点数加数组节点数
    - **Property 8: table 格式值的格式化规则**
    - **Validates: Requirements 11.3**
    - 验证 string/number/boolean/null/数组各类型的格式化输出符合规范

- [x] 4. 实现 Node.js 适配层
  - [x] 4.1 创建 `src/cli/node-adapter.ts`
    - 使用 `import.meta.url` 定位 `public/` 目录，实现 `getPublicDataDir()` 和 `getPublicSettingsDir()`
    - 实现 `readJsonFile<T>(filePath: string): Promise<T>`，使用 `fs.promises.readFile` 读取 JSON 文件，文件缺失时抛出含文件名的错误并提示运行 `pnpm run fetch`
    - 实现进程内存缓存 `memoryCache`（`Map<string, unknown>`），替代 `localStorage`
    - 实现 `loadCharFrequency(type)` 加载五种字频数据文件（`charAbsoluteFrequencySC.json` 等）
    - 实现 `loadCharsetData()` 和 `loadCJKBlockData()` 加载字符集数据
    - 实现 `loadEquivTable()` 加载 `public/settings/equivTable.json`
    - 实现 `initAdapter()`，将 CJK 区块数据和字符集数据注入 Jotai 默认 store（`getDefaultStore().set(...)`），使现有 `charsetService` 的同步函数可用
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]\* 4.2 为适配层编写单元测试
    - 创建 `src/cli/__tests__/node-adapter.test.ts`
    - 测试：文件路径定位逻辑（mock `import.meta.url`）
    - 测试：缓存命中与未命中行为
    - 测试：文件缺失时的错误信息格式（含 `pnpm run fetch` 提示）
    - _Requirements: 3.3, 3.4, 3.5_

- [x] 5. 实现方案配置加载模块
  - [x] 5.1 创建 `src/cli/scheme-loader.ts`
    - 实现 `parseJsonc(text: string): unknown`，使用正则去除 `//` 单行注释和 `/* */` 块注释（处理字符串内的注释字符转义），然后用 `JSON.parse` 解析
    - 实现 `generateSchemeTemplate(): string`，生成包含所有 `方案配置介面` 字段的 JSONC 模板，每个字段附 `//` 注释，枚举字段（`分隔符`、`第一列類型`）注释中列出所有可选值
    - 实现 `loadScheme(path: string): Promise<方案配置介面>`，读取并解析 JSONC 文件，验证必填字段（`元數據`、`方案參數`），文件不存在时生成模板并以退出码 0 退出
    - 实现 `getCodeTableMeta(scheme: 方案配置介面): Required<方案碼表元數據介面>`，提取码表元数据并填充默认值（`分隔符` 默认 `製表符`，`第一列類型` 默认 `字符`）
    - _Requirements: 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [ ]\* 5.2 为 `parseJsonc` 编写属性测试（Property 2）
    - 创建 `src/cli/__tests__/scheme-loader.test.ts`
    - **Property 2: JSONC 解析的注释透明性**
    - **Validates: Requirements 2.2**
    - 使用 `fast-check` 生成任意有效 JSON 对象，序列化后在任意位置插入合法注释，验证 `parseJsonc` 结果与原始 `JSON.parse` 结果深度相等

  - [ ]\* 5.3 为方案配置加载编写单元测试
    - 在 `src/cli/__tests__/scheme-loader.test.ts` 中追加
    - 测试：有效 JSONC 文件的加载与解析
    - 测试：缺少必填字段时的错误信息
    - 测试：文件不存在时生成模板并退出码 0
    - 测试：生成的模板包含所有枚举值注释
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [x] 6. 检查点 — 确保基础模块测试通过
  - 确保所有测试通过，如有问题请向用户说明。

- [x] 7. 实现静态重码分析模块
  - [x] 7.1 创建 `src/cli/analyses/static-duplicate.ts`
    - 实现 `analyzeStaticDuplicate(fullCodeTable, shortCodeTable): Promise<靜態重碼分析結果介面>`
    - 对全部 14 个字符集分别计算：全码重码组数、简码重码组数、全码重码字数、简码重码字数、实际字符数、理论字符数、字集覆盖率（存储为 [0,1] 浮点数）
    - 使用 `charsetService` 的字符集检查函数（已通过 `initAdapter` 注入数据）
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]\* 7.2 为静态重码分析编写属性测试（Property 4）
    - 创建 `src/cli/__tests__/analyses/static-duplicate.test.ts`
    - **Property 4: 静态重码结果的数学不变量**
    - **Validates: Requirements 4.1, 4.2**
    - 使用 `fast-check` 生成任意有效码表，验证：`重码字数 <= 实际字符数`；`重码组数 <= 重码字数`；`字集覆盖率 ∈ [0, 1]`；`实际字符数 <= 理论字符数`

- [x] 8. 实现动态选重分析模块
  - [x] 8.1 创建 `src/cli/analyses/dynamic-duplicate.ts`
    - 实现 `analyzeDynamicDuplicate(fullCodeWithSelectionTable, shortCodeWithSelectionTable, charFrequencies): Promise<動態選重分析結果介面>`
    - 对 5 种字频（知乎简体、北语简体、台标繁体、古籍繁体、繁简联合）分别计算按字频重排和保持原序两种模式下的全码和简码动态选重率，共 20 个数值
    - 选重判断：编码末尾有数字则需选重，按字频加权累计选重字符的字频之和
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]\* 8.2 为动态选重分析编写属性测试（Property 5）
    - 创建 `src/cli/__tests__/analyses/dynamic-duplicate.test.ts`
    - **Property 5: 动态选重率的范围约束**
    - **Validates: Requirements 5.1, 5.2**
    - 使用 `fast-check` 生成任意有效码表和字频数据，验证所有 20 个选重率数值均在 `[0, 1]` 范围内，且结果对象包含全部 20 个字段

- [x] 9. 实现候选个数分析模块
  - [x] 9.1 创建 `src/cli/analyses/maximum-candidates.ts`
    - 实现 `analyzeMaximumCandidates(fullCodeTable): Promise<最大候選個數分析結果>`
    - 对全部 14 个字符集，构建编码到字符列表的映射，找出候选数最多的编码及对应编码列表
    - 字符集无字符时，最大候选个数记录为 0，编码列表为空数组
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]\* 9.2 为候选个数分析编写属性测试（Property 6）
    - 创建 `src/cli/__tests__/analyses/maximum-candidates.test.ts`
    - **Property 6: 候选个数与编码列表的一致性**
    - **Validates: Requirements 6.1, 6.2**
    - 使用 `fast-check` 生成任意有效码表，验证：编码列表中每个编码恰好有 `最大候选个数` 个不同字符映射到该编码；不存在其他编码有更多候选字符

- [x] 10. 实现速度当量分析模块
  - [x] 10.1 创建 `src/cli/analyses/speed-equivalent.ts`
    - 实现 `analyzeSpeedEquivalent(fullCodeWithSelectionTable, shortCodeWithSelectionTable, charFrequencies, equivTable): Promise<速度當量分析結果介面>`
    - 对 5 种字频分别计算全码速度当量、一级简码速度当量、二级简码速度当量、全部简码速度当量，共 20 个数值
    - 对每个字符，查找其编码中每个按键的当量值（来自 `equivTable`），按字频加权求和
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]\* 10.2 为速度当量分析编写单元测试
    - 创建 `src/cli/__tests__/analyses/speed-equivalent.test.ts`
    - 使用小型构造码表和当量表测试边界条件（空码表、单字符、当量表缺失键）
    - _Requirements: 7.1, 7.2_

- [x] 11. 实现简码效率分析模块
  - [x] 11.1 创建 `src/cli/analyses/short-code-efficiency.ts`
    - 实现 `analyzeShortCodeEfficiency(shortCodeTable, charFrequencies): Promise<簡碼效率分析結果介面>`
    - 对 5 种字频分别计算：按字频降序排列字符，对 28 个 N 值（100 到 50000）计算前 N 个字符的字频加权平均码长（使用 `簡碼表` 中的最短编码）
    - N 值列表：`[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 6000, 7000, 8000, 9000, 10000, 12000, 15000, 20000, 30000, 50000]`
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]\* 11.2 为简码效率分析编写单元测试
    - 创建 `src/cli/__tests__/analyses/short-code-efficiency.test.ts`
    - 使用小型构造码表测试边界条件（字符数少于最小 N 值、全部字符无简码）
    - _Requirements: 8.1, 8.2_

- [x] 12. 实现键位热力分析模块
  - [x] 12.1 创建 `src/cli/analyses/keyboard-heatmap.ts`
    - 实现 `analyzeKeyboardHeatmap(fullCodeWithSelectionTable, shortCodeWithSelectionTable, charFrequency): Promise<鍵位熱力分析結果介面>`
    - 使用北语简体字频，遍历 `全碼加選重鍵表` 和 `簡碼加選重鍵表` 中每个字符的编码
    - 按字频加权累计每个按键字符（小写化，`_` 转为空格）的使用计数，分别生成全码和简码两份 `Record<string, number>`
    - _Requirements: 9.1, 9.2_

  - [ ]\* 12.2 为键位热力分析编写单元测试
    - 创建 `src/cli/__tests__/analyses/keyboard-heatmap.test.ts`
    - 测试：`_` 转为空格、大写字母小写化、字频加权计数正确性
    - _Requirements: 9.1_

- [x] 13. 检查点 — 确保六项分析模块测试通过
  - 确保所有测试通过，如有问题请向用户说明。

- [x] 14. 实现分析协调器
  - [x] 14.1 创建 `src/cli/analyzer.ts`
    - 定义 `AnalyzerOptions` 接口（`scheme`、`processedCodeTable`、`onStepStart`、`onStepDone` 回调）
    - 实现 `runAllAnalyses(options: AnalyzerOptions): Promise<方案測評結果介面>`
    - 按顺序调用六项分析函数，每项开始前调用 `onStepStart`，完成后调用 `onStepDone`（传入耗时毫秒数）
    - 从 `node-adapter` 加载所需数据（字频、当量表），传入各分析函数
    - 将六项结果组装为 `方案測評結果介面` 返回
    - _Requirements: 4.3, 5.3, 6.4, 7.3, 8.3, 9.2, 12.1, 12.2, 12.3_

  - [ ]\* 14.2 为分析协调器编写单元测试
    - 创建 `src/cli/__tests__/analyzer.test.ts`
    - 使用 mock 分析函数，验证 `onStepStart` 和 `onStepDone` 回调被正确调用
    - 验证返回结果包含所有六项分析字段
    - _Requirements: 12.2, 12.3_

- [x] 15. 实现 CLI 入口与主流程
  - [x] 15.1 创建 `src/cli/index.ts`
    - 实现 `logProgress(step: string): void`，向 stderr 输出 `[HH:MM:SS] 开始：<step>` 格式的进度行
    - 实现 `logStepDone(ms: number): void`，向 stderr 输出 `[HH:MM:SS] 完成：<step> +<ms>ms` 格式
    - 实现 `main(): Promise<void>`，协调完整主流程：
      1. 调用 `parseArgs` 解析参数，处理 `--help` 和参数验证错误
      2. 调用 `initAdapter()` 初始化 Node.js 适配层
      3. 调用 `loadScheme` 加载方案配置（文件不存在时生成模板并退出）
      4. 使用 `codeTableService` 加载并处理码表文件（验证扩展名、解析、验证非空）
      5. 调用 `runAllAnalyses` 执行六项分析，传入进度回调
      6. 将分析结果合并到方案配置的 `测评结果` 字段
      7. 调用 `formatOutput` 格式化并写入 stdout
      8. 向 stderr 输出总耗时完成提示
    - 所有未捕获错误输出到 stderr 并以退出码 1 退出
    - _Requirements: 1.2, 1.3, 1.4, 1.7, 10.1, 10.4, 12.1, 12.4, 13.1, 13.5_

  - [x] 15.2 更新 `package.json`，添加 `"cli": "tsx src/cli/index.ts"` 脚本
    - _Requirements: 13.2_

  - [ ]\* 15.3 为 CLI 入口编写集成测试
    - 创建 `src/cli/__tests__/integration/cli.test.ts`
    - 使用示例码表文件（构造小型测试码表）运行完整主流程，验证输出 JSON 结构包含所有六项分析字段
    - 验证 JSON 格式和 table 格式的输出符合规范
    - 验证错误场景（文件不存在、无效扩展名）的退出码和 stderr 输出
    - _Requirements: 1.3, 1.4, 2.3, 10.1, 10.2, 11.1, 13.4_

- [x] 16. 最终检查点 — 确保所有测试通过
  - 确保所有测试通过，如有问题请向用户说明。

## Notes

- 标有 `*` 的子任务为可选项，可跳过以加快 MVP 进度
- 每个任务引用了具体的需求条款以保证可追溯性
- 属性测试（Property N）对应 design.md 中的 Correctness Properties 章节
- 六项分析模块（任务 7–12）互相独立，可并行实现
- `node-adapter.ts` 和 `scheme-loader.ts` 是基础依赖，需优先完成
- `arg-parser.ts` 和 `output-formatter.ts` 与其他模块无依赖，可最先实现
- fast-check 已在 design.md 中标注为测试依赖，需添加到 devDependencies

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "3.1"] },
    { "id": 1, "tasks": ["2.2", "3.2", "3.3", "4.1", "5.1"] },
    { "id": 2, "tasks": ["4.2", "5.2", "5.3", "7.1", "8.1", "9.1", "10.1", "11.1", "12.1"] },
    { "id": 3, "tasks": ["7.2", "8.2", "9.2", "10.2", "11.2", "12.2", "14.1"] },
    { "id": 4, "tasks": ["14.2", "15.1"] },
    { "id": 5, "tasks": ["15.2", "15.3"] }
  ]
}
```
