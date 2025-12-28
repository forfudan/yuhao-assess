<template>
  <div ref="cardRef" class="speed-equiv-card">
    <div class="card-header">
      <div class="header-content">
        <div class="header-text">
          <h3 class="card-title">速度當量</h3>
          <p class="card-description">分析輸入法的速度當量，計算基於字頻加權的全碼按鍵組合。閲讀<a href="https://shurufa.app/docs/concepts.html" target="_blank">瓊林擷英</a>瞭解詳細定義。</p>
        </div>
        <div class="header-buttons">
          <button @click="refreshData" class="refresh-btn" :disabled="isCalculating" title="刷新計算">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" :class="{ 'spinning': isCalculating }">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </button>
          <button @click="exportCard" class="export-btn" :disabled="isCalculating || !!error || !analysisResults" title="導出圖片">
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
              <th>全碼當量</th>
              <th>一簡當量</th>
              <th>二簡當量</th>
              <th>全簡當量</th>
              <th>説明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>知乎簡體字頻</td>
              <td class="metric-value clickable" @click="() => showEquivDetails('zhihu', 'full')">{{ analysisResults.zhihuEquiv.toFixed(4) }}</td>
              <td class="metric-value first-short-equiv clickable" @click="() => showEquivDetails('zhihu', 'firstShort')">{{ analysisResults.zhihuFirstShortEquiv.toFixed(4) }}</td>
              <td class="metric-value second-short-equiv clickable" @click="() => showEquivDetails('zhihu', 'secondShort')">{{ analysisResults.zhihuSecondShortEquiv.toFixed(4) }}</td>
              <td class="metric-value short-equiv clickable" @click="() => showEquivDetails('zhihu', 'short')">{{ analysisResults.zhihuShortEquiv.toFixed(4) }}</td>
              <td class="metric-desc">基於<a href="https://github.com/forfudan/chinese-characters-frequency" target="_blank" rel="noopener">知乎字頻表</a>的加權速度當量</td>
            </tr>
            <tr>
              <td>北語簡體字頻</td>
              <td class="metric-value clickable" @click="() => showEquivDetails('sc', 'full')">{{ analysisResults.scEquiv.toFixed(4) }}</td>
              <td class="metric-value first-short-equiv clickable" @click="() => showEquivDetails('sc', 'firstShort')">{{ analysisResults.scFirstShortEquiv.toFixed(4) }}</td>
              <td class="metric-value second-short-equiv clickable" @click="() => showEquivDetails('sc', 'secondShort')">{{ analysisResults.scSecondShortEquiv.toFixed(4) }}</td>
              <td class="metric-value short-equiv clickable" @click="() => showEquivDetails('sc', 'short')">{{ analysisResults.scShortEquiv.toFixed(4) }}</td>
              <td class="metric-desc">基於<a href="https://faculty.blcu.edu.cn/xinghb/zh_CN/article/167473/content/1437.htm" target="_blank" rel="noopener">簡體字頻表</a>的加權速度當量</td>
            </tr>
            <tr>
              <td>臺標繁體字頻</td>
              <td class="metric-value clickable" @click="() => showEquivDetails('tc', 'full')">{{ analysisResults.tcEquiv.toFixed(4) }}</td>
              <td class="metric-value first-short-equiv clickable" @click="() => showEquivDetails('tc', 'firstShort')">{{ analysisResults.tcFirstShortEquiv.toFixed(4) }}</td>
              <td class="metric-value second-short-equiv clickable" @click="() => showEquivDetails('tc', 'secondShort')">{{ analysisResults.tcSecondShortEquiv.toFixed(4) }}</td>
              <td class="metric-value short-equiv clickable" @click="() => showEquivDetails('tc', 'short')">{{ analysisResults.tcShortEquiv.toFixed(4) }}</td>
              <td class="metric-desc">基於<a href="https://language.moe.gov.tw/001/Upload/files/SITE_CONTENT/M0001/PIN/biau1.htm" target="_blank" rel="noopener">臺標繁體字頻表</a>的加權速度當量</td>
            </tr>
            <tr>
              <td>古籍繁體字頻</td>
              <td class="metric-value clickable" @click="() => showEquivDetails('guji', 'full')">{{ analysisResults.gujiEquiv.toFixed(4) }}</td>
              <td class="metric-value first-short-equiv clickable" @click="() => showEquivDetails('guji', 'firstShort')">{{ analysisResults.gujiFirstShortEquiv.toFixed(4) }}</td>
              <td class="metric-value second-short-equiv clickable" @click="() => showEquivDetails('guji', 'secondShort')">{{ analysisResults.gujiSecondShortEquiv.toFixed(4) }}</td>
              <td class="metric-value short-equiv clickable" @click="() => showEquivDetails('guji', 'short')">{{ analysisResults.gujiShortEquiv.toFixed(4) }}</td>
              <td class="metric-desc">基於古籍字頻的加權速度當量</td>
            </tr>
            <tr>
              <td>繁簡聯合字頻</td>
              <td class="metric-value clickable" @click="() => showEquivDetails('unified', 'full')">{{ analysisResults.unifiedEquiv.toFixed(4) }}</td>
              <td class="metric-value first-short-equiv clickable" @click="() => showEquivDetails('unified', 'firstShort')">{{ analysisResults.unifiedFirstShortEquiv.toFixed(4) }}</td>
              <td class="metric-value second-short-equiv clickable" @click="() => showEquivDetails('unified', 'secondShort')">{{ analysisResults.unifiedSecondShortEquiv.toFixed(4) }}</td>
              <td class="metric-value short-equiv clickable" @click="() => showEquivDetails('unified', 'short')">{{ analysisResults.unifiedShortEquiv.toFixed(4) }}</td>
              <td class="metric-desc">基於繁簡聯合字頻表的加權速度當量</td>
            </tr>
          </tbody>
        </table>

        <div class="info-section">
          <p><strong>説明：</strong></p>
          <p>速度當量基於實驗統計結果，評估輸入法按鍵對的手感表現。數值越小表示輸入越流暢。本工具計算了：</p>
          <ul>
            <li><strong>全碼速度當量</strong>（緑色）：使用全碼碼表（每個單字的最長編碼）進行計算</li>
            <li><strong>一級簡碼速度當量</strong>（紫色）：優先使用一級簡碼（編碼長度不大於2且末尾是空格或上屏鍵）</li>
            <li><strong>二簡簡碼速度當量</strong>（橙色）：優先使用二級簡碼（編碼長度不大於3且末尾是空格或上屏鍵）</li>
            <li><strong>全部簡碼速度當量</strong>（紅色）：使用簡碼碼表（每個單字的最短編碼）進行計算</li>
          </ul>
          <br></br>
          <p>計算考慮了：</p>
          <ul>
            <li>漢字的使用頻率</li>
            <li>檢測到的最大碼長爲 {{ maxCodeLength }} 位</li>
            <li v-if="detectedIsPrefix">{{ detectedIsPrefix ? '檢測到本方案爲前綴或頂功' : '' }}{{ detectedIsPrefix && props.globalPrefixKeys && props.globalPrefixKeys.length > 0 ? `，檢測到上屏鍵爲 ${props.globalPrefixKeys.join('')}` : '' }}</li>
            <li v-if="!detectedIsPrefix">碼表的規範化處理，即在未達到最大碼長時使用下劃線補充（代表空格）</li>
            <li v-else>前綴碼特性，未達到最大碼長時且末碼爲上屏碼時不補充下劃線（空格）</li>
            <li>多候選字的選擇鍵處理（第2候選加分號，第3候選加單引號）</li>
          </ul>
          <br></br>
          <p>💡點擊表格中的當量數值，可查看具體按鍵組合的頻率分布。</p>
        </div>
        
        <!-- 方案名稱標註 -->
        <div v-if="codeTableName" class="scheme-name-annotation">
          <span>當前方案：{{ codeTableName }}</span>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 當量詳情模態框 - 使用 Teleport 傳送到 body -->
  <Teleport to="body">
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ modalTitle }}</h3>
          <button class="modal-close" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="isCalculatingDetails" class="modal-loading">
            <div class="spinner"></div>
            <p>正在計算當量分布...</p>
          </div>
          <div v-else-if="equivDetails.length > 0" class="details-table-wrapper">
            <table class="details-table">
              <thead>
                <tr>
                  <th>當量值</th>
                  <th>按鍵組合</th>
                  <th>説明</th>
                  <th>頻率</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in equivDetails" :key="item.equivValue">
                  <td class="equiv-value">{{ item.equivValue.toFixed(1) }}</td>
                  <td class="key-pairs">
                    <span v-for="(pair, idx) in item.keyPairs" :key="idx" class="key-pair">{{ pair }}</span>
                  </td>
                  <td class="description">{{ item.description }}</td>
                  <td class="frequency">{{ formatFrequency(item.frequencyRatio) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="no-data">
            <p>無數據</p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { useCollapse } from '../composables/useCollapse'
import { ExportService } from '../services/exportService'
import type { CodeTable } from '../types/index'
import { BuiltinCodeTableService } from '../services/builtinCodeTableService'
import { codeTableProcessingService } from '../services/codeTableProcessingService'
import { loadAllCharFrequencies } from '../services/dataService'
import {
  calculateSpeedEquiv,
  calculateCodePairFrequencies,
  calculateEquivDistribution,
  type EquivDistributionItem
} from '../services/speedAnalysisService'

// Props
interface Props {
  codeTable?: CodeTable
  codeTableName?: string
  initialPrefix?: boolean
  globalPrefixKeys?: string[]
  processedTables?: any | null  // 處理後的碼表數據
}

const props = withDefaults(defineProps<Props>(), {
  codeTable: () => new Map(),
  codeTableName: '',
  initialPrefix: false,
  globalPrefixKeys: () => [],
  processedTables: null
})

// 摺疊功能
const { isCollapsed, toggleCollapsed, collapse, expand, getCollapsedState } = useCollapse()

// 卡片引用
const cardRef = ref<HTMLElement>()

// 导出功能
async function exportCard() {
  if (!cardRef.value || !analysisResults.value) {
    console.warn('卡片元素或数据不可用')
    return
  }

  try {
    await ExportService.exportElementToPNG(cardRef.value, '速度當量', props.codeTableName || '未命名方案', {
      copyToClipboard: ExportService.isClipboardSupported(),
      download: true
    })
  } catch (error) {
    console.error('導出失敗:', error)
    alert('導出失敗，請重試')
  }
}

// 暴露摺疊方法給父組件
defineExpose({
  collapse,
  expand,
  toggle: toggleCollapsed,
  getCollapsedState
})

// 分析結果數據結構
interface SpeedEquivResults {
  zhihuEquiv: number
  scEquiv: number
  tcEquiv: number
  gujiEquiv: number
  unifiedEquiv: number
  zhihuFirstShortEquiv: number
  scFirstShortEquiv: number
  tcFirstShortEquiv: number
  gujiFirstShortEquiv: number
  unifiedFirstShortEquiv: number
  zhihuSecondShortEquiv: number
  scSecondShortEquiv: number
  tcSecondShortEquiv: number
  gujiSecondShortEquiv: number
  unifiedSecondShortEquiv: number
  zhihuShortEquiv: number
  scShortEquiv: number
  tcShortEquiv: number
  gujiShortEquiv: number
  unifiedShortEquiv: number
}

// 響應式數據
const isCalculating = ref(false)
const error = ref<string | null>(null)
const analysisResults = ref<SpeedEquivResults | null>(null)
const maxCodeLength = ref<number>(0)
const detectedIsPrefix = ref(false)
const builtinService = new BuiltinCodeTableService()

// 模態框相關
const showModal = ref(false)
const modalTitle = ref('')
const isCalculatingDetails = ref(false)
const equivDetails = ref<EquivDistributionItem[]>([])

// 存儲計算過程中的數據，用於詳情彈窗
let cachedPairFrequencies: Record<string, Record<string, number>> = {}
let cachedEquivTable: Record<string, number> = {}

// 格式化頻率顯示（百分比）
function formatFrequency(ratio: number): string {
  return (ratio * 100).toFixed(2) + '%'
}

// 顯示當量詳情
async function showEquivDetails(freqType: string, codeType: string) {
  if (!props.processedTables) return
  
  showModal.value = true
  isCalculatingDetails.value = true
  
  // 設置標題
  const freqNames: Record<string, string> = {
    zhihu: '知乎簡體字頻',
    sc: '北語簡體字頻',
    tc: '臺標繁體字頻',
    guji: '古籍繁體字頻',
    unified: '繁簡聯合字頻'
  }
  
  const codeNames: Record<string, string> = {
    full: '全碼',
    firstShort: '一簡',
    secondShort: '二簡',
    short: '全簡'
  }
  
  modalTitle.value = `${freqNames[freqType]} - ${codeNames[codeType]}當量分布`
  
  try {
    // 獲取對應的碼表
    let codeTable: CodeTable
    if (codeType === 'full') {
      codeTable = props.processedTables.fullWithSelection
    } else if (codeType === 'short') {
      codeTable = props.processedTables.shortWithSelection
    } else if (codeType === 'firstShort') {
      codeTable = generateFirstShortCodeTable(
        props.processedTables.shortWithSelection,
        props.processedTables.fullWithSelection,
        props.globalPrefixKeys
      )
    } else { // secondShort
      codeTable = generateSecondShortCodeTable(
        props.processedTables.shortWithSelection,
        props.processedTables.fullWithSelection,
        props.globalPrefixKeys
      )
    }
    
    // 加載字頻和當量表
    const { zhihuFreq, scFreq, tcFreq, gujiFreq, unifiedFreq } = await loadAllCharFrequencies()
    const freqMap: Record<string, Record<string, number>> = {
      zhihu: zhihuFreq,
      sc: scFreq,
      tc: tcFreq,
      guji: gujiFreq,
      unified: unifiedFreq
    }
    
    const charFrequency = freqMap[freqType]
    const equivTable = cachedEquivTable && Object.keys(cachedEquivTable).length > 0 
      ? cachedEquivTable 
      : await loadEquivTable()
    
    // 計算碼對頻率
    const pairFrequencies = calculateCodePairFrequencies(codeTable, charFrequency)
    
    // 計算分檔詳情
    equivDetails.value = calculateEquivDistribution(pairFrequencies, equivTable)
    
  } catch (err) {
    console.error('計算當量詳情失敗:', err)
    equivDetails.value = []
  } finally {
    isCalculatingDetails.value = false
  }
}

// 關閉模態框
function closeModal() {
  showModal.value = false
  equivDetails.value = []
}

// 加載當量表
async function loadEquivTable(): Promise<Record<string, number>> {
  try {
    const response = await fetch('/data/equivTable.json')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    cachedEquivTable = data.data || {}
    return cachedEquivTable
  } catch (error) {
    console.error('加載當量表失敗:', error)
    throw new Error('加載當量表失敗')
  }
}

// 生成一級簡碼表（長度≤2且末尾是空格或上屏鍵）
function generateFirstShortCodeTable(
  shortWithSelection: CodeTable, 
  fullWithSelection: CodeTable,
  prefixKeys: string[] = []
): CodeTable {
  const result: CodeTable = new Map()
  
  // 创建上屏键集合，包含空格(_)和用户设置的上屏键
  const validEndingKeys = new Set(['_', ...prefixKeys])
  
  for (const [char, codes] of shortWithSelection) {
    const validCodes: string[] = []
    
    for (const code of codes) {
      // 檢查是否符合一級簡碼條件：長度≤2且末尾是空格或上屏鍵
      if (code.length <= 2 && validEndingKeys.has(code[code.length - 1])) {
        validCodes.push(code)
      }
    }
    
    // 如果有符合條件的簡碼，使用簡碼；否則使用全碼
    if (validCodes.length > 0) {
      result.set(char, validCodes)
    } else {
      const fullCodes = fullWithSelection.get(char)
      if (fullCodes) {
        result.set(char, [...fullCodes])
      }
    }
  }
  
  return result
}

// 生成二級簡碼表（長度≤3且末尾是空格或上屏鍵）
function generateSecondShortCodeTable(
  shortWithSelection: CodeTable, 
  fullWithSelection: CodeTable,
  prefixKeys: string[] = []
): CodeTable {
  const result: CodeTable = new Map()
  
  // 创建上屏键集合，包含空格(_)和用户设置的上屏键
  const validEndingKeys = new Set(['_', ...prefixKeys])
  
  for (const [char, codes] of shortWithSelection) {
    const validCodes: string[] = []
    
    for (const code of codes) {
      // 檢查是否符合二級簡碼條件：長度≤3且末尾是空格或上屏鍵
      if (code.length <= 3 && validEndingKeys.has(code[code.length - 1])) {
        validCodes.push(code)
      }
    }
    
    // 如果有符合條件的簡碼，使用簡碼；否則使用全碼
    if (validCodes.length > 0) {
      result.set(char, validCodes)
    } else {
      const fullCodes = fullWithSelection.get(char)
      if (fullCodes) {
        result.set(char, [...fullCodes])
      }
    }
  }
  
  return result
}

// 刷新數據
const refreshData = async () => {
  console.log('手動刷新速度當量數據...')
  await calculateSpeedEquivAnalysis()
}

// 主計算函數
async function calculateSpeedEquivAnalysis() {
  if (!props.codeTable || props.codeTable.size === 0) {
    return
  }
  
  isCalculating.value = true
  error.value = null

  try {
    // 1. 使用從 props 傳入的處理後碼表數據
    const processedTables = props.processedTables
    if (!processedTables) {
      throw new Error('無法獲取處理後的碼表')
    }
    
    const processedCodeTable = processedTables.fullWithSelection
    const shortProcessedCodeTable = processedTables.shortWithSelection
    
    // 2. 從處理服務獲取最大碼長和前綴碼檢測結果（使用全局統一數據源）
    const processingOptions = codeTableProcessingService.getProcessingOptions()
    maxCodeLength.value = processingOptions?.maxLength || 4
    detectedIsPrefix.value = processingOptions?.isPrefix || false
    
    // 3. 生成一級和二級簡碼表
    const firstShortCodeTable = generateFirstShortCodeTable(
      shortProcessedCodeTable, 
      processedCodeTable,
      props.globalPrefixKeys
    )
    const secondShortCodeTable = generateSecondShortCodeTable(
      shortProcessedCodeTable, 
      processedCodeTable,
      props.globalPrefixKeys
    )
    
    // 4. 加載當量表
    const equivTable = await loadEquivTable()
    
    // 5. 加載各種字頻表
    const { zhihuFreq, scFreq, tcFreq, gujiFreq, unifiedFreq } = await loadAllCharFrequencies()
    
    // 6. 計算各種字頻下的全碼速度當量
    const zhihuPairFreq = calculateCodePairFrequencies(processedCodeTable, zhihuFreq)
    const scPairFreq = calculateCodePairFrequencies(processedCodeTable, scFreq)
    const tcPairFreq = calculateCodePairFrequencies(processedCodeTable, tcFreq)
    const gujiPairFreq = calculateCodePairFrequencies(processedCodeTable, gujiFreq)
    const unifiedPairFreq = calculateCodePairFrequencies(processedCodeTable, unifiedFreq)
    
    // 7. 計算各種字頻下的一級簡碼速度當量
    const zhihuFirstShortPairFreq = calculateCodePairFrequencies(firstShortCodeTable, zhihuFreq)
    const scFirstShortPairFreq = calculateCodePairFrequencies(firstShortCodeTable, scFreq)
    const tcFirstShortPairFreq = calculateCodePairFrequencies(firstShortCodeTable, tcFreq)
    const gujiFirstShortPairFreq = calculateCodePairFrequencies(firstShortCodeTable, gujiFreq)
    const unifiedFirstShortPairFreq = calculateCodePairFrequencies(firstShortCodeTable, unifiedFreq)
    
    // 8. 計算各種字頻下的二級簡碼速度當量
    const zhihuSecondShortPairFreq = calculateCodePairFrequencies(secondShortCodeTable, zhihuFreq)
    const scSecondShortPairFreq = calculateCodePairFrequencies(secondShortCodeTable, scFreq)
    const tcSecondShortPairFreq = calculateCodePairFrequencies(secondShortCodeTable, tcFreq)
    const gujiSecondShortPairFreq = calculateCodePairFrequencies(secondShortCodeTable, gujiFreq)
    const unifiedSecondShortPairFreq = calculateCodePairFrequencies(secondShortCodeTable, unifiedFreq)
    
    // 9. 計算各種字頻下的簡碼速度當量
    const zhihuShortPairFreq = calculateCodePairFrequencies(shortProcessedCodeTable, zhihuFreq)
    const scShortPairFreq = calculateCodePairFrequencies(shortProcessedCodeTable, scFreq)
    const tcShortPairFreq = calculateCodePairFrequencies(shortProcessedCodeTable, tcFreq)
    const gujiShortPairFreq = calculateCodePairFrequencies(shortProcessedCodeTable, gujiFreq)
    const unifiedShortPairFreq = calculateCodePairFrequencies(shortProcessedCodeTable, unifiedFreq)
    
    analysisResults.value = {
      zhihuEquiv: calculateSpeedEquiv(zhihuPairFreq, equivTable),
      scEquiv: calculateSpeedEquiv(scPairFreq, equivTable),
      tcEquiv: calculateSpeedEquiv(tcPairFreq, equivTable),
      gujiEquiv: calculateSpeedEquiv(gujiPairFreq, equivTable),
      unifiedEquiv: calculateSpeedEquiv(unifiedPairFreq, equivTable),
      zhihuFirstShortEquiv: calculateSpeedEquiv(zhihuFirstShortPairFreq, equivTable),
      scFirstShortEquiv: calculateSpeedEquiv(scFirstShortPairFreq, equivTable),
      tcFirstShortEquiv: calculateSpeedEquiv(tcFirstShortPairFreq, equivTable),
      gujiFirstShortEquiv: calculateSpeedEquiv(gujiFirstShortPairFreq, equivTable),
      unifiedFirstShortEquiv: calculateSpeedEquiv(unifiedFirstShortPairFreq, equivTable),
      zhihuSecondShortEquiv: calculateSpeedEquiv(zhihuSecondShortPairFreq, equivTable),
      scSecondShortEquiv: calculateSpeedEquiv(scSecondShortPairFreq, equivTable),
      tcSecondShortEquiv: calculateSpeedEquiv(tcSecondShortPairFreq, equivTable),
      gujiSecondShortEquiv: calculateSpeedEquiv(gujiSecondShortPairFreq, equivTable),
      unifiedSecondShortEquiv: calculateSpeedEquiv(unifiedSecondShortPairFreq, equivTable),
      zhihuShortEquiv: calculateSpeedEquiv(zhihuShortPairFreq, equivTable),
      scShortEquiv: calculateSpeedEquiv(scShortPairFreq, equivTable),
      tcShortEquiv: calculateSpeedEquiv(tcShortPairFreq, equivTable),
      gujiShortEquiv: calculateSpeedEquiv(gujiShortPairFreq, equivTable),
      unifiedShortEquiv: calculateSpeedEquiv(unifiedShortPairFreq, equivTable)
    }
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : '計算失敗'
    console.error('速度當量計算失敗:', err)
  } finally {
    isCalculating.value = false
  }
}

// 监听碼表变化
watch(() => props.codeTable, async (newCodeTable) => {
  if (newCodeTable && newCodeTable.size > 0) {
    // 延迟一点确保其他watch已执行
    await nextTick()
    calculateSpeedEquivAnalysis()
  }
}, { immediate: false })  // 不立即执行，让组件挂载逻辑控制

// 組件掛載時自動計算
onMounted(async () => {
  // SpeedEquivCard不再自己檢測前綴碼，完全依賴App.vue的處理結果
  // 直接執行計算
  if (props.codeTable && props.codeTable.size > 0) {
    calculateSpeedEquivAnalysis()
  }
})
</script>

<style scoped>
@import '../styles/card-common.css';
@import '../styles/modal-common.css';

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
  font-family: var(--font-numeric);
  font-feature-settings: "tnum" 0; /* 禁用表格數字，使用比例數字 */
}

.metric-value.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 4px;
  padding: 4px 8px;
  margin: -4px -8px;
}

.metric-value.clickable:hover {
  background: rgba(5, 150, 105, 0.1);
  transform: scale(1.05);
}

.metric-value.first-short-equiv {
  color: #7c3aed; /* 一級簡碼速度當量使用紫色 */
}

.metric-value.second-short-equiv {
  color: #ea580c; /* 二級簡碼速度當量使用橙色 */
}

.metric-value.short-equiv {
  color: #dc2626; /* 簡碼速度當量使用紅色 */
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
[data-theme="dark"] .loading {
  color: var(--color-text-secondary);
}

[data-theme="dark"] .spinner {
  border-color: var(--color-bg-tertiary);
  border-top-color: var(--color-warning);
}

[data-theme="dark"] .error-state {
  color: var(--color-text-secondary);
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

[data-theme="dark"] .metric-value {
  color: var(--color-success);
}

[data-theme="dark"] .scheme-name {
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-primary);
}

[data-theme="dark"] .scheme-name span {
  color: var(--color-text-secondary);
}

/* 模態框樣式 */
/* Modal擴展樣式 */

.details-table-wrapper {
  overflow-x: auto;
}

.details-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.details-table th {
  background: #f8fafc;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  position: sticky;
  top: 0;
}

.details-table td {
  padding: 12px 16px;
  vertical-align: middle;
}

.details-table tbody tr {
  border-bottom: 1px solid #f3f4f6;
}

.details-table tbody tr:last-child {
  border-bottom: none;
}

.details-table tbody tr:hover {
  background: #f9fafb;
}

.equiv-value {
  font-weight: 600;
  color: #059669;
  font-family: var(--font-numeric);
  white-space: nowrap;
}

.key-pairs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.key-pair {
  display: inline-block;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 0.75rem;
  color: #374151;
}

.more-pairs {
  color: #6b7280;
  font-style: italic;
  font-size: 0.85rem;
  align-self: center;
}

.frequency {
  font-weight: 600;
  color: #3b82f6;
  font-family: var(--font-numeric);
  white-space: nowrap;
  text-align: right;
}

.description {
  color: #6b7280;
  font-size: 0.85rem;
  line-height: 1.4;
  min-width: 150px;
  white-space: normal;
}

.no-data {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
}

/* 暗黑模式的模態框樣式 */
[data-theme="dark"] .modal-content {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
}

[data-theme="dark"] .modal-header {
  border-bottom-color: var(--color-border-primary);
}

[data-theme="dark"] .modal-header h3 {
  color: var(--color-text-primary);
}

[data-theme="dark"] .modal-close {
  color: var(--color-text-secondary);
}

[data-theme="dark"] .modal-close:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

[data-theme="dark"] .modal-loading {
  color: var(--color-text-secondary);
}

[data-theme="dark"] .details-table th {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border-bottom-color: var(--color-border-primary);
}

[data-theme="dark"] .details-table td {
  border-bottom-color: var(--color-border-secondary);
  color: var(--color-text-primary);
}

[data-theme="dark"] .details-table tbody tr:hover {
  background: var(--color-bg-tertiary);
}

[data-theme="dark"] .key-pair {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

[data-theme="dark"] .no-data {
  color: var(--color-text-secondary);
}

[data-theme="dark"] .description {
  color: var(--color-text-secondary);
}
</style>
