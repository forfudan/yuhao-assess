# 样式统一指南

本文档记录项目中所有 UI 组件的全局样式配置，确保整个应用的视觉风格统一。

## 表格样式

### 全局配置

项目已配置全局表格样式，确保所有页面的表格风格统一。

#### 配置位置

**主要配置：ConfigProvider** ([main.tsx](../src/main.tsx))

- 全局字体大小：14px（`fontSize`）
- 全局行高：1.4（`lineHeight`）
- 表格单元格padding：上下4px，左右8px（`cellPaddingBlock`, `cellPaddingInline`）
- 表格表头样式：背景色、文字颜色（`headerBg`, `headerColor`）
- 默认表格尺寸：small

**辅助样式：table-common.css** ([styles/table-common.css](../src/styles/table-common.css))

- 等宽字体单元格样式（`.monospace-cell`）
- 分页器样式
- 深色模式适配

**重要：** Ant Design 5.x 使用 CSS-in-JS，主要样式必须通过 ConfigProvider 的 `theme` 配置，普通 CSS 文件的优先级较低。

### 使用指南

#### 基本表格

```tsx
import { Table } from 'antd'

// ✅ 推荐：不指定 size，使用全局默认配置
<Table
  dataSource={data}
  columns={columns}
  pagination={{ pageSize: 10 }}
/>

// ❌ 避免：在每个表格中单独设置 size
<Table
  size="small"  // 不需要，已全局配置
  dataSource={data}
  columns={columns}
/>
```

#### 等宽字体单元格

对于需要等宽字体显示的内容（如编码、代码），使用 `monospace-cell` 类名：

```tsx
{
  title: '编码',
  dataIndex: 'code',
  render: (text: string) => (
    <span className="monospace-cell">{text}</span>
  ),
}
```

#### 自定义表格尺寸

如果某个特殊场景需要不同尺寸，可以单独指定：

```tsx
<Table
  size="middle" // 或 "large"
  dataSource={data}
  columns={columns}
/>
```

### 全局控制

#### 修改全局字体和间距

编辑 [main.tsx](../src/main.tsx) 中的 `theme.token`：

```tsx
<ConfigProvider
  theme={{
    token: {
      fontSize: 14,      // 全局字体大小（px）
      lineHeight: 1.4,   // 全局行高（倍数）
    },
  }}
>
```

**参数说明：**

- `fontSize`: 影响所有文字和组件的基础大小
- `lineHeight`: 文字行高 = fontSize × lineHeight

#### 修改表格单元格间距（Padding）

编辑 [main.tsx](../src/main.tsx) 中的 `theme.components.Table`：

```tsx
components: {
  Table: {
    cellPaddingBlock: 4,    // 单元格上下padding（px）
    cellPaddingInline: 8,   // 单元格左右padding（px）
    headerBg: '#f8f9fa',    // 表头背景色
    headerColor: '#212529', // 表头文字颜色
  },
}
```

**参数图解：**

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

- `cellPaddingBlock`: 控制单元格上下留白
- `cellPaddingInline`: 控制单元格左右留白
- 数值越小，表格越紧凑

### 设计原则

1. **统一性**：所有表格使用相同的字体大小和行高
2. **简洁性**：使用默认字体大小，避免过多自定义
3. **紧凑性**：优化单元格padding，提高信息密度
4. **可维护性**：全局配置，一处修改，全局生效
5. **一致性**：配合设计系统的 CSS 变量使用

### CSS 变量参考

在样式文件中可以使用以下 CSS 变量：

- `--font-size-base`：基础字体大小（1rem / 16px）
- `--font-size-sm`：小字体大小（0.875rem / 14px）
- `--font-mono`：等宽字体
- `--color-bg-secondary`：次要背景色
- `--color-bg-tertiary`：第三级背景色

这些变量定义在 [styles/global.css](../src/styles/global.css) 中。

---

## 其他组件样式

（待补充更多组件的样式指南...）
