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
              <th>全碼</th>
              <th>簡碼</th>
              <th>說明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>簡體動態選重率</td>
              <td class="metric-value">{{ (analysisResults.dynamicDupRate.full * 10000).toFixed(2) }}‱</td>
              <td class="metric-value">{{ (analysisResults.dynamicDupRate.short * 10000).toFixed(2) }}‱</td>
              <td class="metric-desc">基於字頻表中所有漢字的加權選重率</td>
            </tr>
            <tr>
              <td>GB2312重碼組數</td>
              <td class="metric-value">{{ analysisResults.gb2312DuplicateGroups.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.gb2312DuplicateGroups.short.toLocaleString() }}</td>
              <td class="metric-desc">GB2312字符集中的重碼組數量</td>
            </tr>
            <tr>
              <td>國字重碼組數</td>
              <td class="metric-value">{{ analysisResults.guoziDuplicateGroups.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.guoziDuplicateGroups.short.toLocaleString() }}</td>
              <td class="metric-desc">國字字符集中的重碼組數量</td>
            </tr>
            <tr>
              <td>GB2312重碼字符數</td>
              <td class="metric-value">{{ analysisResults.gb2312DuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.gb2312DuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">GB2312字符集 ({{ analysisResults.charsetSizes.gb2312.toLocaleString() }} 字符) 中存在重碼的字符數</td>
            </tr>
            <tr>
              <td>國字重碼字符數</td>
              <td class="metric-value">{{ analysisResults.guoziDuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.guoziDuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">國字標準字體表 ({{ analysisResults.charsetSizes.guozi.toLocaleString() }} 字符) 中存在重碼的字符數</td>
            </tr>
            <tr>
              <td>CJK基本集重碼字符數</td>
              <td class="metric-value">{{ analysisResults.cjkBasicDuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.cjkBasicDuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">CJK統一漢字基本區 ({{ analysisResults.charsetSizes.cjkBasic.toLocaleString() }} 字符) 重碼字符數</td>
            </tr>
            <tr>
              <td>到CJK-A重碼字符數</td>
              <td class="metric-value">{{ analysisResults.cjkToADuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.cjkToADuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">CJK基本區+擴展A ({{ analysisResults.charsetSizes.cjkToA.toLocaleString() }} 字符，{{ analysisResults.charsetEncodedSizes?.cjkToA?.toLocaleString() || '未知' }} 有編碼) 重碼字符數</td>
            </tr>
            <tr>
              <td>到CJK-B重碼字符數</td>
              <td class="metric-value">{{ analysisResults.cjkToBDuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.cjkToBDuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">CJK基本區+擴展A+擴展B ({{ analysisResults.charsetSizes.cjkToB.toLocaleString() }} 字符，{{ analysisResults.charsetEncodedSizes?.cjkToB?.toLocaleString() || '未知' }} 有編碼) 重碼字符數</td>
            </tr>
            <tr>
              <td>到CJK-C重碼字符數</td>
              <td class="metric-value">{{ analysisResults.cjkToCDuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.cjkToCDuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">CJK基本區到擴展C ({{ analysisResults.charsetSizes.cjkToC.toLocaleString() }} 字符，{{ analysisResults.charsetEncodedSizes?.cjkToC?.toLocaleString() || '未知' }} 有編碼) 重碼字符數</td>
            </tr>
            <tr>
              <td>到CJK-D重碼字符數</td>
              <td class="metric-value">{{ analysisResults.cjkToDDuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.cjkToDDuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">CJK基本區到擴展D ({{ analysisResults.charsetSizes.cjkToD.toLocaleString() }} 字符，{{ analysisResults.charsetEncodedSizes?.cjkToD?.toLocaleString() || '未知' }} 有編碼) 重碼字符數</td>
            </tr>
            <tr>
              <td>到CJK-E重碼字符數</td>
              <td class="metric-value">{{ analysisResults.cjkToEDuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.cjkToEDuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">CJK基本區到擴展E ({{ analysisResults.charsetSizes.cjkToE.toLocaleString() }} 字符，{{ analysisResults.charsetEncodedSizes?.cjkToE?.toLocaleString() || '未知' }} 有編碼) 重碼字符數</td>
            </tr>
            <tr>
              <td>到CJK-F重碼字符數</td>
              <td class="metric-value">{{ analysisResults.cjkToFDuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.cjkToFDuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">CJK基本區到擴展F ({{ analysisResults.charsetSizes.cjkToF.toLocaleString() }} 字符，{{ analysisResults.charsetEncodedSizes?.cjkToF?.toLocaleString() || '未知' }} 有編碼) 重碼字符數</td>
            </tr>
            <tr>
              <td>到CJK-G重碼字符數</td>
              <td class="metric-value">{{ analysisResults.cjkToGDuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.cjkToGDuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">CJK基本區到擴展G ({{ analysisResults.charsetSizes.cjkToG.toLocaleString() }} 字符，{{ analysisResults.charsetEncodedSizes?.cjkToG?.toLocaleString() || '未知' }} 有編碼) 重碼字符數</td>
            </tr>
            <tr>
              <td>到CJK-H重碼字符數</td>
              <td class="metric-value">{{ analysisResults.cjkToHDuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.cjkToHDuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">CJK基本區到擴展H ({{ analysisResults.charsetSizes.cjkToH.toLocaleString() }} 字符，{{ analysisResults.charsetEncodedSizes?.cjkToH?.toLocaleString() || '未知' }} 有編碼) 重碼字符數</td>
            </tr>
            <tr>
              <td>到CJK-I重碼字符數</td>
              <td class="metric-value">{{ analysisResults.cjkToIDuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.cjkToIDuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">CJK基本區到擴展I ({{ analysisResults.charsetSizes.cjkToI.toLocaleString() }} 字符，{{ analysisResults.charsetEncodedSizes?.cjkToI?.toLocaleString() || '未知' }} 有編碼) 重碼字符數</td>
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
import { generateFullCodeTable, generateShortCodeTable } from '../services/codeTableCleanService'
import { getDynamicDupRate } from '../services/analysisService'
import type { CodeTable, CharFrequency } from '../types'

// Props
interface Props {
  codeTable?: CodeTable
}

const props = withDefaults(defineProps<Props>(), {
  codeTable: () => new Map()
})

// 双值数据结构
interface DualValue {
  full: number
  short: number
}

// 分析结果数据结构
interface AnalysisResults {
  dynamicDupRate: DualValue
  gb2312DuplicateChars: DualValue
  guoziDuplicateChars: DualValue
  guoziDuplicateGroups: DualValue
  gb2312DuplicateGroups: DualValue
  cjkBasicDuplicateChars: DualValue
  cjkToADuplicateChars: DualValue
  cjkToBDuplicateChars: DualValue
  cjkToCDuplicateChars: DualValue
  cjkToDDuplicateChars: DualValue
  cjkToEDuplicateChars: DualValue
  cjkToFDuplicateChars: DualValue
  cjkToGDuplicateChars: DualValue
  cjkToHDuplicateChars: DualValue
  cjkToIDuplicateChars: DualValue
  charsetSizes: {
    gb2312: number
    guozi: number
    cjkBasic: number
    cjkToA: number
    cjkToB: number
    cjkToC: number
    cjkToD: number
    cjkToE: number
    cjkToF: number
    cjkToG: number
    cjkToH: number
    cjkToI: number
  }
  charsetEncodedSizes: {
    cjkToA: number
    cjkToB: number
    cjkToC: number
    cjkToD: number
    cjkToE: number
    cjkToF: number
    cjkToG: number
    cjkToH: number
    cjkToI: number
  }
}

// 响应式数据
const isCalculating = ref(false)
const analysisResults = ref<AnalysisResults | null>(null)

// 加载字频数据
async function loadCharFrequency(): Promise<CharFrequency> {
  try {
    const response = await fetch('/data/charFrequency.json')
    return await response.json()
  } catch (error) {
    console.error('加载字频数据失败:', error)
    return {}
  }
}

// 计算字符集的重码字符数和重码组数（支持双码表）
async function calculateCharsetDuplicates(charsetType: CharsetType, allChars: Set<string>, fullCodeTable: CodeTable, shortCodeTable: CodeTable) {
  const charset = await generateCharset(charsetType, allChars)
  
  // 计算全码表的重码统计
  const fullCodeToChars = new Map<string, string[]>()
  for (const char of charset) {
    const codes = fullCodeTable.get(char)
    if (codes && codes.length > 0) {
      const code = codes[0]
      if (!fullCodeToChars.has(code)) {
        fullCodeToChars.set(code, [])
      }
      fullCodeToChars.get(code)!.push(char)
    }
  }
  
  let fullDuplicateChars = 0
  let fullDuplicateGroups = 0
  for (const chars of fullCodeToChars.values()) {
    if (chars.length > 1) {
      fullDuplicateChars += chars.length
      fullDuplicateGroups += 1
    }
  }
  
  // 计算简码表的重码统计
  const shortCodeToChars = new Map<string, string[]>()
  for (const char of charset) {
    const codes = shortCodeTable.get(char)
    if (codes && codes.length > 0) {
      const code = codes[0]
      if (!shortCodeToChars.has(code)) {
        shortCodeToChars.set(code, [])
      }
      shortCodeToChars.get(code)!.push(char)
    }
  }
  
  let shortDuplicateChars = 0
  let shortDuplicateGroups = 0
  for (const chars of shortCodeToChars.values()) {
    if (chars.length > 1) {
      shortDuplicateChars += chars.length
      shortDuplicateGroups += 1
    }
  }
  
  return { 
    duplicateChars: { full: fullDuplicateChars, short: shortDuplicateChars },
    duplicateGroups: { full: fullDuplicateGroups, short: shortDuplicateGroups },
    charsetSize: charset.size
  }
}

// 生成累積CJK字符集緩存
async function generateCJKCharsetCache(allChars: Set<string>) {
  // 定義CJK擴展區順序
  const cjkExtensions = ['cjk_basic', 'cjk_a', 'cjk_b', 'cjk_c', 'cjk_d', 'cjk_e', 'cjk_f', 'cjk_g', 'cjk_h', 'cjk_i'] as const
  
  // 生成各個單獨的字符集
  const individualCharsets = await Promise.all(
    cjkExtensions.map(ext => generateCharset(ext, allChars))
  )
  
  // 創建累積字符集
  const cumulativeCharsets: { [key: string]: Set<string> } = {}
  let accumulated = new Set<string>()
  
  cjkExtensions.forEach((ext, index) => {
    for (const char of individualCharsets[index]) {
      accumulated.add(char)
    }
    const targetName = ext === 'cjk_basic' ? 'cjkToBasic' : 
                      ext === 'cjk_a' ? 'cjkToA' :
                      ext === 'cjk_b' ? 'cjkToB' :
                      ext === 'cjk_c' ? 'cjkToC' :
                      ext === 'cjk_d' ? 'cjkToD' :
                      ext === 'cjk_e' ? 'cjkToE' :
                      ext === 'cjk_f' ? 'cjkToF' :
                      ext === 'cjk_g' ? 'cjkToG' :
                      ext === 'cjk_h' ? 'cjkToH' : 'cjkToI'
    cumulativeCharsets[targetName] = new Set(accumulated)
  })
  
  return cumulativeCharsets as {
    cjkToBasic: Set<string>
    cjkToA: Set<string>
    cjkToB: Set<string>
    cjkToC: Set<string>
    cjkToD: Set<string>
    cjkToE: Set<string>
    cjkToF: Set<string>
    cjkToG: Set<string>
    cjkToH: Set<string>
    cjkToI: Set<string>
  }
}

// 計算字符集的重碼統計（直接使用字符集）
function calculateDirectCharsetDuplicates(charset: Set<string>, fullCodeTable: CodeTable, shortCodeTable: CodeTable, charsetName: string) {
  // 计算全码表的重码统计
  const fullCodeToChars = new Map<string, string[]>()
  let fullCodeTableMatches = 0
  
  for (const char of charset) {
    const codes = fullCodeTable.get(char)
    if (codes && codes.length > 0) {
      fullCodeTableMatches++
      const code = codes[0]
      if (!fullCodeToChars.has(code)) {
        fullCodeToChars.set(code, [])
      }
      fullCodeToChars.get(code)!.push(char)
    }
  }
  
  let fullDuplicateChars = 0
  let fullDuplicateGroups = 0
  for (const chars of fullCodeToChars.values()) {
    if (chars.length > 1) {
      fullDuplicateChars += chars.length
      fullDuplicateGroups += 1
    }
  }
  
  // 计算简码表的重码统计
  const shortCodeToChars = new Map<string, string[]>()
  let shortCodeTableMatches = 0
  
  for (const char of charset) {
    const codes = shortCodeTable.get(char)
    if (codes && codes.length > 0) {
      shortCodeTableMatches++
      const code = codes[0]
      if (!shortCodeToChars.has(code)) {
        shortCodeToChars.set(code, [])
      }
      shortCodeToChars.get(code)!.push(char)
    }
  }
  
  let shortDuplicateChars = 0
  let shortDuplicateGroups = 0
  for (const chars of shortCodeToChars.values()) {
    if (chars.length > 1) {
      shortDuplicateChars += chars.length
      shortDuplicateGroups += 1
    }
  }
  
  return { 
    duplicateChars: { full: fullDuplicateChars, short: shortDuplicateChars },
    duplicateGroups: { full: fullDuplicateGroups, short: shortDuplicateGroups },
    charsetSize: charset.size,
    encodedSize: fullCodeTableMatches
  }
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
    
    // 生成全码表和简码表
    const fullCodeResult = generateFullCodeTable(props.codeTable)
    const shortCodeResult = generateShortCodeTable(props.codeTable)
    const fullCodeTable = fullCodeResult.codeTable
    const shortCodeTable = shortCodeResult.codeTable
    
    // 加载字频数据
    const charFrequency = await loadCharFrequency()
    
    // 计算动态选重率
    const fullDynamicDupRate = getDynamicDupRate(fullCodeTable, charFrequency)
    const shortDynamicDupRate = getDynamicDupRate(shortCodeTable, charFrequency)
    
    // 计算各字符集的重码统计
    const gb2312Stats = await calculateCharsetDuplicates('gb2312', allChars, fullCodeTable, shortCodeTable)
    const guoziStats = await calculateCharsetDuplicates('guozi', allChars, fullCodeTable, shortCodeTable)
    const cjkBasicStats = await calculateCharsetDuplicates('cjk_basic', allChars, fullCodeTable, shortCodeTable)
    
    // 生成CJK累積字符集緩存
    const cjkCache = await generateCJKCharsetCache(allChars)
    
    // 使用緩存計算累積字符集的重碼統計
    const cjkExtNames = ['cjkToA', 'cjkToB', 'cjkToC', 'cjkToD', 'cjkToE', 'cjkToF', 'cjkToG', 'cjkToH', 'cjkToI'] as const
    const cjkStats: Record<string, any> = {}
    cjkExtNames.forEach(name => {
      cjkStats[name] = calculateDirectCharsetDuplicates(cjkCache[name], fullCodeTable, shortCodeTable, name)
    })
    
    // 構建 CJK 重碼字符結果
    const cjkDuplicateChars: any = {}
    cjkExtNames.forEach(name => {
      cjkDuplicateChars[`${name}DuplicateChars`] = cjkStats[name].duplicateChars
    })
    
    // 構建字符集大小結果
    const cjkCharsetSizes: any = {}
    cjkExtNames.forEach(name => {
      cjkCharsetSizes[name] = cjkStats[name].charsetSize
    })
    
    analysisResults.value = {
      dynamicDupRate: { full: fullDynamicDupRate, short: shortDynamicDupRate },
      gb2312DuplicateChars: gb2312Stats.duplicateChars,
      guoziDuplicateChars: guoziStats.duplicateChars,
      guoziDuplicateGroups: guoziStats.duplicateGroups,
      gb2312DuplicateGroups: gb2312Stats.duplicateGroups,
      cjkBasicDuplicateChars: cjkBasicStats.duplicateChars,
      ...cjkDuplicateChars,
      charsetSizes: {
        gb2312: gb2312Stats.charsetSize,
        guozi: guoziStats.charsetSize,
        cjkBasic: cjkBasicStats.charsetSize,
        ...cjkCharsetSizes
      },
      charsetEncodedSizes: (() => {
        const result: any = {}
        cjkExtNames.forEach(name => {
          result[name] = cjkStats[name].encodedSize
        })
        return result
      })()
    }
    
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
