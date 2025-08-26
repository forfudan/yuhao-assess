# Services 模塊說明

## 概述

Services 文件夾包含應用的業務邏輯和數據處理模塊，按功能領域劃分為以下幾個模塊：

## 核心模块

### `analysisService.ts` - 分析計算服務

負責各種輸入法評測指標的計算和分析。

**主要函數:**

- `getStaticDupRate()` - 計算靜態重碼率
- `getDynamicDupRate()` - 計算動態重碼率
- `calculateCodeTableMetrics()` - 計算碼表綜合指標
- `calculateSpeedEquiv()` - 計算速度當量
- `calculateCodePairFrequencies()` - 計算碼對頻率
- `filterCharFrequency()` - 字頻數據過濾

### `dataService.ts` - 數據加載服務

負責加載各種數據文件和資源。

**主要函數:**

- `loadCharFrequency()` - 加載知乎字頻數據
- `loadCharFrequencySC()` - 加載簡體字頻數據
- `loadCharFrequencyTC()` - 加載繁體字頻數據
- `loadCharFrequencyUnified()` - 加載統一字頻數據
- `loadAllCharFrequencies()` - 並行加載所有字頻數據
- `loadEquivTable()` - 加載當量表

### `uiService.ts` - UI 服務

負責UI相關的功能，包括格式化和交互組件。

**主要函數:**

- `formatRate()` - 格式化比率為萬分比
- `formatNumber()` - 格式化數字（千位分隔符）
- `formatEquiv()` - 格式化當量
- `createTooltipManager()` - 創建工具提示管理器
- `getCharacterTooltip()` - 獲取字符提示文本

## 專業模塊

### `charsetService.ts` - 字符集服務

處理各種中文字符集的判斷和生成。

**主要函數:**

- `isInGB2312()` - 判斷字符是否在 GB2312 字符集
- `isInGuozi()` - 判斷字符是否在國字常用字符集
- `isInCJK*()` - 判斷字符是否在各個 CJK 擴展區
- `generateCharset()` - 生成指定類型的字符集
- `getCharsetSize()` - 獲取字符集大小

### `codeTableCleanService.ts` - 碼表處理服務

負責碼表的清理、驗證和轉換。

**主要函數:**

- `cleanCodeTable()` - 清理碼表
- `generateFullCodeTable()` - 生成全碼表
- `generateShortCodeTable()` - 生成簡碼表
- `validateCodeTable()` - 驗證碼表格式
- `getCodeTableStats()` - 獲取碼表統計信息

### `duplicateAnalysisService.ts` - 重復分析服務

專門處理碼表重復情況的分析。

**主要函數:**

- `calculateCharsetDuplicates()` - 計算字符集重復情況

### `maximumCandidatesService.ts` - 最大候選數服務

計算碼表中的最大候選數情況。

**主要函數:**

- `getMaximumCandidates()` - 獲取單個字符集的最大候選數
- `getAllMaximumCandidates()` - 獲取所有字符集的最大候選數

## 基礎模塊

### `builtinCodeTableService.ts` - 預設碼表服務

管理預設的碼表和相關配置數據。

**主要功能:**

- 加載預設碼表配置
- 提供字頻數據訪問接口
- 管理碼表元數據

### `codeTableProcessingService.ts` - 碼表處理服務

全局碼表處理狀態管理（單例模式）。

**主要功能:**

- 維護全局碼表處理狀態
- 提供處理選項配置
- 緩存處理結果

## 使用方式

所有模塊都通過 `index.ts` 統一導出，可以通過以下方式導入：

```typescript
// 按需導入
import { formatRate, createTooltipManager } from '../services'
import { calculateSpeedEquiv, getDynamicDupRate } from '../services'

// 或者從具體模塊導入
import { formatRate } from '../services/uiService'
import { calculateSpeedEquiv } from '../services/analysisService'
```

## 設計原則

1. **單一職責** - 每個模塊專注於一個功能領域
2. **功能內聚** - 相關功能組織在同一模塊內
3. **低耦合** - 模塊間依賴關係清晰簡單
4. **易擴展** - 新功能可以方便地添加到對應模塊
