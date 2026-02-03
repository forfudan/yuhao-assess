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
7. **變量命名**：變量統一使用漢字命名，提升可讀性

### 📦 數據文件管理方案

**問題**：`public/data/` 包含 1.5MB 數據文件，頻繁更新會污染 Git 歷史。

**解決方案**：使用獨立倉庫 [yuhao-assess-data](https://github.com/forfudan/yuhao-assess-data)

| 環境 | 數據來源 | 說明 |
| --- | --- | --- |
| **開發** | `/public/data/`（本地） | `.gitignore` 忽略，手動同步 |
| **生產** | GitHub Pages CDN | 自動從 CDN 加載 |

**優勢**：

- ✅ 主倉庫輕量（不含數據文件）
- ✅ 數據更新支持覆蓋式提交（`commit --amend` + `push -f`）
- ✅ 無需 Git LFS（節省存儲成本）
- ✅ CDN 加速 + 瀏覽器緩存

詳見：[src/utils/data-loader.ts](../src/utils/data-loader.ts)

---

## 階段零：基礎設施（預計 2-3 小時）

### 0.1 數據文件外部化（已完成 ✅）

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
- ✅ 開發環境用本地文件，生產環境用 CDN

**下一步**（需手動操作）：

1. 在 GitHub 創建 `yuhao-assess-data` 倉庫
2. 推送數據：`cd ../yuhao-assess-data && git push -u origin main`
3. 啟用 GitHub Pages（Settings → Pages → main branch）
4. ⚠️ **重構完成後**：刪除 `public/data/*.json`（生產環境會自動從 CDN 加載）

### 0.2 Pre-commit Hook 設置

**目標**：統一代碼風格，自動格式化不同類型文件

**安裝依賴**：

```bash
# 代碼格式化與檢查
pnpm add -D husky lint-staged prettier eslint
pnpm add -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
pnpm add -D eslint-plugin-react eslint-plugin-react-hooks

# Markdown 格式化與檢查
pnpm add -D markdownlint-cli2 markdownlint-cli2-formatter-pretty
```

**配置文件**：

```json
// package.json
{
  "scripts": {
    "prepare": "husky install",
    "lint": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"**/*.{ts,tsx,json,md,css}\"",
    "normalize-chars": "node scripts/normalize-traditional-chars.js"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "pnpm exec tsx src/utils/normalize-traditional-chars.ts",
      "eslint --fix",
      "prettier --write"
    ],
    "*.md": [
      "markdownlint-cli2 --fix",
      "prettier --write"
    ],
    "*.json": ["prettier --write"],
    "*.css": ["prettier --write"],
    "*.{js,mjs}": ["eslint --fix", "prettier --write"]
  }
}
```

```json
// .prettierrc.json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "avoid"
}markdownlint-cli2.cjs
module.exports = {
  config: {
    // 基礎規則
    default: true,
    
    // 調整規則
    MD013: false,  // 行長度限制（關閉，因為中文排版特殊）
    MD024: false,  // 允許重複標題（常見於多個「示例」小節）
    MD033: false,  // 允許內嵌 HTML（用於表格、圖標等）
    MD034: false,  // 允許裸 URL（技術文檔常見）
    MD041: false,  // 允許文件不以 h1 開頭（README 可能有 badges）
    
    // 中文標點
    MD037: false,  // 允許強調符號內部有空格（中英混排需要）
    
    // 代碼塊
    MD040: true,   // 代碼塊必須指定語言
    MD046: { style: 'fenced' },  // 只使用圍欄式代碼塊
  },
  // 忽略文件
  ignores: [
    'node_modules',
    'dist',
    'build',
    'CHANGELOG.md',  // 自動生成的變更日誌
  ],
}
```

```javascript
// .
```

```javascript
// .eslintrc.cjs
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  env: {
    browser: true,
    es2021: true,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'react/react-in-jsx-scope': 'off', // React 17+
    '@typescript-eslint/no-explicit-any': 'warn',
  },
}
```

**字形統一轉換腳本**：

```typescript
// src/utils/normalize-traditional-chars.ts
import { readFileSync, writeFileSync } from 'fs'

// 76 组台湾繁体到大陆通规字形映射（内置在代码中）
const CHAR_MAPPINGS = [
  { tw: '羣', cn: '群' },
  { tw: '峯', cn: '峰' },
  { tw: '綠', cn: '緑' },  // 注意：「緑」是大陆通规字形
  { tw: '說', cn: '説' },
  { tw: '為', cn: '爲' },
  // ... 共 76 组映射
] as const

// 处理文件
function processFile(filePath: string): boolean {
  let content = readFileSync(filePath, 'utf-8')
  let modified = false
  
  for (const { tw, cn } of CHAR_MAPPINGS) {
    if (content.includes(tw)) {
      content = content.replaceAll(tw, cn)
      modified = true
    }
  }
  
  if (modified) {
    writeFileSync(filePath, content, 'utf-8')
  }
  return modified
}
```

**特点**：

- ✅ 强类型：TypeScript 确保类型安全
- ✅ 自包含：映射表内置，无需外部文件
- ✅ 详细日志：显示每个替换的详情
- ✅ 错误处理：友好的错误提示

**使用方法**：

```bash
# 查看帮助
pnpm exec tsx src/utils/normalize-traditional-chars.ts

# 处理单个文件
pnpm exec tsx src/utils/normalize-traditional-chars.ts src/App.vue

# 批量处理
pnpm exec tsx src/utils/normalize-traditional-chars.ts src/**/*.ts
```

**設置 Husky**：

```bash
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

---

## 分支策略

**建議使用 Git Flow 進行重構**：

```bash
# 創建重構分支
git checkout -b refactor/react-migration

# 後續各階段提交到此分支
# 每完成一個階段，可以創建子分支進行測試
git checkout -b refactor/react-migration-stage1

# 測試通過後合併回 refactor/react-migration
git checkout refactor/react-migration
git merge refactor/react-migration-stage1

# 全部完成後合併到 main
git checkout main
git merge refactor/react-migration
```

**優勢**：

- ✅ 保持 main 分支穩定
- ✅ 可隨時回滾到舊版本
- ✅ 方便並行開發（多人協作）
- ✅ 便於代碼審查

---

## 階段一：React 基礎架構（預計 6-8 小時）

### 1.1 依賴遷移

**移除**：

```bash
pnpm remove vue @vitejs/plugin-vue vue-tsc @vue/eslint-config-typescript
```

**安裝**：

```bash
# React 核心
pnpm add react react-dom react-router-dom

# UI 框架
pnpm add antd styled-components

# 狀態管理
pnpm add jotai jotai-devtools

# 開發依賴
pnpm add -D @types/react @types/react-dom
pnpm add -D @vitejs/plugin-react
pnpm add -D vite-plugin-svgr
```

### 1.2 Vite 配置更新

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@chinese-ime-metrics': resolve(__dirname, '../chinese-ime-metrics/src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['antd', 'styled-components'],
          'state-vendor': ['jotai'],
        },
      },
    },
  },
})
```

### 1.3 TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@chinese-ime-metrics": ["../chinese-ime-metrics/src"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 1.4 目錄結構創建

```text
src/
├── app.tsx                    # 應用入口
├── main.tsx                   # React 渲染入口
├── routes.tsx                 # 路由配置
│
├── pages/                     # 頁面組件（對應邊欄項）
│   ├── index.tsx             # 首頁/歡迎頁
│   ├── uploader.tsx          # 碼表上傳
│   ├── duplicate.tsx         # 重碼分析
│   ├── candidates.tsx        # 候選個數
│   ├── speed-equiv.tsx       # 速度當量
│   ├── efficiency.tsx        # 簡碼效率
│   ├── heatmap.tsx           # 鍵位熱力
│   └── comparison.tsx        # 方案對比
│
├── components/                # 共享 UI 組件
│   ├── layout/
│   │   ├── AppLayout.tsx    # 應用布局（邊欄+內容）
│   │   ├── Sidebar.tsx      # 側邊導航
│   │   └── Header.tsx       # 頂部欄
│   ├── common/               # 通用組件
│   │   ├── Card.tsx         # 統一卡片樣式
│   │   ├── Button.tsx       # 按鈕
│   │   ├── Input.tsx        # 輸入框
│   │   └── Modal.tsx        # 彈窗
│   └── charts/               # 圖表組件
│       ├── KeyboardHeatmap.tsx
│       └── FrequencyChart.tsx
│
├── atoms/                     # Jotai 狀態原子
│   ├── codeTable.ts          # 碼表狀態
│   ├── analysis.ts           # 分析結果
│   ├── settings.ts           # 用戶設置
│   └── comparison.ts         # 對比狀態
│
├── services/                  # 業務邏輯（純函數）
│   ├── codeTableProcessor.ts # 碼表處理
│   ├── dataLoader.ts         # 數據加載
│   └── exportUtils.ts        # 導出功能
│
├── hooks/                     # 自定義 hooks
│   ├── useCodeTable.ts
│   ├── useAnalysis.ts
│   └── useCharFrequency.ts
│
├── styles/                    # 樣式文件
│   ├── theme.ts              # 主題定義
│   ├── GlobalStyle.ts        # 全局樣式
│   └── common.ts             # 共享樣式
│
├── types/                     # TypeScript 類型
│   └── index.ts
│
└── utils/                     # 工具函數
    ├── export.ts
    └── format.ts
```

---

## 階段二：狀態管理與核心邏輯（Week 3-4）

### 2.1 Jotai 原子定義

```typescript
// src/atoms/codeTable.ts
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type { CodeTable, ProcessedTables } from '@/types'

// 基礎數據
export const codeTableAtom = atom<CodeTable>(new Map())
export const codeTableNameAtom = atom<string>('')
export const analysisReadyAtom = atom<boolean>(false)

// 持久化設置
export const settingsAtom = atomWithStorage('yuhao-settings', {
  theme: 'light',
  prefixKeys: [] as string[],
  prefixEnabled: false,
  layoutName: 'default',
})

// 計算衍生狀態
export const codeTableSizeAtom = atom(get => get(codeTableAtom).size)
```

```typescript
// src/atoms/frequency.ts
import { atom } from 'jotai'
import { atomWithCache } from 'jotai-cache'

// 延遲加載字頻數據
export const charFrequenciesAtom = atom(async () => {
  const [zhihu, sc, tc, guji] = await Promise.all([
    fetch('/data/charFrequencyZhihu.json').then(r => r.json()),
    fetch('/data/charFrequencySC.json').then(r => r.json()),
    fetch('/data/charFrequencyTC.json').then(r => r.json()),
    fetch('/data/charFrequencyGuji.json').then(r => r.json()),
  ])

  return { zhihu, sc, tc, guji }
})

// 選中的字頻類型
export const selectedFrequencyAtom = atom<'zhihu' | 'sc' | 'tc' | 'guji'>('zhihu')

// 當前字頻（計算原子）
export const currentFrequencyAtom = atom(async get => {
  const frequencies = await get(charFrequenciesAtom)
  const selected = get(selectedFrequencyAtom)
  return frequencies[selected]
})
```

```typescript
// src/atoms/analysis.ts
import { atom } from 'jotai'
import { codeTableAtom, currentFrequencyAtom } from './codeTable'
import { calculateDuplicateStats, calculateDynamicDupRate } from '@chinese-ime-metrics'

// 重碼分析結果（異步計算）
export const duplicateStatsAtom = atom(async get => {
  const codeTable = get(codeTableAtom)
  if (codeTable.size === 0) return null

  // 調用 chinese-ime-metrics 計算（純 WASM 實現）
  return await calculateDuplicateStats(codeTable, ['cjk_basic', 'gb2312'])
})

// 動態選重率（異步計算）
export const dynamicDupRateAtom = atom(async get => {
  const codeTable = get(codeTableAtom)
  const frequency = await get(currentFrequencyAtom)
  if (codeTable.size === 0) return null

  return await calculateDynamicDupRate(codeTable, frequency)
})
```

### 2.2 chinese-ime-metrics 集成策略

> ⚠️ **重要提示**：chinese-ime-metrics 已採用純 WASM 實現，不再有 JavaScript 降級。
> 所有計算函數均為異步（async），需要在瀏覽器環境中運行。

#### 開發環境：本地相對路徑

```typescript
// vite.config.ts 中的 alias 配置
resolve: {
  alias: {
    '@chinese-ime-metrics': resolve(__dirname, '../chinese-ime-metrics/src'),
  }
}
```

**使用示例**：

```typescript
// src/services/duplicateAnalyzer.ts
import { calculateDuplicateStats } from '@chinese-ime-metrics'

export async function analyzeDuplicates(codeTable: CodeTable) {
  return await calculateDuplicateStats(codeTable, ['cjk_basic', 'gb2312'])
}
```

#### 生產環境：從 GitHub Pages 加載（推薦）

**方案說明**：

開發環境使用相對路徑，生產環境從 `chinese-ime-metrics` 的 GitHub Pages 加載已構建的模塊。

**優勢**：

- ✅ **倉庫獨立**：yuhao-assess 和 chinese-ime-metrics 完全分離
- ✅ **易於發佈**：chinese-ime-metrics 更新後，yuhao-assess 無需重新構建
- ✅ **版本靈活**：可輕鬆切換到不同版本（穩定版/最新版）
- ✅ **社區友好**：其他項目也可直接使用 CDN 鏈接
- ✅ **未來兼容**：當 chinese-ime-metrics 發佈到 npm 時，只需改 import 路徑

**實現方式**：

```typescript
// vite.config.ts - 環境切換
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        // 開發環境用本地相對路徑
        ...(isDev && {
          '@chinese-ime-metrics': resolve(__dirname, '../chinese-ime-metrics/src'),
        }),
      },
    },
    define: {
      // 生產環境使用 CDN
      'import.meta.env.METRICS_CDN': JSON.stringify(
        isDev
          ? null
          : 'https://forfudan.github.io/chinese-ime-metrics/dist'
      ),
    },
  }
})
```

```typescript
// src/utils/metrics-loader.ts - 統一加載入口
const CDN_BASE = import.meta.env.METRICS_CDN
const USE_LOCAL = import.meta.env.DEV

export async function loadMetricsModule() {
  if (USE_LOCAL) {
    // 開發環境：使用 Vite alias
    return await import('@chinese-ime-metrics')
  } else {
    // 生產環境：從 CDN 加載
    const [jsModule, wasmModule] = await Promise.all([
      import(/* @vite-ignore */ `${CDN_BASE}/index.js`),
      fetch(`${CDN_BASE}/wasm/chinese_ime_metrics_core_bg.wasm`)
        .then(r => r.arrayBuffer()),
    ])
    
    // 初始化 WASM
    await jsModule.default(wasmModule)
    return jsModule
  }
}

// 使用示例
import { loadMetricsModule } from '@/utils/metrics-loader'

const metrics = await loadMetricsModule()
const stats = await metrics.calculateDuplicateStats(codeTable, ['cjk_basic'])
```

```typescript
// src/atoms/analysis.ts - 使用動態加載
import { atom } from 'jotai'
import { codeTableAtom } from './codeTable'
import { loadMetricsModule } from '@/utils/metrics-loader'

// 緩存已加載的模塊
let metricsCache: any = null

export const duplicateStatsAtom = atom(async get => {
  const codeTable = get(codeTableAtom)
  if (codeTable.size === 0) return null

  if (!metricsCache) {
    metricsCache = await loadMetricsModule()
  }

  return await metricsCache.calculateDuplicateStats(codeTable, ['cjk_basic', 'gb2312'])
})
```

**版本管理策略**：

```typescript
// 固定版本（穩定）
const CDN_BASE = 'https://forfudan.github.io/chinese-ime-metrics/v0.1.0/dist'

// 最新版本（激進）
const CDN_BASE = 'https://forfudan.github.io/chinese-ime-metrics/dist'

// 未來 npm 版本（無縫遷移）
import { calculateDuplicateStats } from '@forfudan/chinese-ime-metrics'
```

**CI/CD 配置**：

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Build (production mode)
        run: pnpm build
        env:
          NODE_ENV: production

      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

**測試要點**：

- [ ] 開發環境能正確加載本地 chinese-ime-metrics
- [ ] 生產環境能從 CDN 加載並初始化 WASM
- [ ] 計算結果與預期一致

---

## 階段三：布局與路由（預計 4-6 小時）

### 3.1 應用布局

```tsx
// src/components/layout/AppLayout.tsx
import { Layout, ConfigProvider, theme } from 'antd'
import { Outlet } from 'react-router-dom'
import { Suspense } from 'react'
import { useAtom } from 'jotai'
import { settingsAtom } from '@/atoms/settings'
import Sidebar from './Sidebar'
import Header from './Header'
import { GlobalStyle } from '@/styles/GlobalStyle'

export default function AppLayout() {
  const [settings] = useAtom(settingsAtom)

  return (
    <ConfigProvider
      theme={{
        algorithm: settings.theme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <GlobalStyle />
      <Layout style={{ height: '100vh' }}>
        <Sidebar />
        <Layout>
          <Header />
          <Layout.Content style={{ padding: '24px', overflowY: 'auto' }}>
            <Suspense fallback={<div>載入中...</div>}>
              <Outlet />
            </Suspense>
          </Layout.Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  )
}
```

### 3.2 側邊欄導航

```tsx
// src/components/layout/Sidebar.tsx
import { Layout, Menu } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  UploadOutlined,
  CodeOutlined,
  BarChartOutlined,
  ThunderboltOutlined,
  HeatMapOutlined,
  SwapOutlined,
} from '@ant-design/icons'

const menuItems = [
  { key: '/', label: '碼表上傳', icon: <UploadOutlined /> },
  { key: '/duplicate', label: '重碼分析', icon: <CodeOutlined /> },
  { key: '/candidates', label: '候選個數', icon: <BarChartOutlined /> },
  { key: '/speed', label: '速度當量', icon: <ThunderboltOutlined /> },
  { key: '/efficiency', label: '簡碼效率', icon: <ThunderboltOutlined /> },
  { key: '/heatmap', label: '鍵位熱力', icon: <HeatMapOutlined /> },
  { key: '/comparison', label: '方案對比', icon: <SwapOutlined /> },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Layout.Sider width={220} theme="light">
      <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        <h2>宇浩測評</h2>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
      />
    </Layout.Sider>
  )
}
```

### 3.3 路由配置

```tsx
// src/routes.tsx
import { createBrowserRouter } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import { lazy } from 'react'

// 懶加載頁面
const UploaderPage = lazy(() => import('./pages/uploader'))
const DuplicatePage = lazy(() => import('./pages/duplicate'))
const CandidatesPage = lazy(() => import('./pages/candidates'))
const SpeedEquivPage = lazy(() => import('./pages/speed-equiv'))
const EfficiencyPage = lazy(() => import('./pages/efficiency'))
const HeatmapPage = lazy(() => import('./pages/heatmap'))
const ComparisonPage = lazy(() => import('./pages/comparison'))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <UploaderPage /> },
      { path: 'duplicate', element: <DuplicatePage /> },
      { path: 'candidates', element: <CandidatesPage /> },
      { path: 'speed', element: <SpeedEquivPage /> },
      { path: 'efficiency', element: <EfficiencyPage /> },
      { path: 'heatmap', element: <HeatmapPage /> },
      { path: 'comparison', element: <ComparisonPage /> },
    ],
  },
])
```

**測試要點**：

- [ ] 路由切換正常
- [ ] 側邊欄高亮正確
- [ ] 懶加載生效（查看 Network）
- [ ] 主題切換正常

---

## 階段四：頁面組件遷移（預計 12-16 小時）

### 4.1 遷移順序（由簡到繁）

每個頁面遷移後立即編寫單元測試，確保功能正確。

1. **碼表上傳頁**（2 小時 + 0.5 小時測試）
   - ✅ 文件上傳組件
   - ✅ 碼表解析邏輯
   - ✅ 測試：文件格式驗證、錯誤處理

2. **候選個數頁**（1.5 小時 + 0.5 小時測試）
   - ✅ 簡單統計顯示
   - ✅ 測試：統計計算準確性

3. **重碼分析頁**（2 小時 + 0.5 小時測試）
   - ✅ 調用 chinese-ime-metrics
   - ✅ 異步加載處理
   - ✅ 測試：WASM 調用、結果緩存

4. **簡碼效率頁**（2 小時 + 0.5 小時測試）
   - ✅ 效率計算與展示
   - ✅ 測試：計算邏輯

5. **速度當量頁**（2.5 小時 + 0.5 小時測試）
   - ✅ 複雜計算處理
   - ✅ 性能優化
   - ✅ 測試：大數據集性能

6. **鍵位熱力頁**（2.5 小時 + 0.5 小時測試）
   - ✅ 熱力圖可視化
   - ✅ Canvas/SVG 渲染
   - ✅ 測試：渲染正確性

7. **方案對比頁**（3 小時 + 0.5 小時測試）
   - ✅ 多實例管理
   - ✅ 對比數據展示
   - ✅ 測試：狀態管理、數據同步

### 4.2 示例：重碼分析頁

```tsx
// src/pages/duplicate.tsx
import { useAtomValue } from 'jotai'
import { Suspense } from 'react'
import { Card, Statistic, Row, Col, Empty, Spin } from 'antd'
import { duplicateStatsAtom } from '@/atoms/analysis'
import { codeTableAtom, codeTableNameAtom } from '@/atoms/codeTable'
import { PageContainer } from '@/components/common/PageContainer'

export default function DuplicatePage() {
  const codeTable = useAtomValue(codeTableAtom)
  const codeTableName = useAtomValue(codeTableNameAtom)

  if (codeTable.size === 0) {
    return (
      <PageContainer>
        <Empty description="請先上傳碼表" />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <h1>重碼分析 - {codeTableName}</h1>
      <Suspense fallback={<Spin size="large" />}>
        <DuplicateStatsDisplay />
      </Suspense>
    </PageContainer>
  )
}

// 異步加載的統計顯示組件
function DuplicateStatsDisplay() {
  const stats = useAtomValue(duplicateStatsAtom)

  if (!stats) return <Empty description="無數據" />

  return (
    <Row gutter={[16, 16]}>
      <Col span={6}>
        <Card>
          <Statistic title="CJK Basic 重碼率" value={stats.cjk_basic.dupRate} suffix="%" />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic title="GB2312 重碼率" value={stats.gb2312.dupRate} suffix="%" />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic title="平均碼長" value={stats.cjk_basic.avgLength} precision={2} />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic title="最大重碼數" value={stats.cjk_basic.maxDup} />
        </Card>
      </Col>
    </Row>
  )
}
```

### 4.3 核心邏輯遷移策略

**原則**：逐步將業務邏輯從 Vue 組件遷移到 `chinese-ime-metrics`

#### 遷移候選清單（待實現）

| 函數名                     | 當前位置                       | 目標位置                                  | 優先級 |
| -------------------------- | ------------------------------ | ----------------------------------------- | ------ |
| `calculateDuplicateStats`  | `services/duplicateAnalyzer`   | `chinese-ime-metrics/stats/duplicate`     | P0     |
| `calculateDynamicRate`     | `services/speedCalculator`     | `chinese-ime-metrics/stats/dynamic_rate`  | P0     |
| `processCodeTable`         | `services/codeTableProcessor`  | `chinese-ime-metrics/encoding/code_maker` | P1     |
| `calculateKeyboardHeatmap` | `components/HeatmapCard.vue`   | `chinese-ime-metrics/stats/heatmap`       | P2     |
| `calculateSpeedEquiv`      | `components/SpeedEquivCard.vue`| `chinese-ime-metrics/stats/speed_equiv`   | P1     |

#### 遷移步驟模板

1. **在 chinese-ime-metrics 中實現 Rust 版本**

```rust
// chinese-ime-metrics/rust/src/stats/speed_equiv.rs
pub fn calculate_speed_equiv(
    code_table: &HashMap<String, String>,
    char_freq: &HashMap<String, f64>,
) -> f64 {
    // 實現邏輯...
}
```

1. **添加 WASM 綁定**

```rust
// chinese-ime-metrics/rust/src/lib.rs
#[wasm_bindgen]
pub fn calculate_speed_equiv_wasm(
    code_table: JsValue,
    char_freq: JsValue,
) -> Result<f64, JsValue> {
    // 轉換 + 調用
}
```

1. **導出 TypeScript 接口**

```typescript
// chinese-ime-metrics/src/stats/index.ts
export async function calculateSpeedEquiv(
  codeTable: CodeTable,
  charFreq: CharFrequency
): Promise<number> {
  if (isWasmAvailable()) {
    return await wasmModule.calculate_speed_equiv_wasm(codeTable, charFreq)
  }
  // 降級到 JS 實現
  return calculateSpeedEquivJS(codeTable, charFreq)
}
```

1. **在 yuhao-assess 中使用**

```typescript
// yuhao-assess/src/atoms/analysis.ts
import { calculateSpeedEquiv } from '@chinese-ime-metrics'

export const speedEquivAtom = atom(async get => {
  const codeTable = get(codeTableAtom)
  const frequency = await get(currentFrequencyAtom)
  return await calculateSpeedEquiv(codeTable, frequency)
})
```

**測試策略**：

每個頁面遷移後立即編寫測試文件：

```typescript
// src/pages/__tests__/duplicate.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'jotai'
import DuplicatePage from '../duplicate'

describe('DuplicatePage', () => {
  it('顯示空狀態提示', () => {
    render(
      <Provider>
        <DuplicatePage />
      </Provider>
    )
    expect(screen.getByText('請先上傳碼表')).toBeInTheDocument()
  })

  it('正確計算重碼率', async () => {
    // 設置測試數據...
    await waitFor(() => {
      expect(screen.getByText(/重碼率/)).toBeInTheDocument()
    })
  })
})
```

---

## 階段五：樣式系統統一（預計 4-5 小時）

### 5.1 主題設計

```typescript
// src/styles/theme.ts
export const lightTheme = {
  colors: {
    primary: '#1890ff',
    success: '#52c41a',
    warning: '#faad14',
    error: '#ff4d4f',
    text: '#262626',
    textSecondary: '#8c8c8c',
    background: '#ffffff',
    backgroundSecondary: '#fafafa',
    border: '#d9d9d9',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
  },
  shadows: {
    card: '0 2px 8px rgba(0, 0, 0, 0.1)',
    elevated: '0 4px 16px rgba(0, 0, 0, 0.15)',
  },
}

export const darkTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    text: '#e8e8e8',
    textSecondary: '#a6a6a6',
    background: '#1f1f1f',
    backgroundSecondary: '#141414',
    border: '#434343',
  },
}
```

### 5.2 共享組件庫

```tsx
// src/components/common/Card.tsx
import styled from 'styled-components'

export const Card = styled.div`
  background: ${p => p.theme.colors.background};
  border-radius: ${p => p.theme.borderRadius.md}px;
  padding: ${p => p.theme.spacing.lg}px;
  box-shadow: ${p => p.theme.shadows.card};
  margin-bottom: ${p => p.theme.spacing.md}px;
`

export const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${p => p.theme.spacing.md}px;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: ${p => p.theme.colors.text};
  }
`

export const CardBody = styled.div`
  color: ${p => p.theme.colors.textSecondary};
`
```

```tsx
// src/components/common/PageContainer.tsx
import styled from 'styled-components'

export const PageContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: ${p => p.theme.spacing.lg}px;
`
```

**測試要點**：

- [ ] 主題切換無閃爍
- [ ] 組件樣式復用率 > 80%
- [ ] CSS 文件大小減少 > 50%

---

## 階段六：性能優化（預計 3-4 小時）

### 6.1 代碼分割

```typescript
// src/routes.tsx
const routes = [
  {
    path: '/duplicate',
    lazy: async () => {
      const { default: Component } = await import('./pages/duplicate')
      return { Component }
    },
  },
]
```

### 6.2 計算結果緩存

```typescript
// src/atoms/cache.ts
import { atomFamily } from 'jotai/utils'

// 緩存重碼分析結果
export const duplicateStatsCacheAtom = atomFamily((codeTableHash: string) =>
  atom(async () => {
    // 從 IndexedDB 加載緩存
    const cached = await idb.get('duplicate-stats', codeTableHash)
    if (cached) return cached

    // 計算新結果
    const result = await calculateDuplicateStats(/* ... */)

    // 保存到緩存
    await idb.set('duplicate-stats', codeTableHash, result)
    return result
  })
)
```

### 6.3 虛擬滾動

```tsx
// src/components/charts/VirtualTable.tsx
import { useVirtualizer } from '@tanstack/react-virtual'

export function VirtualTable({ data }: { data: any[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  })

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {rowVirtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {data[virtualRow.index].name}
          </div>
        ))}
      </div>
    </div>
  )
}
```

**測試要點**：

- [ ] Lighthouse 性能分數 > 90
- [ ] 首屏加載時間 < 2 秒
- [ ] WASM 計算比 JS 快 > 3 倍

---

## 階段七：集成測試與部署（預計 2-3 小時）

> 注意：單元測試已在各階段完成，此階段重點是集成測試和部署配置。

### 7.1 端到端測試（可選）

```typescript
// e2e/workflow.spec.ts
import { test, expect } from '@playwright/test'

test('完整工作流', async ({ page }) => {
  // 1. 上傳碼表
  await page.goto('http://localhost:3000')
  await page.setInputFiles('input[type="file"]', 'test-data/sample.txt')
  await expect(page.getByText('上傳成功')).toBeVisible()

  // 2. 查看重碼分析
  await page.click('text=重碼分析')
  await expect(page.getByText(/重碼率/)).toBeVisible()

  // 3. 導出報告
  const downloadPromise = page.waitForEvent('download')
  await page.click('text=導出 PDF')
  const download = await downloadPromise
  expect(download.suggestedFilename()).toContain('.pdf')
})
```

### 7.2 CI/CD 配置

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: recursive # 拉取 chinese-ime-metrics

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Build chinese-ime-metrics
        run: |
          cd lib/chinese-ime-metrics
          pnpm install
          pnpm build

      - name: Build yuhao-assess
        run: pnpm build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 7.3 Cloudflare Pages 配置

```toml
# wrangler.toml
name = "yuhao-assess"
compatibility_date = "2024-01-01"

[build]
command = "pnpm build"
cwd = ""

[build.upload]
format = "service-worker"

[[build.upload.rules]]
type = "ESModule"
globs = ["**/*.js"]

[[build.upload.rules]]
type = "CompiledWasm"
globs = ["**/*.wasm"]
```

---

## 長期規劃

### 階段八：核心邏輯完全遷移（預計 20-30 小時）

**目標**：yuhao-assess 成為純 UI 層，所有計算邏輯移至 chinese-ime-metrics

#### 待遷移功能

1. **鍵位熱力圖計算**
   - 當前：內嵌在 Vue 組件中
   - 目標：`chinese-ime-metrics/stats/heatmap.rs`

2. **簡碼效率分析**
   - 當前：`services/efficiencyAnalyzer.ts`
   - 目標：`chinese-ime-metrics/stats/efficiency.rs`

3. **方案對比引擎**
   - 當前：分散在多個組件
   - 目標：`chinese-ime-metrics/stats/comparison.rs`

4. **編碼生成器**
   - 當前：`services/codeTableProcessor.ts`
   - 目標：`chinese-ime-metrics/encoding/code_maker.rs`

#### 遷移收益

- **性能提升**：Rust + WASM 比 JavaScript 快 3-10 倍
- **代碼復用**：其他項目（如 yu）也可使用
- **類型安全**：Rust 編譯時保證正確性
- **維護性**：單一真實來源（Single Source of Truth）

### 階段九：發佈 chinese-ime-metrics 到 NPM

**時機**：當大部分核心邏輯遷移完成後

```bash
# 發佈準備
cd chinese-ime-metrics
pnpm build
pnpm test

# 發佈到 npm
npm publish --access public
```

**yuhao-assess 遷移策略**：

發佈到 npm 後，可選擇兩種方式：

#### 方式 1：繼續使用 CDN（推薦）

```typescript
// 無需改動，npm 版本會自動同步到 jsdelivr/unpkg
const CDN_MIRRORS = [
  'https://cdn.jsdelivr.net/npm/@forfudan/chinese-ime-metrics@0.2.0/dist/index.js',
  'https://unpkg.com/@forfudan/chinese-ime-metrics@0.2.0/dist/index.js',
]
```

優勢：

- ✅ 減少構建體積（WASM 不打包進 yuhao-assess）
- ✅ CDN 緩存加速
- ✅ 多個項目共享同一份 WASM 文件

#### 方式 2：切換到 npm 包

```json
// package.json
{
  "dependencies": {
    "@forfudan/chinese-ime-metrics": "^0.2.0"
  }
}
```

```typescript
// 直接 import（需要 Vite 配置 WASM 加載）
import { calculateDuplicateStats } from '@forfudan/chinese-ime-metrics'
```

優勢：

- ✅ 離線可用
- ✅ 類型提示更好
- ✅ 版本鎖定更精確

劣勢：

- ❌ 構建體積增加（+2-3MB WASM）
- ❌ 需要配置 Vite WASM 插件

---

## 風險與應對

### 風險 1：WASM 加載失敗

**應對**：提供友好的錯誤提示和重試機制

```typescript
// src/utils/metrics-loader.ts
export async function loadMetricsModule(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await loadMetricsModuleImpl()
    } catch (error) {
      if (i === retries - 1) {
        throw new Error(
          'chinese-ime-metrics 加載失敗，請檢查網絡連接或瀏覽器兼容性。\n' +
          '要求：Chrome 57+ / Firefox 52+ / Safari 11+'
        )
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

### 風險 2：構建時間過長

**應對**：

- 使用增量構建（Vite HMR）
- 緩存 WASM 構建產物
- CI/CD 使用緩存策略

### 風險 3：CDN 不穩定或被牆

**應對**：

1. **多 CDN 備份**

```typescript
const CDN_MIRRORS = [
  'https://forfudan.github.io/chinese-ime-metrics/dist',
  'https://cdn.jsdelivr.net/gh/forfudan/chinese-ime-metrics@latest/dist',
  'https://unpkg.com/@forfudan/chinese-ime-metrics@latest/dist',  // 未來 npm
]

async function loadWithFallback() {
  for (const cdn of CDN_MIRRORS) {
    try {
      return await loadFrom(cdn)
    } catch (e) {
      continue
    }
  }
  throw new Error('所有 CDN 均不可用')
}
```

1. **本地緩存（Service Worker）**

```javascript
// service-worker.js
self.addEventListener('fetch', event => {
  if (event.request.url.includes('chinese-ime-metrics')) {
    event.respondWith(
      caches.match(event.request)
        .then(cached => cached || fetch(event.request))
    )
  }
})
```

### 風險 4：用戶習慣改變（卡片 → 頁面）

**應對**：

- 保留相似的視覺設計
- 提供快速鍵導航
- 添加引導提示

---

## 檢查清單

### 階段 0（基礎設施）

- [x] 數據文件外部化到 yuhao-assess-data
- [x] 創建 data-loader.ts 工具
- [x] 配置 Markdown Lint
- [ ] 推送 yuhao-assess-data 到 GitHub
- [ ] 啟用 GitHub Pages
- [ ] 設置 Husky + lint-staged
- [ ] 配置 Prettier + ESLint

### 階段 1（React 架構）

- [ ] 安裝 React 依賴
- [ ] 更新 Vite 配置
- [ ] 創建目錄結構
- [ ] 配置路徑別名

### 階段 2（狀態管理）

- [ ] 定義 Jotai 原子
- [ ] 配置 chinese-ime-metrics 本地路徑
- [ ] 實現數據加載 hooks

### 階段 3（布局路由）

- [ ] 創建 AppLayout
- [ ] 實現 Sidebar 導航
- [ ] 配置路由規則

### 階段 4（頁面遷移）

- [ ] 遷移碼表上傳頁
- [ ] 遷移重碼分析頁
- [ ] 遷移候選個數頁
- [ ] 遷移速度當量頁
- [ ] 遷移簡碼效率頁
- [ ] 遷移鍵位熱力頁
- [ ] 遷移方案對比頁

### 階段 5（樣式統一）

- [ ] 定義主題系統
- [ ] 創建共享組件庫
- [ ] 移除冗余 CSS

### 階段 6（性能優化）

- [ ] 實現路由懶加載
- [ ] 添加計算結果緩存
- [ ] 優化大列表渲染

### 階段 7（測試部署）

- [ ] 編寫單元測試
- [ ] 配置 CI/CD
- [ ] 部署到 GitHub Pages / Cloudflare

---

## 參考資源

- [chinese-ime-metrics 文檔](../chinese-ime-metrics/docs/)
- [Jotai 文檔](https://jotai.org/)
- [React Router 文檔](https://reactrouter.com/)
- [Ant Design 文檔](https://ant.design/)
- [hanzi-chai](https://github.com/hanzi-chai/hanzi-chai.github.io)
- [shurufa.app](https://shurufa.app)

---

**最後更新**：2026-02-03
**維護者**：@forfudan
