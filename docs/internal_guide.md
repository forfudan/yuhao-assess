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

**功能**: 重碼分析顯示卡片

- `calculateDuplicateAnalysis()`: 計算重碼分析
- `exportCard()`: 導出重碼分析結果

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

**功能**: 重碼分析計算

- `getStaticDupRate()`: 獲取靜態重碼率
- `getDynamicDupRate()`: 獲取動態重碼率
- `calculateCharsetDuplicates()`: 計算字符集重碼

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
