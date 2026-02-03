# yuhao-assess 重構路線圖

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

詳見：[src/utils/data-loader.ts](../src/utils/data-loader.ts)

---

## 重構進度總覽

### ✅ 已完成階段

- **階段零**：基礎設施（2-3小時） ✅
- **階段一**：React 基礎架構（6-8小時） ✅
- **階段二（部分）**：數據加載 Hooks（2小時） ✅

### 🚧 進行中

- **階段二**：核心服務遷移（剩餘 6-8小時）

### ⏳ 待完成

- **階段三**：佈局與路由（4-6小時）
- **階段四**：頁面遷移（12-16小時）
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

**下一步**（需手動操作）：

1. 在 GitHub 創建 `yuhao-assess-data` 倉庫
2. 推送數據：`cd ../yuhao-assess-data && git push -u origin main`
3. 啟用 GitHub Pages（Settings → Pages → main branch）
4. ⚠️ **重構完成後**：删除 `public/data/*.json`（生産環境會自動從 CDN 加載）

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

1. **`useCharFrequency(文件名: string)`** - 加載字頻數據
   - 參數：`文件名`（如 `'charFrequencySC'`、`'charFrequencyTC'`）
   - 返回：`{ data: 數據, loading: 加載中, error: 錯誤, refetch: 重新加載 }`
   - 特性：
     - ✅ 自動加載數據（開發環境用本地，生産環境用 CDN）
     - ✅ 取消請求邏輯（防止競態條件）
     - ✅ 錯誤處理（捕獲加載失敗）
     - ✅ 支持重新加載（`refetch` 函數）

2. **`useWordFrequency(文件名: string)`** - 加載詞頻數據
   - 與 `useCharFrequency` 類似，用於加載詞頻文件
   - 返回類型相同

3. **`useCharsets()`** - 加載字符集數據
   - 無參數，固定加載 `charsets.json`
   - 返回：`{ data: 數據, loading: 加載中, error: 錯誤, refetch: 重新加載 }`
   - 數據包含：GB2312、GBK、通用規範漢字表、BIG5、常用國字標準字體表等

**變量命名**：

- ✅ **全部使用繁體中文**（如：`數據`、`加載中`、`錯誤`、`設置數據`、`加載數據`、`已取消`）
- ✅ 詳細的中文註釋（教學向，解釋 React Hooks 原理）
- ✅ 類型名保持英文（如 `CharFrequencyData`、`CharsetsData`）以保持跨項目兼容性

**使用示例**（見 HomePage.tsx）：

```typescript
const { data: 字頻數據, loading: 字頻加載中, error: 字頻錯誤 } = useCharFrequency('charFrequencySC')
const { data: 字符集數據, loading: 字符集加載中 } = useCharsets()

if (字頻加載中) return <Spin />
if (字頻錯誤) return <Alert message={字頻錯誤} type="error" />

// 使用數據
const 總字符數 = Object.keys(字頻數據).length
const 的頻率 = 字頻數據['的'] || 0
```

### 2.2 碼表解析服務（待完成，3-4小時）

**目標**：遷移 `src/services/CodeTableParser.vue` 到 TypeScript 服務

**計劃創建**：`src/services/codeTableParser.ts`

**功能需求**：

- 支持字符優先格式（`字符 編碼1 編碼2 ...`）
- 支持編碼優先格式（`編碼 字符1 字符2 ...`）
- 自動檢測格式
- 解析爲 `CodeTable` 類型
- 錯誤處理（無效格式、空文件等）

**函數簽名**（計劃）：

```typescript
export function 解析碼表(内容: string): CodeTable
export function 檢測格式(内容: string): '字符優先' | '編碼優先' | null
export function 驗證碼表(碼表: CodeTable): boolean
```

### 2.3 統計計算服務（待完成，3-4小時）

**目標**：創建統計計算服務，整合 `chinese-ime-metrics` WASM 模塊

**計劃創建**：`src/services/statsCalculator.ts`

**功能需求**：

- 計算重碼率（duplicate rate）
- 計算選重率（dynamic selection rate）
- 計算碼長分布（code length distribution）
- 支持多種字符集（GB2312、GBK、通用規範漢字表等）
- 支持自定義字頻/詞頻

**函數簽名**（計劃）：

```typescript
export function 計算重碼率(碼表: CodeTable, 選項: 統計選項): 重碼統計結果
export function 計算選重率(碼表: CodeTable, 選項: 統計選項): 選重統計結果
export function 計算碼長分布(碼表: CodeTable): 碼長分布結果
```

**性能考慮**：

- 考慮使用 Web Worker 處理大量數據
- 利用 `chinese-ime-metrics` WASM 模塊加速計算
- 實現進度回調（用於長時間計算）

---

## 階段三：佈局與路由 ⏳（待完成，4-6小時）

### 3.1 側邊欄導航

**創建組件**：`src/components/layout/Sidebar.tsx`

**功能需求**：

- 使用 Ant Design `Menu` 組件
- 支持折疊/展開
- 高亮當前頁面
- 圖標 + 文字（使用 Ant Design Icons）

**導航項**：

1. 首頁 / 歡迎
2. 碼表上傳
3. 重碼分析
4. 候選個數
5. 速度當量
6. 簡碼效率
7. 鍵位熱力
8. 方案對比
9. 設置

### 3.2 路由配置

**更新文件**：`src/App.tsx`

**路由結構**：

```typescript
const 路由配置 = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/uploader', element: <UploaderPage /> },
      { path: '/duplicate', element: <DuplicatePage /> },
      { path: '/candidates', element: <CandidatesPage /> },
      { path: '/speed-equiv', element: <SpeedEquivPage /> },
      { path: '/efficiency', element: <EfficiencyPage /> },
      { path: '/heatmap', element: <HeatmapPage /> },
      { path: '/comparison', element: <ComparisonPage /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
]
```

### 3.3 佈局優化

**更新組件**：`src/components/layout/MainLayout.tsx`

- 添加 Sidebar 組件
- 實現響應式佈局（移動端折疊側邊欄）
- Content 區域添加麵包屑導航
- 添加頁面過渡動畫

---

## 階段四：頁面遷移 ⏳（待完成，12-16小時）

### 4.1 碼表上傳頁面（2-3小時）

**遷移文件**：`src/components/CodeTableUploaderCard.vue` → `src/pages/UploaderPage.tsx`

**功能保持**：

- 文件拖拽上傳
- 格式檢測
- 預覽前 10 行
- 錯誤提示

**優化點**：

- 使用 Ant Design `Upload` 組件
- 添加加載進度條
- 優化錯誤提示樣式

### 4.2 重碼分析頁面（3-4小時）

**遷移文件**：`src/components/DuplicateAnalysisCard.vue` → `src/pages/DuplicatePage.tsx`

**功能保持**：

- 重碼率計算
- 重碼字符列表
- 字符集篩選
- 導出功能

**優化點**：

- 使用 Ant Design `Table` 組件（支持排序、篩選、分頁）
- 添加數據可視化（圖表）
- 優化大數據渲染性能（虚擬滚動）

### 4.3 候選個數頁面（2-3小時）

**遷移文件**：`src/components/CandidatesCard.vue` → `src/pages/CandidatesPage.tsx`

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

### 未來優化

- 考慮實現 normalize-traditional-chars.ts 的引號跳過邏輯（如果字符串字面量轉換導致問題）
- 添加單元測試覆蓋率要求
- 實現 CI/CD 自動化部署
- 優化 ui-vendor 體積（tree-shaking、動態導入）

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
