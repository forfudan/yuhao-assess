# 宇浩·漢字輸入法測評系統 - 重構路線圖

## 概述

本項目正在進行從 Vue 3 到 React + TypeScript 的架構重構，旨在提升代碼質量、性能和可維護性。

### 核心目標

1. **架構解耦**：分離樣式、組件、業務邏輯，實現模塊化
2. **樣式簡化**：統一主題系統，復用樣式組件，減少冗余 CSS
3. **性能優化**：側邊欄導航 + 延遲加載，避免卡片同時渲染
4. **倉庫優化**：數據文件外部化管理（獨立倉庫 + CDN）
5. **代碼規範**：使用 pre-commit 自動格式化多種文件類型並進行字形統一
6. **核心分離**：將計算邏輯逐步遷移到 `chinese-ime-metrics` 庫
7. **變量命名**：變量統一使用繁體中文命名，提升可讀性

### 📦 數據文件管理方案

**問題**：`public/data/` 包含 1.5MB 數據文件，頻繁更新會污染 Git 歷史。

**解決方案**：使用獨立倉庫 [yuhao-assess-data](https://github.com/forfudan/yuhao-assess-data)

| 環境     | 數據來源                | 説明                        |
| -------- | ----------------------- | --------------------------- |
| **開發** | `/public/data/`（本地） | `.gitignore` 忽略，手動同步 |
| **生産** | GitHub Pages CDN        | 自動從 CDN 加載             |

**優勢**：

- ✅ 主倉庫輕量（不含數據文件）
- ✅ 數據更新支持覆蓋式提交（`commit --amend` + `push -f`）
- ✅ 無需 Git LFS（節省存儲成本）
- ✅ CDN 加速 + 瀏覽器緩存

**數據文件命名規範**（2026-02-03 更新）：

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

詳見：[src/utils/data-loader.ts](../src/utils/data-loader.ts)

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

**實施方案**：使用獨立倉庫 [yuhao-assess-data](https://github.com/forfudan/yuhao-assess-data) 管理數據文件

**倉庫結構**：

```text
/Users/ZHU/Programs/ime/
├── yuhao-assess/              # 主應用
│   ├── public/data/          # ← .gitignore（開發保留，Git 忽略）
│   └── src/utils/
│       └── data-loader.ts    # ← CDN 加載工具
│
└── yuhao-assess-data/         # 數據倉庫（獨立 Git）
    ├── charFrequency*.json
    └── ...（9 個文件，1.5MB）
```

**已完成**：

- ✅ 創建 `yuhao-assess-data` 倉庫
- ✅ 添加 `public/data/` 到 `.gitignore`
- ✅ 創建 `src/utils/data-loader.ts`
- ✅ 開發環境用本地文件，生産環境用 CDN

**數據同步機制**：

1. **開發環境**：運行 `pnpm run fetch` 從 CDN 下載數據到 `public/data/`
2. **生産環境**：運行時直接從 CDN 讀取（不需要本地文件）
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
if (字頻錯誤) return <Alert message={字頻錯誤} type="error" />

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
      <h1>宇浩·漢字輸入法測評系統</h1>
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
