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
                <th>陸標繁體字頻</th>
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
                  :class="getCellClass(row.TC, [row.zhihu, row.SC, row.TC, row.tongguiTC, row.combined])"
                >
                  {{ formatValue(row.TC) }}
                </td>
                <td 
                  class="metric-value hoverable clickable"
                  @mouseenter="showTooltip($event, row.tongguiTCChars, row.N, 'tongguiTC')"
                  @mouseleave="hideTooltip()"
                  @click="copyToClipboard(row.tongguiTCChars, row.N, 'tongguiTC')"
                  :class="getCellClass(row.tongguiTC, [row.zhihu, row.SC, row.TC, row.tongguiTC, row.combined])"
                >
                  {{ formatValue(row.tongguiTC) }}
                </td>
                <td 
                  class="metric-value hoverable clickable"
                  @mouseenter="showTooltip($event, row.combinedChars, row.N, 'combined')"
                  @mouseleave="hideTooltip()"
                  @click="copyToClipboard(row.combinedChars, row.N, 'combined')"
                  :class="getCellClass(row.combined, [row.zhihu, row.SC, row.TC, row.tongguiTC, row.combined])"
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
        <!-- 說明文字 -->
        <div class="explanation">
          <p><strong>說明：</strong></p>
          <ul>
            <li>本模塊使用前 N 個（最大為 1000 個）最有效率的簡碼時的平均碼長</li>
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
import { ref, computed, watch, onMounted, Teleport } from 'vue'
import { calculateShortCodeEfficiency } from '../services/shortCodeEfficiencyService'
import { useCollapse } from '../composables/useCollapse'
import { loadCharFrequency, loadCharFrequencySC, loadCharFrequencyTC, loadCharFrequencyTongguiTC } from '../services/dataService'
import { createTooltipManager } from '../services/uiService'
import { ExportService } from '../services/exportService'
import { codeTableProcessingService } from '../services'
import type { CodeTable, CharFrequency } from '../types'

// Props
interface Props {
  codeTable: CodeTable
  analysisReady: boolean
  globalPrefixKeys?: string[]
  codeTableName?: string
  id?: string
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

// 字頻數據
const charFrequencies = ref<{
  charFrequencySC: CharFrequency
  charFrequencyTC: CharFrequency
  charFrequencyTongguiTC: CharFrequency
  charFrequencyZhihu: CharFrequency
  combined: CharFrequency
}>({
  charFrequencySC: {},
  charFrequencyTC: {},
  charFrequencyTongguiTC: {},
  charFrequencyZhihu: {},
  combined: {}
})

interface TableRow {
  N: number
  zhihu: number
  SC: number  
  TC: number
  tongguiTC: number
  combined: number
  zhihuChars: string[]
  SCChars: string[]
  TCChars: string[]
  tongguiTCChars: string[]
  combinedChars: string[]
}

const tableData = computed<TableRow[]>(() => {
  const frequencies = ['charFrequencyZhihu', 'charFrequencySC', 'charFrequencyTC', 'charFrequencyTongguiTC', 'combined'] as const
  if (!frequencies.every(freq => efficiencyData.value[freq as string]?.length > 0)) return []
  
  // 獲取所有N值
  const nValues = efficiencyData.value['charFrequencyZhihu']?.map((r: any) => r.N) || []
  
  const allRows = nValues.map((N: number) => {
    const zhihuResult = efficiencyData.value['charFrequencyZhihu']?.find((r: any) => r.N === N)
    const SCResult = efficiencyData.value['charFrequencySC']?.find((r: any) => r.N === N)
    const TCResult = efficiencyData.value['charFrequencyTC']?.find((r: any) => r.N === N)
    const tongguiTCResult = efficiencyData.value['charFrequencyTongguiTC']?.find((r: any) => r.N === N)
    const combinedResult = efficiencyData.value['combined']?.find((r: any) => r.N === N)
    
    return {
      N,
      zhihu: zhihuResult?.efficiency || 0,
      SC: SCResult?.efficiency || 0,
      TC: TCResult?.efficiency || 0,
      tongguiTC: tongguiTCResult?.efficiency || 0,
      combined: combinedResult?.efficiency || 0,
      zhihuChars: zhihuResult?.selectedChars || [],
      SCChars: SCResult?.selectedChars || [],
      TCChars: TCResult?.selectedChars || [],
      tongguiTCChars: tongguiTCResult?.selectedChars || [],
      combinedChars: combinedResult?.selectedChars || []
    }
  })

  // 過濾掉五列都沒有新增簡碼字的行
  const filteredRows: TableRow[] = []
  let prevZhihuCount = 0
  let prevSCCount = 0
  let prevTCCount = 0
  let prevTongguiTCCount = 0
  let prevCombinedCount = 0

  for (const row of allRows) {
    const currentZhihuCount = row.zhihuChars.length
    const currentSCCount = row.SCChars.length
    const currentTCCount = row.TCChars.length
    const currentTongguiTCCount = row.tongguiTCChars.length
    const currentCombinedCount = row.combinedChars.length

    // 檢查是否有任何一列有新增簡碼字
    const hasNewZhihu = currentZhihuCount > prevZhihuCount
    const hasNewSC = currentSCCount > prevSCCount
    const hasNewTC = currentTCCount > prevTCCount
    const hasNewTongguiTC = currentTongguiTCCount > prevTongguiTCCount
    const hasNewCombined = currentCombinedCount > prevCombinedCount

    // N=0是基準行，永遠顯示；其他行只有在有新增簡碼字時才顯示
    if (row.N === 0 || hasNewZhihu || hasNewSC || hasNewTC || hasNewTongguiTC || hasNewCombined) {
      filteredRows.push(row)
    }

    // 更新前一行的計數
    prevZhihuCount = currentZhihuCount
    prevSCCount = currentSCCount
    prevTCCount = currentTCCount
    prevTongguiTCCount = currentTongguiTCCount
    prevCombinedCount = currentCombinedCount
  }

  return filteredRows
})

// 檢查是否有被省略的行
const hasOmittedRows = computed(() => {
  const frequencies = ['charFrequencyZhihu', 'charFrequencySC', 'charFrequencyTC', 'charFrequencyTongguiTC', 'combined'] as const
  if (!frequencies.every(freq => efficiencyData.value[freq as string]?.length > 0)) return false
  
  const nValues = efficiencyData.value['charFrequencyZhihu']?.map((r: any) => r.N) || []
  return nValues.length > tableData.value.length
})

// 載入字頻數據
const loadCharFrequencyData = async () => {
  try {
    // 加載字頻數據
    const [charFreqSC, charFreqTC, charFreqTongguiTC, charFreqZhihu] = await Promise.all([
      loadCharFrequencySC(),
      loadCharFrequencyTC(),
      loadCharFrequencyTongguiTC(),
      loadCharFrequency()
    ])

    // 計算聯合字頻
    const combined: CharFrequency = {}
    const allChars = new Set([
      ...Object.keys(charFreqSC),
      ...Object.keys(charFreqTC),
      ...Object.keys(charFreqTongguiTC),
      ...Object.keys(charFreqZhihu)
    ])

    for (const char of allChars) {
      const frequencies = [
        charFreqSC[char] || 0,
        charFreqTC[char] || 0,
        charFreqTongguiTC[char] || 0,
        charFreqZhihu[char] || 0
      ].filter(f => f > 0)
      
      if (frequencies.length > 0) {
        combined[char] = frequencies.reduce((a, b) => a + b, 0) / frequencies.length
      }
    }

    charFrequencies.value = {
      charFrequencySC: charFreqSC,
      charFrequencyTC: charFreqTC,
      charFrequencyTongguiTC: charFreqTongguiTC,
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
    // 預處理碼表以獲取簡碼加選重表
    const processedTables = await codeTableProcessingService.processCodeTable(
      props.codeTable,
      {
        isPrefix: props.globalPrefixKeys && props.globalPrefixKeys.length > 0,
        maxLength: 4,
        prefixKeys: props.globalPrefixKeys
      }
    )
    
    // 保存簡碼加選重表供tooltip使用
    shortWithSelectionTable.value = processedTables.shortWithSelection
    processedCodeTable.value = processedTables.original

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
    const frequencies = ['charFrequencySC', 'charFrequencyTC', 'charFrequencyTongguiTC', 'charFrequencyZhihu', 'combined']
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
  
  // 如果簡碼表中沒有，降級到原始碼表
  const codes = props.codeTable.get(char) || []
  if (codes.length === 0) return ''
  
  // 找到最短的編碼
  const shortestCode = codes.reduce((a, b) => a.length <= b.length ? a : b)
  
  // 檢查是否需要選重複號（簡化邏輯，因為預生成表應該已經處理了這些）
  // 找到所有具有相同簡碼的字符
  const sameCodeChars: string[] = []
  
  // 遍歷碼表找到有相同簡碼的字符
  for (const [otherChar, otherCodes] of props.codeTable.entries()) {
    for (const otherCode of otherCodes) {
      if (otherCode === shortestCode) {
        sameCodeChars.push(otherChar)
        break
      }
    }
  }
  
  // 如果只有一個字符使用這個簡碼，不需要選重複號
  if (sameCodeChars.length <= 1) {
    return shortestCode
  }
  
  // 如果有多個字符使用相同簡碼，需要添加選重複號
  // 按字符的Unicode順序排序，確定位置
  sameCodeChars.sort()
  const position = sameCodeChars.indexOf(char)
  
  if (position === -1) {
    return shortestCode // 如果沒找到（不應該發生），返回原簡碼
  }
  
  // 添加選重複號（使用正確的選重鍵序列）
  const selectionKeys = ['_', ';', "'", '4', '5', '6', '7', '8', '9', '0']
  const selectionKey = position < selectionKeys.length ? selectionKeys[position] : '0'
  return `${shortestCode}${selectionKey}`
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
    case 'tongguiTC': return prevRow.tongguiTCChars
    case 'combined': return prevRow.combinedChars
    default: return []
  }
}

const getCellClass = (value: number, rowValues: number[]): string => {
  // 基於絕對值的五檔分級
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
      'zhihu': '知乎簡體字頻',
      'SC': '北語簡體字頻', 
      'TC': '臺標繁體字頻',
      'tongguiTC': '陸標繁體字頻',
      'combined': '聯合字頻'
    }
    
    const count = displayChars.length
    const successMessage = prevN > 0 
      ? `已復制${freqNames[freqType as keyof typeof freqNames]}N=${currentN}新增的${count}個簡碼字到剪貼板`
      : `已復制${freqNames[freqType as keyof typeof freqNames]}N=${currentN}的${count}個簡碼字到剪貼板`
    
    console.log(successMessage, textToCopy)
    // 可以在這裡添加 toast 提示
  } catch (err) {
    console.error('復制到剪貼板失敗:', err)
    // 可以在這裡添加錯誤提示
  }
}

// 監聽 props 變化
watch(() => props.codeTable, updateEfficiency, { deep: true })
watch(() => props.globalPrefixKeys, updateEfficiency, { deep: true })

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

/* 头部按钮容器 */
.header-buttons {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-left: var(--spacing-lg);
}

/* 导出按钮样式 */
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

/* 效率值的五檔簡約顏色分級 */
.very-high-value {
  background: #fee2e2 !important;  /* 淺紅色背景 - >= 3.7 */
  color: #991b1b;                   /* 深紅色文字 */
  font-weight: 700;
}

.high-value {
  background: #fef3c7 !important;  /* 淺黃色背景 - >= 3.3 */
  color: #92400e;                   /* 深黃色文字 */
  font-weight: 700;
}

.medium-value {
  background: #dcfce7 !important;  /* 淺綠色背景 - >= 2.9 */
  color: #166534;                   /* 深綠色文字 */
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

/* 自定義工具提示 */
.custom-tooltip {
  position: fixed;
  background: #1f2937;
  color: white;
  border-radius: 8px;
  padding: 12px;
  font-size: 0.875rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  max-width: 400px; /* 增加最大宽度以容纳网格布局 */
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

/* 字符表格樣式 - 每個單元格包含ruby */
.tooltip-chars-grid {
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.char-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 3px;
  margin: 6px 0;
  background-color: rgba(75, 85, 99, 0.15);
  border-radius: 8px;
  padding: 4px;
}

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

.char-cell {
  height: 55px;
  position: relative;
  vertical-align: middle;
  text-align: center;
  display: table-cell;
}

.char-ruby {
  font-size: 1.6rem;
  font-weight: 600;
  color: #ffffff;
  line-height: 1.4;
  text-align: center;
  display: block;
  margin: 0 auto;
}

.code-rt {
  font-size: 0.75rem;
  color: #d1d5db;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-weight: 500;
  line-height: 1;
  text-align: center;
  display: block;
}

/* 空單元格樣式 */
.char-cell.empty {
  background-color: transparent;
  border-color: rgba(75, 85, 99, 0.2);
  border-style: dashed;
}

/* 懸停效果 */
.char-table:hover .char-cell:not(.empty) {
  background-color: rgba(79, 70, 229, 0.45);
  border-color: rgba(79, 70, 229, 0.7);
  transform: scale(1.02);
  transition: all 0.2s ease;
}

.char-table:hover .char-ruby {
  color: #f8fafc;
}

.char-table:hover .code-rt {
  color: #e5e7eb;
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

<!-- 全局样式专门用于 Teleport 的 tooltip -->
<style>
/* 专门为 custom-tooltip 设置的全局样式 */
.custom-tooltip .char-cell {
  text-align: center !important;
  vertical-align: middle !important;
}

.custom-tooltip .char-row td {
  text-align: center !important;
  vertical-align: middle !important;
}

.custom-tooltip .char-ruby {
  font-size: 1.0rem !important;
  font-weight: 600;
  color: #ffffff;
  line-height: 1.4;
  text-align: center !important;
  display: block !important;
  margin: 0 auto !important;
}

.custom-tooltip .code-rt {
  font-size: 0.5rem !important;
  color: #d1d5db;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-weight: 500;
  line-height: 1;
  text-align: center !important;
  display: block !important;
}

/* 桌面模式下字体增大 */
@media (min-width: 769px) {
  .custom-tooltip .char-ruby {
    font-size: 1.2rem !important;
    text-align: center !important;
    display: block !important;
    margin: 0 auto !important;
  }
  
  .custom-tooltip .code-rt {
    font-size: 0.8rem !important;
    text-align: center !important;
    display: block !important;
  }
  
  .custom-tooltip .char-cell {
    height: 10px !important;
    min-width: 10px !important;
    text-align: center !important;
    vertical-align: middle !important;
  }
  
  .custom-tooltip .char-row td {
    padding: 2px 2px !important;
    min-width: 10px !important;
    text-align: center !important;
    vertical-align: middle !important;
  }
}
</style>


