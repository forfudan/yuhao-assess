# 宇浩漢字輸入法測評系統

一個基於 React + TypeScript 的輸入法性能測評工具，支持重碼率、動態選重、速度當量、簡碼效率等多項指標分析。

## 📖 重要文檔

- **[命名規範 (NOMENCLATURE.md)](./docs/NOMENCLATURE.md)** - **必讀**，所有變量、類型、函數命名規範
- **[開發路線圖 (ROADMAP.md)](./docs/ROADMAP.md)** - 項目重構計劃與進度跟蹤

## ⚠️ 開發須知

**本倉庫採用繁體中文命名規範**：

- ✅ 所有變量、類型、函數名使用繁體中文
- ✅ 命名要求：具體、詳細、準確、自顯示
- ❌ 禁止使用縮寫、俗稱、别名
- 📋 詳見 [docs/NOMENCLATURE.md](./docs/NOMENCLATURE.md)

**示例**：

```typescript
// ✅ 正確
const 當前方案原子狀態 = atom<方案配置 | null>(null)
function 加載方案(方案鍵名: string): Promise<方案配置> { ... }

// ❌ 錯誤
const currentScheme = atom<SchemeConfig | null>(null)
function loadScheme(key: string): Promise<Config> { ... }
```

## 🚀 快速開始

````bash
# 安裝依賴
pnpm install

# 下載數據文件和内置方案
node scripts/fetch-data.js

# 開發模式
pnpm dev

# 構建生産版本
pnpm build

# 代碼格式化
pnpm format

# 字形轉換（台灣繁體 → 大陸通規繁體）
pnpm tc
```bash
# 命令示例
````

## 📦 項目結構

```text
yuhao-assess/
├── docs/                  # 文檔
│   ├── NOMENCLATURE.md    # 命名規範（必讀）
│   └── ROADMAP.md         # 開發路線圖
├── public/
│   ├── data/              # 大型數據文件（從 yuhao-assess-data CDN 加載）
│   ├── schemes/           # 内置方案測評結果（從 yuhao-assess-data CDN 加載）
│   └── settings/          # 配置文件（Git 追蹤）
├── src/
│   ├── atoms/             # Jotai 狀態管理
│   ├── components/        # React 組件
│   ├── services/          # 業務邏輯服務
│   ├── types/             # TypeScript 類型定義
│   └── utils/             # 工具函數
└── tests/                 # 測試文件
```

## 🔧 技術棧

- **框架**: React 19 + TypeScript 5
- **狀態管理**: Jotai
- **UI 庫**: Ant Design 6
- **構建工具**: Vite 5
- **代碼規範**: ESLint + Prettier
- **Git Hooks**: Husky + lint-staged
- **字形轉換**: normalize-traditional-chars (GujiCC)

## 📝 開發規範

1. **提交前自動處理** (pre-commit)：
   - 字形轉換（台灣繁體 → 大陸通規繁體）
   - ESLint 修復
   - Prettier 格式化
   - Markdownlint 檢查

2. **命名規範**：
   - 嚴格遵循 [NOMENCLATURE.md](./docs/NOMENCLATURE.md)
   - 使用標準名稱，禁止别名
   - 變量名要自顯示，減少註釋需求

3. **代碼組織**：
   - 類型定義放在 `src/types/`
   - 業務邏輯放在 `src/services/`
   - UI 組件放在 `src/components/`
   - 全局狀態放在 `src/atoms/`

## 📄 License

MIT
