# 內部技術文檔

宇浩輸入法性能測評工具 - 基於 Vue 3 + TypeScript 構建的現代化分析平臺

## 功能特性

### 📊 碼表分析

- **智能解析**: 支援"字符-編碼"和"編碼-字符"兩種格式的碼表文件
- **檔案預覽**: 上傳前預覽檔案內容，驗證格式正確性
- **拖拽上傳**: 支援拖拽檔案上傳，提供友好的交互體驗
- **多維度對比**: 支援多個輸入法方案的詳細對比分析

### ⌨️ 鍵位熱力圖

- **多維度分析**: 使用頻率、負擔程度、手指分工三種顯示模式
- **實時交互**: 滑鼠懸停顯示詳細的鍵位統計信息
- **可視化熱力圖**: 直觀展示鍵位分布和使用強度

### 📈 統計分析

- **全面統計**: 總字符數、平均碼長、左右手平衡比例
- **手指負擔**: 分析各手指的工作負擔分布
- **性能指標**: 多項輸入法性能關鍵指標
- **重碼分析**: 靜態和動態重碼率分析
- **簡碼效率**: 簡碼使用效率優化建議
- **速度當量**: 輸入速度等效性分析

## 技術棧

- **前端框架**: Vue 3 (Composition API)
- **開發語言**: TypeScript
- **構建工具**: Vite
- **樣式系統**: CSS Variables + 現代化響應式設計
- **圖標字體**: 原生 Emoji
- **包管理器**: pnpm

## 項目結構

```txt
src/
├── components/          # Vue 組件
├── services/           # 業務邏輯服務
├── types/              # TypeScript 類型定義
├── styles/             # 樣式文件
├── composables/        # Vue 組合式函數
└── ...
```

## 樣式架構 (Styles)

### 共享樣式文件

為了減少代碼重複和提升維護性，項目使用了以下共享樣式文件：

#### card-common.css

**位置**: `src/styles/card-common.css`

**功能**: 卡片組件通用樣式

**包含樣式**:

- `.header-content`: 卡片頭部佈局
- `.header-text`: 頭部文本區域
- `.header-buttons`: 頭部按鈕容器
- `.export-btn`: 導出按鈕樣式
- `.refresh-btn`: 刷新按鈕樣式
- `.collapse-button`: 摺疊按鈕樣式
- `.scheme-name-annotation`: 方案名稱標註
- `.loading`: 加載狀態容器
- `.spinner`: 旋轉加載動畫
- `.metrics-table`: 數據表格樣式
- `.info-section`: 信息說明區域

**使用方式**:

```vue
<style scoped>
@import '../styles/card-common.css';
/* 組件特定樣式 */
</style>
```

#### modal-common.css

**位置**: `src/styles/modal-common.css`

**功能**: 模態框和工具提示通用樣式

**包含樣式**:

- `.modal-overlay`: 模態框遮罩層
- `.modal-content`: 模態框內容容器
- `.modal-header`: 模態框頭部
- `.modal-close`: 關閉按鈕
- `.modal-body`: 模態框主體
- `.modal-loading`: 模態框加載狀態
- `.custom-tooltip`: 自定義工具提示
- `.tooltip-content`: 工具提示內容
- `.tooltip-header`: 工具提示標題

**使用方式**:

```vue
<style scoped>
@import '../styles/modal-common.css';
/* 組件特定樣式 */
</style>
```

**特性**:

- 支持黑暗模式（通過 `[data-theme="dark"]`）
- 響應式設計（移動端適配）
- 流暢的進入/退出動畫
- 高 z-index（999999）確保在最上層

#### tabs-common.css

**位置**: `src/styles/tabs-common.css`

**功能**: 標籤頁（Tab）切換通用樣式

**包含樣式**:

- `.tabs-container`: 標籤頁容器
- `.tab-list`: 標籤頁列表
- `.tab-button`: 標籤頁按鈕
- `.tab-button.active`: 激活狀態
- KeyboardHeatmapCard 的緊湊間距專用樣式

**使用方式**:

```vue
<style scoped>
@import '../styles/tabs-common.css';
/* 組件特定樣式 */
</style>
```

### 樣式最佳實踐

#### 1. 優先使用共享樣式

新增組件時，優先檢查是否可以使用共享樣式文件中的類：

```vue
<!-- ✅ 推薦：使用共享樣式 -->
<div class="header-content">
  <div class="header-text">
    <h3 class="card-title">標題</h3>
  </div>
  <div class="header-buttons">
    <button class="export-btn">導出</button>
    <button class="collapse-button">摺疊</button>
  </div>
</div>

<!-- ❌ 避免：重複定義相同樣式 -->
<style scoped>
.my-header { /* 與 .header-content 功能重複 */ }
</style>
```

#### 2. 導入順序

在組件的 `<style scoped>` 標籤中，按以下順序導入樣式：

```vue
<style scoped>
/* 1. 共享卡片樣式 */
@import '../styles/card-common.css';

/* 2. 模態框樣式（如需要） */
@import '../styles/modal-common.css';

/* 3. 標籤頁樣式（如需要） */
@import '../styles/tabs-common.css';

/* 4. 組件特定樣式 */
.my-component-specific-class {
  /* ... */
}
</style>
```

#### 3. 擴展而非覆蓋

如需自定義共享樣式，使用擴展類而非覆蓋：

```vue
<!-- ✅ 推薦：擴展共享樣式 -->
<button class="export-btn my-custom-export-btn">導出</button>

<style scoped>
@import '../styles/card-common.css';

.my-custom-export-btn {
  /* 只添加額外樣式，不覆蓋基礎樣式 */
  font-size: 1.1rem;
}
</style>

<!-- ❌ 避免：覆蓋共享樣式 -->
<style scoped>
.export-btn {
  /* 完全重新定義，失去共享樣式的好處 */
  background: blue;
}
</style>
```

#### 4. 黑暗模式支持

共享樣式文件已內置黑暗模式支持，使用 CSS 變量確保一致性：

```css
/* 使用 CSS 變量 */
.my-element {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-primary);
}

/* 系統會自動處理黑暗模式切換 */
```

## 組件架構 (Components)

### CodeTableAnalysisCard.vue

**功能**: 碼表基礎統計分析顯示卡片

- `toggleCollapsed()`: 切換摺疊狀態
- `exportCard()`: 導出卡片為圖片

### CodeTableUploaderCard.vue

**功能**: 碼表文件上傳和格式選擇

- `handleFileSelect()`: 處理文件選擇
- `parseCodeTable()`: 解析碼表文件
- `validateFormat()`: 驗證文件格式

### ComparisonCard.vue

**功能**: 多方案對比分析主組件

- `preprocessCodeTableDataComplete()`: 完整的碼表預處理
- `preprocessCodeTableData()`: 基礎碼表預處理
- `calculateCharCount()`: 計算字符總數
- `addBuiltinScheme()`: 添加內建方案
- `addFileScheme()`: 添加文件方案
- `exportCard()`: 導出對比結果

### DuplicateAnalysisCard.vue

**功能**: 字符與詞語重碼分析顯示卡片

- `calculateAllMetrics()`: 計算所有重碼指標（字符和詞語）
- `showDuplicateDetails()`: 顯示重碼詳情（支持字符和詞語兩種類型）
- `exportCard()`: 導出重碼分析結果
- `exportToCSV()`: 導出重碼詳情為 CSV（字符或詞語）

**Props**:

- `codeTable`: 原始碼表
- `processedTables`: 處理後的碼表（包含 full, short, fullWithSelection, shortWithSelection）
- `globalCharFrequencies`: 全局字頻數據（5種字頻）
- `wordCodeTable`: 詞語碼表（wordFullCodeWithSelection）
- `globalWordFrequencies`: 全局詞頻數據（簡體詞頻）

**分析內容**:

- 字符動態選重率（5種字頻 × 全碼/出簡 × 按字頻排序/保持原序）
- 詞語動態選重率（簡體詞頻 × 全碼）
- 字符集重碼統計（GB2312、通規、國字、CJK各區）
- 重碼詳情模態框（字符或詞語）

### KeyboardHeatmapCard.vue

**功能**: 鍵盤熱力圖可視化

- `generateHeatmapData()`: 生成熱力圖數據
- `updateColorIntensity()`: 更新顏色強度
- `exportCard()`: 導出熱力圖

### KeyButton.vue

**功能**: 單個按鍵組件

- `displayValue`: 計算顯示值
- `keyStyle`: 計算按鍵樣式

### MaximumCandidatesCard.vue

**功能**: 最大候選項分析

- `calculateData()`: 計算最大候選項數據
- `exportCard()`: 導出分析結果

### ShortCodeEfficiencyCard.vue

**功能**: 簡碼效率分析

- `calculateEfficiency()`: 計算簡碼效率
- `exportCard()`: 導出效率分析

### SpeedEquivCard.vue

**功能**: 速度當量分析

- `calculateSpeedEquivAnalysis()`: 計算速度當量
- `loadEquivTable()`: 載入當量表
- `exportCard()`: 導出速度分析

## 碼表處理流程

### 概述

當用戶上傳碼表文件後，系統會進行一系列自動化的預處理操作，生成多個輔助碼表供不同的分析組件使用。這個統一的處理流程確保了各個組件使用的數據一致性，並避免了重複計算。

### 處理流程

#### 1. 原始碼表解析

**入口**: `CodeTableUploaderCard.vue`

用戶上傳的碼表文件首先被解析為 `RawCodeTable` 格式：

```typescript
RawCodeTable = Map<number, [string, string, number]>
// 行號 -> [字符, 編碼, N選位置]
```

- 支持兩種格式：字符-編碼（如 `的 de`）和編碼-字符（如 `de 的`）
- 自動檢測多字同編情況，標記 N 選位置（1, 2, 3...）
- 保持原始行號順序，便於追溯

#### 2. 碼表預處理

**核心服務**: `codeTableProcessingService.ts`

系統調用 `processRawCodeTable()` 方法，一次遍歷生成四個輔助碼表：

##### a) **全碼表 (full)**

- 每個字符只保留**最長的編碼**
- 保持原始行號順序
- 用途：分析全碼性能、計算平均碼長

##### b) **簡碼表 (short)**

- 每個字符只保留**最短的編碼**
- 保持原始行號順序
- 用途：分析簡碼性能、優化建議

##### c) **全碼加選重按鍵表 (fullWithSelection)**

- 基於全碼表，添加選重處理
- 未達最大碼長時：
  - 前綴碼：根據上屏鍵決定是否補空格
  - 非前綴碼：補充下劃線（代表空格）
- 非首選（N選 > 1）：添加數字選重鍵（2, 3, 4...）
- 用途：速度當量計算、按鍵分布分析

##### d) **簡碼加選重按鍵表 (shortWithSelection)**

- 基於簡碼表，添加選重處理
- 處理邏輯同 fullWithSelection
- 用途：簡碼速度當量、簡碼效率評估

##### e) **詞語全碼加選重按鍵表 (wordFullCodeWithSelection)**

- 由 `generateWordCodeTableWithSelection()` 生成
- 包含單字詞和多字詞的編碼
- 編碼規則：
  - 1字詞：取單字**全碼**
  - 2字詞：各取前2碼
  - 3字詞：首字前2碼 + 第2字首碼 + 末字首碼
  - 4字及以上：前3字各取首碼 + 末字前2碼
- 已按詞頻排序（基於 `wordFrequencySC.json`）
- 非首選詞添加選重鍵（2, 3, 4...）在編碼末尾
- 用途：詞語重碼分析、詞語動態選重率計算

##### f) **詞語簡碼加選重按鍵表 (wordShortCodeWithSelection)**

- 由 `generateWordShortCodeTableWithSelection()` 生成
- 與詞語全碼表的唯一區別：單字詞使用**簡碼**而非全碼
- 編碼規則：
  - 1字詞：取單字**簡碼**（與全碼的唯一區別）
  - 2字詞：各取前2碼（與全碼相同）
  - 3字詞：首字前2碼 + 第2字首碼 + 末字首碼（與全碼相同）
  - 4字及以上：前3字各取首碼 + 末字前2碼（與全碼相同）
- 已按詞頻排序（基於 `wordFrequencySC.json`）
- 非首選詞添加選重鍵（2, 3, 4...）在編碼末尾
- 用途：詞語簡碼效率分析、簡碼場景下的詞語輸入評估

#### 3. 處理選項

預處理過程會考慮以下選項：

- **isPrefix**: 是否為前綴碼/頂功方案
- **prefixKeys**: 上屏鍵列表（如 `['a', 'o', 'e', 'i', 'u', '_']`）
- **maxLength**: 最大碼長（自動檢測）

這些選項影響：

- 是否需要補充空格（下劃線）
- 如何處理選重按鍵
- 碼長規範化策略

#### 4. 字符過濾

在預處理過程中，系統會自動過濾：

- **非單字符條目**：只保留單個漢字，詞組被排除
- **非 CJK 字符**：只保留 CJK 基本區到擴展 J 區的漢字（共 101,984 個）
- **重複編碼**：同一字符的相同編碼只保留首次出現

#### 5. 字頻數據融合

**相關服務**: `dataService.ts`、`App.vue`

#### 字頻與詞頻數據

##### 數據源概覽

系統使用多個字頻和詞頻數據源，以適應不同的分析場景和用戶群體：

**字頻數據（5 個）**：

1. **知乎簡體字頻** (`charFrequencyZhihu.json`)
   - 來源：知乎平臺的現代簡體中文語料
   - 用途：分析簡體中文現代網絡用語場景
   - 特點：包含網絡用語、新詞、流行語

2. **北語簡體字頻** (`charFrequencySC.json`)
   - 來源：北京語言大學邢紅兵現代漢語語料庫
   - 用途：標準簡體中文分析的首選
   - 特點：語料規範、覆蓋面廣、學術權威性高

3. **臺標繁體字頻** (`charFrequencyTC.json`)
   - 來源：臺灣常用國字標準字體表統計數據
   - 用途：繁體中文輸入法分析
   - 特點：符合臺灣用字習慣、包含臺灣特有用字

4. **古籍繁體字頻** (`charFrequencyGuji.json`)
   - 來源：二十四史的古籍語料統計
   - 用途：古文、文言文輸入場景分析
   - 特點：包含大量古字、異體字、生僻字

5. **繁簡聯合字頻** (`combined`)
   - 來源：北語簡體 + 臺標繁體合併計算
   - 用途：繁簡混合輸入場景
   - 特點：兼顧繁簡兩種用字習慣，適合繁簡通打用戶

**詞頻數據（1 個）**：

1. **現代漢語語料庫分詞類詞頻表** (`wordFrequencySC.json`)
   - 來源：現代漢語語料庫分詞統計
   - 格式：詞語-出現次數配對
   - 詞數：14,887 個常用詞語
   - 用途：詞語重碼分析、詞組輸入效率評估
   - 特點：
     - 已按詞語分組並求和（一個詞語只出現一次）
     - 保持原始排序（按使用頻率從高到低）
     - 覆蓋日常使用的絕大多數詞彙
     - 包含單字詞和多字詞

##### 數據格式

**字頻數據格式**（JSON 對象）：

```json
{
  "的": 40529650,
  "一": 18584230,
  "了": 18338520,
  "是": 16552880,
  ...
}
```

**詞頻數據格式**（JSON 對象）：

```json
{
  "的": 744863,
  "了": 130263,
  "是": 118554,
  "在": 119696,
  "我們": 26821,
  ...
}
```

##### 數據規模

- **字頻數據**：原始頻數約 10 億量級（實際文本統計結果）
- **詞頻數據**：原始頻數約 9550 萬量級（語料庫總字數）
- **字符覆蓋**：常用字 3000-5000 個，包含生僻字可達 8000+ 個
- **詞語覆蓋**：常用詞 14,887 個，涵蓋日常使用的 99%+ 詞彙

##### 字頻數據加載與歸一化

系統在 `App.vue` 的 `loadGlobalCharFrequencies()` 函數中統一加載並歸一化所有字頻數據：

1. **原始數據加載**：從 JSON 文件並行加載 5 個字頻表
   - **知乎簡體字頻** (`charFrequencyZhihu.json`)
   - **北語簡體字頻** (`charFrequencySC.json`)
   - **臺標繁體字頻** (`charFrequencyTC.json`)
   - **古籍繁體字頻** (`charFrequencyGuji.json`)
   - **繁簡聯合字頻** (簡體+繁體合併)

2. **歸一化處理**：將原始頻數（約 10 億量級）轉換為概率值（0-1 之間）

   ```typescript
   const normalizeCharFrequency = (charFreq: CharFrequency): CharFrequency => {
     const totalFreq = Object.values(charFreq).reduce((sum, freq) => sum + freq, 0)
     if (totalFreq === 0) return {}
     
     const normalized: CharFrequency = {}
     for (const [char, freq] of Object.entries(charFreq)) {
       normalized[char] = freq / totalFreq
     }
     return normalized
   }
   ```

3. **全局傳遞**：通過 `props.globalCharFrequencies` 傳遞給所有需要字頻數據的組件

##### 詞頻數據加載與歸一化

系統在 `App.vue` 的 `loadGlobalWordFrequencies()` 函數中統一加載並歸一化詞頻數據：

1. **原始數據加載**：從 JSON 文件加載簡體詞頻表
   - **現代漢語語料庫分詞類詞頻表** (`wordFrequencySC.json`)

2. **歸一化處理**：將原始頻數轉換為概率值（0-1 之間）

   ```typescript
   const normalizeWordFrequency = (wordFreq: WordFrequency): WordFrequency => {
     const totalFreq = Object.values(wordFreq).reduce((sum, freq) => sum + freq, 0)
     if (totalFreq === 0) return {}
     
     const normalized: WordFrequency = {}
     for (const [word, freq] of Object.entries(wordFreq)) {
       normalized[word] = freq / totalFreq
     }
     return normalized
   }
   ```

3. **全局傳遞**：通過 `props.globalWordFrequencies` 傳遞給需要詞頻數據的組件（未來將用於詞語重碼分析卡片）

##### API 使用規範

**✅ 正確做法**：組件只使用 `props.globalCharFrequencies` 或 `props.globalWordFrequencies`

```vue
<script setup lang="ts">
interface Props {
  globalCharFrequencies?: {
    zhihu: CharFrequency
    sc: CharFrequency
    tc: CharFrequency
    guji: CharFrequency
    combined: CharFrequency
  }
  globalWordFrequencies?: {
    sc: WordFrequency
  }
}

const props = defineProps<Props>()

// ✅ 使用 props 中的歸一化字頻
const charFreq = props.globalCharFrequencies?.zhihu[char] || 0

// ✅ 使用 props 中的歸一化詞頻
const wordFreq = props.globalWordFrequencies?.sc[word] || 0
</script>
```

**❌ 錯誤做法**：組件直接調用 `dataService` 或 `fetch` 加載原始頻率

```vue
<script setup lang="ts">
import { loadCharFrequency } from '../services/dataService'

// ❌ 不要在組件中直接加載原始字頻
const rawFreq = await loadCharFrequency()

// ❌ 不要在組件中直接 fetch 詞頻數據
const response = await fetch('/data/wordFrequencySC.json')
const rawWordFreq = await response.json()
</script>
```

##### 字頻與詞頻數據用途

**字頻數據用於**：

- **簡碼效率分析**：計算字頻加權節約碼長
- **速度當量計算**：加權計算按鍵組合頻率
- **動態重碼率**：基於實際使用頻率的重碼統計
- **鍵盤熱力圖**：按鍵使用頻率可視化

**詞頻數據用於**：

- **詞語重碼分析**：統計常用詞語的動態選重率（已實現）
- **詞語重碼詳情**：展示需要選重的詞語及其編碼信息（已實現）
- **詞組輸入效率**：評估詞語輸入相比逐字輸入的效率提升（計劃中）
- **智能組詞建議**：基於詞頻推薦高頻詞組優化方案（計劃中）

##### 為什麼要歸一化？

1. **統一接口**：所有組件使用一致的概率值格式
2. **性能優化**：避免每個組件重複計算總頻數（約 10 億次累加）
3. **數值精度**：概率值（0-1）更適合浮點運算，避免大數溢出
4. **顯示友好**：直接乘以 10000 轉換為萬分率（‱）或乘以 100 轉換為百分比（%）
5. **字詞統一**：字頻和詞頻使用相同的歸一化邏輯，便於後續混合分析

##### 顯示轉換示例

```typescript
// 原始頻數顯示（舊方式，已廢棄）
const displayValue = (rawFreq / 1_000_000_000 * 10_000).toFixed(4) + '‱'

// 歸一化頻率顯示（新方式，推薦）
const displayValue = (normalizedFreq * 10_000).toFixed(4) + '‱'

// 百分比顯示
const displayPercent = (normalizedFreq * 100).toFixed(2) + '%'
```

### 組件調用關係

```txt
用戶上傳碼表
    ↓
CodeTableUploaderCard.vue (解析為 RawCodeTable)
    ↓
ComparisonCard.vue (調用預處理)
    ↓
codeTableProcessingService.processRawCodeTable()
    ↓
生成四個字符輔助碼表 + 一個詞語碼表
    ↓
分發給各個分析組件：
    ├─ CodeTableAnalysisCard.vue → 使用 full, short
    ├─ KeyboardHeatmapCard.vue → 使用 fullWithSelection, wordFullCodeWithSelection
    ├─ DuplicateAnalysisCard.vue → 使用 full, short, wordFullCodeWithSelection
    ├─ MaximumCandidatesCard.vue → 使用 full
    ├─ ShortCodeEfficiencyCard.vue → 使用 short + 字頻過濾
    └─ SpeedEquivCard.vue → 使用 fullWithSelection, shortWithSelection, wordFullCodeWithSelection
```

### 緩存機制

為了提高性能，處理結果會被緩存：

- **服務級緩存**: `codeTableProcessingService` 緩存已處理的四個碼表
- **組件級緩存**: 各分析組件緩存自己的計算結果
- **清除時機**: 上傳新碼表或切換方案時自動清除

### 數據流示例

以"的"字為例，假設有以下碼表行：

```txt
的 d 1    # 一簡，首選
的 de 1   # 二簡，首選
的 dexe 1 # 全碼，首選
```

經過預處理後：

- **full**: `的 → ["dexe"]`（最長編碼）
- **short**: `的 → ["d"]`（最短編碼）
- **fullWithSelection**: `的 → ["dexe_"]`（全碼+空格）
- **shortWithSelection**: `的 → ["d_"]`（簡碼+空格）

如果"的"是二選（position = 2）：

- **fullWithSelection**: `的 → ["dexe2"]`（全碼+選重鍵2）
- **shortWithSelection**: `的 → ["d2"]`（簡碼+選重鍵2）

### 最佳實踐建議

為貢獻者開發新功能時的建議：

1. **復用預處理結果**: 優先使用已生成的四個輔助碼表，避免重複處理
2. **明確碼表類型**: 根據分析需求選擇合適的碼表類型
3. **考慮字頻過濾**: 如需字頻加權，使用 `dataService` 載入字頻數據
4. **處理選重邏輯**: 使用 `*WithSelection` 表進行真實按鍵分析
5. **緩存計算結果**: 對於耗時計算，在組件內實現結果緩存

## 服務架構 (Services)

### builtinCodeTableService.ts

**功能**: 內建碼表服務管理

- `loadBuiltinCodeTable()`: 載入內建碼表
- `getAvailableCodeTables()`: 獲取可用碼表列表
- `getCodeTableInfo()`: 獲取碼表信息

### calculationService.ts

**功能**: 高性能計算服務核心

- `initializeCalculationService()`: 初始化計算服務
- `generateCharset()`: 生成字符集
- `calculateCharCount()`: 計算字符數量
- `preprocessCodeTable()`: 預處理碼表
- `calculateAllMetrics()`: 計算所有指標
- `clearCache()`: 清除緩存

### charsetService.ts

**功能**: 字符集分類和管理

- `loadCharsetData()`: 載入字符集數據
- `loadCJKBlockData()`: 載入CJK區塊數據
- `isInGB2312()`: 判斷是否在GB2312字符集
- `isInGuozi()`: 判斷是否在國字標準字體
- `isInCJKBasic()`: 判斷是否在CJK基本區
- `isInCJKA()` ~ `isInCJKJ()`: 判斷是否在CJK擴展A-J區
- `generateCharset()`: 生成指定類型字符集
- `getCharsetSize()`: 獲取字符集大小
- `getTheoreticalCharsetSize()`: 獲取理論字符集大小

### codeTableCleanService.ts

**功能**: 碼表清理和處理

- `cleanCodeTable()`: 清理碼表數據
- `generateFullCodeTable()`: 生成全碼表
- `generateShortCodeTable()`: 生成簡碼表
- `generateCompleteCharTable()`: 生成完整字符表
- `validateCodeTable()`: 驗證碼表有效性
- `getCodeTableStats()`: 獲取碼表統計信息

### codeTableProcessingService.ts

**功能**: 碼表處理和轉換服務

- `processCodeTable()`: 處理碼表
- `getProcessedTables()`: 獲取處理後的表格
- `getProcessingOptions()`: 獲取處理選項

### dataService.ts

**功能**: 數據載入和緩存管理

- `getFrequencyCharsUnion()`: 獲取頻率字符聯集
- `clearFrequencyCharsCache()`: 清除頻率字符緩存
- `loadCharFrequency()`: 載入知乎字頻
- `loadCharFrequencySC()`: 載入簡體字頻
- `loadCharFrequencyTC()`: 載入繁體字頻
- `loadCharFrequencyGuji()`: 載入古籍字頻
- `loadCharFrequencyUnified()`: 載入統一字頻
- `loadAllCharFrequencies()`: 載入所有字頻數據
- `loadEquivTable()`: 載入當量表

### duplicateAnalysisService.ts

**功能**: 字符與詞語重碼分析計算

**字符重碼分析**:

- `getStaticDupRate()`: 獲取靜態重碼率
- `getDynamicDupRate()`: 獲取字符動態重碼率（按字頻重新排序）
- `getDynamicDupRateFromOriginalOrder()`: 從帶選重鍵的碼表計算動態重碼率（保持原序）
- `getNonFirstDuplicateDetails()`: 獲取非一選重碼字的詳細信息
- `calculateCharsetDuplicates()`: 計算字符集重碼

**詞語重碼分析**:

- `getWordDynamicDupRate()`: 計算詞語動態選重率（從帶選重鍵的詞語碼表）
  - 直接檢查編碼末尾是否有選重鍵（0-9數字）
  - 累加有選重鍵的詞語頻率除以總詞頻
- `getNonFirstWordDuplicateDetails()`: 獲取需要選重的詞語詳細信息
  - 列出所有有選重鍵的詞
  - 顯示去掉選重鍵後的基礎編碼
  - 顯示該基礎編碼上的所有詞（按詞頻降序）

**數據類型**:

- `NonFirstDuplicateDetail`: 字符重碼詳情接口
- `NonFirstWordDuplicateDetail`: 詞語重碼詳情接口

### exportService.ts

**功能**: 導出功能服務

- `exportToImage()`: 導出為圖片
- `exportToCSV()`: 導出為CSV
- `exportToPDF()`: 導出為PDF

### maximumCandidatesService.ts

**功能**: 最大候選項分析

- `getMaximumCandidates()`: 獲取最大候選項
- `getAllMaximumCandidates()`: 獲取所有最大候選項

### shortCodeEfficiencyService.ts

**功能**: 簡碼效率分析

- `calculateShortCodeEfficiency()`: 計算簡碼效率
- `calculateFullCodeAverageLength()`: 計算全碼平均長度
- `calculateShortCodeAverageLength()`: 計算簡碼平均長度
- `preprocessCodeTable()`: 預處理碼表（僅處理單字符且在字頻表中的字符）

### speedAnalysisService.ts

**功能**: 速度分析計算

- `calculateCodePairFrequencies()`: 計算編碼對頻率
- `calculateSpeedEquiv()`: 計算速度當量
- `calculateSpeedEquivFromCodeTable()`: 從碼表計算速度當量

### uiService.ts

**功能**: UI 輔助工具

- `formatRate()`: 格式化比率
- `formatNumber()`: 格式化數字
- `formatEquiv()`: 格式化當量值
- `createTooltipManager()`: 創建工具提示管理器

## 快速開始

### 安裝依賴

```bash
pnpm install
```

### 開發服務器

```bash
pnpm run dev
```

### 構建生產版本

```bash
pnpm run build
```

### 預覽生產版本

```bash
pnpm run preview
```

## 使用指南

### 1. 上傳碼表

1. 選擇碼表格式：字符-編碼 或 編碼-字符
2. 點擊上傳區域或拖拽檔案到上傳區
3. 支援 `.txt` 和 `.csv` 格式
4. 預覽檔案內容確認格式正確
5. 點擊"開始分析"按鈕處理檔案

### 2. 方案對比

1. 可同時添加多個輸入法方案
2. 支援內建方案和檔案上傳方案
3. 實時計算各項性能指標
4. 支援導出對比結果

### 3. 分析功能

- **字符統計**: 各字符集的收字數量
- **重碼分析**: 靜態和動態重碼率
- **簡碼效率**: 簡碼使用優化建議
- **速度當量**: 不同語料的輸入速度分析
- **鍵位熱力圖**: 可視化鍵位使用分布

## 檔案格式要求

### 字符-編碼格式

```txt
的 de
一 yi
是 si
```

### 編碼-字符格式

```txt
de 的
yi 一
si 是
```

**注意事項:**

- 每行一個字符和編碼對
- 字符和編碼之間用空格或制表符分隔
- 僅支援單字符分析（詞語將被過濾）
- 檔案編碼必須為 UTF-8
- 簡碼效率分析只處理在字頻表中的字符

## 性能優化

### 計算優化

- 使用緩存機制避免重複計算
- 異步處理大型碼表
- 字符集預載入機制
- 批量處理和並行計算

### UI 優化

- 組件懶載入
- 虛擬滾動處理大數據
- 響應式設計支援移動端
- 檔案大小限制保護

## 開發說明

### 代碼規範

- 使用 ESLint 進行代碼檢查
- 遵循 Vue 3 Composition API 最佳實踐
- TypeScript 嚴格模式
- 函數和組件命名採用駝峰式
- 優先使用共享樣式文件，避免重複定義

### 樣式開發規範

#### 共享樣式使用

新增或修改組件時，遵循以下樣式開發流程：

1. **檢查共享樣式**: 在 `src/styles/` 目錄查看是否有可用的共享樣式
2. **導入共享樣式**: 在組件 `<style scoped>` 標籤開頭導入所需的共享樣式文件
3. **定義特定樣式**: 僅為組件特有功能編寫樣式

```vue
<template>
  <div class="my-card">
    <!-- 使用共享樣式類 -->
    <div class="header-content">
      <div class="header-text">
        <h3 class="card-title">標題</h3>
      </div>
      <button class="export-btn">導出</button>
    </div>
    <!-- 使用組件特定樣式 -->
    <div class="my-special-content">
      特殊內容
    </div>
  </div>
</template>

<style scoped>
/* 導入共享樣式 */
@import '../styles/card-common.css';

/* 僅定義組件特定樣式 */
.my-card {
  /* 組件特定佈局 */
}

.my-special-content {
  /* 特殊內容樣式 */
}
</style>
```

#### 何時新增共享樣式

當發現以下情況時，考慮將樣式添加到共享文件：

- ✅ 樣式在 3 個或更多組件中重複出現
- ✅ 樣式是通用 UI 模式（按鈕、模態框、表格等）
- ✅ 樣式需要在多處保持一致性
- ❌ 樣式僅用於單一組件的特定場景
- ❌ 樣式高度定制化，不具通用性

#### Composable 使用規範

所有卡片組件應使用 `useCollapse` composable 實現摺疊功能：

```vue
<script setup lang="ts">
import { useCollapse } from '../composables/useCollapse'

// ✅ 正確：使用 composable
const { isCollapsed, toggleCollapsed, collapse, expand, getCollapsedState } = useCollapse()

// 暴露方法給父組件
defineExpose({
  collapse,
  expand,
  toggle: toggleCollapsed,
  getCollapsedState
})

// ❌ 錯誤：手動實現摺疊邏輯
// const isCollapsed = ref(false)
// const toggleCollapsed = () => { isCollapsed.value = !isCollapsed.value }
</script>
```

### 新增功能指南

1. **新增服務**: 在 `services/` 目錄創建新的服務文件
2. **新增組件**: 在 `components/` 目錄創建新的Vue組件
3. **類型定義**: 在 `types/` 目錄更新相關類型
4. **更新文檔**: 同步更新本文檔的函數列表

## 瀏覽器支援

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+

## 貢獻指南

歡迎貢獻代碼！請遵循以下步驟：

1. Fork 本倉庫
2. 創建特性分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 提交 Pull Request

## 授權協議

本項目採用 Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 授權協議 - 查看 [LICENSE](../LICENSE) 檔案了解詳情

## 相關連結

- [宇浩輸入法官網](https://shurufa.app)
- [宇浩輸入法 GitHub](https://github.com/forfudan/yu)
- [作者主頁](https://zhuyuhao.com)
