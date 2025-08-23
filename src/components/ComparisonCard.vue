<template>
  <div class="comparison-card">
    <div class="card-header">
      <h3>數據對比</h3>
      <p class="card-description">對比不同輸入法方案的全碼重碼數據</p>
    </div>

    <div class="card-content">
      <div v-if="!hasAnyScheme" class="empty-state">
        <div class="empty-icon">📊</div>
        <h4>開始方案對比</h4>
        <p>添加多個輸入法方案進行對比分析</p>
        <button @click="showAddForm = true" class="primary-btn">添加第一個方案</button>
      </div>
      
      <div v-else>
        <!-- 對比表格 -->
        <div class="comparison-table-container">
          <table class="comparison-table">
            <thead>
              <tr>
                <th class="scheme-name-header">方案名稱</th>
                <th class="metric-header">
                  <div class="metric-header-content">
                    <span>知乎動態選重率</span>
                    <small>基於知乎字頻</small>
                  </div>
                </th>
                <th class="metric-header">
                  <div class="metric-header-content">
                    <span>簡體動態選重率</span>
                    <small>基於簡體字頻</small>
                  </div>
                </th>
                <th class="metric-header">
                  <div class="metric-header-content">
                    <span>繁體動態選重率</span>
                    <small>基於繁體字頻</small>
                  </div>
                </th>
                <th class="metric-header">
                  <div class="metric-header-content">
                    <span>聯合動態選重率</span>
                    <small>基於繁簡聯合字頻</small>
                  </div>
                </th>
                <th class="metric-header">
                  <div class="metric-header-content">
                    <span>GB2312</span>
                    <small>重碼字數</small>
                  </div>
                </th>
                <th class="metric-header">
                  <div class="metric-header-content">
                    <span>國字常用</span>
                    <small>重碼字數</small>
                  </div>
                </th>
                <th class="metric-header">
                  <div class="metric-header-content">
                    <span>CJK基本區</span>
                    <small>重碼字數</small>
                  </div>
                </th>
                <th class="metric-header">
                  <div class="metric-header-content">
                    <span>到CJK-A</span>
                    <small>重碼字數</small>
                  </div>
                </th>
                <th class="metric-header">
                  <div class="metric-header-content">
                    <span>到CJK-B</span>
                    <small>重碼字數</small>
                  </div>
                </th>
                <th class="metric-header">
                  <div class="metric-header-content">
                    <span>到CJK-I</span>
                    <small>重碼字數</small>
                  </div>
                </th>
                <th class="actions-header">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(scheme, index) in allSchemes" :key="scheme.id" class="scheme-row">
                <td class="scheme-name">
                  <div class="scheme-info">
                    <span class="scheme-title">{{ scheme.name }}</span>
                    <span v-if="scheme.isBuiltin" class="scheme-source">內置方案</span>
                    <span v-else-if="scheme.name === '當前方案'" class="scheme-source">當前方案</span>
                    <span v-else class="scheme-source">上傳文件</span>
                  </div>
                </td>
                <td class="metric-cell">
                  <div v-if="scheme.isCalculating" class="calculating">
                    <div class="mini-spinner"></div>
                    <span>計算中</span>
                  </div>
                  <span v-else class="metric-value">
                    {{ formatRate(scheme.data?.dynamicDupRate) }}
                  </span>
                </td>
                <td class="metric-cell">
                  <div v-if="scheme.isCalculating" class="calculating">
                    <div class="mini-spinner"></div>
                    <span>計算中</span>
                  </div>
                  <span v-else class="metric-value">
                    {{ formatRate(scheme.data?.dynamicDupRateSC) }}
                  </span>
                </td>
                <td class="metric-cell">
                  <div v-if="scheme.isCalculating" class="calculating">
                    <div class="mini-spinner"></div>
                    <span>計算中</span>
                  </div>
                  <span v-else class="metric-value">
                    {{ formatRate(scheme.data?.dynamicDupRateTC) }}
                  </span>
                </td>
                <td class="metric-cell">
                  <div v-if="scheme.isCalculating" class="calculating">
                    <div class="mini-spinner"></div>
                    <span>計算中</span>
                  </div>
                  <span v-else class="metric-value">
                    {{ formatRate(scheme.data?.dynamicDupRateUnified) }}
                  </span>
                </td>
                <td class="metric-cell">
                  <div v-if="scheme.isCalculating" class="calculating">
                    <div class="mini-spinner"></div>
                    <span>計算中</span>
                  </div>
                  <span v-else class="metric-value">
                    {{ formatNumber(scheme.data?.gb2312DuplicateChars) }}
                  </span>
                </td>
                <td class="metric-cell">
                  <div v-if="scheme.isCalculating" class="calculating">
                    <div class="mini-spinner"></div>
                    <span>計算中</span>
                  </div>
                  <span v-else class="metric-value">
                    {{ formatNumber(scheme.data?.guoziDuplicateChars) }}
                  </span>
                </td>
                <td class="metric-cell">
                  <div v-if="scheme.isCalculating" class="calculating">
                    <div class="mini-spinner"></div>
                    <span>計算中</span>
                  </div>
                  <span v-else class="metric-value">
                    {{ formatNumber(scheme.data?.cjkBasicDuplicateChars) }}
                  </span>
                </td>
                <td class="metric-cell">
                  <div v-if="scheme.isCalculating" class="calculating">
                    <div class="mini-spinner"></div>
                    <span>計算中</span>
                  </div>
                  <span v-else class="metric-value">
                    {{ formatNumber(scheme.data?.cjkToADuplicateChars) }}
                  </span>
                </td>
                <td class="metric-cell">
                  <div v-if="scheme.isCalculating" class="calculating">
                    <div class="mini-spinner"></div>
                    <span>計算中</span>
                  </div>
                  <span v-else class="metric-value">
                    {{ formatNumber(scheme.data?.cjkToBDuplicateChars) }}
                  </span>
                </td>
                <td class="metric-cell">
                  <div v-if="scheme.isCalculating" class="calculating">
                    <div class="mini-spinner"></div>
                    <span>計算中</span>
                  </div>
                  <span v-else class="metric-value">
                    {{ formatNumber(scheme.data?.cjkToIDuplicateChars) }}
                  </span>
                </td>
                <td class="actions-cell">
                  <button 
                    v-if="canRemoveScheme(index)" 
                    @click="removeScheme(index)" 
                    class="remove-btn"
                    title="移除此方案"
                  >
                    🗑️
                  </button>
                  <span v-else class="no-remove">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 添加方案按鈕 -->
        <div class="add-scheme-section">
          <button 
            @click="showAddForm = true" 
            class="add-scheme-btn"
            :disabled="isAdding"
          >
            <span v-if="isAdding">添加中...</span>
            <span v-else>➕ 添加新方案</span>
          </button>
        </div>
      </div>

      <!-- 添加方案表單 -->
      <div v-if="showAddForm" class="add-form-overlay">
        <div class="add-form">
          <div class="form-header">
            <h4>添加對比方案</h4>
            <button @click="cancelAdd" class="close-btn">✕</button>
          </div>
          
          <div class="form-content">
            <!-- 內置方案選項 -->
            <div class="form-section">
              <h5>內置方案</h5>
              <p class="section-desc">選擇預設的輸入法方案</p>
              <div class="builtin-options">
                <select v-model="selectedBuiltinScheme" class="scheme-select">
                  <option value="">請選擇內置方案</option>
                  <option v-for="scheme in availableBuiltinSchemes" :key="scheme.id" :value="scheme.id">
                    {{ scheme.name }}
                  </option>
                </select>
                <button 
                  @click="addBuiltinScheme" 
                  :disabled="!selectedBuiltinScheme || isAdding"
                  class="add-btn"
                >
                  添加
                </button>
              </div>
            </div>

            <div class="form-divider">
              <span>或</span>
            </div>

            <!-- 文件上傳選項 -->
            <div class="form-section">
              <h5>上傳碼表文件</h5>
              <p class="section-desc">支持 .txt 和 .csv 格式的碼表文件</p>
              <div class="upload-area">
                <input 
                  ref="fileInput"
                  type="file" 
                  @change="handleFileUpload" 
                  accept=".txt,.csv"
                  class="file-input"
                  :disabled="isAdding"
                >
                <button 
                  @click="triggerFileUpload" 
                  class="upload-btn"
                  :disabled="isAdding"
                >
                  選擇文件
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { generateCharset, type CharsetType, getTheoreticalCharsetSize } from '../services/charsetService'
import { generateFullCodeTable, generateShortCodeTable } from '../services/codeTableCleanService'
import { getDynamicDupRate } from '../services/analysisService'
import { BuiltinCodeTableService } from '../services/builtinCodeTableService'
import type { CodeTable, CharFrequency } from '../types'

// Props
interface Props {
  currentCodeTable?: CodeTable | null
}

const props = defineProps<Props>()

// 定義方案數據接口
interface SchemeData {
  dynamicDupRate: number
  dynamicDupRateSC: number
  dynamicDupRateTC: number
  dynamicDupRateUnified: number
  gb2312DuplicateChars: number
  guoziDuplicateChars: number
  cjkBasicDuplicateChars: number
  cjkToADuplicateChars: number
  cjkToBDuplicateChars: number
  cjkToIDuplicateChars: number
}

// 定義方案接口
interface Scheme {
  id: string
  name: string
  source: 'builtin' | 'upload'
  codeTable?: CodeTable
  isCalculating: boolean
  data?: SchemeData
}

// 定義內置方案接口
interface BuiltinScheme {
  id: string
  name: string
}

// 響應式數據
const yuhaoDefaultScheme = ref<Scheme | null>(null) // 宇浩日月方案
const currentUserScheme = ref<Scheme | null>(null) // 當前用戶方案
const additionalSchemes = ref<Scheme[]>([]) // 額外添加的方案
const showAddForm = ref(false)
const isAdding = ref(false)
const selectedBuiltinScheme = ref('')
const availableBuiltinSchemes = ref<BuiltinScheme[]>([])
const fileInput = ref<HTMLInputElement>()

// 創建服務實例
const builtinService = new BuiltinCodeTableService()

// 計算屬性 - 合併所有方案用於顯示
const allSchemes = computed(() => {
  const schemes = []
  if (yuhaoDefaultScheme.value) schemes.push(yuhaoDefaultScheme.value)
  if (currentUserScheme.value) schemes.push(currentUserScheme.value)
  schemes.push(...additionalSchemes.value)
  return schemes
})

// 計算屬性 - 是否有任何方案
const hasAnyScheme = computed(() => allSchemes.value.length > 0)

// 格式化函數
const formatRate = (rate?: number) => {
  return rate ? (rate * 10000).toFixed(2) + '‱' : '-'
}

const formatNumber = (num?: number) => {
  return num ? num.toLocaleString() : '-'
}

// 加载字频数据
async function loadCharFrequency(): Promise<CharFrequency> {
  try {
    return await builtinService.loadCharFrequency()
  } catch (error) {
    console.error('加载知乎字频数据失败:', error)
    return {}
  }
}

async function loadCharFrequencySC(): Promise<CharFrequency> {
  try {
    return await builtinService.loadCharFrequencySC()
  } catch (error) {
    console.error('加载简体字频数据失败:', error)
    return {}
  }
}

async function loadCharFrequencyTC(): Promise<CharFrequency> {
  try {
    return await builtinService.loadCharFrequencyTC()
  } catch (error) {
    console.error('加载繁体字频数据失败:', error)
    return {}
  }
}

async function loadCharFrequencyUnified(): Promise<CharFrequency> {
  try {
    return await builtinService.loadCharFrequencyUnified()
  } catch (error) {
    console.error('加载繁简联合字频数据失败:', error)
    return {}
  }
}

// 计算字符集的重码字符数
async function calculateCharsetDuplicates(charsetType: CharsetType, allChars: Set<string>, fullCodeTable: CodeTable) {
  const actualCharset = await generateCharset(charsetType, allChars)
  
  const fullCodeToChars = new Map<string, string[]>()
  
  for (const char of actualCharset) {
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
  for (const chars of fullCodeToChars.values()) {
    if (chars.length > 1) {
      fullDuplicateChars += chars.length
    }
  }
  
  return fullDuplicateChars
}

// 初始化內置方案列表
onMounted(async () => {
  try {
    const config = await builtinService.loadConfig()
    availableBuiltinSchemes.value = config.builtinCodeTables.map(table => ({
      id: table.id,
      name: table.name
    }))
    
    // 自動載入宇浩日月作為默認方案
    await loadDefaultYuhaoScheme()
    
    // 如果用戶有當前方案，也載入它
    if (props.currentCodeTable) {
      loadCurrentUserScheme()
    }
  } catch (error) {
    console.error('載入內置方案列表失敗:', error)
  }
})

// 監聽當前方案變化
watch(() => props.currentCodeTable, (newCodeTable) => {
  if (newCodeTable) {
    loadCurrentUserScheme()
  } else {
    currentUserScheme.value = null
  }
})

// 載入默認宇浩日月方案
const loadDefaultYuhaoScheme = async () => {
  try {
    const yuhaoScheme = availableBuiltinSchemes.value.find(
      scheme => scheme.id === 'yuhao-star-original'
    )
    if (yuhaoScheme) {
      const codeTable = await builtinService.loadCodeTable(yuhaoScheme.id)
      yuhaoDefaultScheme.value = {
        id: `default-${Date.now()}`,
        name: yuhaoScheme.name,
        codeTable,
        isBuiltin: true,
        isCalculating: true,
        data: undefined
      }
      // 異步計算數據
      const data = await calculateSchemeData(codeTable)
      yuhaoDefaultScheme.value.data = data
      yuhaoDefaultScheme.value.isCalculating = false
    }
  } catch (error) {
    console.error('Failed to load default Yuhao scheme:', error)
  }
}

// 載入當前用戶方案
const loadCurrentUserScheme = async () => {
  if (props.currentCodeTable) {
    currentUserScheme.value = {
      id: `current-${Date.now()}`,
      name: '當前方案',
      codeTable: props.currentCodeTable,
      isBuiltin: false,
      isCalculating: true,
      data: undefined
    }
    // 異步計算數據
    try {
      const data = await calculateSchemeData(props.currentCodeTable)
      currentUserScheme.value.data = data
      currentUserScheme.value.isCalculating = false
    } catch (error) {
      console.error('Failed to calculate current scheme data:', error)
      currentUserScheme.value.isCalculating = false
    }
  }
}

// 計算方案數據
async function calculateSchemeData(codeTable: CodeTable): Promise<SchemeData> {
  // 從碼表鍵中提取所有單個字符
  const allUniqueChars = new Set<string>()
  for (const key of codeTable.keys()) {
    for (const char of key) {
      allUniqueChars.add(char)
    }
  }
  
  // 生成全碼表
  const fullCodeResult = generateFullCodeTable(codeTable)
  const fullCodeTable = fullCodeResult.codeTable
  
  // 加載所有字頻數據
  const [charFrequency, charFrequencySC, charFrequencyTC, charFrequencyUnified] = await Promise.all([
    loadCharFrequency(),
    loadCharFrequencySC(),
    loadCharFrequencyTC(),
    loadCharFrequencyUnified()
  ])
  
  // 計算各種動態選重率（只計算全碼）
  const dynamicDupRate = getDynamicDupRate(fullCodeTable, charFrequency)
  const dynamicDupRateSC = getDynamicDupRate(fullCodeTable, charFrequencySC)
  const dynamicDupRateTC = getDynamicDupRate(fullCodeTable, charFrequencyTC)
  const dynamicDupRateUnified = getDynamicDupRate(fullCodeTable, charFrequencyUnified)
  
  // 計算各字符集的重碼統計（只計算全碼）
  const gb2312DuplicateChars = await calculateCharsetDuplicates('gb2312', allUniqueChars, fullCodeTable)
  const guoziDuplicateChars = await calculateCharsetDuplicates('guozi', allUniqueChars, fullCodeTable)
  const cjkBasicDuplicateChars = await calculateCharsetDuplicates('cjk_basic', allUniqueChars, fullCodeTable)
  const cjkToADuplicateChars = await calculateCharsetDuplicates('cjk_to_a', allUniqueChars, fullCodeTable)
  const cjkToBDuplicateChars = await calculateCharsetDuplicates('cjk_to_b', allUniqueChars, fullCodeTable)
  
  return {
    dynamicDupRate,
    dynamicDupRateSC,
    dynamicDupRateTC,
    dynamicDupRateUnified,
    gb2312DuplicateChars,
    guoziDuplicateChars,
    cjkBasicDuplicateChars,
    cjkToADuplicateChars,
    cjkToBDuplicateChars
  }
}

// 添加內置方案
async function addBuiltinScheme() {
  if (!selectedBuiltinScheme.value || isAdding.value) return
  
  const builtinScheme = availableBuiltinSchemes.value.find(s => s.id === selectedBuiltinScheme.value)
  if (!builtinScheme) return

  isAdding.value = true
  
  try {
    const newScheme: Scheme = {
      id: `builtin_${selectedBuiltinScheme.value}_${Date.now()}`,
      name: builtinScheme.name,
      isBuiltin: true,
      isCalculating: true
    }
    
    additionalSchemes.value.push(newScheme)
    showAddForm.value = false
    
    // 載入碼表並計算數據
    const result = await builtinService.downloadCodeTable(selectedBuiltinScheme.value)
    newScheme.codeTable = result.codeTable
    newScheme.data = await calculateSchemeData(result.codeTable)
    newScheme.isCalculating = false
    
    selectedBuiltinScheme.value = ''
    
  } catch (error) {
    console.error('添加內置方案失敗:', error)
    // 移除失敗的方案
    const index = additionalSchemes.value.findIndex(s => s.name === builtinScheme.name && s.isCalculating)
    if (index !== -1) {
      additionalSchemes.value.splice(index, 1)
    }
  } finally {
    isAdding.value = false
  }
}

// 觸發文件上傳
function triggerFileUpload() {
  fileInput.value?.click()
}

// 處理文件上傳
async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || isAdding.value) return
  
  isAdding.value = true
  
  try {
    const newScheme: Scheme = {
      id: `upload_${Date.now()}`,
      name: file.name.replace(/\.(txt|csv)$/, ''),
      isBuiltin: false,
      isCalculating: true
    }
    
    additionalSchemes.value.push(newScheme)
    showAddForm.value = false
    
    // 解析碼表文件
    const text = await file.text()
    const codeTable = parseCodeTableText(text)
    
    newScheme.codeTable = codeTable
    newScheme.data = await calculateSchemeData(codeTable)
    newScheme.isCalculating = false
    
  } catch (error) {
    console.error('上傳碼表失敗:', error)
    // 移除失敗的方案
    const index = additionalSchemes.value.findIndex(s => s.name === file.name.replace(/\.(txt|csv)$/, '') && s.isCalculating)
    if (index !== -1) {
      additionalSchemes.value.splice(index, 1)
    }
  } finally {
    isAdding.value = false
  }
  
  // 清空文件輸入
  target.value = ''
}

// 解析碼表文本
function parseCodeTableText(text: string): CodeTable {
  const codeTable = new Map<string, string[]>()
  const lines = text.split('\n')
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    
    const parts = trimmed.split(/\s+/)
    if (parts.length >= 2) {
      const char = parts[0]
      const code = parts[1]
      
      if (!codeTable.has(char)) {
        codeTable.set(char, [])
      }
      codeTable.get(char)!.push(code)
    }
  }
  
  return codeTable
}

// 移除方案
// 判斷是否可以移除方案
function canRemoveScheme(index: number): boolean {
  const defaultSchemeCount = yuhaoDefaultScheme.value ? 1 : 0
  const currentSchemeCount = currentUserScheme.value ? 1 : 0
  const fixedSchemesCount = defaultSchemeCount + currentSchemeCount
  
  // 只有額外添加的方案才能移除（索引大於等於固定方案數量）
  return index >= fixedSchemesCount
}

// 移除方案
function removeScheme(index: number) {
  if (!canRemoveScheme(index)) return
  
  const defaultSchemeCount = yuhaoDefaultScheme.value ? 1 : 0
  const currentSchemeCount = currentUserScheme.value ? 1 : 0
  const additionalSchemeIndex = index - defaultSchemeCount - currentSchemeCount
  
  if (additionalSchemeIndex >= 0 && additionalSchemeIndex < additionalSchemes.value.length) {
    additionalSchemes.value.splice(additionalSchemeIndex, 1)
  }
}

// 取消添加
function cancelAdd() {
  showAddForm.value = false
  selectedBuiltinScheme.value = ''
}
</script>

<style scoped>
.comparison-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin: 20px 0;
  position: relative; /* 添加相對定位 */
}

.card-header {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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

/* 空狀態樣式 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.empty-state h4 {
  margin: 0 0 8px 0;
  font-size: 1.25rem;
  color: #374151;
}

.empty-state p {
  margin: 0 0 24px 0;
  font-size: 0.875rem;
}

.primary-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

/* 對比表格樣式 */
.comparison-table-container {
  overflow-x: auto;
  margin-bottom: 20px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.comparison-table {
  width: 100%;
  min-width: 1200px;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.comparison-table th,
.comparison-table td {
  padding: 12px 8px;
  text-align: center;
  border-right: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
}

.comparison-table th:last-child,
.comparison-table td:last-child {
  border-right: none;
}

.comparison-table thead tr:last-child th {
  border-bottom: 2px solid #d1d5db;
}

.comparison-table tbody tr:last-child td {
  border-bottom: none;
}

.scheme-name-header {
  background: #f9fafb;
  width: 140px;
  min-width: 140px;
  text-align: left !important;
  font-weight: 600;
  color: #374151;
}

.metric-header {
  background: #f9fafb;
  width: 100px;
  min-width: 100px;
  font-weight: 600;
  color: #374151;
}

.metric-header-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.metric-header-content span {
  font-size: 0.75rem;
  line-height: 1.2;
}

.metric-header-content small {
  font-size: 0.625rem;
  opacity: 0.7;
  font-weight: 400;
}

.actions-header {
  background: #f9fafb;
  width: 80px;
  min-width: 80px;
  font-weight: 600;
  color: #374151;
}

.scheme-row:hover {
  background: #f9fafb;
}

.scheme-name {
  text-align: left !important;
}

.scheme-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.scheme-title {
  font-weight: 500;
  color: #374151;
}

.scheme-source {
  font-size: 0.75rem;
  color: #6b7280;
}

.metric-cell {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
}

.calculating {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #6b7280;
}

.mini-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #10b981;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.metric-value {
  font-weight: 600;
  color: #059669;
}

.remove-btn {
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s ease;
  font-size: 0.875rem;
}

.remove-btn:hover {
  background: #fef2f2;
}

.no-remove {
  color: #9ca3af;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
}

/* 添加方案按鈕 */
.add-scheme-section {
  text-align: center;
  margin-top: 20px;
}

.add-scheme-btn {
  background: #f3f4f6;
  color: #374151;
  border: 2px dashed #d1d5db;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.add-scheme-btn:hover:not(:disabled) {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.add-scheme-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 添加表單覆蓋層 */
.add-form-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  min-height: 400px; /* 確保有足夠的高度 */
}

.add-form {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #e5e7eb;
}

.form-header h4 {
  margin: 0;
  font-size: 1.25rem;
  color: #374151;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.2s ease;
}

.close-btn:hover {
  color: #374151;
}

.form-content {
  padding: 25px;
}

.form-section {
  margin-bottom: 24px;
}

.form-section h5 {
  margin: 0 0 8px 0;
  font-size: 1rem;
  color: #374151;
  font-weight: 600;
}

.section-desc {
  margin: 0 0 12px 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.builtin-options,
.upload-area {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.scheme-select,
.file-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.add-btn,
.upload-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  white-space: nowrap;
  transition: background 0.2s ease;
}

.add-btn:hover:not(:disabled),
.upload-btn:hover:not(:disabled) {
  background: #059669;
}

.add-btn:disabled,
.upload-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.form-divider {
  text-align: center;
  margin: 24px 0;
  position: relative;
  color: #9ca3af;
  font-size: 0.875rem;
  font-weight: 500;
}

.form-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e5e7eb;
  z-index: 0;
}

.form-divider span {
  background: white;
  padding: 0 12px;
  position: relative;
  z-index: 1;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .comparison-table {
    font-size: 0.75rem;
  }
  
  .comparison-table th,
  .comparison-table td {
    padding: 8px 6px;
  }
  
  .scheme-name-header {
    width: 100px;
    min-width: 100px;
  }
  
  .metric-header {
    width: 80px;
    min-width: 80px;
  }
  
  .metric-header-content span {
    font-size: 0.625rem;
  }
  
  .metric-header-content small {
    font-size: 0.5rem;
  }
  
  .add-form {
    width: 95%;
    margin: 20px;
  }
  
  .builtin-options,
  .upload-area {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
