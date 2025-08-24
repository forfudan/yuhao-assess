<template>
  <div class="speed-equiv-card">
    <div class="card-header">
      <h3>全碼速度當量分析</h3>
      <p class="card-description">分析輸入法的人體工學表現，計算基於字頻加權的按鍵組合速度當量</p>
    </div>

    <div class="card-content">
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

        <div class="prefix-control">
          <button 
            @click="togglePrefixMode" 
            :class="['prefix-button', { 'active': isPrefixCode }]"
            title="切換前綴碼模式"
          >
            {{ isPrefixCode ? '✓ 本方案為前綴碼' : '本方案為前綴碼' }}
          </button>
        </div>

        <div class="info-section">
          <h4>指標說明</h4>
          <p>速度當量基於實驗統計結果，評估輸入法按鍵對的手感表現。數值越小表示輸入越流暢。計算考慮了：</p>
          <ul>
            <li>漢字的使用頻率</li>
            <li v-if="!isPrefixCode">碼表的規範化處理，即在未達到最大碼長時使用空格補充</li>
            <li v-else>前綴碼特性，未達到最大碼長時不補充空格</li>
            <li>多候選字的選擇鍵處理（第2候選加分號，第3候選加單引號，依此類推）</li>
          </ul>
          <p>檢測到的最大碼長為：{{ maxCodeLength }} 位</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { CodeTable } from '../types/index'
import { BuiltinCodeTableService } from '../services/builtinCodeTableService'

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
const isPrefixCode = ref(false)
const builtinService = new BuiltinCodeTableService()

// 特殊字符用于测试最大码长
const TEST_CHARS = ['灌', '瓣', '璧', '豁', '糯', '籍', '矗', '瓤', '嚼', '瞻', '覆', '馨', '徽', '警', '繁', '霜', '霞']

// 检查是否为内置前缀码方案
async function checkBuiltinPrefixCode() {
  if (!props.codeTableName) return
  
  try {
    const response = await fetch('/data/codeTableConfig.json')
    if (!response.ok) return
    
    const config = await response.json()
    const builtinTables = config.builtinCodeTables || []
    
    const matchedTable = builtinTables.find((table: any) => 
      table.key === props.codeTableName || table.name === props.codeTableName
    )
    
    if (matchedTable && matchedTable.prefix === true) {
      isPrefixCode.value = true
    }
  } catch (error) {
    console.warn('检查内置方案配置失败:', error)
  }
}

// 切换前缀码模式
function togglePrefixMode() {
  isPrefixCode.value = !isPrefixCode.value
  // 立即重新计算当量
  if (props.codeTable && props.codeTable.size > 0) {
    calculateSpeedEquivAnalysis()
  }
}

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

// 计算最大码长
function calculateMaxCodeLength(codeTable: CodeTable): number {
  let maxLength = 0
  for (const char of TEST_CHARS) {
    const codes = codeTable.get(char)
    if (codes && codes.length > 0) {
      const codeLength = codes[0].length
      maxLength = Math.max(maxLength, codeLength)
    }
  }
  return maxLength || 4 // 默认4位
}

// 处理码表：短码补充下划线（前缀码除外）并添加选择键
function processCodeTable(codeTable: CodeTable, maxLength: number, isPrefix: boolean): CodeTable {
  const processedTable = new Map<string, string[]>()
  
  // 首先收集所有编码的字符，按频率排序以确定候选顺序
  const codeToChars = new Map<string, string[]>()
  
  for (const [char, codes] of codeTable.entries()) {
    if (codes.length === 0) continue
    
    for (const code of codes) {
      if (!codeToChars.has(code)) {
        codeToChars.set(code, [])
      }
      codeToChars.get(code)!.push(char)
    }
  }
  
  // 为每个字符处理编码
  for (const [char, codes] of codeTable.entries()) {
    if (codes.length === 0) continue
    
    const processedCodes: string[] = []
    
    for (const code of codes) {
      const charsWithThisCode = codeToChars.get(code) || []
      const charIndex = charsWithThisCode.indexOf(char)
      
      let processedCode = code
      
      // 非前缀码且未达到最大码长时补充下划线
      if (!isPrefix && code.length < maxLength) {
        processedCode = code + '_'
      }
      
      // 如果有多个候选，添加选择键
      if (charsWithThisCode.length > 1 && charIndex > 0) {
        const selectKeys = [';', "'", '4', '5', '6', '7', '8', '9']
        if (charIndex - 1 < selectKeys.length) {
          processedCode += selectKeys[charIndex - 1]
        } else {
          // 超过选择键数量时用数字继续
          processedCode += (charIndex + 1).toString()
        }
      }
      
      processedCodes.push(processedCode)
    }
    
    processedTable.set(char, processedCodes)
  }
  
  return processedTable
}

// 计算编码对的频率分布
function calculateCodePairFrequencies(
  codeTable: CodeTable, 
  charFrequency: Record<string, number>
): Record<string, number> {
  const pairFrequencies: Record<string, number> = {}
  
  for (const [char, codes] of codeTable.entries()) {
    const frequency = charFrequency[char] || 0
    if (frequency === 0 || codes.length === 0) continue
    
    const code = codes[0] // 使用第一个编码
    
    // 生成所有相邻的编码对
    for (let i = 0; i < code.length - 1; i++) {
      const pair = code.substring(i, i + 2)
      pairFrequencies[pair] = (pairFrequencies[pair] || 0) + frequency
    }
  }
  
  return pairFrequencies
}

// 计算速度当量
function calculateSpeedEquiv(
  pairFrequencies: Record<string, number>,
  equivTable: Record<string, number>
): number {
  let totalWeightedEquiv = 0
  let totalFrequency = 0
  
  for (const [pair, frequency] of Object.entries(pairFrequencies)) {
    const equiv = equivTable[pair]
    if (equiv !== undefined) {
      totalWeightedEquiv += equiv * frequency
      totalFrequency += frequency
    }
  }
  
  return totalFrequency > 0 ? totalWeightedEquiv / totalFrequency : 0
}

// 主计算函数
async function calculateSpeedEquivAnalysis() {
  if (!props.codeTable || props.codeTable.size === 0) {
    return
  }

  isCalculating.value = true
  error.value = null

  try {
    // 1. 计算最大码长
    maxCodeLength.value = calculateMaxCodeLength(props.codeTable)
    
    // 2. 处理码表
    const processedCodeTable = processCodeTable(props.codeTable, maxCodeLength.value, isPrefixCode.value)
    
    // 3. 加载当量表
    const equivTable = await loadEquivTable()
    
    // 4. 加载各种字频表
    const [zhihuFreq, scFreq, tcFreq, unifiedFreq] = await Promise.all([
      builtinService.loadCharFrequency(),
      builtinService.loadCharFrequencySC(),
      builtinService.loadCharFrequencyTC(),
      builtinService.loadCharFrequencyUnified()
    ])
    
    // 5. 计算各种字频下的速度当量
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
watch(() => props.codeTable, (newCodeTable) => {
  if (newCodeTable && newCodeTable.size > 0) {
    calculateSpeedEquivAnalysis()
  }
}, { immediate: true })

// 监听方案名称变化，检查是否为内置前缀码方案
watch(() => props.codeTableName, (newName) => {
  if (newName) {
    checkBuiltinPrefixCode()
  }
}, { immediate: true })

// 组件挂载时自动计算
onMounted(async () => {
  // 检查是否为内置前缀码方案
  if (props.codeTableName) {
    await checkBuiltinPrefixCode()
  }
  
  // 如果没有检测到内置前缀码，使用用户上传时的设置
  if (!isPrefixCode.value && props.initialPrefix) {
    isPrefixCode.value = true
  }
  
  // 自动计算
  if (props.codeTable && props.codeTable.size > 0) {
    calculateSpeedEquivAnalysis()
  }
})
</script>

<style scoped>
.speed-equiv-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 20px;
}

.card-header {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  padding: 20px;
}

.card-header h3 {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.card-description {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.9;
  line-height: 1.4;
}

.card-description a {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: underline;
}

.card-description a:hover {
  color: white;
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

.prefix-control {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.prefix-button {
  background: #f3f4f6;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.prefix-button:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.prefix-button.active {
  background: #dcfce7;
  border-color: #16a34a;
  color: #15803d;
}

.prefix-button.active:hover {
  background: #bbf7d0;
  border-color: #15803d;
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
  .card-header {
    padding: 15px;
  }
  
  .card-content {
    padding: 15px;
  }
  
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
