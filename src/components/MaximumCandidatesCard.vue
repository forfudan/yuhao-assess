<template>
  <div class="maximum-candidates-card">
    <div class="card-header">
      <div class="header-content">
        <div class="header-text">
          <h3 class="card-title">最大候選項個數</h3>
          <p class="card-description">分析不同字符集下每個編碼的最大候選項個數。數字越小，翻頁次數越少。</p>
        </div>
        <button @click="toggleCollapsed" class="collapse-button">
          <svg :class="{ 'rotated': isCollapsed }" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </button>
      </div>
    </div>
    
    <div v-show="!isCollapsed" class="card-content">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>計算中...</p>
      </div>
      
      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <h4>計算失敗</h4>
        <p>{{ error }}</p>
        <button @click="calculateData" class="retry-btn">重試</button>
      </div>
      
      <div v-else-if="analysisResults" class="results-container">
        <!-- 數據表格 -->
        <div class="results-table-container">
          <table class="results-table">
            <thead>
              <tr>
                <th class="charset-header">字符集</th>
                <th class="count-header">最大候選項個數</th>
                <th class="codes-header">對應編碼</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in tableData" :key="item.charset" class="result-row">
                <td class="charset-cell">
                  <div class="charset-info">
                    <span class="charset-name">{{ item.name }}</span>
                  </div>
                </td>
                <td class="count-cell">
                  <span class="count-value" :class="{ 'high-count': item.count > 5, 'medium-count': item.count > 2 }">
                    {{ item.count }}
                  </span>
                </td>
                <td class="codes-cell">
                  <div class="codes-list">
                    <span 
                      v-for="(codeInfo, index) in item.codes" 
                      :key="codeInfo.code"
                      class="code-item"
                    >
                      <span 
                        class="code-text hoverable"
                        @mouseenter="showTooltip($event, codeInfo.chars)"
                        @mouseleave="hideTooltip()"
                      >
                        {{ codeInfo.code }}
                      </span>
                      <span v-if="index < item.codes.length - 1" class="code-separator">, </span>
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 數據說明 -->
        <div class="analysis-notes">
          <h4>📝 分析說明</h4>
          <div class="notes-grid">
            <div class="note-item">
              <span class="note-label">計算方式:</span>
              <span>使用全碼表和某個字符集，統計每個編碼對應的漢字數量，取最大值</span>
            </div>
            <div class="note-item">
              <span class="note-label">顏色標示:</span>
              <span>
                <span class="count-demo normal">≤2</span>
                <span class="count-demo medium">3-5</span>
                <span class="count-demo high">>5</span>
              </span>
            </div>
            <div class="note-item">
              <span class="note-label">其他功能:</span>
              <span>鼠標懸停在編碼上可查看該編碼對應的所有漢字</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 自定義工具提示 - 使用 Teleport 移到 body -->
  <Teleport to="body">
    <div v-if="tooltipVisible" class="custom-tooltip" :style="tooltipStyle">
      <div class="tooltip-content">
        <div class="tooltip-header">該編碼對應的漢字：</div>
        <div class="tooltip-chars">{{ tooltipChars }}</div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, Teleport } from 'vue'
import { getAllMaximumCandidates, type MaximumCandidatesResult } from '../services/maximumCandidatesService'
import { useCollapse } from '../composables/useCollapse'
import type { CodeTable } from '../types'

// Props
interface Props {
  codeTable: CodeTable
}

const props = defineProps<Props>()

// 折叠功能
const { isCollapsed, toggleCollapsed, collapse, expand, getCollapsedState } = useCollapse()

// 暴露折叠方法给父组件
defineExpose({
  collapse,
  expand,
  toggle: toggleCollapsed,
  getCollapsedState
})

// 響應式數據
const loading = ref(false)
const error = ref<string | null>(null)
const analysisResults = ref<Record<string, MaximumCandidatesResult> | null>(null)

// 工具提示相關
const tooltipVisible = ref(false)
const tooltipChars = ref('')
const tooltipStyle = ref({})

// 字符集信息映射
const charsetInfo = {
  gb2312: {
    name: 'GB2312'
  },
  guozi: {
    name: '國字常用'
  },
  cjk_basic: {
    name: 'CJK基本區'
  },
  cjk_to_a: {
    name: '到CJK-A'
  },
  cjk_to_b: {
    name: '到CJK-B'
  },
  cjk_to_f: {
    name: '到CJK-F'
  },
  cjk_to_i: {
    name: '到CJK-I'
  }
}

// 計算表格數據
const tableData = computed(() => {
  if (!analysisResults.value) return []
  
  return Object.entries(analysisResults.value).map(([charset, result]) => ({
    charset,
    name: charsetInfo[charset as keyof typeof charsetInfo]?.name || charset,
    count: result.maxCount,
    codes: result.codes
  }))
})

// 生成字符工具提示文本
const getCharacterTooltip = (chars: string[]) => {
  return `該編碼對應的漢字：${chars.join('')}`
}

// 顯示自定義工具提示
const showTooltip = (event: MouseEvent, chars: string[]) => {
  console.log('showTooltip called with chars:', chars)
  tooltipChars.value = chars.join('')
  tooltipVisible.value = true
  
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  const tooltipLeft = Math.min(rect.left, window.innerWidth - 320) // 确保不超出右边界
  const tooltipTop = rect.bottom + 8
  
  tooltipStyle.value = {
    position: 'fixed',
    left: `${tooltipLeft}px`,
    top: `${tooltipTop}px`,
    zIndex: 9999
  }
  console.log('Tooltip visible:', tooltipVisible.value, 'chars:', tooltipChars.value)
  console.log('Tooltip position:', tooltipStyle.value)
}

// 隱藏工具提示
const hideTooltip = () => {
  console.log('hideTooltip called')
  tooltipVisible.value = false
}

// 計算分析數據
const calculateData = async () => {
  if (!props.codeTable || props.codeTable.size === 0) {
    error.value = '請先上傳碼表'
    return
  }
  
  loading.value = true
  error.value = null
  
  try {
    const results = await getAllMaximumCandidates(props.codeTable)
    analysisResults.value = results
  } catch (err) {
    console.error('計算最大候選項失敗:', err)
    error.value = err instanceof Error ? err.message : '計算失敗，請重試'
  } finally {
    loading.value = false
  }
}

// 監聽碼表變化
watch(() => props.codeTable, () => {
  if (props.codeTable && props.codeTable.size > 0) {
    calculateData()
  }
}, { immediate: true })

// 組件掛載時計算
onMounted(() => {
  if (props.codeTable && props.codeTable.size > 0) {
    calculateData()
  }
})
</script>

<style scoped>
/* 卡片头部布局 */
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
}

.header-text {
  flex: 1;
}

/* 折叠按钮样式 */
.collapse-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  padding: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: var(--spacing-lg);
  backdrop-filter: blur(10px);
}

.collapse-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.collapse-button svg {
  transition: transform 0.3s ease;
}

.collapse-button svg.rotated {
  transform: rotate(180deg);
}

/* 原有样式 */
/* 載入和錯誤狀態 */
.loading-state,
.error-state {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #8b5cf6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.error-state h4 {
  margin: 0 0 8px 0;
  font-size: 1.25rem;
  color: #374151;
}

.error-state p {
  margin: 0 0 24px 0;
  font-size: 0.875rem;
}

.retry-btn {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.retry-btn:hover {
  background: #7c3aed;
}

/* 結果容器 */
.results-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 表格樣式 */
.results-table-container {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin-bottom: 24px;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.results-table th,
.results-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.results-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.charset-header {
  width: 25%;
}

.count-header {
  width: 20%;
  text-align: center;
}

.codes-header {
  width: 55%;
}

.result-row:hover {
  background: #f9fafb;
}

.charset-cell {
  text-align: left;
}

.charset-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.charset-name {
  font-weight: 500;
  color: #374151;
}

.count-cell {
  text-align: center;
}

.count-value {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  background: #dcfce7;
  color: #166534;
}

.count-value.medium-count {
  background: #fef3c7;
  color: #92400e;
}

.count-value.high-count {
  background: #fee2e2;
  color: #991b1b;
}

.codes-cell {
  padding: 12px 16px;
}

.codes-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.code-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.code-text {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #374151;
}

.hoverable {
  cursor: help;
  text-decoration: underline;
  text-decoration-style: dotted;
  text-decoration-color: #cbd5e1;
  transition: all 0.2s ease;
}

.hoverable:hover {
  background: #e5e7eb;
  color: #1f2937;
  text-decoration-color: #3b82f6;
}

.code-separator {
  color: #6b7280;
}

/* 自定義工具提示 */
.custom-tooltip {
  position: fixed;
  background: #1f2937;
  color: white;
  border-radius: 8px;
  padding: 12px;
  font-size: 0.875rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  max-width: 300px;
  z-index: 9999;
  pointer-events: none;
  border: 2px solid #3b82f6; /* 添加边框便于调试 */
  min-width: 100px;
  min-height: 50px;
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tooltip-header {
  font-weight: 500;
  color: #d1d5db;
  font-size: 0.75rem;
}

.tooltip-chars {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 1.2rem;
  line-height: 1.5;
  word-break: break-all;
}

/* 分析說明 */
.analysis-notes {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
}

.analysis-notes h4 {
  margin: 0 0 16px 0;
  font-size: 1rem;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
}

.notes-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.note-item {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.note-label {
  font-weight: 500;
  color: #374151;
  min-width: 80px;
  flex-shrink: 0;
}

.note-item span:last-child {
  color: #6b7280;
  line-height: 1.5;
}

.count-demo {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-right: 8px;
}

.count-demo.normal {
  background: #dcfce7;
  color: #166534;
}

.count-demo.medium {
  background: #fef3c7;
  color: #92400e;
}

.count-demo.high {
  background: #fee2e2;
  color: #991b1b;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .results-table {
    font-size: 0.75rem;
  }
  
  .results-table th,
  .results-table td {
    padding: 8px 12px;
  }
  
  .charset-header {
    width: 30%;
  }
  
  .count-header {
    width: 25%;
  }
  
  .codes-header {
    width: 45%;
  }
  
  .notes-grid {
    gap: 8px;
  }
  
  .note-item {
    flex-direction: column;
    gap: 4px;
  }
  
  .note-label {
    min-width: auto;
  }
  
  .code-text {
    font-size: 0.75rem;
    padding: 1px 4px;
  }
  
  .help-icon {
    width: 14px;
    height: 14px;
    font-size: 9px;
  }
  
  .custom-tooltip {
    max-width: 250px;
    font-size: 0.75rem;
  }
  
  .tooltip-chars {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .card-content {
    padding: 16px;
  }
  
  .results-table th,
  .results-table td {
    padding: 6px 8px;
  }
  
  .charset-header {
    width: 35%;
  }
  
  .count-header {
    width: 25%;
  }
  
  .codes-header {
    width: 40%;
  }
  
  .codes-list {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
  
  .code-item {
    gap: 2px;
  }
  
  .custom-tooltip {
    max-width: 200px;
    padding: 8px;
    font-size: 0.7rem;
  }
  
  .tooltip-chars {
    font-size: 0.9rem;
  }
}
</style>
