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
