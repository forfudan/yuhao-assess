<template>
  <div ref="cardRef" class="short-code-efficiency-card" :id="id">
    <div class="card-header">
      <div class="header-content">
        <div class="header-text">
          <h3 class="card-title">簡碼效率</h3>
          <p class="card-description">
            計算使用效率最高的若干簡碼下的字頻加權平均碼長。
          </p>
        </div>
        <div class="header-buttons">
          <button @click="exportCard" class="export-btn" :disabled="isLoading || !!error || tableData.length === 0" title="导出图片">
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
                <th>知乎簡體字頻</th>
                <th>北語簡體字頻</th>
                <th>臺標繁體字頻</th>
                <th>古籍繁體字頻</th>
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
                  :class="getCellClass(row.TC, [row.zhihu, row.SC, row.TC, row.guji, row.combined])"
                >
                  {{ formatValue(row.TC) }}
                </td>
                <td 
                  class="metric-value hoverable clickable"
                  @mouseenter="showTooltip($event, row.gujiChars, row.N, 'guji')"
                  @mouseleave="hideTooltip()"
                  @click="copyToClipboard(row.gujiChars, row.N, 'guji')"
                  :class="getCellClass(row.guji, [row.zhihu, row.SC, row.TC, row.guji, row.combined])"
                >
                  {{ formatValue(row.guji) }}
                </td>
                <td 
                  class="metric-value hoverable clickable"
                  @mouseenter="showTooltip($event, row.combinedChars, row.N, 'combined')"
                  @mouseleave="hideTooltip()"
                  @click="copyToClipboard(row.combinedChars, row.N, 'combined')"
                  :class="getCellClass(row.combined, [row.zhihu, row.SC, row.TC, row.guji, row.combined])"
                >
                  {{ formatValue(row.combined) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- 省略行提示 -->
        <div v-if="hasOmittedRows" class="omitted-notice">
          <p><strong>注意：</strong>繼續出簡不再降低碼長</p>
        </div>
        <!-- 説明文字 -->
        <div class="info-section">
          <p><strong>説明：</strong></p>
          <ul>
            <li>本模塊使用前 N 個（最大爲 1000 個）最有效率的簡碼時的平均碼長</li>
            <li>簡碼字的效率取決於於漢字字頻 × 節約碼長</li>
            <li>僅考慮簡碼長度小於全碼長度的漢字，實際簡碼數量可能小於 N</li>
            <li>鼠標懸停在數字上可查看當前區間對應的高效簡碼字</li>
            <li>點擊數字可將當前區間的高效簡碼字復制到剪貼板</li>
          </ul>
        </div>
        
        <!-- 方案名稱標註 -->
        <div v-if="codeTableName" class="scheme-name-annotation">
          <span>當前方案：{{ codeTableName }}</span>
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
        <div class="tooltip-chars-grid" v-html="tooltipCharsWithCodes"></div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, Teleport } from 'vue'
import { calculateShortCodeEfficiency } from '../services/shortCodeEfficiencyService'
import { useCollapse } from '../composables/useCollapse'
import { loadCharFrequency, loadCharFrequencySC, loadCharFrequencyTC, loadCharFrequencyGuji } from '../services/dataService'
import { createTooltipManager } from '../services/uiService'
import { ExportService } from '../services/exportService'
import { CodeTableProcessingService } from '../services/codeTableProcessingService'
import type { CodeTable, CharFrequency } from '../types'

// Props
interface Props {
  codeTable: CodeTable
  analysisReady: boolean
  globalPrefixKeys?: string[]
  codeTableName?: string
  id?: string
  processedTables?: any | null  // 處理後的碼表數據
}

const props = defineProps<Props>()

// 折叠功能
const { isCollapsed, toggleCollapsed, collapse, expand, getCollapsedState } = useCollapse()

// 卡片引用
const cardRef = ref<HTMLElement>()

// 导出功能
async function exportCard() {
  if (!cardRef.value || tableData.value.length === 0) {
    console.warn('卡片元素或数据不可用')
    return
  }

  try {
    await ExportService.exportElementToPNG(cardRef.value, '簡碼效率', props.codeTableName || '未命名方案', {
      copyToClipboard: ExportService.isClipboardSupported(),
      download: true
    })
  } catch (error) {
    console.error('导出失败:', error)
    alert('导出失败，请重试')
  }
}

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
const tooltipCharsWithCodes = ref('')

// 预处理的码表（包含简码加选重表）
const processedCodeTable = ref<CodeTable>(new Map())
const shortWithSelectionTable = ref<CodeTable>(new Map())

// 碼表處理服務實例
const processingService = CodeTableProcessingService.getInstance()

// 檢查處理狀態
const checkProcessingStatus = () => {
  // 超時檢查（10秒）
  const elapsed = Date.now() - statusCheckStartTime
  if (elapsed > 10000) {
    console.warn('[ShortCodeEfficiencyCard] 等待全局處理結果超時')
    stopStatusCheck()
    isLoading.value = false
    error.value = '等待碼表處理結果超時，請嘗試重新上傳碼表'
    return
  }
  
  const processedTables = props.processedTables || processingService.getProcessedTables()
  
  // 檢查是否有新的處理結果且當前沒有計算結果
  if (processedTables && 
      Object.keys(efficiencyData.value).length === 0 && 
      props.codeTable && 
      props.codeTable.size > 0) {
    
    console.log('[ShortCodeEfficiencyCard] 檢測到新的全局處理結果，開始計算效率...')
    // 短暫延遲確保處理完成，但不需要設置isLoading，updateEfficiency會處理
    setTimeout(() => {
      updateEfficiency()
    }, 50)
  }
}

// 定期檢查處理狀態
let statusCheckInterval: number | null = null
let statusCheckStartTime: number = 0

const startStatusCheck = () => {
  if (statusCheckInterval) clearInterval(statusCheckInterval)
  
  // 記錄開始時間
  statusCheckStartTime = Date.now()
  
  // 如果還沒有計算結果，顯示加載狀態
  if (Object.keys(efficiencyData.value).length === 0) {
    isLoading.value = true
    error.value = ''
  }
  
  // 立即檢查一次
  checkProcessingStatus()
  // 然後每200ms檢查一次，響應更快
  statusCheckInterval = setInterval(checkProcessingStatus, 200)
}

const stopStatusCheck = () => {
  if (statusCheckInterval) {
    clearInterval(statusCheckInterval)
    statusCheckInterval = null
  }
}

// 字頻數據
const charFrequencies = ref<{
  charFrequencySC: CharFrequency
  charFrequencyTC: CharFrequency
  charFrequencyGuji: CharFrequency
  charFrequencyZhihu: CharFrequency
  combined: CharFrequency
}>({
  charFrequencySC: {},
  charFrequencyTC: {},
  charFrequencyGuji: {},
  charFrequencyZhihu: {},
  combined: {}
})

interface TableRow {
  N: number
  zhihu: number
  SC: number  
  TC: number
  guji: number
  combined: number
  zhihuChars: string[]
  SCChars: string[]
  TCChars: string[]
  gujiChars: string[]
  combinedChars: string[]
}

const tableData = computed<TableRow[]>(() => {
  const frequencies = ['charFrequencyZhihu', 'charFrequencySC', 'charFrequencyTC', 'charFrequencyGuji', 'combined'] as const
  if (!frequencies.every(freq => efficiencyData.value[freq as string]?.length > 0)) return []
  
  // 獲取所有N值
  const nValues = efficiencyData.value['charFrequencyZhihu']?.map((r: any) => r.N) || []
  
  const allRows = nValues.map((N: number) => {
    const zhihuResult = efficiencyData.value['charFrequencyZhihu']?.find((r: any) => r.N === N)
    const SCResult = efficiencyData.value['charFrequencySC']?.find((r: any) => r.N === N)
    const TCResult = efficiencyData.value['charFrequencyTC']?.find((r: any) => r.N === N)
    const gujiResult = efficiencyData.value['charFrequencyGuji']?.find((r: any) => r.N === N)
    const combinedResult = efficiencyData.value['combined']?.find((r: any) => r.N === N)
    
    return {
      N,
      zhihu: zhihuResult?.efficiency || 0,
      SC: SCResult?.efficiency || 0,
      TC: TCResult?.efficiency || 0,
      guji: gujiResult?.efficiency || 0,
      combined: combinedResult?.efficiency || 0,
      zhihuChars: zhihuResult?.selectedChars || [],
      SCChars: SCResult?.selectedChars || [],
      TCChars: TCResult?.selectedChars || [],
      gujiChars: gujiResult?.selectedChars || [],
      combinedChars: combinedResult?.selectedChars || []
    }
  })

  // 過濾掉五列都没有新增簡碼字的行
  const filteredRows: TableRow[] = []
  let prevZhihuCount = 0
  let prevSCCount = 0
  let prevTCCount = 0
  let prevGujiCount = 0
  let prevCombinedCount = 0

  for (const row of allRows) {
    const currentZhihuCount = row.zhihuChars.length
    const currentSCCount = row.SCChars.length
    const currentTCCount = row.TCChars.length
    const currentGujiCount = row.gujiChars.length
    const currentCombinedCount = row.combinedChars.length

    // 檢查是否有任何一列有新增簡碼字
    const hasNewZhihu = currentZhihuCount > prevZhihuCount
    const hasNewSC = currentSCCount > prevSCCount
    const hasNewTC = currentTCCount > prevTCCount
    const hasNewGuji = currentGujiCount > prevGujiCount
    const hasNewCombined = currentCombinedCount > prevCombinedCount

    // N=0是基準行，永遠顯示；其他行只有在有新增簡碼字時才顯示
    if (row.N === 0 || hasNewZhihu || hasNewSC || hasNewTC || hasNewGuji || hasNewCombined) {
      filteredRows.push(row)
    }

    // 更新前一行的計數
    prevZhihuCount = currentZhihuCount
    prevSCCount = currentSCCount
    prevTCCount = currentTCCount
    prevGujiCount = currentGujiCount
    prevCombinedCount = currentCombinedCount
  }

  return filteredRows
})

// 檢查是否有被省略的行
const hasOmittedRows = computed(() => {
  const frequencies = ['charFrequencyZhihu', 'charFrequencySC', 'charFrequencyTC', 'charFrequencyGuji', 'combined'] as const
  if (!frequencies.every(freq => efficiencyData.value[freq as string]?.length > 0)) return false
  
  const nValues = efficiencyData.value['charFrequencyZhihu']?.map((r: any) => r.N) || []
  return nValues.length > tableData.value.length
})

// 使用加選重碼表計算簡碼效率的函數
const calculateShortCodeEfficiencyWithMaps = (
  charFrequency: CharFrequency, 
  shortCodeMap: Map<string, string>, 
  fullCodeMap: Map<string, string>
): Array<{ N: number; efficiency: number; selectedChars: string[] }> => {
  
  // 預處理字符數據
  const processedChars: Array<{
    char: string
    shortLen: number
    fullLen: number
    lenDiff: number
    freq: number
    freqLenDiff: number
  }> = []

  for (const [char, freq] of Object.entries(charFrequency)) {
    if (freq <= 0) continue
    
    const shortCode = shortCodeMap.get(char)
    const fullCode = fullCodeMap.get(char)
    
    if (!shortCode || !fullCode) continue
    
    const shortLen = shortCode.length
    const fullLen = fullCode.length
    const lenDiff = fullLen - shortLen
    
    processedChars.push({
      char,
      shortLen,
      fullLen,
      lenDiff,
      freq,
      freqLenDiff: freq * lenDiff
    })
  }

  // 計算不同N值下的效率
  const nValues = [0, 25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
  const results: Array<{ N: number; efficiency: number; selectedChars: string[] }> = []
  
  for (const N of nValues) {
    // 只考慮簡碼長度小於全碼長度的漢字
    const validShortCodeChars = processedChars.filter(char => char.shortLen < char.fullLen)
    
    // 按頻率差值排序，選擇前N個字符使用簡碼
    const sortedByFreqDiff = [...validShortCodeChars].sort((a, b) => b.freqLenDiff - a.freqLenDiff)
    const actualSelectedCount = Math.min(N, sortedByFreqDiff.length)
    const selectedCharsList = sortedByFreqDiff.slice(0, actualSelectedCount).map(c => c.char)
    const selectedChars = new Set(selectedCharsList)
    
    // 計算加權平均碼長：前N個字符使用簡碼，其餘使用全碼
    let totalFreqLen = 0
    let totalFreq = 0
    
    for (const char of processedChars) {
      const finalLen = selectedChars.has(char.char) ? char.shortLen : char.fullLen
      totalFreqLen += char.freq * finalLen
      totalFreq += char.freq
    }
    
    const efficiency = totalFreq > 0 ? totalFreqLen / totalFreq : 0
    results.push({ N, efficiency, selectedChars: selectedCharsList })
  }
  
  return results
}

// 載入字頻數據
const loadCharFrequencyData = async () => {
  try {
    // 加載字頻數據
    const [charFreqSC, charFreqTC, charFreqGuji, charFreqZhihu] = await Promise.all([
      loadCharFrequencySC(),
      loadCharFrequencyTC(),
      loadCharFrequencyGuji(),
      loadCharFrequency()
    ])

    // 計算聯合字頻
    const combined: CharFrequency = {}
    const allChars = new Set([
      ...Object.keys(charFreqSC),
      ...Object.keys(charFreqTC),
      ...Object.keys(charFreqGuji),
      ...Object.keys(charFreqZhihu)
    ])

    for (const char of allChars) {
      const frequencies = [
        charFreqSC[char] || 0,
        charFreqTC[char] || 0,
        charFreqGuji[char] || 0,
        charFreqZhihu[char] || 0
      ].filter(f => f > 0)
      
      if (frequencies.length > 0) {
        combined[char] = frequencies.reduce((a, b) => a + b, 0) / frequencies.length
      }
    }

    charFrequencies.value = {
      charFrequencySC: charFreqSC,
      charFrequencyTC: charFreqTC,
      charFrequencyGuji: charFreqGuji,
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
    // 使用全局已處理的碼表結果，避免重複計算
    const processedTables = props.processedTables || processingService.getProcessedTables()
    
    if (!processedTables) {
      // 如果全局處理結果不存在，停止加載狀態並等待狀態檢查重試
      console.warn('[ShortCodeEfficiencyCard] 全局碼表處理結果不存在，等待處理完成...')
      isLoading.value = false
      return
    }
    
    console.log('[ShortCodeEfficiencyCard] 使用全局處理結果計算簡碼效率')
    
    // 處理成功，停止狀態檢查
    stopStatusCheck()
    
    // 保存簡碼加選重表供tooltip使用
    shortWithSelectionTable.value = processedTables.shortWithSelection
    processedCodeTable.value = processedTables.full  // 使用全码表代替原始码表

    // 將加選重碼表轉換為CodeTableRow[]格式，用於簡碼效率計算
    const convertCodeTableToRows = (codeTable: CodeTable): { char: string; code: string }[] => {
      const rows: { char: string; code: string }[] = []
      for (const [char, codes] of codeTable) {
        for (const code of codes) {
          rows.push({ char, code })
        }
      }
      return rows
    }

    // 合併簡碼加選重和全碼加選重表，用於正確的效率計算
    const shortRows = convertCodeTableToRows(processedTables.shortWithSelection)
    const fullRows = convertCodeTableToRows(processedTables.fullWithSelection)
    
    // 創建字符到編碼的映射
    const shortCodeMap = new Map<string, string>()
    const fullCodeMap = new Map<string, string>()
    
    shortRows.forEach(row => {
      if (!shortCodeMap.has(row.char) || row.code.length < shortCodeMap.get(row.char)!.length) {
        shortCodeMap.set(row.char, row.code)
      }
    })
    
    fullRows.forEach(row => {
      if (!fullCodeMap.has(row.char) || row.code.length > fullCodeMap.get(row.char)!.length) {
        fullCodeMap.set(row.char, row.code)
      }
    })
    
    // 合併為完整的碼表，包含簡碼和全碼
    const combinedRows: { char: string; code: string; isShort: boolean }[] = []
    const allChars = new Set([...shortCodeMap.keys(), ...fullCodeMap.keys()])
    
    for (const char of allChars) {
      const shortCode = shortCodeMap.get(char)
      const fullCode = fullCodeMap.get(char)
      
      if (shortCode) {
        combinedRows.push({ char, code: shortCode, isShort: true })
      }
      if (fullCode && fullCode !== shortCode) {
        combinedRows.push({ char, code: fullCode, isShort: false })
      }
    }

    const results: Record<string, Array<{ N: number; efficiency: number; selectedChars: string[] }>> = {}

    // 爲每個字頻數據計算簡碼效率
    const frequencies = ['charFrequencySC', 'charFrequencyTC', 'charFrequencyGuji', 'charFrequencyZhihu', 'combined']
    for (const freqKey of frequencies) {
      const charFrequency = charFrequencies.value[freqKey as keyof typeof charFrequencies.value]
      if (charFrequency && Object.keys(charFrequency).length > 0) {
        const efficiencyResults = calculateShortCodeEfficiencyWithMaps(
          charFrequency,
          shortCodeMap,
          fullCodeMap
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
    tooltipChars.value = '無簡碼字'
    tooltipCharsWithCodes.value = '<div>無簡碼字</div>'
  } else {
    // 根據不同的N值顯示差值字符
    if (prevN > 0) {
      // 獲取前一個N值的字符
      const prevChars = getPreviousChars(prevN, freqType)
      // 計算差值：當前N的字符減去前一個N的字符
      displayChars = chars.filter(char => !prevChars.includes(char))
      tooltipChars.value = displayChars.join('')
      
      if (displayChars.length === 0) {
        tooltipChars.value = '無新增漢字'
        tooltipCharsWithCodes.value = '<div>無新增漢字</div>'
      }
    } else {
      // 第一行顯示所有字符
      displayChars = chars
      tooltipChars.value = chars.join('')
    }
    
    // 生成網格佈局的HTML，每行10個字符，帶有ruby文本顯示編碼
    if (displayChars.length > 0) {
      const gridHTML = generateCharacterGrid(displayChars)
      tooltipCharsWithCodes.value = gridHTML
    }
  }
  
  const actualCount = displayChars.length
  const tooltipText = prevN > 0 
    ? `N=${currentN}新增的${actualCount}個簡碼字：${tooltipChars.value}`
    : `N=${currentN}的${actualCount}個效率最高的簡碼字符：${tooltipChars.value}`
  showTooltipBase(event, tooltipText)
}

// 生成字符表格HTML - 每個單元格包含漢字和上方的ruby簡碼
const generateCharacterGrid = (chars: string[]): string => {
  if (chars.length === 0) {
    return '<div>無字符</div>'
  }
  
  // 统一每行显示10个字符
  const charsPerRow = 10
  
  // 生成表格行
  const rows: string[] = []
  for (let i = 0; i < chars.length; i += charsPerRow) {
    const rowChars = chars.slice(i, i + charsPerRow)
    
    // 生成包含ruby的單元格
    const cellsHTML = rowChars.map(char => {
      const fullShortCode = getFullShortCodeWithSelection(char)
      return `<td class="char-cell">
        <ruby class="char-ruby">
          ${char}
          <rt class="code-rt">${fullShortCode}</rt>
        </ruby>
      </td>`
    }).join('')
    
    // 如果行不完整，補充空單元格
    const emptyCells = Math.max(0, charsPerRow - rowChars.length)
    const emptyHTML = '<td class="char-cell empty"></td>'.repeat(emptyCells)
    
    rows.push(`<tr class="char-row">${cellsHTML}${emptyHTML}</tr>`)
  }
  
  return `<table class="char-table">${rows.join('')}</table>`
}

// 獲取完整的簡碼（使用預生成的簡碼加選重表）
const getFullShortCodeWithSelection = (char: string): string => {
  // 優先使用預生成的簡碼加選重表
  const shortCodes = shortWithSelectionTable.value.get(char)
  if (shortCodes && shortCodes.length > 0) {
    // 返回最短的簡碼（通常只有一個）
    return shortCodes.reduce((a, b) => a.length <= b.length ? a : b)
  }
  
  // 如果簡碼表中没有該字符，檢查是否真的有簡碼優勢
  const processedTables = CodeTableProcessingService.getInstance().getProcessedTables()
  if (!processedTables) return ''
  
  const shortCodes2 = processedTables.short.get(char) || []
  const fullCodes = processedTables.full.get(char) || []
  
  if (shortCodes2.length === 0 || fullCodes.length === 0) return ''
  
  // 找到最短的簡碼和全碼
  const shortestShortCode = shortCodes2.reduce((a, b) => a.length <= b.length ? a : b)
  const shortestFullCode = fullCodes.reduce((a, b) => a.length <= b.length ? a : b)
  
  // 只有當簡碼真的比全碼短時才顯示
  if (shortestShortCode.length >= shortestFullCode.length) {
    return '' // 不顯示沒有優勢的簡碼
  }
  
  return shortestShortCode

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
    case 'guji': return prevRow.gujiChars
    case 'combined': return prevRow.combinedChars
    default: return []
  }
}

const getCellClass = (value: number, rowValues: number[]): string => {
  // 基於絶對值的五檔分級
  if (value <= 0) return ''
  
  if (value >= 3.7) {
    return 'very-high-value'   // >= 3.7 - 略低於四碼定長全碼長度
  } else if (value >= 3.3) {
    return 'high-value'        // >= 3.3 - 略低於出了一簡之後的碼長
  } else if (value >= 2.9) {
    return 'medium-value'      // >= 2.9 - 略低於出了二簡之後的碼長
  } else if (value >= 2.5) {
    return 'low-value'         // >= 2.5 - 略低於前綴碼的簡碼碼長
  } else {
    return 'very-low-value'    // < 2.5 - 頂功碼長
  }
}

// 複製字符到剪貼板
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
      'zhihu': '知乎簡體字頻',
      'SC': '北語簡體字頻', 
      'TC': '臺標繁體字頻',
      'guji': '古籍繁體字頻',
      'combined': '繁簡聯合字頻'
    }
    
    const count = displayChars.length
    const successMessage = prevN > 0 
      ? `已復制${freqNames[freqType as keyof typeof freqNames]}N=${currentN}新增的${count}個簡碼字到剪貼板`
      : `已復制${freqNames[freqType as keyof typeof freqNames]}N=${currentN}的${count}個簡碼字到剪貼板`
    
    console.log(successMessage, textToCopy)
    // 可以在這裏添加 toast 提示
  } catch (err) {
    console.error('復制到剪貼板失敗:', err)
    // 可以在這裏添加錯誤提示
  }
}

// 監聽 props 變化
watch(() => props.codeTable, () => {
  stopStatusCheck()
  // 清空舊的計算結果
  efficiencyData.value = {}
  isLoading.value = false
  error.value = ''
  
  if (props.codeTable && props.codeTable.size > 0) {
    startStatusCheck()
  }
}, { deep: true })

watch(() => props.globalPrefixKeys, () => {
  // 清空舊的計算結果，因為前綴碼變化會影響計算
  efficiencyData.value = {}
  isLoading.value = false  
  error.value = ''
  
  if (props.codeTable && props.codeTable.size > 0) {
    startStatusCheck()
  }
}, { deep: true })

// 監聽 analysisReady 變化
watch(() => props.analysisReady, (newReady) => {
  if (newReady && props.codeTable && props.codeTable.size > 0) {
    // 清空舊結果並啟動狀態檢查
    efficiencyData.value = {}
    isLoading.value = false
    error.value = ''
    startStatusCheck()
  }
})

onMounted(async () => {
  await loadCharFrequencyData()
  if (props.analysisReady && props.codeTable && props.codeTable.size > 0) {
    startStatusCheck()
  }
})

onUnmounted(() => {
  stopStatusCheck()
})
</script>

<style scoped>
.short-code-efficiency-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-text {
  flex: 1;
}

/* 頭部按鈕容器 */
.header-buttons {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-left: var(--spacing-lg);
}

/* 導出按鈕樣式 */
.export-btn {
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
  backdrop-filter: blur(10px);
}

.export-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  transition: background-color 0.2s ease;
}

.hoverable {
  cursor: help;
  transition: background-color 0.2s ease;
}

.clickable {
  cursor: pointer;
}

.hoverable:hover {
  background: #e5e7eb;
  color: #1f2937;
}

/* 效率值的五檔簡約顔色分級 */
.very-high-value {
  background: #fee2e2 !important;  /* 淺紅色背景 - >= 3.7 */
  color: #991b1b;                   /* 深紅色文字 */
  font-weight: 700;
}

.high-value {
  background: #fef3c7 !important;  /* 淺黄色背景 - >= 3.3 */
  color: #92400e;                   /* 深黄色文字 */
  font-weight: 700;
}

.medium-value {
  background: #dcfce7 !important;  /* 淺緑色背景 - >= 2.9 */
  color: #166534;                   /* 深緑色文字 */
  font-weight: 700;
}

.low-value {
  background: #dbeafe !important;  /* 淺藍色背景 - >= 2.5 */
  color: #1e40af;                   /* 深藍色文字 */
  font-weight: 700;
}

.very-low-value {
  background: #f3e8ff !important;  /* 淺紫色背景 - < 2.5 */
  color: #7c3aed;                   /* 深紫色文字 */
  font-weight: 700;
}

/* 暗黑模式下的效率值颜色分级 - 更深沉的配色方案 */
[data-theme="dark"] .very-high-value {
  background: #3f1d1d !important;  /* 非常深的红灰色背景 */
  color: #fca5a5;                   /* 柔和的浅红色文字 */
  font-weight: 700;
}

[data-theme="dark"] .high-value {
  background: #3d2817 !important;  /* 非常深的黄灰色背景 */
  color: #fbbf24;                   /* 柔和的浅黄色文字 */
  font-weight: 700;
}

[data-theme="dark"] .medium-value {
  background: #1a2e1a !important;  /* 非常深的绿灰色背景 */
  color: #86efac;                   /* 柔和的浅绿色文字 */
  font-weight: 700;
}

[data-theme="dark"] .low-value {
  background: #1e2a3a !important;  /* 非常深的蓝灰色背景 */
  color: #93c5fd;                   /* 柔和的浅蓝色文字 */
  font-weight: 700;
}

[data-theme="dark"] .very-low-value {
  background: #2d1b3d !important;  /* 非常深的紫灰色背景 */
  color: #c4b5fd;                   /* 柔和的浅紫色文字 */
  font-weight: 700;
}

/* 簡化的懸停效果 */
.very-high-value:hover {
  background: #fecaca !important;
}

.high-value:hover {
  background: #fde68a !important;
}

.medium-value:hover {
  background: #bbf7d0 !important;
}

.low-value:hover {
  background: #bfdbfe !important;
}

.very-low-value:hover {
  background: #e9d5ff !important;
}

/* 暗黑模式下的懸停效果 - 深沈但有層次的變化 */
[data-theme="dark"] .very-high-value:hover {
  background: #4a2323 !important;  /* 稍微變亮的深紅灰色 */
}

[data-theme="dark"] .high-value:hover {
  background: #4a311d !important;  /* 稍微變亮的深黃灰色 */
}

[data-theme="dark"] .medium-value:hover {
  background: #213621 !important;  /* 稍微變亮的深綠灰色 */
}

[data-theme="dark"] .low-value:hover {
  background: #253242 !important;  /* 稍微變亮的深藍灰色 */
}

[data-theme="dark"] .very-low-value:hover {
  background: #362147 !important;  /* 稍微變亮的深紫灰色 */
}

/* 自定義工具提示容器 - 滑鼠懸停時顯示的浮動提示框 */
.custom-tooltip {
  position: fixed;
  background: #1f2937;
  color: white;
  border-radius: 8px;
  padding: 12px;
  font-size: 0.875rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  max-width: 400px; /* 增加最大寬度以容納網格佈局 */
  z-index: 9999;
  pointer-events: none;
  min-width: 100px;
  min-height: 50px;
}

/* 提示框内容容器 - 包含標題和字符網格的垂直佈局 */
.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 提示框標題樣式 - 顯示説明文字 */
.tooltip-header {
  font-weight: 500;
  color: #d1d5db;
  font-size: 0.75rem;
}

/* 舊版提示框字符樣式 - 保留以防向後兼容性 */
.tooltip-chars {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 1.2rem;
  line-height: 1.5;
  word-break: break-all;
}

/* 字符網格容器樣式 - 設定中文字體族 */
.tooltip-chars-grid {
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* 字符表格容器樣式 - 用於tooltip中顯示漢字網格 */
.char-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 3px;
  margin: 6px 0;
  background-color: rgba(75, 85, 99, 0.15);
  border-radius: 8px;
  padding: 4px;
}

/* 字符表格行中的單元格樣式 - 每個漢字佔一個單元格 */
.char-row td {
  border: 1px solid rgba(156, 163, 175, 0.4);
  text-align: center;
  vertical-align: middle;
  padding: 8px 6px;
  min-width: 38px;
  border-radius: 4px;
  background-color: rgba(79, 70, 229, 0.3);
  border-color: rgba(79, 70, 229, 0.5);
}

/* 字符單元格樣式 - 包含漢字和編碼的容器 */
.char-cell {
  height: 55px;
  position: relative;
  vertical-align: middle;
  text-align: center;
  display: table-cell;
}

/* 漢字文本樣式 - ruby元素中的主要漢字 */
.char-ruby {
  font-size: 1.6rem;
  font-weight: 600;
  color: #ffffff;
  line-height: 1.4;
  text-align: center;
  display: block;
  margin: 0 auto;
}

/* 編碼文本樣式 - ruby元素中漢字上方的編碼 */
.code-rt {
  font-size: 0.75rem;
  color: #d1d5db;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-weight: 500;
  line-height: 1;
  text-align: center;
  display: block;
}

/* 空單元格樣式 - 用於填補行末不足10個字符的空位 */
.char-cell.empty {
  background-color: transparent;
  border-color: rgba(75, 85, 99, 0.2);
  border-style: dashed;
}

/* 懸停效果 - 滑鼠經過表格時的視覺反饋 */
.char-table:hover .char-cell:not(.empty) {
  background-color: rgba(79, 70, 229, 0.45);
  border-color: rgba(79, 70, 229, 0.7);
  transform: scale(1.02);
  transition: all 0.2s ease;
}

/* 懸停時漢字顔色變化 - 增強可讀性 */
.char-table:hover .char-ruby {
  color: #f8fafc;
}

/* 懸停時編碼顔色變化 - 增強可讀性 */
.char-table:hover .code-rt {
  color: #e5e7eb;
}

.omitted-notice {
  margin-top: 12px;
  padding: 8px 12px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  color: #856404;
}

.omitted-notice p {
  margin: 0;
  font-size: 0.85rem;
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
</style>

<!-- 全域樣式專門用於 Teleport 的 tooltip - 解決 scoped 樣式無法作用於 Teleport 内容的問題 -->
<style>
/* tooltip 字符單元格樣式 - 確保所有單元格内容居中對齊 */
.custom-tooltip .char-cell {
  text-align: center !important;
  vertical-align: middle !important;
}

/* tooltip 表格行單元格樣式 - 確保表格結構正確對齊 */
.custom-tooltip .char-row td {
  text-align: center !important;
  vertical-align: middle !important;
}

/* tooltip 漢字樣式 - 手機端基礎字體大小 */
.custom-tooltip .char-ruby {
  font-size: 1.0rem !important;
  font-weight: 600;
  color: #ffffff;
  line-height: 1.4;
  text-align: center !important;
  display: block !important;
  margin: 0 auto !important;
}

/* tooltip 編碼樣式 - 手機端基礎字體大小 */
.custom-tooltip .code-rt {
  font-size: 0.5rem !important;
  color: #d1d5db;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-weight: 500;
  line-height: 1;
  text-align: center !important;
  display: block !important;
}

/* 桌面端響應式設計 - 螢幕寬度 ≥ 769px 時應用較大字體和容器 */
@media (min-width: 769px) {
  /* 桌面端漢字樣式 - 比手機端稍大以利用桌面螢幕空間 */
  .custom-tooltip .char-ruby {
    font-size: 1.2rem !important;
    text-align: center !important;
    display: block !important;
    margin: 0 auto !important;
  }
  
  /* 桌面端編碼樣式 - 對應增大字體以保持比例 */
  .custom-tooltip .code-rt {
    font-size: 0.8rem !important;
    text-align: center !important;
    display: block !important;
  }
  
  /* 桌面端字符單元格樣式 - 調整容器大小以適配較大字體 */
  .custom-tooltip .char-cell {
    height: 10px !important;
    min-width: 10px !important;
    text-align: center !important;
    vertical-align: middle !important;
  }
  
  /* 桌面端表格單元格樣式 - 增大内邊距和最小寬度 */
  .custom-tooltip .char-row td {
    padding: 2px 2px !important;
    min-width: 10px !important;
    text-align: center !important;
    vertical-align: middle !important;
  }
}

/* 暗黑模式專用樣式 */
[data-theme="dark"] .table-container {
  background: var(--color-bg-primary);
  border-color: var(--color-border-primary);
}

[data-theme="dark"] .metrics-table {
  background: var(--color-bg-primary);
  border-color: var(--color-border-primary);
}

[data-theme="dark"] .metrics-table th {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border-bottom-color: var(--color-border-primary);
}

[data-theme="dark"] .metrics-table td {
  color: var(--color-text-primary);
  border-bottom-color: var(--color-border-secondary);
}

[data-theme="dark"] .metrics-table tbody tr:hover {
  background: var(--color-bg-tertiary);
}

[data-theme="dark"] .n-value {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

[data-theme="dark"] .metric-value {
  color: var(--color-success);
}

[data-theme="dark"] .hoverable:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

[data-theme="dark"] .very-high-value {
  background: var(--color-error-light) !important;
  color: var(--color-error-dark);
}

[data-theme="dark"] .high-value {
  background: var(--color-warning-light) !important;
  color: var(--color-warning-dark);
}

[data-theme="dark"] .medium-value {
  background: var(--color-success-light) !important;
  color: var(--color-success-dark);
}

[data-theme="dark"] .low-value {
  background: var(--color-bg-tertiary) !important;
  color: var(--color-text-primary);
}

[data-theme="dark"] .very-low-value {
  background: var(--color-bg-secondary) !important;
  color: var(--color-text-secondary);
}

[data-theme="dark"] .omitted-notice {
  background: var(--color-warning-light);
  border-color: var(--color-warning);
  color: var(--color-warning-dark);
}
</style>


