<template>
  <div class="maximum-candidates-card">
    <div class="card-header">
      <h3>最大候選項個數</h3>
      <p class="card-description">分析不同字符集下每個編碼的最大候選項個數</p>
    </div>
    
    <div class="card-content">
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
                <th class="description-header">說明</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in tableData" :key="item.charset" class="result-row">
                <td class="charset-cell">
                  <div class="charset-info">
                    <span class="charset-name">{{ item.name }}</span>
                    <span class="charset-code">{{ item.charset }}</span>
                  </div>
                </td>
                <td class="count-cell">
                  <span class="count-value" :class="{ 'high-count': item.count > 5, 'medium-count': item.count > 2 }">
                    {{ item.count }}
                  </span>
                </td>
                <td class="description-cell">
                  <span class="description-text">{{ item.description }}</span>
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
              <span>使用全碼表統計每個編碼對應的漢字數量，取最大值</span>
            </div>
            <div class="note-item">
              <span class="note-label">數值意義:</span>
              <span>數值越小表示重碼越少，翻頁次數越少</span>
            </div>
            <div class="note-item">
              <span class="note-label">顏色標示:</span>
              <span>
                <span class="count-demo normal">≤2</span>
                <span class="count-demo medium">3-5</span>
                <span class="count-demo high">>5</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { getAllMaximumCandidates } from '../services/maximumCandidatesService'
import type { CodeTable } from '../types'

// Props
interface Props {
  codeTable: CodeTable
}

const props = defineProps<Props>()

// 響應式數據
const loading = ref(false)
const error = ref<string | null>(null)
const analysisResults = ref<Record<string, number> | null>(null)

// 字符集信息映射
const charsetInfo = {
  gb2312: {
    name: 'GB2312',
    description: '簡體字符集（6763字）'
  },
  guozi: {
    name: '國字常用',
    description: '繁體常用字符集（4808字）'
  },
  cjk_basic: {
    name: 'CJK基本區',
    description: 'Unicode基本漢字區（20992字）'
  },
  cjk_to_a: {
    name: '到CJK-A',
    description: '包含CJK基本區+擴展A區'
  },
  cjk_to_b: {
    name: '到CJK-B',
    description: '包含到CJK-A+擴展B區'
  },
  cjk_to_f: {
    name: '到CJK-F',
    description: '包含到CJK-B+擴展C-F區'
  },
  cjk_to_i: {
    name: '到CJK-I',
    description: '包含到CJK-F+擴展G-I區'
  }
}

// 計算表格數據
const tableData = computed(() => {
  if (!analysisResults.value) return []
  
  return Object.entries(analysisResults.value).map(([charset, count]) => ({
    charset,
    name: charsetInfo[charset as keyof typeof charsetInfo]?.name || charset,
    description: charsetInfo[charset as keyof typeof charsetInfo]?.description || '',
    count
  }))
})

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
.maximum-candidates-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin: 20px 0;
}

.card-header {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  padding: 20px 25px;
}

.card-header h3 {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.card-description {
  margin: 0;
  opacity: 0.9;
  font-size: 0.875rem;
}

.card-content {
  padding: 25px;
}

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
  space-y: 24px;
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
  width: 30%;
}

.count-header {
  width: 25%;
  text-align: center;
}

.description-header {
  width: 45%;
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

.charset-code {
  font-size: 0.75rem;
  color: #6b7280;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
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

.description-cell {
  color: #6b7280;
  font-size: 0.875rem;
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
    width: 35%;
  }
  
  .count-header {
    width: 25%;
  }
  
  .description-header {
    width: 40%;
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
}

@media (max-width: 480px) {
  .card-content {
    padding: 16px;
  }
  
  .results-table th,
  .results-table td {
    padding: 6px 8px;
  }
  
  .description-header,
  .description-cell {
    display: none;
  }
  
  .charset-header {
    width: 60%;
  }
  
  .count-header {
    width: 40%;
  }
}
</style>
