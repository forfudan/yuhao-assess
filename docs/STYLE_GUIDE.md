# 樣式與主題配置指南

本文檔記録項目中所有 UI 組件的全局樣式配置，以及如何自定義主題設置。

## 目録

- [主題配置系統](#主題配置系統)
- [表格樣式](#表格樣式)
- [CSS 變量機制](#css-變量機制)
- [技術實現](#技術實現)

---

## 主題配置系統

### 概述

宇浩漢字輸入法測評系統支持自定義主題配置，允許用户在當前會話中調整界面樣式。

### 使用設置頁面

1. 點擊左側導航欄的「設置」
2. 在設置頁面中調整各項參數
3. 設置在當前會話期間有效，刷新頁面後恢復默認值

⚠️ **注意**：所有設置僅在當前會話有效，不會持久化到 localStorage。如需永久修改，請編輯源代碼中的默認主題配置。

### 可配置項目

#### 全局樣式

- **全局字體大小**（10-20px）：影響所有文字和組件的基礎大小
- **全局行高**（1.0-2.0）：影響文字的垂直間距

#### 表格樣式

- **表格字體大小**（10-20px）：統一應用到所有表格單元格
  - ⚠️ **重要**：此設置會同時應用到普通表格單元格和使用等寬字體的單元格（如 monospace-cell）
  - 解決了之前 Ant Design Table 配置（13px）與 CSS 變量 `--font-size-sm`（0.875rem ≈ 14px）不一致的問題
- **單元格垂直内邊距**（0-20px）：表格單元格上下内邊距
- **單元格水平内邊距**（0-20px）：表格單元格左右内邊距
- **表頭背景色**：表頭的背景顔色（十六進制格式）
- **表頭文字顔色**：表頭的文字顔色（十六進制格式）

### 默認值

```typescript
{
  全局字體大小: 14,      // px
  全局行高: 1.4,         // 倍數
  表格: {
    字體大小: 13,                // px
    單元格垂直内邊距: 4,         // px
    單元格水平内邊距: 8,         // px
    表頭背景色: '#f8f9fa',
    表頭文字顔色: '#212529',
  }
}
```

---

## 表格樣式

### 全局配置

項目已配置全局表格樣式，確保所有頁面的表格風格統一。

#### 配置位置

**主要配置：AntdConfigProvider** ([src/components/AntdConfigProvider.tsx](../src/components/AntdConfigProvider.tsx))

動態讀取主題配置並應用到 Ant Design 的 ConfigProvider：

- 全局字體大小 → `token.fontSize`
- 全局行高 → `token.lineHeight`
- 表格配置 → `components.Table.*`

**輔助樣式：table-common.css** ([src/styles/table-common.css](../src/styles/table-common.css))

- 等寬字體單元格樣式（`.monospace-cell`）
- 分頁器樣式
- 深色模式適配

**重要**：Ant Design 5.x 使用 CSS-in-JS，主要樣式必須通過 ConfigProvider 的 `theme` 配置，普通 CSS 文件的優先級較低。

### 使用指南

#### 基本表格

```tsx
import { Table } from 'antd'

// ✅ 推薦：不指定 size，使用全局默認配置
<Table
  dataSource={data}
  columns={columns}
  pagination={{ pageSize: 10 }}
/>

// ❌ 避免：在每個表格中單獨設置 size
<Table
  size="small"  // 不需要，已全局配置
  dataSource={data}
  columns={columns}
/>
```

#### 等寬字體單元格

對於需要等寬字體顯示的内容（如編碼、代碼），使用 `monospace-cell` 類名：

```tsx
{
  title: '編碼',
  dataIndex: 'code',
  render: (text: string) => (
    <span className="monospace-cell">{text}</span>
  ),
}
```

⚠️ **重要**：`.monospace-cell` 使用動態 CSS 變量 `var(--table-font-size, 13px)`，確保與表格其他單元格的字體大小一致。

#### 自定義表格尺寸

如果某個特殊場景需要不同尺寸，可以單獨指定：

```tsx
<Table
  size="middle" // 或 "large"
  dataSource={data}
  columns={columns}
/>
```

### 單元格間距示意圖

```text
┌─────────────────────────┐
│ cellPaddingInline (8px) │ ← 左右留白
│  ┌───────────────────┐  │
│  │ cellPaddingBlock  │  │ ← 上留白 (4px)
│  │ 文字内容           │  │
│  │ cellPaddingBlock  │  │ ← 下留白 (4px)
│  └───────────────────┘  │
└─────────────────────────┘
```

- `cellPaddingBlock`：控制單元格上下留白
- `cellPaddingInline`：控制單元格左右留白
- 數值越小，表格越緊湊

### 設計原則

1. **統一性**：所有表格使用相同的字體大小和行高
2. **簡潔性**：使用默認字體大小，避免過多自定義
3. **緊湊性**：優化單元格 padding，提高信息密度
4. **可維護性**：全局配置，一處修改，全局生效
5. **一致性**：配合設計系統的 CSS 變量使用

---

## CSS 變量機制

### 基本概念

CSS 的 `var()` 函數支持後備值（fallback value）：

```css
font-size: var(--table-font-size, 13px);
```

**工作原理**：

1. **優先**：嘗試使用 CSS 變量 `--table-font-size` 的值
2. **後備**：如果變量未定義或不存在，使用 `13px`

### 實際案例

當用户在設置頁面選擇表格字體大小爲 20px 時：

1. `ThemeProvider` 執行：

   ```javascript
   document.documentElement.style.setProperty('--table-font-size', '20px')
   ```

2. CSS 讀取變量：

   ```css
   .monospace-cell {
     font-size: var(--table-font-size, 13px);
     /* 實際應用的值是 20px，不是 13px */
   }
   ```

3. **結果**：所有使用 `.monospace-cell` 的單元格字體大小都變爲 20px

### 爲什麽需要後備值？

- **漸進增強**：如果 JavaScript 執行失敗或變量未設置，仍有合理的默認值
- **向後兼容**：確保在不支持自定義屬性的舊瀏覽器中有基本樣式
- **開發便利**：在開發階段即使主題系統未啓動，樣式也能正常顯示

### 項目中使用的 CSS 變量

#### 動態變量（由主題系統設置）

```css
--table-font-size          /* 表格字體大小 */
--table-cell-padding-block /* 單元格垂直内邊距 */
--table-cell-padding-inline /* 單元格水平内邊距 */
--table-header-bg          /* 表頭背景色 */
--table-header-color       /* 表頭文字顔色 */
```

#### 靜態變量（定義在 global.css）

```css
--font-size-base           /* 基礎字體大小（1rem / 16px）*/
--font-size-sm             /* 小字體大小（0.875rem / 14px）*/
--font-mono                /* 等寬字體 */
--color-bg-secondary       /* 次要背景色 */
--color-bg-tertiary        /* 第三級背景色 */
```

這些變量定義在 [styles/global.css](../src/styles/global.css) 中。

---

## 技術實現

### 架構圖

```txt
用户設置
    ↓
主題配置原子 (Jotai Atom)
    ↓
    ├─→ ThemeProvider
    │       ↓
    │   設置 CSS 變量到 :root
    │
    └─→ AntdConfigProvider
            ↓
        配置 Ant Design theme token
```

### 配置存儲

- 使用 Jotai 的 `atom` 管理主題狀態（**不持久化**）
- 每次刷新頁面恢復默認值
- 在當前會話期間可以自由調整

### 樣式應用

主題配置通過以下方式應用到界面：

#### 1. CSS 變量（ThemeProvider）

通過 ThemeProvider 動態設置根元素的 CSS 變量：

```typescript
// src/components/ThemeProvider.tsx
useEffect(() => {
  const root = document.documentElement
  root.style.setProperty('--table-font-size', `${主题配置.表格.字体大小}px`)
  root.style.setProperty('--table-cell-padding-block', `${主题配置.表格.单元格垂直内边距}px`)
  root.style.setProperty('--table-cell-padding-inline', `${主题配置.表格.单元格水平内边距}px`)
  root.style.setProperty('--table-header-bg', 主题配置.表格.表头背景色)
  root.style.setProperty('--table-header-color', 主题配置.表格.表头文字颜色)
}, [主题配置])
```

#### 2. Ant Design ConfigProvider

動態配置 Ant Design 組件的 theme token：

```typescript
// src/components/AntdConfigProvider.tsx
<ConfigProvider
  theme={{
    token: {
      fontSize: 主题配置.全局字体大小,
      lineHeight: 主题配置.全局行高,
    },
    components: {
      Table: {
        fontSize: 主题配置.表格.字体大小,
        cellPaddingBlock: 主题配置.表格.单元格垂直内边距,
        cellPaddingInline: 主题配置.表格.单元格水平内边距,
        headerBg: 主题配置.表格.表头背景色,
        headerColor: 主题配置.表格.表头文字颜色,
      },
    },
  }}
>
```

#### 3. CSS 樣式統一

在 `table-common.css` 中：

```css
.ant-table .monospace-cell {
  font-family: var(--font-mono);
  font-size: var(--table-font-size, 13px);
}
```

確保等寬字體單元格與普通單元格使用相同的字體大小。

### 組件層級結構

```txt
main.tsx
  └─ Provider (Jotai)
      └─ BrowserRouter
          └─ AntdConfigProvider
              └─ App
                  └─ ThemeProvider
                      └─ Routes
```

### 修改默認配置

如需永久修改默認主題，編輯 [src/types/theme.ts](../src/types/theme.ts)：

```typescript
export const 默认主题配置: 主题配置 = {
  全局字体大小: 14, // 修改這裏
  全局行高: 1.4, // 修改這裏
  表格: {
    字体大小: 13, // 修改這裏
    单元格垂直内边距: 4, // 修改這裏
    单元格水平内边距: 8, // 修改這裏
    表头背景色: '#f8f9fa', // 修改這裏
    表头文字颜色: '#212529', // 修改這裏
  },
}
```

---

## 常見問題

### Q: 修改配置後需要刷新頁面嗎？

A: 不需要，所有配置更改會立即生效。

### Q: 配置會保存嗎？

A: 不會，配置僅在當前會話有效，刷新頁面後恢復默認值。這是設計選擇，避免用户誤操作後難以恢復。

### Q: 如何永久修改樣式？

A: 編輯源代碼中的 `src/types/theme.ts` 文件，修改 `默认主题配置` 的值。

### Q: 爲什麽表格字體大小很重要？

A: 之前系統中存在不一致：

- Ant Design 的表格配置使用 13px
- CSS 中的 `monospace-cell` 使用 `--font-size-sm`（0.875rem ≈ 14px）

這導致同一表格中不同單元格字體大小不一致。新的主題系統通過 CSS 變量統一了這個配置。

### Q: `var(--table-font-size, 13px)` 中的 13px 會被使用嗎？

A: 只有在 `--table-font-size` 變量未定義時才會使用 13px 作爲後備值。當主題系統正常運行時，會優先使用變量的值（例如用户設置的 20px）。

---

## 其他組件樣式

（待補充更多組件的樣式指南...）
