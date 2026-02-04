# 宇浩漢字輸入法測評系統 - 重構路線圖

## 概述

本項目正在進行從 Vue 3 到 React + TypeScript 的架構重構，旨在提升代碼質量、性能和可維護性。

### 核心目標

1. **架構解耦**：分離樣式、組件、業務邏輯，實現模塊化
2. **樣式簡化**：統一主題系統，復用樣式組件，減少冗余 CSS
3. **性能優化**：側邊欄導航 + 延遲加載，避免卡片同時渲染
4. **倉庫優化**：數據文件外部化管理（獨立倉庫 + CDN）
5. **代碼規範**：使用 pre-commit 自動格式化多種文件類型並進行字形統一
6. **核心分離**：將計算邏輯逐步遷移到 `chinese-ime-metrics` 庫
7. **命名規範**：**所有變量、類型、函數名統一使用繁體中文命名，要求具體、詳細、準確、自顯示**，詳見 **[命名規範文檔](./NOMENCLATURE.md)**（必讀）

> **⚠️ 重要提示**：開發前務必閲讀 [NOMENCLATURE.md](./NOMENCLATURE.md)，了解本倉庫的命名規範。所有代碼提交必須遵循該規範，使用標準名稱而非别名或縮寫。

### 📦 數據文件管理方案

**問題**：`public/data/` 包含 1.5MB 數據文件，頻繁更新會污染 Git 歷史。

**解決方案**：使用獨立倉庫 [yuhao-assess-data](https://github.com/forfudan/yuhao-assess-data) + 本地配置文件

| 環境     | 大型數據文件            | 配置文件                   |
| -------- | ----------------------- | -------------------------- |
| **開發** | `/public/data/`（本地） | `/public/settings/`（Git） |
| **生産** | GitHub Pages CDN        | 隨應用部署                 |

**文件分類**（2026-02-04 更新）：

**大型數據文件**（`public/data/`，不 track，從 CDN 加載）：

- `charAbsoluteFrequencyZhihu.json` - 知乎字頻數
- `charAbsoluteFrequencySC.json` - 北語簡體字頻數
- `charAbsoluteFrequencyTC.json` - 臺灣繁體字頻數
- `charAbsoluteFrequencyGuji.json` - 古籍字頻數
- `wordAbsoluteFrequencySC.json` - 簡體詞頻數
- `charsets.json` - 字符集數據

**配置文件**（`public/settings/`，track changes，隨應用部署）：

- `cjkBlocks.json` - CJK Unicode 區塊定義
- `codeTableConfig.json` - 預設碼表配置
- `equivTable.json` - 按鍵當量表

**優勢**：

- ✅ 主倉庫輕量（不含大型數據文件）
- ✅ 大型數據更新支持覆蓋式提交（`commit --amend` + `push -f`）
- ✅ 配置文件保持版本控制，方便回溯
- ✅ 無需 Git LFS（節省存儲成本）
- ✅ CDN 加速 + 瀏覽器緩存

**數據文件命名規範**（已廢棄，僅供參考）：

| 舊文件名                  | 新文件名                          | 説明           |
| ------------------------- | --------------------------------- | -------------- |
| `charFrequencyZhihu.json` | `charAbsoluteFrequencyZhihu.json` | 知乎字頻數     |
| `charFrequencySC.json`    | `charAbsoluteFrequencySC.json`    | 北語簡體字頻數 |
| `charFrequencyTC.json`    | `charAbsoluteFrequencyTC.json`    | 臺灣繁體字頻數 |
| `charFrequencyGuji.json`  | `charAbsoluteFrequencyGuji.json`  | 古籍字頻數     |
| `wordFrequencySC.json`    | `wordAbsoluteFrequencySC.json`    | 簡體詞頻數     |

**術語規範**：

- **頻數（Absolute Frequency）**：出現次數（整數），如「的」出現 1000 次
- **頻率（Relative Frequency）**：出現比例（小數），如「的」佔 0.05（5%）

### 🔗 與 chinese-ime-metrics 的協作

本項目計算邏輯將逐步遷移到 [chinese-ime-metrics](https://github.com/forfudan/chinese-ime-metrics)：

- **yuhao-assess**：UI 層，負責數據展示、用户交互、設置管理
- **chinese-ime-metrics**：計算層，Rust + WASM 實現高性能統計算法

**集成方式**：

- 開發環境：使用本地相對路徑（`../chinese-ime-metrics`）
- 生産環境：從 GitHub Pages CDN 加載 WASM 模塊

**計劃集成的功能**：

- ✅ 靜態重碼計算（`calculateDuplicateStats`）
- ✅ 動態選重率（`calculateDynamicDupRate`）
- ⏳ 碼長分布統計
- ⏳ 鍵位熱力圖計算
- ⏳ 速度當量計算

詳見：[chinese-ime-metrics/docs/ROADMAP.md](../../chinese-ime-metrics/docs/ROADMAP.md)

---

## 重構進度總覽

### ✅ 已完成階段

- **階段零**：基礎設施（2-3小時） ✅
- **階段一**：React 基礎架構（6-8小時） ✅
- **階段二**：核心服務遷移（6小時） ✅
  - 2.1 數據加載 Hooks ✅
  - 2.2 碼表解析服務 ✅
  - 2.3 統計計算服務整合 ✅
- **階段三**：佈局與路由（4-6小時） ✅
  - 3.1 側邊欄導航 ✅
  - 3.2 主佈局優化 ✅
  - 3.3 術語統一（Jotai 原子狀態）✅

### 🚧 進行中

- **階段四**：頁面遷移 + WASM 遷移（12-16小時）

### ⏳ 待完成

- **階段四**：頁面遷移 + WASM 遷移（12-16小時）
- **階段五**：樣式統一（4-5小時）
- **階段六**：性能優化（3-4小時）
- **階段七**：測試與部署（2-3小時）

---

## 階段零：基礎設施 ✅（已完成，2-3小時）

### 0.1 數據文件外部化 ✅

**實施方案**：

- **大型數據文件**：使用獨立倉庫 [yuhao-assess-data](https://github.com/forfudan/yuhao-assess-data)
- **配置文件**：存放在 `public/settings/`，保持版本控制

**目録結構**（2026-02-04 更新）：

```text
/Users/ZHU/Programs/ime/
├── yuhao-assess/              # 主應用
│   ├── public/
│   │   ├── data/             # ← .gitignore（大型數據，開發保留）
│   │   │   ├── charAbsoluteFrequency*.json
│   │   │   ├── wordAbsoluteFrequencySC.json
│   │   │   └── charsets.json
│   │   └── settings/         # ← Git track（配置文件）
│   │       ├── cjkBlocks.json
│   │       ├── codeTableConfig.json
│   │       └── equivTable.json
│   └── src/utils/
│       └── data-loader.ts    # ← CDN 加載工具
│
└── yuhao-assess-data/         # 數據倉庫（獨立 Git）
    ├── charAbsoluteFrequency*.json
    ├── wordAbsoluteFrequencySC.json
    └── charsets.json          # （6 個大型文件）
```

**已完成**：

- ✅ 創建 `yuhao-assess-data` 倉庫
- ✅ 添加 `public/data/` 到 `.gitignore`
- ✅ 創建 `public/settings/` 目録
- ✅ 移動配置文件到 `public/settings/`
- ✅ 更新代碼引用路徑（`/data/` → `/settings/`）
- ✅ 創建 `src/utils/data-loader.ts`
- ✅ 開發環境用本地文件，生産環境用 CDN

**文件訪問策略**：

| 文件類型 | 開發環境     | 生産環境 | Git 追蹤 |
| -------- | ------------ | -------- | -------- |
| 大型數據 | 本地或 CDN   | CDN 加載 | ❌       |
| 配置文件 | 本地（打包） | 打包部署 | ✅       |

**數據同步機制**：

1. **開發環境**：運行 `pnpm run fetch` 從 CDN 下載數據到 `public/data/`
2. **生産環境**：
   - 大型數據：運行時從 CDN 讀取
   - 配置文件：隨應用打包部署
3. ⚠️ `public/data/` 已加入 `.gitignore`，不會提交到 Git

**前提條件**：

- yuhao-assess-data 已推送到 GitHub
- GitHub Pages 已啟用（Settings → Pages → Deploy from main branch）

**使用方式**：

```bash
pnpm run fetch   # 同步數據文件
pnpm run dev     # 啟動開發服務器
pnpm run build   # 構建生産版本
pnpm run preview # 測試生産構建（從 CDN 讀取）
```

### 0.2 Pre-commit Hook 設置 ✅

**目標**：統一代碼風格，自動格式化不同類型文件

**已安裝依賴**：

- 代碼格式化：`prettier@3.8.1`、`eslint@8.57.1`
- TypeScript ESLint：`@typescript-eslint/parser`、`@typescript-eslint/eslint-plugin`
- React 插件：`eslint-plugin-react@7.37.5`、`eslint-plugin-react-hooks@7.0.1`
- Markdown 工具：`markdownlint-cli2@0.20.0`
- Git Hooks：`husky@9.1.7`、`lint-staged@16.2.7`

**已配置文件**：

- ✅ `package.json` - lint-staged 配置
- ✅ `eslint.config.mjs` - ESLint 配置（支持 React + TypeScript）
- ✅ `.prettierrc.json` - Prettier 格式化規則
- ✅ `.markdownlintrc.cjs` - Markdown 檢查規則
- ✅ `src/utils/normalize-traditional-chars.ts` - 字形轉換腳本（76組映射）
- ✅ `.husky/pre-commit` - Git 預提交鉤子

**字形轉換範圍**：

- ✅ `.ts`、`.tsx` 文件
- ✅ `.md` 文件（包括代碼中的字符串字面量）
- ❌ `.json`、`.css` 文件（不轉換）

---

## 階段一：React 基礎架構 ✅（已完成，6-8小時）

### 1.1 依賴遷移 ✅

**已移除的包**（24個）：

- Vue 核心：`vue@3.5.19`
- Vue 工具：`@vitejs/plugin-vue`、`vue-tsc`
- Vue TypeScript：`@vue/eslint-config-typescript`、`@vue/tsconfig`
- Vue ESLint：`eslint-plugin-vue`
- Vue 工具庫：`@vueuse/core`

**已安裝的包**（84個核心 + 165個開發依賴）：

- React 核心：`react@19.2.4`、`react-dom@19.2.4`（最新穩定版）
- 路由：`react-router-dom@7.13.0`
- UI 框架：`antd@6.2.3`（11.77 MB，企業級組件庫）
- 樣式方案：`styled-components@6.3.8`（CSS-in-JS）
- 狀態管理：`jotai@2.17.0`（輕量級原子狀態）
- TypeScript 支持：`@types/react@19.2.10`、`@types/react-dom@19.2.3`
- Vite 插件：`@vitejs/plugin-react@5.1.3`
- ESLint 插件：`eslint-plugin-react@7.37.5`、`eslint-plugin-react-hooks@7.0.1`

**技術選型理由**：

1. **React 19.2.4**：最新穩定版，支持並發特性和最新 Hooks
2. **Ant Design 6.2.3**：成熟的企業級 UI 庫，組件豐富，支持繁體中文
3. **styled-components**：CSS-in-JS，避免樣式衝突，支持主題切換
4. **Jotai**：輕量級狀態管理（比 Redux 簡單，比 Context 高效）
5. **React Router 7**：最新路由方案，支持數據加載和錯誤邊界

### 1.2 構建配置更新 ✅

**[vite.config.ts](../vite.config.ts)**：

- ✅ 插件替換：`@vitejs/plugin-vue` → `@vitejs/plugin-react`
- ✅ 路徑别名：`'@': resolve(__dirname, 'src')`
- ✅ 代碼分割策略：
  - `react-vendor`：React 核心庫（45.48 kB）
  - `ui-vendor`：Ant Design + styled-components（640.62 kB，gzip 後 ~197 kB）
  - `state-vendor`：Jotai（0.04 kB）
- ✅ 保持端口 3000，開啟自動打開瀏覽器

**[tsconfig.json](../tsconfig.json)**：

- ✅ JSX 配置：`"jsx": "react-jsx"`（React 17+ 新 JSX 轉換，無需手動導入 React）
- ✅ 目標版本：`ES2021`（支持 replaceAll 等新特性）
- ✅ 模塊解析：`"moduleResolution": "bundler"`（Vite 優化）
- ✅ 路徑别名：`"@/*": ["src/*"]`
- ✅ 包含文件：添加 `env.d.ts` 以支持 `import.meta.env`

**[env.d.ts](../env.d.ts)**：

- ✅ 移除 Vue 模塊聲明
- ✅ 添加 Vite 環境變量類型：`ImportMetaEnv` 接口

**[index.html](../index.html)**：

- ✅ 根節點：`<div id="app">` → `<div id="root">`
- ✅ 入口文件：`/src/main.ts` → `/src/main.tsx`

**[package.json](../package.json)**：

- ✅ 構建腳本：`vue-tsc && vite build` → `tsc && vite build`
- ✅ Lint 範圍：`.vue,.js,.jsx,.ts,.tsx` → `.ts,.tsx`
- ✅ lint-staged：移除 `.vue` 文件處理，添加字形轉換

### 1.3 目録結構創建 ✅

已創建以下目録：

```text
src/
├── pages/              # 頁面組件
│   └── HomePage.tsx   # 首頁（數據加載演示）
├── components/
│   ├── layout/        # 佈局組件
│   │   └── MainLayout.tsx  # 主佈局（Header + Footer）
│   ├── common/        # 通用組件（待遷移）
│   └── charts/        # 圖表組件（待遷移）
├── atoms/             # Jotai 狀態原子
│   ├── codeTable.ts   # 碼表狀態
│   ├── settings.ts    # 應用設置
│   └── index.ts       # 狀態導出
├── hooks/             # 自定義 React Hooks
│   └── useDataLoaders.ts  # 數據加載 Hooks（字頻/詞頻/字符集）
├── services/          # 業務邏輯服務（待遷移）
├── utils/             # 工具函數
│   ├── data-loader.ts # CDN 數據加載器
│   └── normalize-traditional-chars.ts  # 字形轉換腳本
└── styles/            # 全局樣式（已存在，保留）
```

### 1.4 核心文件創建 ✅

**狀態管理（Jotai）**：

- **[src/atoms/codeTable.ts](../src/atoms/codeTable.ts)**：碼表數據狀態
  - `原始碼表Atom`：原始碼表文本
  - `碼表Atom`：解析後的碼表對象
  - `碼表元數據Atom`：碼表元數據（持久化到 localStorage）
  - `碼表加載中Atom`、`碼表錯誤Atom`：加載狀態

- **[src/atoms/settings.ts](../src/atoms/settings.ts)**：應用設置（全部持久化）
  - `設置Atom`：字符集、統計、顯示設置
  - `分析參數Atom`：分析參數配置

- **[src/atoms/index.ts](../src/atoms/index.ts)**：狀態導出

**React 應用入口**：

- **[src/main.tsx](../src/main.tsx)**：
  - ✅ React 18+ `createRoot` API
  - ✅ `BrowserRouter` 路由配置
  - ✅ Ant Design `ConfigProvider`（繁體中文 locale：`zh_TW`）
  - ✅ 嚴格模式 `<StrictMode>` + 全局樣式注入

- **[src/App.tsx](../src/App.tsx)**：
  - ✅ 使用 `react-router-dom` 的 `useRoutes`
  - ✅ 定義路由結構（主佈局 + 首頁）

**佈局與頁面**：

- **[src/components/layout/MainLayout.tsx](../src/components/layout/MainLayout.tsx)**：
  - ✅ 使用 Ant Design `Layout` 組件
  - ✅ styled-components 自定義樣式
  - ✅ Header、Content（最大寬度 1400px）、Footer 結構
  - ✅ 標題更新：「輸入法測評系統」（已移除「宇浩」品牌名）

- **[src/pages/HomePage.tsx](../src/pages/HomePage.tsx)**：
  - ✅ 數據加載演示頁面
  - ✅ 使用 `useCharFrequency('charFrequencySC')` 加載簡體字頻
  - ✅ 使用 `useCharsets()` 加載字符集數據
  - ✅ 顯示統計信息：總字符數、"的"/"一"/"是"的頻率
  - ✅ 顯示字符集列表：GB2312、GBK、通用規範漢字表等
  - ✅ 加載/錯誤狀態處理（Ant Design Spin + Alert）

### 1.5 驗證結果 ✅

- ✅ **TypeScript 編譯**：`tsc --noEmit` 通過（0 錯誤）
- ✅ **Vite 構建**：`pnpm run build` 成功（1.44-1.52秒）
- ✅ **開發服務器**：`pnpm run dev` 啟動在 <http://localhost:3000>
- ✅ **代碼分割**（生産構建）：
  - `index.js`：7.72 kB（應用主邏輯）
  - `react-vendor.js`：45.48 kB（React 核心）
  - `ui-vendor.js`：640.62 kB（Ant Design + styled-components，gzip 後 ~197 kB）
  - `state-vendor.js`：0.04 kB（Jotai）

---

## 階段二：核心服務遷移 🚧（進行中，8-10小時）

### 2.1 數據加載 Hooks ✅（已完成，2小時）

**[src/hooks/useDataLoaders.ts](../src/hooks/useDataLoaders.ts)**（203行）：

**實現的 Hooks**：

1. **`useCharAbsoluteFrequency(文件名: string)`** - 加載字頻數據
   - 參數：`文件名`（如 `'charAbsoluteFrequencySC'`、`'charAbsoluteFrequencyTC'`）
   - 返回：`{ data: 數據, loading: 加載中, error: 錯誤, refetch: 重新加載 }`
   - 特性：
     - ✅ 自動加載數據（開發環境用本地，生産環境用 CDN）
     - ✅ 取消請求邏輯（防止競態條件）
     - ✅ 錯誤處理（捕獲加載失敗）
     - ✅ 支持重新加載（`refetch` 函數）

2. **`useWordAbsoluteFrequency(文件名: string)`** - 加載詞頻數據
   - 與 `useCharFrequency` 類似，用於加載詞頻文件
   - 返回類型相同

3. **`useCharsets()`** - 加載字符集數據
   - 無參數，固定加載 `charsets.json`
   - 返回：`{ data: 數據, loading: 加載中, error: 錯誤, refetch: 重新加載 }`
   - 數據包含：GB2312、GBK、通用規範漢字表、BIG5、常用國字標準字體表等

**變量命名**：

- ✅ **全部使用繁體中文**（如：`數據`、`加載中`、`錯誤`、`設置數據`、`加載數據`、`已取消`）
- ✅ 詳細的中文註釋（教學向，解釋 React Hooks 原理）
- ✅ 類型名保持英文（如 `CharAbsoluteFrequencyData`、`CharsetsData`）以保持跨項目兼容性

**使用示例**（見 HomePage.tsx）：

```typescript
const { data: 字頻數據, loading: 字頻加載中, error: 字頻錯誤 } = useCharAbsoluteFrequency('charAbsoluteFrequencySC')
const { data: 字符集數據, loading: 字符集加載中 } = useCharsets()

if (字頻加載中) return <Spin />
if (字頻錯誤) return <Alert title={字頻錯誤} type="error" />

// 使用數據
const 總字符數 = Object.keys(字頻數據).length
const 的頻率 = 字頻數據['的'] || 0
```

### 2.2 碼表解析服務 ✅（已完成，發現已實現）

**實際狀况**：碼表解析功能已在現有服務中實現

**[src/services/builtinCodeTableService.ts](../src/services/builtinCodeTableService.ts)**：

- ✅ `parseRawCodeTable(text: string, format: CodeTableFormat)` - 解析碼表文本
- ✅ 支持字符優先格式（`char_first`）
- ✅ 支持編碼優先格式（`code_first`）
- ✅ 自動計算 N 選位置
- ✅ 錯誤處理（空行、註釋行過濾）
- ✅ 返回 `RawCodeTable` 類型（Map<行號, [字符, 編碼, N選位置]>）

**使用示例**：

```typescript
const { rawCodeTable } = BuiltinCodeTableService.parseRawCodeTable(text, 'char_first')
```

**相關服務**：

- `codeTableProcessingService.ts` - 從 RawCodeTable 生成全碼表/簡碼表等
- `codeTableCleanService.ts` - 碼表清理和優化

### 2.3 統計計算服務整合 ✅（已完成，2小時）

**[src/hooks/useStatistics.ts](../src/hooks/useStatistics.ts)**（195行）：

**實現的 Hooks**：

1. **`useDuplicateStats()`** - 重碼統計 Hook
   - 調用 `calculateCharsetDuplicates()` 計算字符集重碼
   - 返回：`{ data, loading, error, calculate, reset }`
   - 支持異步計算，自動處理加載狀態

2. **`useCodeLengthDistribution()`** - 碼長分布統計 Hook
   - 計算碼表中各碼長的字符數量
   - 返回：`Record<碼長, 字符數>`

3. **`createStatisticsHook(calculator)`** - Hook 工廠函數
   - 通用統計 Hook 創建器
   - 可擴展支持新的統計類型

**已整合的服務**：

- ✅ `duplicateAnalysisService.ts` - 提供 `getStaticDupRate`、`getDynamicDupRate`、`calculateCharsetDuplicates`
- ✅ `maximumCandidatesService.ts` - 候選個數計算（待集成 Hook）
- ✅ `speedAnalysisService.ts` - 速度當量計算（待集成 Hook）
- ✅ `shortCodeEfficiencyService.ts` - 簡碼效率計算（待集成 Hook）

**使用示例**：

```typescript
const { data, loading, error, calculate } = useDuplicateStats()

// 計算 GB2312 字符集重碼率
await calculate('charset', codeTable, { 字符集類型: 'gb2312' })

console.log(data?.duplicateRate) // 0.15 (15% 重碼率)
```

**WASM 遷移計劃**（階段四並行）：

- 4.2 完成後 → 遷移重碼計算到 `chinese-ime-metrics` WASM
- 4.3 完成後 → 添加候選個數 WASM 版本
- 逐步替換性能瓶頸部分

---

## 階段三：佈局與路由 ✅（已完成，4-6小時）

### 3.1 側邊欄導航 ✅

**已創建組件**：[src/components/layout/Sidebar.tsx](../src/components/layout/Sidebar.tsx)（147行）

**已實現功能**：

- ✅ 使用 Ant Design `Menu` + `Layout.Sider` 組件
- ✅ 可折疊/展開（`MenuFoldOutlined` / `MenuUnfoldOutlined` 圖標）
- ✅ 使用 `react-router-dom` 的 `navigate()` 進行路由跳轉
- ✅ 深色主題（`theme="dark"`）
- ✅ 圖標 + 文字（`@ant-design/icons`）

**導航項（9個）**：

1. 首頁（`HomeOutlined`）
2. 碼表上傳（`UploadOutlined`）
3. 重碼分析（`BarChartOutlined`）
4. 候選個數（`NumberOutlined`）
5. 速度當量（`ThunderboltOutlined`）
6. 簡碼效率（`RocketOutlined`）
7. 鍵位熱力（`FireOutlined`）
8. 方案對比（`SwapOutlined`）
9. 設置（`SettingOutlined`）

### 3.2 主佈局優化 ✅

**已更新組件**：[src/components/layout/MainLayout.tsx](../src/components/layout/MainLayout.tsx)（67行）

**已實現功能**：

- ✅ 整合 Sidebar 組件（`<Sidebar />` + `<Layout>` 嵌套結構）
- ✅ 深色主題 Header（`#001529` 背景色）
- ✅ 白色 Content 區域（`#f0f2f5` 外層 + 白色内容卡片）
- ✅ 使用 `<Outlet />` 渲染子路由
- ✅ 響應式佈局（flex 布局，最小高度 100vh）

**佈局結構**：

```typescript
<StyledLayout>
  <Sidebar />  {/* 側邊欄導航 */}
  <Layout>
    <StyledHeader>
      <h1>輸入法測評系統</h1>
    </StyledHeader>
    <StyledContent>
      <ContentInner>
        <Outlet />  {/* 路由内容 */}
      </ContentInner>
    </StyledContent>
    <StyledFooter>
      © {new Date().getFullYear()} 宇浩輸入法
    </StyledFooter>
  </Layout>
</StyledLayout>
```

### 3.3 原子狀態術語統一 ✅

**已更新文件**：

- [src/atoms/codeTable.ts](../src/atoms/codeTable.ts) - 所有 atom 重命名爲「原子狀態」後綴
- [src/atoms/settings.ts](../src/atoms/settings.ts) - 設置和分析參數原子狀態
- [src/atoms/index.ts](../src/atoms/index.ts) - 統一導出

**Jotai 術語規範**：

- **英文 atom** → **中文「原子狀態」**
- 示例：`rawCodeTableAtom` → `原始碼表原子狀態`
- 使用方式：

  ```typescript
  const [碼表, 設置碼表] = useAtom(碼表原子狀態) // 讀寫
  const 碼表 = useAtomValue(碼表原子狀態) // 只讀
  const 設置碼表 = useSetAtom(碼表原子狀態) // 只寫
  ```

**驗證結果**：

- ✅ TypeScript 編譯通過（0 錯誤）
- ✅ 構建成功（1.83s）
- ✅ 開發服務器運行正常（<http://localhost:3001）>
- ✅ 側邊欄導航功能正常
- ✅ Git 提交（commit `ed623d2`）

---

## 階段四：頁面遷移 + WASM 遷移 ⏳（待完成，12-16小時）

**策略**：頁面遷移與 WASM 性能優化並行進行

### 4.1 碼表上傳頁面 ✅（已完成，3小時）

**遷移文件**：`src/components/CodeTableUploaderCard.vue` → `src/pages/UploaderPage.tsx`（366行）

**已實現功能**：

- ✅ 文件拖拽上傳（Upload.Dragger 組件）
- ✅ 預設方案選擇（Select 組件，自動加載並分析）
- ✅ 格式選擇（char_first / code_first）
- ✅ 前綴模式支持（帶幫助 Modal）
- ✅ 編碼預覽表格（前 100 個字符）
- ✅ 自動分析（選擇預設方案時觸發）
- ✅ 錯誤/成功提示（Alert 組件）
- ✅ 全局狀態管理（Jotai 原子狀態）

**已修復問題**：

- ✅ `isInCJKToJ()` 函數異步加載問題
  - 問題：函數依賴 `cjkBlockData`，但數據需異步加載，導致同步調用時返回 `false`
  - 解決：將 `loadCJKBlockData` 導出爲公共函數，在 `parseRawCodeTable` 前調用
  - 修改：`parseRawCodeTable` 改爲 `async` 函數
- ✅ 移除所有 Card 容器，使用簡潔樣式
- ✅ 移除頁面標題（側邊欄已有導航）

**樣式原則**：

- ✅ 只使用必要的内聯樣式（padding、width、margin）
- ✅ 無自定義 styled-components
- ✅ 全部使用 Ant Design 原生組件

**優化點**：

- 使用 Ant Design `Upload` 組件
- 添加加載進度條
- 優化錯誤提示樣式

### 4.2 重碼分析頁面（3-4小時）+ WASM 遷移

**遷移文件**：`src/components/DuplicateAnalysisCard.vue` → `src/pages/DuplicatePage.tsx`

**功能保持**：

- 重碼率計算（先用 `duplicateAnalysisService.ts`）
- 重碼字符列表
- 字符集篩選
- 導出功能

**優化點**：

- 使用 Ant Design `Table` 組件（支持排序、篩選、分頁）
- 添加數據可視化（圖表）
- 優化大數據渲染性能（虚擬滚動）

**WASM 遷移（4.2 完成後）**：

- 在 `chinese-ime-metrics` 中完善重碼計算 WASM 接口
- 創建 `src/services/statsCalculatorWasm.ts`
- 逐步替換 TypeScript 實現爲 WASM 調用
- 性能對比測試

### 4.3 候選個數頁面（2-3小時）+ WASM 擴展

**遷移文件**：`src/components/CandidatesCard.vue` → `src/pages/CandidatesPage.tsx`

**功能保持**：

- 候選個數計算（先用 `maximumCandidatesService.ts`）
- 候選分布圖表
- 字符集篩選

**WASM 擴展（4.3 完成後）**：

- 在 `chinese-ime-metrics` 添加候選個數計算 Rust 實現
- 編譯 WASM 模塊
- 集成到 React 應用

### 4.4 速度當量頁面（2-3小時）

**遷移文件**：`src/components/SpeedEquivCard.vue` → `src/pages/SpeedEquivPage.tsx`

### 4.5 簡碼效率頁面（2-3小時）

**遷移文件**：`src/components/EfficiencyCard.vue` → `src/pages/EfficiencyPage.tsx`

### 4.6 鍵位熱力頁面（2-3小時）

**遷移文件**：`src/components/HeatmapCard.vue` → `src/pages/HeatmapPage.tsx`

### 4.7 方案對比頁面（2-3小時）

**遷移文件**：`src/components/ComparisonCard.vue` → `src/pages/ComparisonPage.tsx`

---

## 階段四點五：方案配置 JSON 系統 ⏳（待完成，8-12小時）

本階段可以與階段四並行進行。

### 🎯 設計目標

構建基於 JSON 的方案配置系統，將輸入法的元數據、參數、測評結果統一存儲，實現：

1. **性能提升**：預計算結果，秒開默認方案對比（重碼分析從 10 秒 → 瞬時加載）
2. **用户體驗**：不強制上傳碼表，支持方案快照，離線也能對比方案
3. **可維護性**：數據結構化，支持增量添加測評指標（向後兼容）
4. **社區友好**：方案作者可提交 JSON，用户可分享測評結果

### 📐 數據結構設計

**文件位置**：`public/schemes/*.json`

```typescript
interface SchemeConfig {
  // ========== 方案數據 ==========
  方案數據: {
    名稱: string // 方案名稱（如「靈明」）
    鍵名: string // 唯一標識（文件名，如「yuling」）
    作者?: string[] // 作者（如「朱宇浩」）
    維護者?: string[] // 維護者（如「社區維護者」）
    版本: string // 版本號（語義版本，如「1.0.0」）
    官網?: string // 官網（如「https://shurufa.app」）
    碼表下載鏈接?: string // 碼表下載鏈接
    描述?: string // 描述
    標籤?: string[] // 標籤（如 ['形碼', '前綴碼', '五碼']）
    創建時間: string // 創建時間（ISO 8601）
    更新時間: string // 更新時間（ISO 8601）
  }

  // ========== 方案參數 ==========
  方案參數: {
    是否爲前綴碼: boolean // 是否爲前綴碼方案
    前綴鍵?: string[] // 前綴鍵（如 ['a','o','e','i','u','_']）
    最大碼長: number // 最大碼長（如 4 或 5）
    編碼規則?: {
      單字?: string // 單字編碼規則描述
      詞語?: string // 詞語編碼規則描述
    }
  }

  // ========== 碼表信息（可選） ==========
  碼表信息?: {
    分隔符: '空格' | '製表符' | '逗號' | '分號'
    第一列類型: '字符' | '編碼'
    總字符數: number // 總字符數
    來源: 'file' | 'url' | 'builtin'
    哈希值?: string // 碼表 SHA-256（用於驗證一致性）
    // 注意：不存儲完整 rawCodeTable（太大，需時從碼表文件生成）
  }

  // ========== 測評結果（增量，可選） ==========
  測評結果?: {
    // 字集覆蓋
    // 記録本方案在各個字集中覆蓋字數
    // 可用來對比本字集理論全部字符數
    字集覆蓋?: {
      gb2312?: number
      通用規範?: number
      常用國字?: number
      cjk基本?: number
      cjk擴A?: number
      cjk擴B?: number
      cjk擴F?: number
      cjk擴J?: number
      更新時間: string
    }

    // 重碼分析
    重碼分析?: {
      靜態重碼: {
        gb2312?: { 組數: number; 字數: number }
        通用規範?: { 組數: number; 字數: number }
        常用國字?: { 組數: number; 字數: number }
        cjk基本?: { 組數: number; 字數: number }
        cjk擴A?: { 組數: number; 字數: number }
        cjk擴B?: { 組數: number; 字數: number }
        cjk擴F?: { 組數: number; 字數: number }
        cjk擴J?: { 組數: number; 字數: number }
      }
      更新時間: string
    }

    // 動態選重率
    動態選重?: {
      知乎字頻?: number
      簡體字頻?: number
      繁體字頻?: number
      古籍字頻?: number
      混合字頻?: number
      更新時間: string
    }

    // 候選個數
    候選個數?: {
      gb2312?: { 個數: number; 編碼: string[] }
      通用規範?: { 個數: number; 編碼: string[] }
      常用國字?: { 個數: number; 編碼: string[] }
      cjk基本?: { 個數: number; 編碼: string[] }
      cjk擴A?: { 個數: number; 編碼: string[] }
      cjk擴B?: { 個數: number; 編碼: string[] }
      cjk擴F?: { 個數: number; 編碼: string[] }
      cjk擴J?: { 個數: number; 編碼: string[] }
      更新時間: string
    }

    // 速度當量
    速度當量?: {
      知乎字頻?: { 全碼: number; 一級簡碼: number; 二級簡碼: number; 全部簡碼: number }
      簡體字頻?: { 全碼: number; 一級簡碼: number; 二級簡碼: number; 全部簡碼: number }
      繁體字頻?: { 全碼: number; 一級簡碼: number; 二級簡碼: number; 全部簡碼: number }
      古籍字頻?: { 全碼: number; 一級簡碼: number; 二級簡碼: number; 全部簡碼: number }
      混合字頻?: { 全碼: number; 一級簡碼: number; 二級簡碼: number; 全部簡碼: number }
      更新時間: string
    }

    // 簡碼效率
    簡碼效率?: {
      知乎字頻?: {
        簡碼數量對應碼長: Record<number, number> // { 1: 26, 2: 650, 3: 5000, 4: 20000 }
        極限碼長: number
      } // 取所有簡碼時候的碼長
      更新時間: string
    }

    // 鍵位熱力
    鍵位熱力?: {
      按鍵頻率: Record<string, number> // { 'a': 0.15, 'o': 0.12, ... }
      手指負擔: Record<string, number> // { '左手食指': 0.2, '右手中指': 0.3, ... }
      左右手分佈: { 左手: number; 右手: number }
      按排分佈: Record<string, number> // { '上排': 0.4, '中排': 0.5, '下排': 0.1 }
      更新時間: string
      是否模擬標點使用頻率: boolean
    }
  }
}
```

**設計原則**：

1. **增量添加**：`results` 字段完全可選，支持部分結果存儲
2. **時間戳管理**：每個結果類型獨立記録 `updatedAt`，方便緩存失效判斷
3. **不存碼表**：完整碼表數據量大，僅存 hash 值用於驗證，需時從碼表文件重新解析
4. **向後兼容**：新增或修改指標時不影響舊 JSON 讀取，如果某指標缺失則需重新計算即可

### 🚀 實施路線圖

#### Phase 1: 類型定義與基礎服務（2小時）

**創建文件**：

```typescript
// src/types/scheme.ts
export interface SchemeConfig {
  /* 見上 */
}
export interface SchemeMetadata {
  /* ... */
}
export interface SchemeParameters {
  /* ... */
}
export interface SchemeResults {
  /* ... */
}

// src/atoms/scheme.ts
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

// 當前方案配置（持久化到 localStorage）
export const 當前方案原子狀態 = atomWithStorage<SchemeConfig | null>('currentScheme', null)

// 預設方案列表
export const 方案列表原子狀態 = atom<SchemeConfig[]>([])

// src/services/schemeService.ts
export class SchemeService {
  // 加載預設方案
  async loadScheme(key: string): Promise<SchemeConfig>

  // 加載所有預設方案列表（僅元數據）
  async loadSchemeList(): Promise<SchemeMetadata[]>

  // 導出爲 JSON
  exportToJSON(scheme: SchemeConfig): string

  // 從 JSON 導入
  importFromJSON(json: string): SchemeConfig

  // 驗證完整性
  validateScheme(scheme: SchemeConfig): { valid: boolean; missing: string[] }

  // 計算缺失的結果
  async computeMissingResults(scheme: SchemeConfig, codeTable: RawCodeTable): Promise<SchemeConfig>

  // 生成碼表 hash
  async generateCodeTableHash(codeTable: RawCodeTable): Promise<string>
}
```

**驗收標準**：

- ✅ TypeScript 編譯通過（0 錯誤）
- ✅ 所有接口導出正確
- ✅ Jotai 原子狀態可正常讀寫

#### Phase 2: 首頁改造（2-3小時）

**目標**：將首頁（HomePage.tsx）改造爲方案配置中心

**功能清單**：

1. **方案元數據編輯器**
   - 輸入：方案名、作者、版本號、官網、描述
   - 選擇：是否前綴碼、最大碼長、碼表格式
   - 標籤管理：添加/删除標籤

2. **方案導入/導出**
   - 導入 JSON 文件（拖拽或選擇）
   - 導出當前方案爲 JSON（下載）
   - 加載預設方案（下拉選擇）

3. **方案狀態顯示**
   - 顯示當前方案名稱和版本
   - 顯示測評結果完整性（哪些指標已計算）
   - 顯示最後更新時間

**UI 設計**（參考 Ant Design）：

```tsx
<Card title="方案配置">
  <Form layout="vertical">
    <Form.Item label="方案名稱">
      <Input />
    </Form.Item>
    {/* ... 其他字段 */}

    <Space>
      <Button icon={<UploadOutlined />}>導入 JSON</Button>
      <Button icon={<DownloadOutlined />}>導出 JSON</Button>
      <Select placeholder="加載預設方案">
        <Option value="yuhao-ming">日月</Option>
        <Option value="yuhao-star">星陳</Option>
        {/* ... */}
      </Select>
    </Space>
  </Form>
</Card>
```

**驗收標準**：

- ✅ 可以編輯方案元數據並保存到 Jotai atom
- ✅ 可以導入/導出 JSON 文件
- ✅ 可以加載預設方案（從 `public/schemes/` 讀取）

#### Phase 3: 碼表上傳頁面改造（1-2小時）

**目標**：使碼表上傳變爲**可選**（如果 JSON 中已有結果）

**變更點**：

1. **條件渲染**

   ```tsx
   {
     !scheme?.results?.duplicate && <Upload.Dragger>上傳碼表</Upload.Dragger>
   }
   {
     scheme?.results?.duplicate && <Alert title="已有測評結果，無需上傳碼表" type="info" />
   }
   ```

2. **從鏈接下載碼表**（新功能）

   ```tsx
   <Input.Search
     placeholder="輸入碼表 URL"
     onSearch={async url => {
       const text = await fetch(url).then(r => r.text())
       // 解析碼表...
     }}
   />
   ```

3. **解析後自動填充 scheme.codeTable**

   ```typescript
   const hash = await schemeService.generateCodeTableHash(rawCodeTable)
   scheme.codeTable = {
     totalChars: rawCodeTable.size,
     source: 'url',
     hash,
   }
   ```

**驗收標準**：

- ✅ 有結果時不要求上傳碼表
- ✅ 支持從 URL 下載碼表
- ✅ 解析後更新 scheme.codeTable 字段

#### Phase 4: 分析頁面改造（2-3小時）

**目標**：優先從 JSON 讀取結果，缺失時才計算

**通用邏輯**（適用所有分析頁面）：

```typescript
// src/pages/DuplicatePage.tsx
const [scheme] = useAtom(當前方案原子狀態)
const [計算中, 設置計算中] = useState(false)

// 1. 檢查 JSON 中是否有結果
const hasResult = scheme?.results?.duplicate != null

// 2. 如果有結果，直接顯示
if (hasResult) {
  return <DuplicateResultsDisplay data={scheme.results.duplicate} />
}

// 3. 如果没有結果，顯示「計算」按鈕
return (
  <>
    <Alert title="尚無測評結果，請上傳碼表並點擊計算" />
    <Button
      onClick={async () => {
        設置計算中(true)
        const results = await calculateDuplicate(rawCodeTable)
        // 更新 scheme
        scheme.results = {
          ...scheme.results,
          duplicate: { ...results, updatedAt: new Date().toISOString() }
        }
        設置當前方案(scheme)
        設置計算中(false)
      }}
      loading={計算中}
    >
      計算重碼率
    </Button>
  </>
)
```

**驗收標準**：

- ✅ 有結果時直接顯示，無需計算
- ✅ 無結果時顯示計算按鈕
- ✅ 計算完成後更新 scheme 並提示導出 JSON

#### Phase 5: 預設方案 JSON 生成（2-3小時）

**目標**：爲現有預設方案生成 JSON 配置文件

**方式 A：手動編寫**（推薦初期）

```bash
public/schemes/
  ├── yuhao-ming.json      # 手動編寫元數據 + 運行測評獲取結果
  ├── yuhao-star.json
  ├── yuhao-light.json
  ├── yuhao-joy.json
  └── sky.json
```

**示例**（`yuhao-ming.json`）：

```json
{
  "metadata": {
    "name": "日月",
    "key": "yuhao-ming",
    "author": "forfudan",
    "version": "1.0.0",
    "website": "https://shurufa.app/",
    "codeTableUrl": "https://shurufa.app/mabiao-ming.txt",
    "description": "宇浩拆分·世上首款純形前綴碼·五碼限長",
    "tags": ["形碼", "前綴碼", "五碼"],
    "createdAt": "2026-02-04T00:00:00Z",
    "updatedAt": "2026-02-04T00:00:00Z"
  },
  "parameters": {
    "isPrefix": true,
    "prefixKeys": ["a", "o", "e", "i", "u", "_"],
    "maxCodeLength": 5,
    "codeTableFormat": "code_first"
  },
  "codeTable": {
    "totalChars": 95000,
    "source": "url",
    "hash": "abc123..."
  },
  "results": {
    "duplicate": {
      "staticRate": {
        "gb2312": { "rate": 0.15, "duplicateChars": 1050, "totalChars": 7000 }
        // ... 其他字符集
      },
      "updatedAt": "2026-02-04T10:00:00Z"
    }
    // ... 其他測評結果（按需添加）
  }
}
```

**方式 B：自動化腳本**（未來優化）

```typescript
// scripts/generate-scheme-json.ts
// 從碼表文件自動生成 JSON（運行所有測評並保存結果）
```

**驗收標準**：

- ✅ 至少 3 個預設方案有完整 JSON（含測評結果）
- ✅ 可以在首頁加載並顯示

#### Phase 6: 方案對比頁面（1-2小時）

**目標**：支持多方案並排對比（從 JSON 加載）

**功能清單**：

1. **方案選擇**

   ```tsx
   <Select mode="multiple" placeholder="選擇要對比的方案">
     <Option value="yuhao-ming">日月</Option>
     <Option value="yuhao-star">星陳</Option>
     {/* ... */}
   </Select>
   ```

2. **上傳用户 JSON**

   ```tsx
   <Upload accept=".json" onChange={handleUpload}>
     上傳自定義方案
   </Upload>
   ```

3. **並排顯示**

   ```tsx
   <Table
     columns={[
       { title: '指標', dataIndex: 'metric' },
       { title: '日月', dataIndex: 'yuhao-ming' },
       { title: '星陳', dataIndex: 'yuhao-star' },
     ]}
   />
   ```

**驗收標準**：

- ✅ 可以選擇多個預設方案對比
- ✅ 可以上傳用户 JSON 參與對比
- ✅ 表格清晰顯示各方案指標差異

### 📂 文件結構

```text
src/
├── types/
│   └── scheme.ts              # SchemeConfig 接口
├── atoms/
│   └── scheme.ts              # 方案狀態原子
├── services/
│   └── schemeService.ts       # 方案管理服務
├── pages/
│   ├── HomePage.tsx           # 方案配置中心（改造）
│   ├── UploaderPage.tsx       # 碼表上傳（改造爲可選）
│   ├── DuplicatePage.tsx      # 重碼分析（改造爲讀取 JSON）
│   └── ComparisonPage.tsx     # 方案對比（新增）
└── ...

public/
└── schemes/                   # 預設方案 JSON
    ├── yuhao-ming.json
    ├── yuhao-star.json
    ├── yuhao-light.json
    ├── yuhao-joy.json
    └── sky.json
```

### ⏱️ 時間估算

| Phase    | 任務               | 時間       |
| -------- | ------------------ | ---------- |
| 1        | 類型定義與基礎服務 | 2h         |
| 2        | 首頁改造           | 2-3h       |
| 3        | 碼表上傳頁面改造   | 1-2h       |
| 4        | 分析頁面改造       | 2-3h       |
| 5        | 預設方案 JSON 生成 | 2-3h       |
| 6        | 方案對比頁面       | 1-2h       |
| **總計** |                    | **10-15h** |

### 🎯 驗收標準

1. ✅ 可以加載預設方案（從 `public/schemes/` 讀取 JSON）
2. ✅ 可以導入/導出用户方案 JSON
3. ✅ 分析頁面優先讀取 JSON 結果，缺失時才計算
4. ✅ 計算完成後可將結果保存回 scheme 並導出
5. ✅ 方案對比頁面可並排顯示多個方案
6. ✅ 至少 3 個預設方案有完整測評結果

---

## 階段五：樣式統一 ⏳（待完成，4-5小時）

### 5.1 主題系統

**創建文件**：`src/styles/theme.ts`

```typescript
export const 主題配置 = {
  顔色: {
    主色: '#1890ff',
    成功色: '#52c41a',
    警告色: '#faad14',
    錯誤色: '#f5222d',
    // ...
  },
  間距: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  // ...
}
```

### 5.2 通用組件樣式

**創建組件**：

- `src/components/common/Card.tsx`
- `src/components/common/Button.tsx`
- `src/components/common/Input.tsx`

### 5.3 響應式優化

- 移動端適配（斷點：576px、768px、992px、1200px）
- 觸摸操作優化
- 移動端導航菜單

---

## 階段六：性能優化 ⏳（待完成，3-4小時）

### 6.1 代碼分割

- React.lazy + Suspense 延遲加載頁面
- 按需加載 Ant Design 圖標

### 6.2 數據緩存

- 使用 Jotai 持久化緩存字頻/詞頻數據
- IndexedDB 存儲大型數據

### 6.3 計算優化

- Web Worker 處理重計算
- 防抖/節流優化輸入

---

## 階段七：測試與部署 ⏳（待完成，2-3小時）

### 7.1 測試

- 單元測試（Jest + React Testing Library）
- E2E 測試（Playwright）

### 7.2 部署

- 構建優化
- GitHub Pages 部署
- 添加 PWA 支持

---

## 技術債務與未來計劃

### 已知問題

- ⚠️ Ant Design 體積較大（640 kB），考慮按需加載優化
- ⚠️ 現有 Vue 組件（`src/components/*.vue`）尚未遷移，暫時保留
- ⚠️ 現有樣式文件（`src/styles/*.css`）已保留，需逐步重構爲 styled-components
- ⚠️ **路由切換導致頁面重新渲染問題**（2026-02-04 識别）
  - **現象**：切換到其他頁面再返回時，計算頁面會完全重新渲染，本地狀態（如表格數據、UI狀態）丢失
  - **影響**：用户需要重新觸發計算，等待時間長（尤其是重碼分析等耗時操作）
  - **原因**：React Router 默認會卸載（unmount）離開的組件，再次進入時重新挂載（mount）

### 未來優化 - 路由狀態保持方案

**問題詳述**：
切換路由時，React Router 默認行爲是：

1. 離開頁面 → 組件卸載（unmount）→ 本地狀態丢失
2. 返回頁面 → 組件重新挂載（mount）→ 重新計算

**影響範圍**：

- 重碼分析頁面（計算耗時：5-10秒）
- 動態選重率頁面（計算耗時：10-20秒）
- 碼長分布頁面（計算耗時：3-5秒）

**可選方案**（按推薦度排序）：

#### 方案 A：全局狀態管理 ⭐⭐⭐⭐⭐

**思路**：將計算結果存儲到 Jotai 全局原子狀態中

**優點**：

- ✅ 實現簡單，與現有架構一致（已在用 Jotai）
- ✅ 狀態跨路由持久化
- ✅ 可選擇性持久化到 localStorage（`atomWithStorage`）
- ✅ 類型安全

**實現要點**：

```typescript
// src/atoms/analysis.ts
export const 重碼分析結果原子狀態 = atom<DuplicateAnalysisResult | null>(null)
export const 動態選重率結果原子狀態 = atom<DynamicRateResult | null>(null)
export const 碼長分布結果原子狀態 = atom<CodeLengthDistribution | null>(null)

// 在頁面組件中
const [結果, 設置結果] = useAtom(重碼分析結果原子狀態)

// 只在結果爲空時計算
useEffect(() => {
  if (!結果 && 碼表) {
    執行計算()
  }
}, [碼表, 結果])
```

**缺點**：

- ❌ 需要手動管理緩存失效（碼表更新時清空結果）
- ❌ 内存占用增加（結果長期駐留）

**預估工時**：1-2小時

---

#### 方案 B：React Router Outlet Context ⭐⭐⭐⭐

**思路**：在 MainLayout 中管理所有頁面狀態，通過 Outlet context 傳遞

**優點**：

- ✅ 集中管理，邏輯清晰
- ✅ 狀態與路由綁定
- ✅ 不依賴全局狀態庫

**實現要點**：

```typescript
// MainLayout.tsx
const [頁面狀態, 設置頁面狀態] = useState({
  uploader: { /* ... */ },
  duplicate: { 結果: null, 加載中: false },
  dynamic: { 結果: null, 加載中: false }
})

<Outlet context={{ 頁面狀態, 設置頁面狀態 }} />

// 子頁面
const { 頁面狀態, 設置頁面狀態 } = useOutletContext()
```

**缺點**：

- ❌ MainLayout 變得臃腫
- ❌ Context 更新會導致所有子組件重新渲染（需要 memo 優化）

**預估工時**：2-3小時

---

#### 方案 C：自定義路由緩存（KeepAlive） ⭐⭐⭐

**思路**：用 `display: none` 隱藏組件而不卸載

**優點**：

- ✅ 完全保留組件狀態（包括 DOM、事件監聽器）
- ✅ 類似 Vue 的 `<keep-alive>` 體驗

**實現要點**：

```typescript
// CachedOutlet.tsx
const [緩存頁面, 設置緩存頁面] = useState<Map<string, ReactElement>>(new Map())

useEffect(() => {
  const 當前組件 = <Outlet />
  設置緩存頁面(prev => new Map(prev).set(location.pathname, 當前組件))
}, [location])

return (
  <>
    {Array.from(緩存頁面).map(([path, element]) => (
      <div key={path} style={{ display: path === location.pathname ? 'block' : 'none' }}>
        {element}
      </div>
    ))}
  </>
)
```

**缺點**：

- ❌ 實現複雜，需要處理緩存清理邏輯
- ❌ 内存占用高（所有訪問過的頁面都保留在 DOM 中）
- ❌ 可能影響性能（大量隱藏 DOM 節點）
- ❌ 生命週期管理複雜（何時清理緩存？）

**預估工時**：4-6小時

---

#### 方案 D：IndexedDB 持久化 ⭐⭐

**思路**：將計算結果存儲到瀏覽器本地數據庫

**優點**：

- ✅ 跨會話持久化（刷新頁面後仍保留）
- ✅ 不占用内存
- ✅ 存儲容量大（至少 50MB）

**實現要點**：

```typescript
// 使用 idb-keyval 簡化 IndexedDB 操作
import { get, set } from 'idb-keyval'

// 保存結果
await set('duplicate-result', 結果)

// 讀取結果
const 緩存結果 = await get('duplicate-result')
```

**缺點**：

- ❌ 異步操作，增加複雜度
- ❌ 需要處理數據版本問題（碼表更新後緩存失效）
- ❌ 序列化開銷（Map/Set 需要轉換）

**預估工時**：2-3小時

---

#### 方案 E：React.memo + useMemo 優化 ⭐⭐

**思路**：減少不必要的重新渲染和計算

**優點**：

- ✅ 標準 React 優化手段
- ✅ 無需額外狀態管理

**實現要點**：

```typescript
const 計算結果 = useMemo(() => {
  if (!碼表) return null
  return 執行重碼分析(碼表)
}, [碼表]) // 只在碼表變化時重新計算

export default React.memo(DuplicateAnalysisPage)
```

**缺點**：

- ❌ **無法解決路由切換導致組件卸載的問題**（組件卸載後 useMemo 緩存也丢失）
- ❌ 只能減少組件内部的重複計算

**結論**：此方案**無法解決**路由切換問題，但可作爲輔助優化

---

### 推薦方案

**短期（立即實施）**：

- 🎯 **方案 A：全局狀態管理**（推薦）
  - 與現有架構無縫集成
  - 工時短，風險低
  - 足以解決當前問題

**中期（視需求）**：

- 方案 D：IndexedDB 持久化（可選）
  - 適合需要跨會話保留結果的場景

**長期（性能極致優化）**：

- 方案 C：自定義路由緩存
  - 僅在性能成爲瓶頸時考慮
  - 需要完善的緩存管理策略

---

### 其他未來優化

- 考慮實現 normalize-traditional-chars.ts 的引號跳過邏輯（如果字符串字面量轉換導致問題）
- 添加單元測試覆蓋率要求
- 實現 CI/CD 自動化部署
- 優化 ui-vendor 體積（tree-shaking、動態導入）
- idb-keyval 文檔：<https://github.com/jakearchibald/idb-keyval>（如選擇 IndexedDB 方案）

### 長期計劃

#### YAML 格式兼容性 ⏳（長期目標）

**背景**：當前方案配置系統使用 JSON 格式（階段四點五），未來可考慮兼容 YAML 格式以提升可讀性。

**優勢**：

- ✅ 更友好的手動編輯體驗（支持註釋、多行字符串）
- ✅ 與 [hanzi-chai](https://github.com/hanzi-chai/hanzi-chai.github.io) 等項目生態對齊
- ✅ 適合方案作者直接編寫配置

**實施方案**：

1. **内部保持 JSON**
   - `public/schemes/` 繼續使用 JSON 格式
   - TypeScript 類型安全、解析速度快

2. **提供 YAML 導入/導出**

   ```typescript
   // src/services/schemeService.ts
   import yaml from 'js-yaml'

   export function exportToYAML(scheme: SchemeConfig): string {
     return yaml.dump(scheme, {
       indent: 2,
       lineWidth: 100,
       noRefs: true,
     })
   }

   export function importFromYAML(yamlText: string): SchemeConfig {
     const data = yaml.load(yamlText)
     // + Zod 校驗
     return data as SchemeConfig
   }
   ```

3. **用户可選格式**
   - 導出時選擇 JSON 或 YAML
   - 導入時自動識别格式（根據文件擴展名或内容）

**預估工時**：2-3 小時（在階段四點五完成後）

**依賴庫**：

- `js-yaml` (45KB gzipped) - 成熟的 YAML 解析器
- 文檔：<https://github.com/nodeca/js-yaml>

#### 社區方案提交機制 ⏳（長期目標）

**目標**：允許社區貢獻輸入法方案配置

**實施方案**：

1. **GitHub PR 流程**
   - 方案作者提交 PR 到 `public/schemes/`
   - 包含完整測評結果的 JSON 文件
   - CI 自動驗證 JSON 格式和完整性

2. **方案審核標準**
   - 必填字段完整（metadata、parameters）
   - 至少包含 1 項測評結果（如重碼率）
   - 方案名稱和 key 唯一（不與現有方案衝突）
   - 碼表來源可訪問（codeTableUrl 有效）

3. **自動化工具**

   ```bash
   # scripts/validate-scheme.ts
   # 驗證 JSON 格式、檢查必填字段、運行測試
   pnpm run validate-scheme public/schemes/new-scheme.json
   ```

**預估工時**：3-4 小時（在階段四點五完成後）

---

## 參考資源

- React 19 文檔：<https://react.dev/>
- Ant Design 文檔：<https://ant-design.antgroup.com/>
- Jotai 文檔：<https://jotai.org/>
- styled-components 文檔：<https://styled-components.com/>
- chinese-ime-metrics：[../chinese-ime-metrics/README.md](../../chinese-ime-metrics/README.md)
- GujiCC 字形標準：<https://github.com/forfudan/GujiCC>

---

## 維護指南

### 完成一個階段後的步驟

1. **更新本文檔**：
   - 將對應階段標記爲 ✅
   - 更新「重構進度總覽」部分
   - 記録實際完成時間和遇到的問題
   - 更新「已知問題」和「技術債務」

2. **提交代碼**：

   ```bash
   git add .
   git commit -m "完成階段X：簡短描述"
   git push
   ```

3. **驗證構建**：

   ```bash
   pnpm run build  # 確保構建成功
   pnpm run lint   # 確保代碼規範
   ```

4. **更新 instructions**：
   - 確保 `.github/copilot-instructions.md` 反映最新的代碼風格和規範

### 遇到問題時

- 記録到「已知問題」部分
- 評估是否需要調整計劃
- 考慮創建新的子分支測試解決方案

### 變更計劃時

- 更新對應階段的「功能需求」和「函數簽名」
- 調整時間估算
- 在「未來優化」中説明原因
