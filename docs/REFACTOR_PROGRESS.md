# React 重構進度記錄

## 第一階段：React 基礎架構 ✅

### 完成內容

#### 1. 依賴遷移 ✅

- **移除的包**（24個）：
  - Vue 核心：`vue@3.5.19`
  - Vue 工具：`@vitejs/plugin-vue`, `vue-tsc`
  - Vue TypeScript：`@vue/eslint-config-typescript`, `@vue/tsconfig`
  - Vue ESLint：`eslint-plugin-vue`
  - Vue 工具庫：`@vueuse/core`

- **新增的包**（84個核心 + 165個開發依賴）：
  - React 核心：`react@19.2.4`, `react-dom@19.2.4`
  - 路由：`react-router-dom@7.13.0`
  - UI 框架：`antd@6.2.3` (11.77 MB)
  - 樣式方案：`styled-components@6.3.8`
  - 狀態管理：`jotai@2.17.0`
  - TypeScript 支持：`@types/react@19.2.10`, `@types/react-dom@19.2.3`
  - Vite 插件：`@vitejs/plugin-react@5.1.3`
  - ESLint 插件：`eslint-plugin-react@7.37.5`, `eslint-plugin-react-hooks@7.0.1`

#### 2. 構建配置更新 ✅

- **[vite.config.ts](vite.config.ts)**：
  - 將 `@vitejs/plugin-vue` 替換為 `@vitejs/plugin-react`
  - 添加路徑別名：`'@': resolve(__dirname, 'src')`
  - 配置代碼分割策略：
    - `react-vendor`: React 核心庫 (45.48 kB)
    - `ui-vendor`: Ant Design + styled-components (611.60 kB)
    - `state-vendor`: Jotai (0.04 kB)
  - 保持端口 3000，開啟自動打開瀏覽器

- **[tsconfig.json](tsconfig.json)**：
  - JSX 配置：`"jsx": "react-jsx"`（React 17+ 新 JSX 轉換）
  - 目標版本：`ES2021`（支持 replaceAll 等新特性）
  - 模塊解析：`"moduleResolution": "bundler"`（Vite 優化）
  - 路徑別名：`"@/*": ["src/*"]`
  - 包含文件：添加 `env.d.ts` 以支持 `import.meta.env`

- **[env.d.ts](env.d.ts)**：
  - 移除 Vue 模塊聲明
  - 添加 Vite 環境變量類型：`ImportMetaEnv` 接口

- **[index.html](index.html)**：
  - 根節點：`<div id="app">` → `<div id="root">`
  - 入口文件：`/src/main.ts` → `/src/main.tsx`

- **[package.json](package.json)**：
  - 構建腳本：`vue-tsc && vite build` → `tsc && vite build`
  - Lint 範圍：`.vue,.js,.jsx,.ts,.tsx` → `.ts,.tsx`
  - lint-staged：移除 `.vue` 文件處理

#### 3. 目錄結構創建 ✅

新增以下目錄：

```text
src/
├── pages/              # 頁面組件
├── components/
│   ├── layout/        # 佈局組件
│   ├── common/        # 通用組件
│   └── charts/        # 圖表組件
├── atoms/             # Jotai 狀態原子
├── hooks/             # 自定義 React Hooks
└── styles/            # 全局樣式（已存在，保留）
```

#### 4. 核心文件創建 ✅

**狀態管理（Jotai）**：

- [src/atoms/codeTable.ts](src/atoms/codeTable.ts)：碼表數據狀態
  - `rawCodeTableAtom`：原始碼表文本
  - `codeTableAtom`：解析後的碼表對象
  - `codeTableMetaAtom`：碼表元數據（持久化）
  - `codeTableLoadingAtom`、`codeTableErrorAtom`：加載狀態

- [src/atoms/settings.ts](src/atoms/settings.ts)：應用設置（全部持久化）
  - `settingsAtom`：字符集、統計、顯示設置
  - `analysisParamsAtom`：分析參數配置

- [src/atoms/index.ts](src/atoms/index.ts)：狀態導出

**React 應用入口**：

- [src/main.tsx](src/main.tsx)：
  - React 18+ `createRoot` API
  - `BrowserRouter` 路由配置
  - Ant Design `ConfigProvider`（繁體中文 locale）
  - 嚴格模式 + 全局樣式注入

- [src/App.tsx](src/App.tsx)：
  - 使用 `react-router-dom` 的 `useRoutes`
  - 定義路由結構（主佈局 + 首頁）

**佈局與頁面**：

- [src/components/layout/MainLayout.tsx](src/components/layout/MainLayout.tsx)：
  - 使用 Ant Design `Layout` 組件
  - styled-components 自定義樣式
  - Header、Content（最大寬度 1400px）、Footer 結構

- [src/pages/HomePage.tsx](src/pages/HomePage.tsx)：
  - 臨時佔位頁面，顯示重構進度提示

#### 5. 驗證結果 ✅

- ✅ TypeScript 編譯：`tsc --noEmit` 通過（0 錯誤）
- ✅ Vite 構建：`pnpm run build` 成功（1.42秒）
- ✅ 開發服務器：`pnpm run dev` 啟動在 <http://localhost:3000>
- ✅ 代碼分割：
  - `index.js`: 7.72 kB（應用主邏輯）
  - `react-vendor.js`: 45.48 kB（React 核心）
  - `ui-vendor.js`: 611.60 kB（Ant Design，gzip 後 197.37 kB）
  - `state-vendor.js`: 0.04 kB（Jotai）

### 技術決策說明

#### 為什麼選擇這些技術？

1. **React 19.2.4**：最新穩定版，支持並發特性和最新 Hooks
2. **Ant Design 6.2.3**：成熟的企業級 UI 庫，組件豐富，支持繁體中文
3. **styled-components**：CSS-in-JS，避免樣式衝突，支持主題切換
4. **Jotai**：輕量級狀態管理（比 Redux 簡單，比 Context 高效）
5. **React Router 7**：最新路由方案，支持數據加載和錯誤邊界

#### 代碼分割策略

- **react-vendor**：React 核心很少變化，單獨緩存
- **ui-vendor**：Ant Design 體積大但穩定，避免重複加載
- **state-vendor**：Jotai 極小，單獨分離便於按需加載

### 下一步工作（階段二）

根據 [ROADMAP.md](docs/ROADMAP.md)，接下來需要完成：

#### 階段二：核心服務遷移（8-10小時）

1. **碼表解析服務**（3-4小時）
   - 遷移 `src/services/CodeTableParser.vue`
   - 創建 `src/services/codeTableParser.ts`
   - 支持字符優先/編碼優先兩種格式

2. **數據加載服務**（2-3小時）
   - 已完成 `src/utils/data-loader.ts`
   - 創建 React Hooks：`useCharFrequency`, `useWordFrequency`, `useCharsets`

3. **統計計算服務**（3-4小時）
   - 遷移重碼率、選重率計算邏輯
   - 創建 `src/services/statsCalculator.ts`
   - 優化性能（使用 Web Worker？）

### 注意事項

- ⚠️ Ant Design 體積較大（611 kB），考慮使用按需加載
- ⚠️ 現有 Vue 組件（`src/components/*.vue`）尚未遷移，暫時保留
- ⚠️ 現有樣式文件（`src/styles/*.css`）已保留，需逐步重構為 styled-components
- ⚠️ `chinese-ime-metrics` 依賴需要驗證 React 兼容性

### 參考資源

- React 19 文檔：<https://react.dev/>
- Ant Design 文檔：<https://ant-design.antgroup.com/>
- Jotai 文檔：<https://jotai.org/>
- styled-components 文檔：<https://styled-components.com/>
