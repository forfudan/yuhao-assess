# GitHub Copilot 項目指引

> 本文檔爲 GitHub Copilot 提供項目背景和開發約定，確保跨會話的上下文連續性。

## ⚠️ 重要規範

### � 完成一步後更新 ROADMAP

**強制要求**：每完成一個階段或重要功能後，必須更新 [docs/ROADMAP.md](../docs/ROADMAP.md)：

1. **標記完成狀態**：
   - 將對應部分標記爲 ✅
   - 更新「重構進度總覽」部分

2. **記録實際情况**：
   - 記録實際完成時間
   - 記録遇到的問題和解決方案
   - 更新「已知問題」和「技術債務」部分

3. **調整未來計劃**（如有需要）：
   - 更新後續階段的計劃
   - 調整時間估算
   - 説明變更原因

**示例**：

```markdown
## 階段二：核心服務遷移 ✅（已完成，8小時）

### 2.1 數據加載 Hooks ✅（2小時）

- 實際完成時間：2024-02-03，用時 2 小時
- 遇到問題：TypeScript 完全支持中文變量名，無需特殊配置
```

### 🔨 每次完成 Prompt 後必須構建驗證

**強制要求**：完成任何代碼修改後，必須執行以下命令驗證：

```bash
# 1. TypeScript 類型檢查
pnpm exec tsc --noEmit

# 2. 構建項目
pnpm run build

# 3. 運行測試（如有）
pnpm test
```

**驗證標準**：

- ✅ 所有 TypeScript 文件無類型錯誤
- ✅ 構建成功，無編譯錯誤
- ✅ 測試通過（如有測試文件）

**如果構建失敗**：

1. 立即報告錯誤信息
2. 分析錯誤原因
3. 修復所有類型錯誤
4. 再次驗證直到成功

### 🈶 語言規範：統一使用繁體中文

**強制要求**：

1. **對話語言**：與用户對話統一使用繁體中文
2. **代碼註釋**：所有註釋使用繁體中文
3. **變量命名**：逐步將簡體中文變量名改爲繁體中文
4. **文檔内容**：所有文檔（README、ROADMAP 等）使用繁體中文

**漸進式遷移**：

- ✅ 新代碼：直接使用繁體中文
- ✅ 修改現有代碼時：順便將簡體改爲繁體
- ⚠️ 不要一次性大規模替換（避免干擾 git diff）

**示例**：

```typescript
// ❌ 錯誤：簡體中文
const 字频 = await loadCharFrequency() // 简体
const 码表 = new Map() // 简体

// ✅ 正確：繁體中文
const 字頻 = await loadCharFrequency() // 繁體
const 碼表 = new Map() // 繁體
```

**文檔標題示例**：

- ❌ `# 重构路线图`（簡體）
- ✅ `# 重構路線圖`（繁體）

---

## 📌 項目概述

## 📌 項目概述

**yuhao-assess** 是宇浩輸入法的性能測評工具，用於分析碼表的重碼率、速度當量、簡碼效率等指標。

- **當前狀態**：Vue 3 單頁應用
- **重構目標**：遷移到 React + TypeScript + Jotai
- **核心依賴**：chinese-ime-metrics（Rust + WASM 計算庫）

## 🎯 核心目標

1. **架構解耦**：樣式、組件、業務邏輯分離
2. **樣式簡化**：統一主題，減少冗餘 CSS
3. **性能優化**：側邊欄導航 + 延遲加載
4. **代碼規範**：pre-commit 自動格式化 + 字形統一
5. **核心分離**：將計算邏輯遷移到 chinese-ime-metrics
6. \*\*變量録結構（React 目標架構）

```text
src/
├── app.tsx                    # 應用入口
├── main.tsx                   # React 渲染
├── routes.tsx                 # 路由配置
├── pages/                     # 頁面組件
├── components/                # UI 組件
│   ├── layout/               # 布局
│   ├── common/               # 通用組件
│   └── charts/               # 圖表
├── atoms/                     # Jotai 狀態
├── services/                  # 業務邏輯
├── hooks/                     # 自定義 hooks
├── styles/                    # 樣式系統
├── types/                     # TypeScript 類型
└── utils/                     # 工具函數
```

**重要**：工具腳本應放在 `src/utils/`，不是根目録

**重要**：工具脚本应放在 `src/utils/`，不是根目录 `scripts/`。

## 🔗 chinese-ime-metrics 集成

### 关键信息

- **仓库**：`forfudan/chinese-ime-metrics`
- **技术栈**：Rust + WebAssembly（纯 WASM 实现，无 JS 降级）
- **API**：所有函数均为异步（async）
- **集成方式**：开发环境本地路径，生产环境 CDN 加载

### API 命名约定

❌ **错误**：`calculateDuplicateStatsHybrid`（已废弃）  
✅ **正确**：`calculateDuplicateStats`（纯 WASM）

### 集成策略

**开发环境**：

```typescript
// vite.config.ts
resolve: {
  alias: {
    '@chinese-ime-metrics': resolve(__dirname, '../chinese-ime-metrics/src')
  }
}
```

**生产环境**（推荐 CDN 方式）：

```typescript
// src/utils/metrics-loader.ts
const CDN_BASE = 'https://forfudan.github.io/chinese-ime-metrics/dist'
export async function loadMetricsModule() {
  if (import.meta.env.DEV) {
    return await import('@chinese-ime-metrics')
  }
  return await import(/* @vite-ignore */ `${CDN_BASE}/index.js`)
}
```

**原因**：

- ✅ 仓库独立，便于分开维护
- ✅ chinese-ime-metrics 更新后无需重新构建 yuhao-assess
- ✅ 其他项目可直接使用 CDN
- ✅ 减少构建体积（WASM 不打包）

## 📝 代码规范

### 字形统一

#### 繁體中文標準

本倉庫採用 **[GujiCC](https://github.com/forfudan/GujiCC) 的「調和大陸繁體標準」**。

**核心原則**：

- ✅ 可以使用台灣標準繁體書寫（如「群」「峰」「説」）
- ✅ 提交時自動轉換爲大陸通規字形（如「群」「峰」「説」）
- ✅ 保證字形統一，避免混用

#### 自動轉換機制

**轉換範圍**：

- ✅ 代碼文件（`.ts`、`.tsx` 等）
- ✅ Markdown 文檔（`.md`）
- ❌ JSON、CSS 文件（僅格式化，不轉換字形）

**轉換行爲**：

- ✅ 全局替換所有出現的台灣字形
- ✅ 包括代碼、註釋、字符串字面量
- ⚠️ 注意：引號内的字符串也會被轉換（如 `const 説明 = "説明"` → `const 説明 = "説明"`）
- ❌ 轉換腳本本身（`normalize-traditional-chars.ts`）不會被轉換

**運行方式**：

```bash
# 手動轉換單個文件
pnpm exec tsx src/utils/normalize-traditional-chars.ts src/App.tsx

# 手動轉換多個文件
pnpm exec tsx src/utils/normalize-traditional-chars.ts docs/*.md

# Pre-commit 自動轉換（無需手動執行）
git commit -m "提交信息"  # 自動觸發字形轉換
```

**映射表示例**（共 76 組）：

| 台灣字形 | 大陸通規 | 類别 |
| -------- | -------- | ---- |
| 群       | 群       | 羊部 |
| 峰       | 峰       | 山部 |
| 緑       | 緑       | 糸部 |
| 説       | 説       | 兑部 |
| 爲       | 爲       | 爪部 |
| 着       | 着       | 羊部 |

完整映射表參考：`src/utils/normalize-traditional-chars.ts`

### 命名約定

#### 核心原則

所有對話、文檔註釋、變量名都使用繁體中文

#### 變量命名規範

- **變量/函數名**：**必須使用繁體中文**（TypeScript 完全支持 Unicode 標識符）
- **組件文件名**：PascalCase（`HomePage.tsx`、`MainLayout.tsx`）
- **工具文件名**：camelCase（`useDataLoaders.ts`）
- **類型名**：PascalCase 英文（`CodeTable`、`CharFrequency`）- 因爲需要導出給其他項目使用

**✅ 推薦的繁體中文命名**：

```typescript
// 變量使用繁體中文
const 碼表 = new Map<string, string>()
const 字頻數據 = await 加載字符頻率()
const 重碼率 = 計算重碼率(碼表)
const 是否加載中 = true
const 錯誤信息 = null

// 函數使用繁體中文
function 加載字符頻率(文件名: string) {}
function 計算重碼率(碼表: CodeTable) {}
async function 解析碼表(内容: string) {}

// React Hooks 使用繁體中文
const [數據, 設置數據] = useState(null)
const [加載中, 設置加載中] = useState(false)
const { 字頻數據, 加載中: 字頻加載中, 錯誤 } = useCharFrequency('charFrequencySC')

// 類型保持英文（便於跨項目引用）
interface UseDataResult<T> {
  data: T | null
  loading: boolean
  error: string | null
}
```

**❌ 避免的命名**：

```typescript
// 不要用英文變量名
const data = null // ❌
const loading = true // ❌
const errorMessage = '' // ❌

// 不要用拼音
const shuju = null // ❌
const jiazaizhong = true // ❌
```

**爲什麽使用中文變量名？**

1. ✅ 與註釋、文檔語言一致，更易讀
2. ✅ 業務邏輯更清晰（「重碼率」比 `duplicateRate` 更直觀）
3. ✅ 減少中英文混雜（註釋中文、變量英文很分裂）
4. ✅ TypeScript/React 完全支持 Unicode 標識符
5. ✅ 現代編輯器對中文輸入有良好支持

// ⚠️ 簡體中文（需漸進遷移）
const 码表 = new Map<string, string>() // 舊代碼
const 字频数据 = await loadCharFrequency() // 舊代碼

````typescript

### Pre-commit 检查

```json
"lint-staged": {
  "*.{ts,tsx}": [
    "pnpm exec tsx src/utils/normalize-traditional-chars.ts",
    "eslint --fix",
    "prettier --write"
  ]
}
````

## 🗂️ 数据文件管理

### 目录结构

```text
public/
├── data/           # 大数据文件（Git LFS）
│   ├── charFrequencyZhihu.json
│   ├── charFrequencySC.json
│   ├── wordFrequencySC.json
│   └── ...
└── settings/       # 配置文件（普通 Git）
    ├── charsets.json
    ├── cjkBlocks.json
    └── ...
```

### Git LFS 配置

```gitattributes
public/data/** filter=lfs diff=lfs merge=lfs -text
```

## 🚀 重构路线图

参考 [docs/ROADMAP.md](../docs/ROADMAP.md)

### 时间估算

- **总计**：40-50 小时（5-7 个工作日）
- **阶段零**：基础设施（1 小时）
- **阶段一**：React 架构（6-8 小时）
- **阶段二**：状态管理（6-8 小时）
- **阶段三**：布局路由（4-6 小时）
- **阶段四**：页面迁移（12-16 小时）
- **阶段五**：样式统一（4-5 小时）
- **阶段六**：性能优化（3-4 小时）
- **阶段七**：测试部署（2-3 小时）

### 分支策略

- **主分支**：`main`
- **重构分支**：`refactor/react-migration`
- **子任务分支**：`refactor/react-migration-stage1`、`stage2`...

## 🧪 测试策略

**原则**：每个页面迁移后立即编写单元测试，不要等到最后。

```typescript
// src/pages/__tests__/duplicate.test.tsx
import { render, screen } from '@testing-library/react'
import { Provider } from 'jotai'
import DuplicatePage from '../duplicate'

describe('DuplicatePage', () => {
  it('显示空状态提示', () => {
    render(
      <Provider>
        <DuplicatePage />
      </Provider>
    )
    expect(screen.getByText('请先上传码表')).toBeInTheDocument()
  })
})
```

## 🔍 常见问题

### Q1: 使用哪个 UI 框架？

**A**: Ant Design

### Q2: 状态管理用什么？

**A**: Jotai（原子化状态管理，不是 Redux/Zustand）

### Q3: 样式方案？

**A**: styled-components + Ant Design 主题

### Q4: 是否需要 SSR？

**A**: 不需要，纯客户端渲染

### Q5: WASM 加载失败怎么办？

**A**: 显示友好错误提示，chinese-ime-metrics 已移除 JS 降级

## 📚 参考资源

- `docs/ROADMAP.md` - 完整重構路線圖
- `docs/QUICK_START.md` - 快速開始指南
- `../chinese-ime-metrics/docs/` - chinese-ime-metrics 文檔
- [hanzi-chai](https://github.com/hanzi-chai/hanzi-chai.github.io)
- [shurufa.app](https://shurufa.app)

## 🎨 设计原则

1. **简洁优先**：避免过度设计，使用简洁风格
2. **性能优先**：使用 WASM 加速，延迟加载大数据
3. **类型安全**：严格 TypeScript 模式
4. **可维护性**：模块化、文档化、测试覆盖

## 🚨 注意事项

### 避免的反模式

❌ 不要在根目录创建 `scripts/` 文件夹  
✅ 工具函数放在 `src/utils/`

❌ 不要使用已废弃的 `Hybrid` API  
✅ 使用纯 WASM API（`calculateDuplicateStats`）

❌ 不要将大数据文件直接提交到 Git  
✅ 使用 Git LFS 管理 `public/data/`

❌ 不要在组件中直接写复杂计算逻辑  
✅ 抽取到 `services/` 或迁移到 `chinese-ime-metrics`

### 迁移时的特殊处理

1. **字频数据加载**：从 `public/data/` 改为 `public/data/`（注意路径变化）
2. **配置文件加载**：从 `public/data/` 改为 `public/settings/`
3. **导入语句**：Vue 的 `@/` 别名在 React 中保持一致
4. **组件生命周期**：
   - Vue `onMounted` → React `useEffect`
   - Vue `computed` → React `useMemo` 或 Jotai 计算原子
   - Vue `watch` → React `useEffect` 依赖数组

## 📊 项目关键指标

- **代码行数**：约 10,000 行（目标：减少 20%）
- **CSS 大小**：目标减少 50%
- **首屏加载**：目标 < 2 秒
- **Lighthouse 分数**：目标 > 90
- **WASM 性能提升**：目标 3-10 倍

---

**最后更新**：2026-02-03  
**维护者**：@forfudan  
**版本**：v1.0
