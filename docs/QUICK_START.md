# 快速開始指南

根據 [ROADMAP.md](ROADMAP.md) 的規劃，本文檔提供階段零的快速實施步驟。

## ✅ 已完成的配置

以下配置已在當前分支完成，無需重複執行：

- ✅ 數據文件外部化（yuhao-assess-data 倉庫）
- ✅ Markdown Lint 配置
- ✅ 字形統一腳本（TypeScript 版本）
- ✅ TypeScript 配置更新
- ✅ GitHub Copilot 指引

## 🚀 下一步工作

### 1. 推送數據倉庫到 GitHub（5 分鐘）

```bash
# 在 GitHub 創建新倉庫：yuhao-assess-data
# 然後執行：
cd /Users/ZHU/Programs/ime/yuhao-assess-data
git remote add origin https://github.com/forfudan/yuhao-assess-data.git
git push -u origin main
```

### 2. 啟用 GitHub Pages（2 分鐘）

在 GitHub 倉庫設置中：

- Settings → Pages
- Source: Deploy from branch `main`
- 等待 1-2 分鐘部署完成

### 3. 設置 Pre-commit Hook（20 分鐘）

```bash
# 安装依赖
pnpm add -D husky lint-staged prettier eslint
pnpm add -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
pnpm add -D eslint-plugin-react eslint-plugin-react-hooks

# 创建配置文件
cat > .prettierrc.json << 'EOF'
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "avoid"
}
EOF

cat > .eslintrc.cjs << 'EOF'
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
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
}
EOF

# 更新 package.json scripts
# (手动编辑或使用下面的脚本)
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
pkg.scripts = {
  ...pkg.scripts,
  prepare: 'husky install',
  lint: 'eslint . --ext .ts,.tsx --fix',
  format: 'prettier --write \"**/*.{ts,tsx,json,md,css}\"',
  'normalize-chars': 'pnpm exec tsx src/utils/normalize-traditional-chars.ts'
};
pkg['lint-staged'] = {
  '*.{ts,tsx}': [
    'pnpm exec tsx src/utils/normalize-traditional-chars.ts',
    'eslint --fix',
    'prettier --write'
  ],
  '*.{json,md}': ['prettier --write'],
  '*.css': ['prettier --write'],
  '*.{js,mjs}': ['eslint --fix', 'prettier --write']
};
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

# 初始化 Husky
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"

# 提交
git add .
git commit -m "chore: 设置 pre-commit hooks 和代码规范"
```

### 4. 测试字形统一脚本（5分钟）

```bash
# 查看帮助
pnpm exec tsx src/utils/normalize-traditional-chars.ts
# 输出：支持的映射: 76 组字形转换

# 测试脚本（处理单个文件）
pnpm exec tsx src/utils/normalize-traditional-chars.ts docs/ROADMAP.md

# 批量处理文件
pnpm exec tsx src/utils/normalize-traditional-chars.ts src/**/*.ts

# 如果有修改，提交
git add .
git commit -m "chore: 统一字形"
```

## 📋 階段零檢查清單

完成以上步驟後，檢查：

- [x] 數據文件外部化：`yuhao-assess-data` 倉庫已創建
- [x] `.gitignore` 已添加 `public/data/`
- [x] `src/utils/data-loader.ts` 已創建
- [ ] yuhao-assess-data 已推送到 GitHub
- [ ] GitHub Pages 已啟用（數據 CDN 可訪問）
- [ ] Pre-commit hook 已安裝並測試
- [ ] Markdown lint 可正常運行：`pnpm exec markdownlint-cli2 "docs/*.md"`

## 🎯 下一步

### 阶段一：React 基础架构（预计 6-8 小时）

1. **依赖迁移**（1小时）
   - 移除 Vue 相关依赖
   - 安装 React、Ant Design、Jotai
   - 更新 Vite 配置

2. **目录结构**（1小时）
   - 创建 `src/pages/`
   - 创建 `src/components/layout/`
   - 创建 `src/atoms/`
   - 创建 `src/hooks/`

3. **chinese-ime-metrics 集成**（2小时）
   - 配置本地开发路径
   - 实现 CDN 加载器
   - 测试 WASM 加载

4. **基础组件**（2-3小时）
   - 创建 `AppLayout.tsx`
   - 创建 `Sidebar.tsx`
   - 配置路由

5. **单元测试**（1小时）
   - 测试布局组件渲染
   - 测试路由切换

## 📊 时间总览

| 阶段 | 预计时间 | 累计时间 |
| --- | --- | --- |
| 阶段零（今天） | 1 小时 | 1 小时 |
| 阶段一 | 6-8 小时 | 7-9 小时 |
| 阶段二 | 6-8 小时 | 13-17 小时 |
| 阶段三 | 4-6 小时 | 17-23 小时 |
| 阶段四 | 12-16 小时 | 29-39 小时 |
| 阶段五 | 4-5 小时 | 33-44 小时 |
| 阶段六 | 3-4 小时 | 36-48 小时 |
| 阶段七 | 2-3 小时 | 38-51 小时 |

**预计总时间**：约 40-50 小时（5-7 个工作日）

## 🛠️ 開發環境要求

- Node.js 20+
- pnpm 8+
- Chrome/Firefox（用於測試 WASM）

## 📞 遇到問題？

参考：

- [ROADMAP.md](ROADMAP.md) - 完整路线图
- [chinese-ime-metrics 文档](../../chinese-ime-metrics/docs/)
- [React 官方文档](https://react.dev/)
- [Jotai 文档](https://jotai.org/)

---

**创建日期**：2026-02-03  
**维护者**：@forfudan
