# Requirements Document

## Introduction

为 yuhao-assess 形码测评网站添加一个 CLI 工具，使用户能够在命令行环境中对输入法码表进行全套测评分析，无需打开浏览器。CLI 工具接受码表文件和必要的方案配置文件（JSONC 格式）作为输入，计算所有测评指标（静态重码分析、动态选重分析、候选个数分析、速度当量分析、简码效率分析、键位热力分析），并将结果以 JSON 或表格格式输出到 stdout。

该工具需要在 Node.js 环境中运行，绕过现有服务对浏览器 API（`fetch`、`localStorage`、Web Crypto API）和 Jotai atoms 的依赖，直接读取 `public/` 目录下的本地数据文件。

## Glossary

- **CLI_Tool**：命令行工具，入口文件为 `src/cli/index.ts`，通过 `tsx` 运行
- **码表文件**：包含汉字与编码映射关系的文本文件，支持 `.txt`、`.csv`、`.tsv`、`.yaml`、`.yml` 格式
- **方案配置文件**：JSONC 格式文件（JSON with Comments），包含方案配置信息（对应 `方案配置介面` 中除 `测评结果` 字段外的所有字段），通过 `--scheme` 选项指定路径
- **JSONC**：JSON with Comments，支持 `//` 单行注释和 `/* */` 多行注释的 JSON 超集格式
- **默认方案配置模板**：当 `--scheme` 指定的文件不存在时，CLI 自动生成的带注释的 JSONC 模板文件，包含所有字段的说明和枚举值取值
- **测评结果**：六项分析的计算结果，对应 `方案测评结果介面` 类型
- **Node.js_Adapter**：适配层模块，为现有服务提供 Node.js 兼容的数据加载实现，替代浏览器 `fetch` 和 `localStorage`
- **分隔符**：码表文件中分隔字符与编码的符号，在方案配置文件的 `碼表元數據.分隔符` 字段中指定，可为 `製表符`、`空格`、`逗號`、`分號`
- **第一列类型**：码表文件第一列的含义，在方案配置文件的 `碼表元數據.第一列類型` 字段中指定，可为 `字符` 或 `編碼`
- **JSON_Path**：对象属性的点分路径表示，如 `元数据.方案名`，用于 `table` 格式输出
- **全碼表**：`處理後的碼表結果介面` 中的 `全碼表` 字段，每个字符对应最长编码
- **簡碼表**：`處理後的碼表結果介面` 中的 `簡碼表` 字段，每个字符对应最短编码

## Requirements

### Requirement 1: 码表文件输入

**User Story:** 作为输入法开发者，我希望通过命令行指定码表文件路径，以便无需打开浏览器即可分析码表。

#### Acceptance Criteria

1. THE CLI_Tool SHALL 接受一个位置参数作为码表文件路径（必填）
2. THE CLI_Tool SHALL 支持 `.txt`、`.csv`、`.tsv`、`.yaml`、`.yml` 五种文件扩展名（大小写不敏感）
3. WHEN 码表文件路径不存在或不可读时，THE CLI_Tool SHALL 向 stderr 输出包含文件路径的错误信息并以退出码 1 退出
4. WHEN 码表文件扩展名不在支持列表中时，THE CLI_Tool SHALL 向 stderr 输出错误信息（列出所有支持的扩展名）并以退出码 1 退出
5. THE CLI_Tool SHALL 从方案配置文件的 `碼表元數據.分隔符` 字段读取分隔符（`製表符`、`空格`、`逗號`、`分號`），默认值为 `製表符`
6. THE CLI_Tool SHALL 从方案配置文件的 `碼表元數據.第一列類型` 字段读取第一列类型（`字符`、`編碼`），默认值为 `字符`
7. WHEN 码表文件解析后不包含任何有效字符-编码对时，THE CLI_Tool SHALL 向 stderr 输出错误信息并以退出码 1 退出

### Requirement 2: 方案配置文件

**User Story:** 作为输入法开发者，我希望通过 `--scheme` 选项指定方案配置文件，以便测评结果能与方案配置合并输出，并且在文件不存在时能自动获得一个带注释的模板。

#### Acceptance Criteria

1. THE CLI_Tool SHALL 要求 `--scheme <path>` 选项（必填），接受一个 JSONC 文件路径
2. THE CLI_Tool SHALL 支持解析 JSONC 格式（JSON with Comments），即文件中可包含 `//` 单行注释和 `/* */` 多行注释，解析时忽略所有注释
3. WHEN `--scheme` 指定的文件路径不存在时，THE CLI_Tool SHALL 在该路径自动生成一个默认方案配置模板文件，向 stderr 输出提示信息说明已生成模板，然后以退出码 0 退出（不执行分析）
4. THE CLI_Tool SHALL 生成的默认方案配置模板为 JSONC 格式，包含 `方案配置介面` 中所有字段（`元數據`、`方案參數`、`碼表元數據`），每个字段附有 `//` 注释说明字段含义，枚举类型字段注释中列出所有可选值
5. THE CLI_Tool SHALL 生成的默认方案配置模板中，`碼表元數據.分隔符` 的注释须列出所有可选值：`製表符`、`空格`、`逗號`、`分號`
6. THE CLI_Tool SHALL 生成的默认方案配置模板中，`碼表元數據.第一列類型` 的注释须列出所有可选值：`字符`、`編碼`
7. WHEN `--scheme` 指定的文件存在但内容不是有效 JSONC 时，THE CLI_Tool SHALL 向 stderr 输出包含解析错误详情的错误信息并以退出码 1 退出
8. WHEN `--scheme` 指定的 JSONC 文件缺少 `方案配置介面` 的必填字段（`元數據`、`方案參數`）时，THE CLI_Tool SHALL 向 stderr 输出说明缺失字段的错误信息并以退出码 1 退出
9. WHEN `--scheme` 选项未被传入时，THE CLI_Tool SHALL 向 stderr 输出错误信息说明该选项为必填，并以退出码 1 退出

### Requirement 3: Node.js 数据加载适配

**User Story:** 作为 CLI 工具，我需要在 Node.js 环境中加载数据文件，以便绕过浏览器 API 依赖。

#### Acceptance Criteria

1. THE Node.js_Adapter SHALL 通过 `fs.promises.readFile` 直接读取 `public/data/` 目录下的以下 JSON 数据文件：`charAbsoluteFrequencySC.json`、`charAbsoluteFrequencyTC.json`、`charAbsoluteFrequencyZhihu.json`、`charAbsoluteFrequencyGuji.json`、`charsets.json`，替代浏览器 `fetch`
2. THE Node.js_Adapter SHALL 通过 `fs.promises.readFile` 直接读取 `public/settings/` 目录下的配置文件（`cjkBlocks.json`、`equivTable.json`），替代浏览器 `fetch`
3. THE Node.js_Adapter SHALL 使用进程内存 Map 替代 `localStorage` 进行数据缓存，缓存在单次 CLI 运行期间有效
4. THE Node.js_Adapter SHALL 使用 `import.meta.url` 或 `__dirname` 相对于 CLI 入口文件的路径定位 `public/` 目录，确保从任意工作目录运行时均能正确找到数据文件
5. WHEN `public/data/` 或 `public/settings/` 目录下任一必要数据文件缺失或不可读时，THE CLI_Tool SHALL 向 stderr 输出包含文件名的错误信息，提示用户运行 `pnpm run fetch` 下载数据文件，并以退出码 1 退出
6. THE Node.js_Adapter SHALL 作为独立模块实现于 `src/cli/` 目录下，不修改 `src/services/` 或 `src/atoms/` 中的任何现有文件

### Requirement 4: 静态重码分析

**User Story:** 作为输入法开发者，我希望 CLI 工具能计算静态重码分析结果，以便了解码表在各字符集下的重码情况。

#### Acceptance Criteria

1. WHEN 码表解析完成后，THE CLI_Tool SHALL 对所有 14 个字符集（GB2312、通用规范、常用国字、CJK基本、到CJK扩A、到CJK扩B、到CJK扩C、到CJK扩D、到CJK扩E、到CJK扩F、到CJK扩G、到CJK扩H、到CJK扩I、到CJK扩J）分别计算静态重码数据，输入为 `全碼表` 和 `簡碼表`
2. THE CLI_Tool SHALL 对每个字符集计算以下 7 项数据：全码重码组数、简码重码组数、全码重码字数、简码重码字数、实际字符数（码表中属于该字符集的字符数）、理论字符数（该字符集的总字符数）、字集覆盖率（实际字符数 / 理论字符数，存储为 [0, 1] 范围内的浮点数）
3. THE CLI_Tool SHALL 将静态重码分析结果存入输出 JSON 的 `测评结果.静态重码分析` 字段，结构与 `靜態重碼分析結果介面` 一致
4. IF 字符集参考数据文件（`charsets.json` 或 `cjkBlocks.json`）加载失败，THEN THE CLI_Tool SHALL 向 stderr 输出错误信息并以退出码 1 退出

### Requirement 5: 动态选重分析

**User Story:** 作为输入法开发者，我希望 CLI 工具能计算动态选重分析结果，以便了解实际打字时的选重频率。

#### Acceptance Criteria

1. WHEN 码表解析完成后，THE CLI_Tool SHALL 使用 5 种字频数据（知乎简体、北语简体、台标繁体、古籍繁体、繁简联合）分别计算动态选重率
2. THE CLI_Tool SHALL 对每种字频类型分别计算按字频重排和保持原序两种模式下的全码动态选重率和简码动态选重率，共产生 20 个数值
3. THE CLI_Tool SHALL 将动态选重分析结果存入输出 JSON 的 `测评结果.动态选重分析` 字段，结构与 `動態選重分析結果介面` 一致
4. IF 任一字频数据文件加载失败，THEN THE CLI_Tool SHALL 向 stderr 输出包含文件名的错误信息并以退出码 1 退出

### Requirement 6: 候选个数分析

**User Story:** 作为输入法开发者，我希望 CLI 工具能计算候选个数分析结果，以便了解各字符集下的最大候选项数量。

#### Acceptance Criteria

1. WHEN 码表解析完成后，THE CLI_Tool SHALL 对所有 14 个字符集计算最大候选个数，其中"最大候选个数"定义为该字符集内同一全码编码下出现的最多字符数
2. THE CLI_Tool SHALL 对每个字符集计算并存入最大候选个数及对应的编码列表（即达到最大候选数的所有编码）
3. WHEN 某字符集在码表中没有任何字符时，THE CLI_Tool SHALL 将该字符集的最大候选个数记录为 0，编码列表记录为空数组
4. THE CLI_Tool SHALL 将候选个数分析结果存入输出 JSON 的 `测评结果.候选个数分析` 字段，结构与 `最大候選個數分析結果` 一致

### Requirement 7: 速度当量分析

**User Story:** 作为输入法开发者，我希望 CLI 工具能计算速度当量分析结果，以便了解码表的打字效率。

#### Acceptance Criteria

1. WHEN 速度当量分析开始时，THE CLI_Tool SHALL 从 `public/settings/equivTable.json` 加载当量表数据；IF 该文件缺失、不可读或不是有效 JSON，THEN THE CLI_Tool SHALL 向 stderr 输出包含文件路径的错误信息并以退出码 1 退出
2. THE CLI_Tool SHALL 使用 5 种字频（知乎简体、北语简体、台标繁体、古籍繁体、繁简联合）分别计算全码速度当量、一级简码速度当量、二级简码速度当量、全部简码速度当量，共产生 20 个数值
3. THE CLI_Tool SHALL 将速度当量分析结果存入输出 JSON 的 `测评结果.速度当量分析` 字段，结构与 `速度當量分析結果介面` 一致

### Requirement 8: 简码效率分析

**User Story:** 作为输入法开发者，我希望 CLI 工具能计算简码效率分析结果，以便了解简码设置的优化程度。

#### Acceptance Criteria

1. WHEN 码表解析完成后，THE CLI_Tool SHALL 使用 5 种字频（知乎简体、北语简体、台标繁体、古籍繁体、繁简联合）分别计算简码效率，N 值列表为 `[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 6000, 7000, 8000, 9000, 10000, 12000, 15000, 20000, 30000, 50000]`（共 28 个值，与 web 版一致）
2. THE CLI_Tool SHALL 对每种字频类型计算：完整字符字符串（按字频降序排列的前 max(N) 个字符）以及每个 N 值对应的字频加权码长（使用 `簡碼表` 中的最短编码）
3. THE CLI_Tool SHALL 将简码效率分析结果存入输出 JSON 的 `测评结果.简码效率分析` 字段，结构与 `簡碼效率分析結果介面` 一致

### Requirement 9: 键位热力分析

**User Story:** 作为输入法开发者，我希望 CLI 工具能计算键位热力分析结果，以便了解各按键的使用频率分布。

#### Acceptance Criteria

1. WHEN 码表解析完成后，THE CLI*Tool SHALL 使用北语简体字频，遍历 `全碼加選重鍵表` 和 `簡碼加選重鍵表` 中每个字符的编码，按字频加权累计每个按键字符（小写化，`*` 转为空格）的使用计数，分别生成全码和简码两份按键计数 Map
2. THE CLI_Tool SHALL 将键位热力分析结果存入输出 JSON 的 `测评结果.键位热力` 字段，结构与 `鍵位熱力分析結果介面` 一致（`全碼` 和 `簡碼` 各为一个 `Record<string, number>`）
3. IF 北语简体字频数据文件加载失败，THEN THE CLI_Tool SHALL 向 stderr 输出包含文件名的错误信息并以退出码 1 退出

### Requirement 10: JSON 输出格式

**User Story:** 作为输入法开发者，我希望 CLI 工具默认输出格式化的 JSON，以便将结果保存为方案配置文件或进行程序化处理。

#### Acceptance Criteria

1. THE CLI_Tool SHALL 默认将 JSON 输出到 stdout，包含所有测评结果及方案配置信息
2. THE CLI_Tool SHALL 使用 2 空格缩进格式化输出 JSON
3. THE CLI_Tool SHALL 对输出 JSON 中所有 object 的键名进行 Unicode 码点字母序排序（alphabetical sort），递归应用于所有嵌套对象（数组内的对象同样排序，数组本身的顺序不变）
4. THE CLI_Tool SHALL 将测评结果合并到方案配置的 `测评结果` 字段后输出完整方案配置，包含方案元数据

### Requirement 11: 表格输出格式

**User Story:** 作为输入法开发者，我希望通过 `--format=table` 选项获得扁平化的键值对输出，以便快速查看各项指标数值。

#### Acceptance Criteria

1. THE CLI_Tool SHALL 支持 `--format` 选项，可选值为 `json`（默认）和 `table`
2. WHEN `--format=table` 被指定时，THE CLI_Tool SHALL 将 JSON 输出中所有标量叶节点（string、number、boolean、null）展开为两列输出，第一列为 JSON path（点分路径），第二列为对应的值；数组作为原子值处理，输出为单行 JSON 格式
3. WHEN `--format=table` 被指定时，THE CLI_Tool SHALL 对每一行按 `<path>\t<value>` 格式输出（制表符分隔），其中：string 值输出原始字符串（不加引号），number/boolean 输出其 JSON 字符串表示，null 输出字面量 `null`，数组输出单行 JSON 且逗号后加一个空格（如 `["a", "b", "c"]`）
4. WHEN `--format` 选项值不在 `json`、`table` 中时，THE CLI_Tool SHALL 向 stderr 输出错误信息（列出所有有效值）并以退出码 1 退出
5. THE CLI_Tool SHALL 对 table 格式的输出行按 JSON path 的 Unicode 码点字母序排序

### Requirement 12: 进度信息输出

**User Story:** 作为输入法开发者，我希望在计算过程中能看到进度信息，以便了解当前执行状态。

#### Acceptance Criteria

1. WHILE 计算正在进行时，THE CLI_Tool SHALL 将所有进度信息输出到 stderr，stdout 仅包含最终结果
2. WHEN 每项分析开始时，THE CLI_Tool SHALL 向 stderr 输出一行包含以下信息的进度行：当前时间戳（格式为 `HH:MM:SS`）、当前步骤名称（以下六项之一：「静态重码分析」、「动态选重分析」、「候选个数分析」、「速度当量分析」、「简码效率分析」、「键位热力分析」）
3. WHEN 每项分析完成时，THE CLI_Tool SHALL 向 stderr 输出该步骤消耗的时间（单位毫秒，格式如 `+1234ms`）
4. WHEN 所有六项分析计算完成时，THE CLI_Tool SHALL 向 stderr 输出一条包含总耗时的完成提示信息

### Requirement 13: CLI 入口与运行方式

**User Story:** 作为输入法开发者，我希望通过 `pnpm run cli` 或直接调用脚本的方式运行 CLI 工具，以便与现有项目工作流集成。

#### Acceptance Criteria

1. THE CLI_Tool SHALL 入口文件位于 `src/cli/index.ts`
2. THE CLI_Tool SHALL 在 `package.json` 的 `scripts` 中添加 `"cli": "tsx src/cli/index.ts"` 脚本
3. THE CLI_Tool SHALL 不在 `package.json` 的 `dependencies` 中新增任何条目；可在 `devDependencies` 中添加 `jsonc-parser`（用于解析 JSONC 格式的方案配置文件）以及测试相关依赖，仅使用 Node.js 内置模块和 `tsx` 运行
4. WHEN `--help` 选项被传入时，THE CLI_Tool SHALL 向 stdout 输出使用说明，包含：命令格式、所有选项名称、每个选项的描述和默认值，然后以退出码 0 退出
5. WHEN 运行时发生未被其他需求覆盖的错误时，THE CLI_Tool SHALL 向 stderr 输出错误信息并以退出码 1 退出
