<template>
  <div ref="cardRef" class="maximum-candidates-card" :id="id">
    <div class="card-header">
      <div class="header-content">
        <div class="header-text">
          <h3 class="card-title">候選個數</h3>
          <p class="card-description">分析不同字符集下方案的最大候選項個數，借以反映方案的檢字效率。</p>
        </div>
        <div class="header-buttons">
          <button @click="exportCard" class="export-btn" :disabled="loading || !!error || !analysisResults" title="導出圖片">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
          </button>
          <button @click="toggleCollapsed" class="collapse-button">
            <svg :class="{ 'rotated': isCollapsed }" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
            </svg>
          </button>
        </div>
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
                <th class="count-header">候選個數</th>
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

        <!-- 數據説明 -->
        <div class="info-section">
          <p><strong>説明：</strong></p>
          <p><strong>本方案累計収録 {{ charCount.toLocaleString() }} 個漢字（CJK 基本區到擴展 J 區共 101,984 個漢字）</strong></p>
          <p>最大候選項個數評估輸入法的選字體驗，數值越小表示翻頁次數越少，檢字效率越高。計算考慮了：</p>
          <ul>
            <li>單字全碼和指定字符集，統計每個編碼對應的漢字數量</li>
            <li>取所有編碼中候選項個數的最大值</li>
            <li>顔色標示：<span style="color: #059669; font-weight: 600;">≤2</span>、<span style="color: #d97706; font-weight: 600;">3-5</span>、<span style="color: #dc2626; font-weight: 600;">>5</span></li>
            <li>鼠標懸停在編碼上可查看該編碼對應的所有漢字</li>
          </ul>
        </div>
        
        <!-- 方案名稱標註 -->
        <div v-if="codeTableName" class="scheme-name-annotation">
          <span>當前方案：{{ codeTableName }}</span>
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
import { createTooltipManager, getCharacterTooltip } from '../services/uiService'
import { calculateCharCount } from '../services/calculationService'
import { useCollapse } from '../composables/useCollapse'
import { ExportService } from '../services/exportService'
import type { CodeTable } from '../types'

// Props
interface Props {
  codeTable: CodeTable
  codeTableName?: string
  id?: string
}

const props = defineProps<Props>()

// 折叠功能
const { isCollapsed, toggleCollapsed, collapse, expand, getCollapsedState } = useCollapse()

// 卡片引用
const cardRef = ref<HTMLElement>()

// 導出功能
async function exportCard() {
  if (!cardRef.value || !analysisResults.value) {
    console.warn('卡片元素或數據不可用')
    return
  }

  try {
    await ExportService.exportElementToPNG(cardRef.value, '候選個數', props.codeTableName || '未命名方案', {
      copyToClipboard: ExportService.isClipboardSupported(),
      download: true
    })
  } catch (error) {
    console.error('導出失敗:', error)
    alert('導出失敗，請重試')
  }
}

// 暴露折疊方法給父組件
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
const charCount = ref<number>(0)

// 工具提示管理器
const { tooltipVisible, tooltipText, tooltipStyle, showTooltip: showTooltipBase, hideTooltip } = createTooltipManager()
const tooltipChars = ref('')

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
  cjk_to_j: {
    name: '到CJK-J'
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

// 生成字符工具提示文本（適配器）
const showTooltip = (event: MouseEvent, chars: string[]) => {
  tooltipChars.value = chars.join('')
  const tooltipText = `該編碼對應的漢字：${chars.join('')}`
  showTooltipBase(event, tooltipText)
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
    const [results, charCountResult] = await Promise.all([
      getAllMaximumCandidates(props.codeTable),
      await calculateCharCount(props.codeTable)
    ])
    analysisResults.value = results
    charCount.value = charCountResult
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
  font-family: var(--font-numeric);
  font-feature-settings: "tnum" 0; /* 禁用表格數字，使用比例數字 */
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

/* 方案名稱標註樣式 */
.scheme-name {
  margin-top: 16px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
  text-align: center;
}

.scheme-name span {
  font-size: 0.85rem;
  color: #4a5568;
  font-weight: 500;
}

/* 暗黑模式專用樣式 */
[data-theme="dark"] .results-table-container {
  background: var(--color-bg-primary);
  border-color: var(--color-border-primary);
}

[data-theme="dark"] .results-table {
  background: var(--color-bg-primary);
}

[data-theme="dark"] .results-table th {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border-bottom-color: var(--color-border-primary);
}

[data-theme="dark"] .results-table td {
  color: var(--color-text-primary);
  border-bottom-color: var(--color-border-secondary);
}

[data-theme="dark"] .result-row:hover {
  background: var(--color-bg-tertiary);
}

[data-theme="dark"] .charset-name {
  color: var(--color-text-primary);
}

[data-theme="dark"] .count-value {
  background: var(--color-success-light);
  color: var(--color-success-dark);
}

[data-theme="dark"] .count-value.medium-count {
  background: var(--color-warning-light);
  color: var(--color-warning-dark);
}

[data-theme="dark"] .count-value.high-count {
  background: var(--color-error-light);
  color: var(--color-error-dark);
}

[data-theme="dark"] .code-text {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-secondary);
}

[data-theme="dark"] .hoverable:hover {
  background: var(--color-bg-secondary);
  border-color: var(--color-primary);
  text-decoration-color: var(--color-primary);
}

[data-theme="dark"] .code-separator {
  color: var(--color-text-secondary);
}

[data-theme="dark"] .scheme-name {
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
}

[data-theme="dark"] .scheme-name span {
  color: var(--color-text-secondary);
}
</style>
