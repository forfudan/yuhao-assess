# 本地多方案支持 — 需求规格

## 背景

当前应用只支持单一「当前方案」。用户需要能在浏览器本地保存多个方案配置及其测评结果，方便对比不同参数下的指标差异。

---

## 需求列表

### 1. 克隆方案

- 右上角新增「克隆」按钮。
- 点击后：
  1. 将**当前方案**（原方案名、原标识符、当前所有测评结果）作为快照存入 local schemes。
  2. 将**当前方案**的方案名改为「原名 + `Copy on yyyy-mm-dd HH:MM:SS`」，标识符改为新生成的唯一 ID（`local-{timestamp}-{random}`）。
  3. `當前本地方案標識符` 指向新标识符。
  4. 跳转到主页，让用户进一步修改配置。
- 结果：页面显示的是改了名字的新方案（克隆版），local schemes 里保存的是原方案快照。

### 2. 本地方案切换器

- 右上角提供下拉框，列出所有本地方案（有本地方案时才显示）。
- 切换时：恢复对应方案的测评结果到各 atoms，清空码表相关状态。

### 3. 清除行为

- 当前方案是本地方案时，「清除」按钮删除该本地方案：
  - 若列表还有其他方案，自动切换到列表末尾的方案。
  - 若列表为空，清空所有数据。
- 当前方案不是本地方案时，「清除」行为不变（清空所有数据）。
- 删除前弹出确认提示。

### 4. 测评结果自动同步

- 当 `當前本地方案標識符` 非空时，监听各测评结果 atoms 的变化，自动将最新结果写回 local schemes 对应条目（`useLocalSchemeSyncMetrics` hook，挂载在 `MainLayout`）。
- 重算指标后同样自动同步，无需额外操作。

### 5. 方案对比集成

- 本地方案默认全部参与对比（新增方案时自动加入选中列表）。
- 「选择对比方案」弹窗分「本地方案」和「内置方案」两个区块，可分别勾选/取消。
- 选中状态持久化到 localStorage（`atomWithStorage`），切换页面不丢失。
- 当前激活的本地方案已以「当前方案」形式出现在对比表格中，不重复添加。

### 6. 新建方案

- 新建时自动生成唯一标识符（`new-scheme-{timestamp}-{random}`），不使用硬编码的 `new-scheme`。

### 7. 首页预设方案下拉框

- 当前方案是本地方案时（标识符以 `local-` 开头），下拉框显示 placeholder，不干扰内置方案列表的选中状态。

---

## 数据结构

直接复用现有的 `方案配置介面`（已含 `測評結果?: 方案測評結果介面`），不新增类型。

- **local schemes 存储键**：`yuhao-assess:local-schemes`，值为 `方案配置介面[]`
- **当前激活标识符**：`yuhao-assess:current-local-scheme-id`，值为 `string | null`
- **对比页选中本地方案**：`yuhao-assess:comparison-local-schemes`，值为 `string[]`
- **唯一标识符格式**：`local-{Date.now()}-{Math.random().toString(36).slice(2,9)}`

---

## 实现文件清单

| 文件                                     | 改动类型                      |
| ---------------------------------------- | ----------------------------- |
| `src/atoms/localSchemes.ts`              | 新增                          |
| `src/hooks/useLocalSchemeSyncMetrics.ts` | 新增                          |
| `src/services/schemeService.ts`          | 修改（`創建空白方案` 标识符） |
| `src/components/layout/AppHeader.tsx`    | 修改（克隆、切换器、清除）    |
| `src/components/layout/MainLayout.tsx`   | 修改（挂载 hook）             |
| `src/pages/HomePage.tsx`                 | 修改（下拉框 value 逻辑）     |
| `src/pages/ComparisonPage.tsx`           | 修改（本地方案对比集成）      |
| `src/atoms/index.ts`                     | 修改（导出新 atoms）          |
