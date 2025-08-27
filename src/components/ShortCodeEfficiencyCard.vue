<template>
  <div class="short-code-efficiency-card" :id="id">
    <div class="card-header">
      <div class="header-content">
        <div class="header-text">
          <h3 class="card-title">簡碼效率</h3>
          <p class="card-description">
            計算使用效率最高的若干簡碼下的字頻加權平均碼長。
          </p>
        </div>
        <button @click="toggleCollapsed" class="collapse-button">
          <svg :class="{ 'rotated': isCollapsed }" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </button>
      </div>
    </div>

    <div v-show="!isCollapsed" class="card-content">
      <div v-if="isLoading" class="loading">
        <div class="spinner"></div>
        <span>正在計算簡碼效率...</span>
      </div>

      <div v-else-if="error" class="error">
        <span>{{ error }}</span>
      </div>

      <div v-else-if="tableData.length > 0" class="results">
        <!-- 效率表格 -->
        <div class="table-container">
          <table class="metrics-table">
            <thead>
              <tr>
                <th>簡碼數量</th>
                <th>知乎字頻</th>
                <th>簡體字頻</th>
                <th>繁體字頻</th>
                <th>繁簡聯合字頻</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in tableData" :key="row.N">
                <td class="n-value">{{ row.N }}</td>
                <td 
                  class="metric-value hoverable clickable"
                  @mouseenter="showTooltip($event, row.zhihuChars, row.N, 'zhihu')"
                  @mouseleave="hideTooltip()"
                  @click="copyToClipboard(row.zhihuChars, row.N, 'zhihu')"
                  :class="getCellClass(row.zhihu, [row.zhihu, row.SC, row.TC, row.combined])"
                >
                  {{ formatValue(row.zhihu) }}
                </td>
                <td 
                  class="metric-value hoverable clickable"
                  @mouseenter="showTooltip($event, row.SCChars, row.N, 'SC')"
                  @mouseleave="hideTooltip()"
                  @click="copyToClipboard(row.SCChars, row.N, 'SC')"
                  :class="getCellClass(row.SC, [row.zhihu, row.SC, row.TC, row.combined])"
                >
                  {{ formatValue(row.SC) }}
                </td>
                <td 
                  class="metric-value hoverable clickable"
                  @mouseenter="showTooltip($event, row.TCChars, row.N, 'TC')"
                  @mouseleave="hideTooltip()"
                  @click="copyToClipboard(row.TCChars, row.N, 'TC')"
                  :class="getCellClass(row.TC, [row.zhihu, row.SC, row.TC, row.combined])"
                >
                  {{ formatValue(row.TC) }}
                </td>
                <td 
                  class="metric-value hoverable clickable"
                  @mouseenter="showTooltip($event, row.combinedChars, row.N, 'combined')"
                  @mouseleave="hideTooltip()"
                  @click="copyToClipboard(row.combinedChars, row.N, 'combined')"
                  :class="getCellClass(row.combined, [row.zhihu, row.SC, row.TC, row.combined])"
                >
                  {{ formatValue(row.combined) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 說明文字 -->
        <div class="explanation">
          <p><strong>說明：</strong></p>
          <ul>
            <li>簡碼數量為 0：全碼平均碼長（基準）</li>
            <li>簡碼數量為大於 0：使用N個最有效率的簡碼時的平均碼長</li>
            <li>簡碼字的選取基於漢字字頻 × 節約碼長，並考慮空格鍵</li>
            <li>鼠標懸停在數字上可查看當前區間對應的高效簡碼字</li>
            <li>點擊數字可將當前區間的高效簡碼字復制到剪貼板</li>
          </ul>
        </div>
      </div>

      <div v-else class="no-data">
        <div class="empty-icon">📊</div>
        <h4>等待碼表數據</h4>
        <p>請上傳碼表文件開始分析</p>
      </div>
    </div>
  </div>

  <!-- 自定義工具提示 - 使用 Teleport 移到 body -->
  <Teleport to="body">
    <div v-if="tooltipVisible" class="custom-tooltip" :style="tooltipStyle">
      <div class="tooltip-content">
        <div class="tooltip-header">本區間效率最高簡碼字（點擊數字複製漢字）：</div>
        <div class="tooltip-chars">{{ tooltipChars }}</div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, Teleport } from 'vue'
import { calculateShortCodeEfficiency } from '../services/shortCodeEfficiencyService'
import { useCollapse } from '../composables/useCollapse'
import { loadCharFrequency, loadCharFrequencySC, loadCharFrequencyTC } from '../services/dataService'
import { createTooltipManager } from '../services/uiService'
import type { CodeTable, CharFrequency } from '../types'

// Props
interface Props {
  codeTable: CodeTable
  analysisReady: boolean
  globalPrefixKeys?: string[]
  id?: string
}

const props = defineProps<Props>()

// 折叠功能
const { isCollapsed, toggleCollapsed, collapse, expand, getCollapsedState } = useCollapse()

// 暴露摺疊方法給父組件
defineExpose({
  collapse,
  expand,
  toggle: toggleCollapsed,
  getCollapsedState
})

const isLoading = ref(false)
const error = ref('')
const efficiencyData = ref<Record<string, Array<{ N: number; efficiency: number; selectedChars: string[] }>>>({})

// 工具提示管理器
const { tooltipVisible, tooltipText, tooltipStyle, showTooltip: showTooltipBase, hideTooltip } = createTooltipManager()
const tooltipChars = ref('')

// 字頻數據
const charFrequencies = ref<{
  charFrequencySC: CharFrequency
  charFrequencyTC: CharFrequency
  charFrequencyZhihu: CharFrequency
  combined: CharFrequency
}>({
  charFrequencySC: {},
  charFrequencyTC: {},
  charFrequencyZhihu: {},
  combined: {}
})

interface TableRow {
  N: number
  zhihu: number
  SC: number  
  TC: number
  combined: number
  zhihuChars: string[]
  SCChars: string[]
  TCChars: string[]
  combinedChars: string[]
}

const tableData = computed<TableRow[]>(() => {
  const frequencies = ['charFrequencyZhihu', 'charFrequencySC', 'charFrequencyTC', 'combined'] as const
  if (!frequencies.every(freq => efficiencyData.value[freq as string]?.length > 0)) return []
  
  // 獲取所有N值
  const nValues = efficiencyData.value['charFrequencyZhihu']?.map((r: any) => r.N) || []
  
  return nValues.map((N: number) => {
    const zhihuResult = efficiencyData.value['charFrequencyZhihu']?.find((r: any) => r.N === N)
    const SCResult = efficiencyData.value['charFrequencySC']?.find((r: any) => r.N === N)
    const TCResult = efficiencyData.value['charFrequencyTC']?.find((r: any) => r.N === N)
    const combinedResult = efficiencyData.value['combined']?.find((r: any) => r.N === N)
    
    return {
      N,
      zhihu: zhihuResult?.efficiency || 0,
      SC: SCResult?.efficiency || 0,
      TC: TCResult?.efficiency || 0,
      combined: combinedResult?.efficiency || 0,
      zhihuChars: zhihuResult?.selectedChars || [],
      SCChars: SCResult?.selectedChars || [],
      TCChars: TCResult?.selectedChars || [],
      combinedChars: combinedResult?.selectedChars || []
    }
  })
})

// 載入字頻數據
const loadCharFrequencyData = async () => {
  try {
    // 加載字頻數據
    const [charFreqSC, charFreqTC, charFreqZhihu] = await Promise.all([
      loadCharFrequencySC(),
      loadCharFrequencyTC(),
      loadCharFrequency()
    ])

    // 計算聯合字頻
    const combined: CharFrequency = {}
    const allChars = new Set([
      ...Object.keys(charFreqSC),
      ...Object.keys(charFreqTC),
      ...Object.keys(charFreqZhihu)
    ])

    for (const char of allChars) {
      const frequencies = [
        charFreqSC[char] || 0,
        charFreqTC[char] || 0,
        charFreqZhihu[char] || 0
      ].filter(f => f > 0)
      
      if (frequencies.length > 0) {
        combined[char] = frequencies.reduce((a, b) => a + b, 0) / frequencies.length
      }
    }

    charFrequencies.value = {
      charFrequencySC: charFreqSC,
      charFrequencyTC: charFreqTC,
      charFrequencyZhihu: charFreqZhihu,
      combined: combined
    }
  } catch (err) {
    error.value = `載入字頻數據時出錯: ${err instanceof Error ? err.message : String(err)}`
    console.error('字頻數據載入錯誤:', err)
  }
}

// 從主方案計算簡碼效率
const updateEfficiency = async () => {
  if (!props.codeTable || props.codeTable.size === 0) {
    efficiencyData.value = {}
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    // 轉換碼表格式為數組
    const codeTableRows: Array<{ char: string; code: string }> = []
    for (const [char, codes] of props.codeTable.entries()) {
      for (const code of codes) {
        codeTableRows.push({ char, code })
      }
    }

    // 獲取配置參數
    const maxLen = 4 // 默認最大長度
    const isPrefix = !!props.globalPrefixKeys && props.globalPrefixKeys.length > 0

    const results: Record<string, Array<{ N: number; efficiency: number; selectedChars: string[] }>> = {}

    // 為每個字頻數據計算簡碼效率
    const frequencies = ['charFrequencySC', 'charFrequencyTC', 'charFrequencyZhihu', 'combined']
    for (const freqKey of frequencies) {
      const charFrequency = charFrequencies.value[freqKey as keyof typeof charFrequencies.value]
      if (charFrequency && Object.keys(charFrequency).length > 0) {
        const efficiencyResults = calculateShortCodeEfficiency(
          codeTableRows,
          charFrequency,
          maxLen,
          isPrefix
        )
        results[freqKey] = efficiencyResults
      }
    }

    efficiencyData.value = results
  } catch (err) {
    error.value = `計算簡碼效率時出錯: ${err instanceof Error ? err.message : String(err)}`
    console.error('簡碼效率計算錯誤:', err)
  } finally {
    isLoading.value = false
  }
}

const formatValue = (value: number): string => {
  return value.toFixed(3)
}

// 生成字符工具提示文本 - 顯示差值字符
const showTooltip = (event: MouseEvent, chars: string[], currentN: number, freqType: string) => {
  let displayChars: string[] = []
  const prevN = getPreviousN(currentN)
  
  if (chars.length === 0) {
    tooltipChars.value = '無簡碼字符'
  } else {
    // 根據不同的N值顯示差值字符
    if (prevN > 0) {
      // 獲取前一個N值的字符
      const prevChars = getPreviousChars(prevN, freqType)
      // 計算差值：當前N的字符減去前一個N的字符
      displayChars = chars.filter(char => !prevChars.includes(char))
      tooltipChars.value = displayChars.join('')
      
      if (displayChars.length === 0) {
        tooltipChars.value = '無新增字符'
      }
    } else {
      // 第一行顯示所有字符
      displayChars = chars
      tooltipChars.value = chars.join('')
    }
  }
  
  const actualCount = displayChars.length
  const tooltipText = prevN > 0 
    ? `N=${currentN}新增的${actualCount}個簡碼字符：${tooltipChars.value}`
    : `N=${currentN}的${actualCount}個效率最高的簡碼字符：${tooltipChars.value}`
  showTooltipBase(event, tooltipText)
}

// 獲取前一個N值
const getPreviousN = (currentN: number): number => {
  const nValues = tableData.value.map(row => row.N).sort((a, b) => a - b)
  const currentIndex = nValues.indexOf(currentN)
  return currentIndex > 0 ? nValues[currentIndex - 1] : 0
}

// 獲取前一個N值對應的字符
const getPreviousChars = (prevN: number, freqType: string): string[] => {
  const prevRow = tableData.value.find(row => row.N === prevN)
  if (!prevRow) return []
  
  switch (freqType) {
    case 'zhihu': return prevRow.zhihuChars
    case 'SC': return prevRow.SCChars
    case 'TC': return prevRow.TCChars
    case 'combined': return prevRow.combinedChars
    default: return []
  }
}

const getCellClass = (value: number, rowValues: number[]): string => {
  // 基於絕對值的分級，馬長高顯示綠色，碼長低顯示紅色
  if (value <= 0) return ''
  
  if (value > 3.6) {
    return 'high-value'       // 碼長 3.6 以上 - 紅色
  } else if (value >= 3.0) {
    return 'medium-value'     // 碼長 3.0-3.6 - 黃色
  } else {
    return 'low-value'        // 碼長 3.0 以下 - 綠色
  }
}

// 復制字符到剪貼板
const copyToClipboard = async (chars: string[], currentN: number, freqType: string) => {
  try {
    // 獲取要復制的字符（與懸停顯示邏輯一致）
    let displayChars: string[] = []
    const prevN = getPreviousN(currentN)
    
    if (chars.length === 0) {
      displayChars = []
    } else if (prevN > 0) {
      // 獲取差值字符
      const prevChars = getPreviousChars(prevN, freqType)
      displayChars = chars.filter(char => !prevChars.includes(char))
    } else {
      // 第一行顯示所有字符
      displayChars = chars
    }
    
    const textToCopy = displayChars.join('')
    await navigator.clipboard.writeText(textToCopy)
    
    // 顯示復制成功提示
    const freqNames = {
      'zhihu': '知乎字頻',
      'SC': '簡體字頻', 
      'TC': '繁體字頻',
      'combined': '聯合字頻'
    }
    
    const count = displayChars.length
    const successMessage = prevN > 0 
      ? `已復制${freqNames[freqType as keyof typeof freqNames]}N=${currentN}新增的${count}個字符到剪貼板`
      : `已復制${freqNames[freqType as keyof typeof freqNames]}N=${currentN}的${count}個字符到剪貼板`
    
    console.log(successMessage, textToCopy)
    // 可以在這裡添加 toast 提示
  } catch (err) {
    console.error('復制到剪貼板失敗:', err)
    // 可以在這裡添加錯誤提示
  }
}

// 監聽 props 變化
watch(() => props.codeTable, updateEfficiency, { deep: true })

onMounted(async () => {
  await loadCharFrequencyData()
  if (props.analysisReady) {
    await updateEfficiency()
  }
})
</script>

<style scoped>
.short-code-efficiency-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
  overflow: hidden;
}

.card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 24px;
  color: white;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-text {
  flex: 1;
}

.card-description {
  margin: 0;
  opacity: 0.9;
  line-height: 1.5;
  font-size: 0.95rem;
}

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

.card-content {
  padding: 24px;
}

.loading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  color: #6c757d;
  justify-content: center;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e9ecef;
  border-top: 2px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  padding: 16px;
  background: #f8d7da;
  color: #721c24;
  border-radius: 8px;
  border: 1px solid #f5c6cb;
  text-align: center;
}

/* 使用與重碼分析卡片相同的表格樣式 */
.table-container {
  overflow-x: auto;
  border-radius: 8px;
  margin-bottom: 24px;
}

.metrics-table {
  width: 100%;
  border-collapse: collapse;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.metrics-table th,
.metrics-table td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.8rem;
  line-height: 1.3;
}

.metrics-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #374151;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: left;
}

.metrics-table tbody tr:hover {
  background: #f9fafb;
}

.metrics-table tbody tr:last-child td {
  border-bottom: none;
}

.n-value {
  font-weight: 600;
  background: #f8fafc;
  color: #374151;
  text-align: center;
}

.metric-value {
  font-weight: 600;
  color: #059669;
  font-family: var(--font-numeric);
  font-feature-settings: "tnum" 0; /* 禁用表格數字，使用比例數字 */
  text-align: center;
}

.hoverable {
  cursor: help;
  transition: all 0.2s ease;
}

.clickable {
  cursor: pointer;
}

.hoverable:hover {
  background: #e5e7eb;
  color: #1f2937;
}

/* 效率值的三檔顏色分級 - 反轉邏輯 */
.high-value {
  background: #fee2e2 !important;  /* 淺紅色 - 3.6以上（需要優化） */
  color: #991b1b;
}

.medium-value {
  background: #fef3c7 !important;  /* 淺黃色 - 3.0-3.6（中等） */
  color: #92400e;
}

.low-value {
  background: #dcfce7 !important;  /* 淺綠色 - 3.0以下（效率好） */
  color: #166534;
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

.explanation {
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 0.9rem;
}

.explanation strong {
  color: #495057;
}

.explanation ul {
  margin: 8px 0 0 20px;
  color: #6c757d;
}

.explanation li {
  margin-bottom: 4px;
  line-height: 1.4;
}

.no-data {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.no-data h4 {
  margin: 0 0 8px 0;
  color: #495057;
  font-size: 1.1rem;
}

.no-data p {
  margin: 0;
  font-size: 0.9rem;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .metrics-table {
    font-size: 0.75rem;
  }
  
  .metrics-table th,
  .metrics-table td {
    padding: 6px 8px;
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
  
  .metrics-table th,
  .metrics-table td {
    padding: 4px 6px;
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
