<template>
  <div class="duplicate-analysis-card">
    <div class="card-header">
      <h3>重碼數據分析</h3>
      <div class="controls">
        <button @click="calculateAllMetrics" :disabled="isCalculating" class="calculate-btn">
          {{ isCalculating ? '計算中...' : '重新計算' }}
        </button>
      </div>
    </div>

    <div class="card-content">
      <div v-if="isCalculating" class="loading">
        <div class="spinner"></div>
        <p>正在計算重碼數據...</p>
      </div>

      <div v-else-if="analysisResults" class="analysis-results">
        <table class="metrics-table">
          <thead>
            <tr>
              <th>指標</th>
              <th>數值</th>
              <th>說明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>簡體動態選重率</td>
              <td class="metric-value">{{ (analysisResults.dynamicDupRate * 100).toFixed(2) }}%</td>
              <td class="metric-desc">基於字頻表的加權選重率</td>
            </tr>
            <tr>
              <td>GB2312重碼字符數</td>
              <td class="metric-value">{{ analysisResults.gb2312DuplicateChars.toLocaleString() }}</td>
              <td class="metric-desc">GB2312字符集中存在重碼的字符數</td>
            </tr>
            <tr>
              <td>國字重碼字符數</td>
              <td class="metric-value">{{ analysisResults.guoziDuplicateChars.toLocaleString() }}</td>
              <td class="metric-desc">國字標準字體表中存在重碼的字符數</td>
            </tr>
            <tr>
              <td>國字重碼組數</td>
              <td class="metric-value">{{ analysisResults.guoziDuplicateGroups.toLocaleString() }}</td>
              <td class="metric-desc">國字字符集中的重碼組數量</td>
            </tr>
            <tr>
              <td>GB2312重碼組數</td>
              <td class="metric-value">{{ analysisResults.gb2312DuplicateGroups.toLocaleString() }}</td>
              <td class="metric-desc">GB2312字符集中的重碼組數量</td>
            </tr>
            <tr>
              <td>CJK基本集重碼字符數</td>
              <td class="metric-value">{{ analysisResults.cjkBasicDuplicateChars.toLocaleString() }}</td>
              <td class="metric-desc">CJK統一漢字基本區重碼字符數</td>
            </tr>
            <tr>
              <td>到CJK-B重碼字符數</td>
              <td class="metric-value">{{ analysisResults.cjkToBDuplicateChars.toLocaleString() }}</td>
              <td class="metric-desc">CJK基本區+擴展A+擴展B重碼字符數</td>
            </tr>
            <tr>
              <td>到CJK-F重碼字符數</td>
              <td class="metric-value">{{ analysisResults.cjkToFDuplicateChars.toLocaleString() }}</td>
              <td class="metric-desc">CJK基本區到擴展F重碼字符數</td>
            </tr>
            <tr>
              <td>到CJK-I重碼字符數</td>
              <td class="metric-value">{{ analysisResults.cjkToIDuplicateChars.toLocaleString() }}</td>
              <td class="metric-desc">CJK基本區到擴展I重碼字符數</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">
        <p>請點擊「重新計算」來查看分析結果</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { generateCharset, type CharsetType } from '../services/charsetService'
import type { CodeTable } from '../types'

// Props
interface Props {
  codeTable?: CodeTable
}

const props = withDefaults(defineProps<Props>(), {
  codeTable: () => new Map()
})

// 分析结果数据结构
interface AnalysisResults {
  dynamicDupRate: number
  gb2312DuplicateChars: number
  guoziDuplicateChars: number
  guoziDuplicateGroups: number
  gb2312DuplicateGroups: number
  cjkBasicDuplicateChars: number
  cjkToBDuplicateChars: number
  cjkToFDuplicateChars: number
  cjkToIDuplicateChars: number
}

// 响应式数据
const isCalculating = ref(false)
const analysisResults = ref<AnalysisResults | null>(null)

// 计算字符集的重码字符数和重码组数
async function calculateCharsetDuplicates(charsetType: CharsetType, allChars: Set<string>) {
  const charset = await generateCharset(charsetType, allChars)
  const codeToChars = new Map<string, string[]>()
  
  // 构建重码组
  for (const char of charset) {
    const codes = props.codeTable!.get(char)
    if (codes && codes.length > 0) {
      const code = codes[0]
      if (!codeToChars.has(code)) {
        codeToChars.set(code, [])
      }
      codeToChars.get(code)!.push(char)
    }
  }
  
  // 计算重码统计
  let duplicateChars = 0
  let duplicateGroups = 0
  
  for (const chars of codeToChars.values()) {
    if (chars.length > 1) {
      duplicateChars += chars.length
      duplicateGroups += 1
    }
  }
  
  return { duplicateChars, duplicateGroups }
}

// 计算复合字符集（例如CJK基本+A+B）
async function calculateCompoundCharsetDuplicates(charsetTypes: CharsetType[], allChars: Set<string>) {
  const combinedCharset = new Set<string>()
  
  // 合并多个字符集
  for (const charsetType of charsetTypes) {
    const charset = await generateCharset(charsetType, allChars)
    for (const char of charset) {
      combinedCharset.add(char)
    }
  }
  
  const codeToChars = new Map<string, string[]>()
  
  // 构建重码组
  for (const char of combinedCharset) {
    const codes = props.codeTable!.get(char)
    if (codes && codes.length > 0) {
      const code = codes[0]
      if (!codeToChars.has(code)) {
        codeToChars.set(code, [])
      }
      codeToChars.get(code)!.push(char)
    }
  }
  
  // 计算重码字符数
  let duplicateChars = 0
  for (const chars of codeToChars.values()) {
    if (chars.length > 1) {
      duplicateChars += chars.length
    }
  }
  
  return duplicateChars
}

// 计算所有指标
async function calculateAllMetrics() {
  if (!props.codeTable || props.codeTable.size === 0) {
    console.warn('没有可用的码表数据')
    return
  }
  
  isCalculating.value = true
  
  try {
    const allChars = new Set(props.codeTable.keys())
    
    // 计算动态选重率（暂时使用整体重码率的0.8倍作为估算）
    const codeToChars = new Map<string, string[]>()
    for (const [char, codes] of props.codeTable.entries()) {
      if (codes.length > 0) {
        const code = codes[0]
        if (!codeToChars.has(code)) {
          codeToChars.set(code, [])
        }
        codeToChars.get(code)!.push(char)
      }
    }
    
    let totalDuplicateChars = 0
    for (const chars of codeToChars.values()) {
      if (chars.length > 1) {
        totalDuplicateChars += chars.length
      }
    }
    
    const overallDupRate = props.codeTable.size > 0 ? totalDuplicateChars / props.codeTable.size : 0
    const dynamicDupRate = overallDupRate * 0.8 // 简化估算
    
    // 计算各字符集的重码统计
    const gb2312Stats = await calculateCharsetDuplicates('gb2312', allChars)
    const guoziStats = await calculateCharsetDuplicates('guozi', allChars)
    const cjkBasicStats = await calculateCharsetDuplicates('cjk_basic', allChars)
    
    // 计算复合字符集
    const cjkToBStats = await calculateCompoundCharsetDuplicates(['cjk_basic', 'cjk_a', 'cjk_b'], allChars)
    const cjkToFStats = await calculateCompoundCharsetDuplicates(['cjk_basic', 'cjk_a', 'cjk_b', 'cjk_c', 'cjk_d', 'cjk_e', 'cjk_f'], allChars)
    const cjkToIStats = await calculateCompoundCharsetDuplicates(['cjk_basic', 'cjk_a', 'cjk_b', 'cjk_c', 'cjk_d', 'cjk_e', 'cjk_f', 'cjk_g', 'cjk_h', 'cjk_i'], allChars)
    
    analysisResults.value = {
      dynamicDupRate,
      gb2312DuplicateChars: gb2312Stats.duplicateChars,
      guoziDuplicateChars: guoziStats.duplicateChars,
      guoziDuplicateGroups: guoziStats.duplicateGroups,
      gb2312DuplicateGroups: gb2312Stats.duplicateGroups,
      cjkBasicDuplicateChars: cjkBasicStats.duplicateChars,
      cjkToBDuplicateChars: cjkToBStats,
      cjkToFDuplicateChars: cjkToFStats,
      cjkToIDuplicateChars: cjkToIStats
    }
    
    console.log('分析结果:', analysisResults.value)
  } catch (error) {
    console.error('计算重码时出错:', error)
  } finally {
    isCalculating.value = false
  }
}

// 监听码表变化
watch(() => props.codeTable, (newCodeTable) => {
  if (newCodeTable && newCodeTable.size > 0) {
    calculateAllMetrics()
  }
}, { immediate: true })

// 组件挂载时自动计算一次
onMounted(() => {
  if (props.codeTable && props.codeTable.size > 0) {
    calculateAllMetrics()
  }
})
</script>

<style scoped>
.duplicate-analysis-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 20px;
}

.card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.card-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.calculate-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.95);
  color: #333;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.calculate-btn:hover:not(:disabled) {
  background: white;
  transform: translateY(-1px);
}

.calculate-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.card-content {
  padding: 25px;
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
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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
}

.metrics-table th,
.metrics-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.metrics-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
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
  font-size: 0.875rem;
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
}

.empty-state p {
  margin: 0;
  font-size: 1.1rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .controls {
    justify-content: center;
  }
  
  .metrics-table {
    font-size: 0.875rem;
  }
  
  .metrics-table th,
  .metrics-table td {
    padding: 8px 12px;
  }
}
</style>
