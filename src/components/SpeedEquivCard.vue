<template>
  <div class="speed-equiv-card">
    <div class="card-header">
      <div class="header-content">
        <div class="header-text">
          <h3 class="card-title">全碼速度當量分析</h3>
          <p class="card-description">分析輸入法的人體工學表現，計算基於字頻加權的按鍵組合速度當量。閱讀<a href="https://shurufa.app/docs/concepts.html" target="_blank">瓊林擷英</a>瞭解詳細定義。</p>
        </div>
        <button @click="toggleCollapsed" class="collapse-button">
          <svg :class="{ 'rotated': isCollapsed }" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </button>
      </div>
    </div>

    <div v-show="!isCollapsed" class="card-content">
      <div v-if="isCalculating" class="loading">
        <div class="spinner"></div>
        <p>正在計算速度當量...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <h4>計算失敗</h4>
        <p>{{ error }}</p>
      </div>

      <div v-else-if="analysisResults" class="analysis-results">
        <table class="metrics-table">
          <thead>
            <tr>
              <th>字頻來源</th>
              <th>速度當量</th>
              <th>說明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>知乎字頻</td>
              <td class="metric-value">{{ analysisResults.zhihuEquiv.toFixed(4) }}</td>
              <td class="metric-desc">基於<a href="https://github.com/forfudan/chinese-characters-frequency" target="_blank" rel="noopener">知乎字頻表</a>的加權速度當量</td>
            </tr>
            <tr>
              <td>簡體字頻</td>
              <td class="metric-value">{{ analysisResults.scEquiv.toFixed(4) }}</td>
              <td class="metric-desc">基於<a href="https://faculty.blcu.edu.cn/xinghb/zh_CN/article/167473/content/1437.htm" target="_blank" rel="noopener">簡體字頻表</a>的加權速度當量</td>
            </tr>
            <tr>
              <td>繁體字頻</td>
              <td class="metric-value">{{ analysisResults.tcEquiv.toFixed(4) }}</td>
              <td class="metric-desc">基於<a href="https://language.moe.gov.tw/001/Upload/files/SITE_CONTENT/M0001/PIN/biau1.htm" target="_blank" rel="noopener">繁體字頻表</a>的加權速度當量</td>
            </tr>
            <tr>
              <td>繁簡聯合字頻</td>
              <td class="metric-value">{{ analysisResults.unifiedEquiv.toFixed(4) }}</td>
              <td class="metric-desc">基於繁簡聯合字頻表的加權速度當量</td>
            </tr>
          </tbody>
        </table>

        <div class="info-section">
          <h4>指標說明</h4>
          <p>速度當量基於實驗統計結果，評估輸入法按鍵對的手感表現。數值越小表示輸入越流暢。計算考慮了：</p>
          <ul>
            <li>使用全碼碼表（每個單字的最長編碼）進行分析</li>
            <li>漢字的使用頻率</li>
            <li v-if="!detectedIsPrefix">碼表的規範化處理，即在未達到最大碼長時使用下劃線補充（代表空格）</li>
            <li v-else>前綴碼特性，未達到最大碼長時不補充下劃線</li>
            <li>多候選字的選擇鍵處理（第2候選加分號，第3候選加單引號）</li>
          </ul>
          <p>檢測到的最大碼長為：{{ maxCodeLength }} 位{{ detectedIsPrefix ? '，檢測到本方案為前綴碼' : '' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { useCollapse } from '../composables/useCollapse'
import type { CodeTable } from '../types/index'
import { BuiltinCodeTableService } from '../services/builtinCodeTableService'
import { codeTableProcessingService } from '../services/codeTableProcessingService'
import { 
  loadAllCharFrequencies,
  calculateSpeedEquiv,
  calculateCodePairFrequencies 
} from '../services/utilsService'

// Props
interface Props {
  codeTable?: CodeTable
  codeTableName?: string
  initialPrefix?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  codeTable: () => new Map(),
  codeTableName: '',
  initialPrefix: false
})

// 折叠功能
const { isCollapsed, toggleCollapsed, collapse, expand, getCollapsedState } = useCollapse()

// 暴露折叠方法给父组件
defineExpose({
  collapse,
  expand,
  toggle: toggleCollapsed,
  getCollapsedState
})

// 分析结果数据结构
interface SpeedEquivResults {
  zhihuEquiv: number
  scEquiv: number
  tcEquiv: number
  unifiedEquiv: number
}

// 响应式数据
const isCalculating = ref(false)
const error = ref<string | null>(null)
const analysisResults = ref<SpeedEquivResults | null>(null)
const maxCodeLength = ref<number>(0)
const detectedIsPrefix = ref(false)
const builtinService = new BuiltinCodeTableService()

// 加载当量表
async function loadEquivTable(): Promise<Record<string, number>> {
  try {
    const response = await fetch('/data/equivTable.json')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data.data || {}
  } catch (error) {
    console.error('加载当量表失败:', error)
    throw new Error('加载当量表失败')
  }
}

// 主计算函数
async function calculateSpeedEquivAnalysis() {
  if (!props.codeTable || props.codeTable.size === 0) {
    return
  }
  
  isCalculating.value = true
  error.value = null

  try {
    // 1. 直接获取已处理的码表（由App.vue统一处理）
    const processedTables = codeTableProcessingService.getProcessedTables()
    if (!processedTables) {
      throw new Error('无法获取处理后的码表')
    }
    
    const fullCodeTable = processedTables.full
    const processedCodeTable = processedTables.fullWithSelection
    
    // 2. 从处理服务获取最大码长和前缀码检测结果
    const processingOptions = codeTableProcessingService.getProcessingOptions()
    maxCodeLength.value = processingOptions?.maxLength || 4
    detectedIsPrefix.value = processingOptions?.isPrefix || false
    
    // 3. 加载当量表
    const equivTable = await loadEquivTable()
    
    // 5. 加载各种字频表
    const { zhihuFreq, scFreq, tcFreq, unifiedFreq } = await loadAllCharFrequencies()
    
    // 6. 计算各种字频下的速度当量
    const zhihuPairFreq = calculateCodePairFrequencies(processedCodeTable, zhihuFreq)
    const scPairFreq = calculateCodePairFrequencies(processedCodeTable, scFreq)
    const tcPairFreq = calculateCodePairFrequencies(processedCodeTable, tcFreq)
    const unifiedPairFreq = calculateCodePairFrequencies(processedCodeTable, unifiedFreq)
    
    analysisResults.value = {
      zhihuEquiv: calculateSpeedEquiv(zhihuPairFreq, equivTable),
      scEquiv: calculateSpeedEquiv(scPairFreq, equivTable),
      tcEquiv: calculateSpeedEquiv(tcPairFreq, equivTable),
      unifiedEquiv: calculateSpeedEquiv(unifiedPairFreq, equivTable)
    }
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : '计算失败'
    console.error('速度当量计算失败:', err)
  } finally {
    isCalculating.value = false
  }
}

// 监听码表变化
watch(() => props.codeTable, async (newCodeTable) => {
  if (newCodeTable && newCodeTable.size > 0) {
    // 延迟一点确保其他watch已执行
    await nextTick()
    calculateSpeedEquivAnalysis()
  }
}, { immediate: false })  // 不立即执行，让组件挂载逻辑控制

// 组件挂载时自动计算
onMounted(async () => {
  // SpeedEquivCard不再自己检测前缀码，完全依赖App.vue的处理结果
  // 直接执行计算
  if (props.codeTable && props.codeTable.size > 0) {
    calculateSpeedEquivAnalysis()
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
.card-description a {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: underline;
}

.card-description a:hover {
  color: white;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #f59e0b;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.analysis-results {
  width: 100%;
}

.metrics-table {
  width: 100%;
  border-collapse: collapse;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 25px;
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
}

.metrics-table tbody tr:hover {
  background: #f9fafb;
}

.metrics-table tbody tr:last-child td {
  border-bottom: none;
}

.metric-value {
  font-weight: 600;
  color: #059669;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
}

.metric-desc {
  color: #6b7280;
  font-size: 0.75rem;
}

.metric-desc a {
  color: #3b82f6;
  text-decoration: none;
}

.metric-desc a:hover {
  text-decoration: underline;
}

.info-section {
  background: #f8fafc;
  border-radius: 8px;
  padding: 20px;
  border-left: 4px solid #f59e0b;
}

.info-section h4 {
  margin: 0 0 12px 0;
  color: #374151;
  font-size: 1rem;
  font-weight: 600;
}

.info-section p {
  margin: 0 0 12px 0;
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.6;
}

.info-section ul {
  margin: 0 0 12px 0;
  padding-left: 20px;
  color: #6b7280;
  font-size: 0.875rem;
}

.info-section li {
  margin-bottom: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .metrics-table {
    font-size: 0.75rem;
  }
  
  .metrics-table th,
  .metrics-table td {
    padding: 6px 8px;
    font-size: 0.7rem;
  }
}
</style>
