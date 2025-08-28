<template>
  <div class="duplicate-analysis-card" :id="id">
    <div class="card-header">
      <div class="header-content">
        <div class="header-text">
          <h3 class="card-title">重碼數據</h3>
          <p class="card-description">分析不同字符集下的重碼情況，計算靜態重碼率和動態選重率。閱讀<a href="https://shurufa.app/docs/concepts.html" target="_blank">瓊林擷英</a>瞭解詳細定義。</p>
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
        <p>正在計算重碼數據...</p>
      </div>

      <div v-else-if="analysisResults" class="analysis-results">
        <table class="metrics-table">
          <thead>
            <tr>
              <th>指標</th>
              <th>全碼</th>
              <th>
                出簡
                <span 
                  class="info-icon" 
                  @mouseenter="showTooltip($event, '計算簡碼時，會提取碼表相同漢字中編碼長度最小之編碼，並視之為簡碼。故而出現多重簡碼、兼容編碼、無理碼等特殊情況時，該列數據會出現失真現象。欲獲取更加準確之統計，請對碼表進行處理。')"
                  @mouseleave="hideTooltip()"
                >
                  ⓘ
                </span>
              </th>
              <th>說明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                知乎動態選重率
                <span 
                  class="info-icon" 
                  @mouseenter="showTooltip($event, '計算動態選衝率時，會使用字頻數據對漢字進行降序重排，以方便不同方案進行比較。因此上，計算結果可能會稍低於真實選重率。')"
                  @mouseleave="hideTooltip()"
                >
                  ⓘ
                </span>
              </td>
              <td class="metric-value">{{ (analysisResults.dynamicDupRate.full * 10000).toFixed(2) }}‱</td>
              <td class="metric-value">{{ (analysisResults.dynamicDupRate.short * 10000).toFixed(2) }}‱</td>
              <td class="metric-desc">基於<a href="https://github.com/forfudan/chinese-characters-frequency" target="_blank" rel="noopener">知乎字頻表</a>的加權選重率，‱ 爲萬分符</td>
            </tr>
            <tr>
              <td>
                簡體動態選重率
                <span 
                  class="info-icon" 
                  @mouseenter="showTooltip($event, '計算動態選衝率時，會使用字頻數據對漢字進行降序重排，以方便不同方案進行比較。因此上，計算結果可能會稍低於真實選重率。')"
                  @mouseleave="hideTooltip()"
                >
                  ⓘ
                </span>
              </td>
              <td class="metric-value">{{ (analysisResults.dynamicDupRateSC.full * 10000).toFixed(2) }}‱</td>
              <td class="metric-value">{{ (analysisResults.dynamicDupRateSC.short * 10000).toFixed(2) }}‱</td>
              <td class="metric-desc">基於<a href="https://faculty.blcu.edu.cn/xinghb/zh_CN/article/167473/content/1437.htm" target="_blank" rel="noopener">簡體字頻表</a>的加權選重率</td>
            </tr>
            <tr>
              <td>
                繁體動態選重率
                <span 
                  class="info-icon" 
                  @mouseenter="showTooltip($event, '計算動態選衝率時，會使用字頻數據對漢字進行降序重排，以方便不同方案進行比較。因此上，計算結果可能會稍低於真實選重率。')"
                  @mouseleave="hideTooltip()"
                >
                  ⓘ
                </span>
              </td>
              <td class="metric-value">{{ (analysisResults.dynamicDupRateTC.full * 10000).toFixed(2) }}‱</td>
              <td class="metric-value">{{ (analysisResults.dynamicDupRateTC.short * 10000).toFixed(2) }}‱</td>
              <td class="metric-desc">基於<a href="https://language.moe.gov.tw/001/Upload/files/SITE_CONTENT/M0001/PIN/biau1.htm" target="_blank" rel="noopener">繁體字頻表</a>的加權選重率</td>
            </tr>
            <tr>
              <td>
                繁簡聯合動態選重率
                <span 
                  class="info-icon" 
                  @mouseenter="showTooltip($event, '計算動態選衝率時，會使用字頻數據對漢字進行降序重排，以方便不同方案進行比較。因此上，計算結果可能會稍低於真實選重率。')"
                  @mouseleave="hideTooltip()"
                >
                  ⓘ
                </span>
              </td>
              <td class="metric-value">{{ (analysisResults.dynamicDupRateUnified.full * 10000).toFixed(2) }}‱</td>
              <td class="metric-value">{{ (analysisResults.dynamicDupRateUnified.short * 10000).toFixed(2) }}‱</td>
              <td class="metric-desc">基於繁簡聯合字頻表的加權選重率</td>
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
              <td>GB2312重碼字數</td>
              <td class="metric-value">{{ analysisResults.gb2312DuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.gb2312DuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">{{ analysisResults.charsetSizes.gb2312.toLocaleString() }} 之 {{ analysisResults.charsetEncodedSizes?.gb2312?.toLocaleString() || '未知' }} 有編碼 </td>
            </tr>
            <tr>
              <td>國字重碼字數</td>
              <td class="metric-value">{{ analysisResults.guoziDuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.guoziDuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">國字標準字體表 {{ analysisResults.charsetSizes.guozi.toLocaleString() }} 之 {{ analysisResults.charsetEncodedSizes?.guozi?.toLocaleString() || '未知' }} 有編碼 </td>
            </tr>
            <tr>
              <td>CJK基本區重碼字數</td>
              <td class="metric-value">{{ analysisResults.cjkBasicDuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.cjkBasicDuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">{{ analysisResults.charsetSizes.cjkBasic.toLocaleString() }} 之 {{ analysisResults.charsetEncodedSizes?.cjkBasic?.toLocaleString() || '未知' }} 有編碼 </td>
            </tr>
            <tr>
              <td>到CJK-A重碼字數</td>
              <td class="metric-value">{{ analysisResults.cjkToADuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.cjkToADuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">{{ analysisResults.charsetSizes.cjkToA.toLocaleString() }} 之 {{ analysisResults.charsetEncodedSizes?.cjkToA?.toLocaleString() || '未知' }} 有編碼</td>
            </tr>
            <tr>
              <td>到CJK-B重碼字數</td>
              <td class="metric-value">{{ analysisResults.cjkToBDuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.cjkToBDuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">{{ analysisResults.charsetSizes.cjkToB.toLocaleString() }} 之 {{ analysisResults.charsetEncodedSizes?.cjkToB?.toLocaleString() || '未知' }} 有編碼</td>
            </tr>
            <tr>
              <td>到CJK-C重碼字數</td>
              <td class="metric-value">{{ analysisResults.cjkToCDuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.cjkToCDuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">{{ analysisResults.charsetSizes.cjkToC.toLocaleString() }} 之 {{ analysisResults.charsetEncodedSizes?.cjkToC?.toLocaleString() || '未知' }} 有編碼</td>
            </tr>
            <tr>
              <td>到CJK-D重碼字數</td>
              <td class="metric-value">{{ analysisResults.cjkToDDuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.cjkToDDuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">{{ analysisResults.charsetSizes.cjkToD.toLocaleString() }} 之 {{ analysisResults.charsetEncodedSizes?.cjkToD?.toLocaleString() || '未知' }} 有編碼</td>
            </tr>
            <tr>
              <td>到CJK-E重碼字數</td>
              <td class="metric-value">{{ analysisResults.cjkToEDuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.cjkToEDuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">{{ analysisResults.charsetSizes.cjkToE.toLocaleString() }} 之 {{ analysisResults.charsetEncodedSizes?.cjkToE?.toLocaleString() || '未知' }} 有編碼</td>
            </tr>
            <tr>
              <td>到CJK-F重碼字數</td>
              <td class="metric-value">{{ analysisResults.cjkToFDuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.cjkToFDuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">{{ analysisResults.charsetSizes.cjkToF.toLocaleString() }} 之 {{ analysisResults.charsetEncodedSizes?.cjkToF?.toLocaleString() || '未知' }} 有編碼</td>
            </tr>
            <tr>
              <td>到CJK-G重碼字數</td>
              <td class="metric-value">{{ analysisResults.cjkToGDuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.cjkToGDuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">{{ analysisResults.charsetSizes.cjkToG.toLocaleString() }} 之 {{ analysisResults.charsetEncodedSizes?.cjkToG?.toLocaleString() || '未知' }} 有編碼</td>
            </tr>
            <tr>
              <td>到CJK-H重碼字數</td>
              <td class="metric-value">{{ analysisResults.cjkToHDuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.cjkToHDuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">{{ analysisResults.charsetSizes.cjkToH.toLocaleString() }} 之 {{ analysisResults.charsetEncodedSizes?.cjkToH?.toLocaleString() || '未知' }} 有編碼</td>
            </tr>
            <tr>
              <td>到CJK-I重碼字數</td>
              <td class="metric-value">{{ analysisResults.cjkToIDuplicateChars.full.toLocaleString() }}</td>
              <td class="metric-value">{{ analysisResults.cjkToIDuplicateChars.short.toLocaleString() }}</td>
              <td class="metric-desc">{{ analysisResults.charsetSizes.cjkToI.toLocaleString() }} 之 {{ analysisResults.charsetEncodedSizes?.cjkToI?.toLocaleString() || '未知' }} 有編碼</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">
        <p>請點擊「重新計算」來查看分析結果</p>
      </div>
      
      <!-- 方案名稱標註 -->
      <div v-if="codeTableName" class="scheme-name">
        <span>當前方案：{{ codeTableName }}</span>
      </div>
    </div>
  </div>

  <!-- 自定義工具提示 - 使用 Teleport 移到 body -->
  <Teleport to="body">
    <div v-if="tooltipVisible" class="custom-tooltip" :style="tooltipStyle">
      <div class="tooltip-content">
        {{ tooltipText }}
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, Teleport } from 'vue'
import { generateCharset, type CharsetType, getTheoreticalCharsetSize } from '../services/charsetService'
import { getDynamicDupRate } from '../services/duplicateAnalysisService'
import { BuiltinCodeTableService } from '../services/builtinCodeTableService'
import { codeTableProcessingService } from '../services/codeTableProcessingService'
import { 
  loadCharFrequency,
  loadCharFrequencySC,
  loadCharFrequencyTC,
  loadCharFrequencyUnified
} from '../services/dataService'
import { createTooltipManager } from '../services/uiService'
import { useCollapse } from '../composables/useCollapse'
import type { CodeTable, CharFrequency } from '../types'

// Props
interface Props {
  codeTable?: CodeTable
  codeTableName?: string
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  codeTable: () => new Map(),
  codeTableName: ''
})

// 折叠功能
const { isCollapsed, toggleCollapsed, collapse, expand, getCollapsedState } = useCollapse()

// 暴露摺疊方法給父組件
defineExpose({
  collapse,
  expand,
  toggle: toggleCollapsed,
  getCollapsedState
})

// 雙值數據結構
interface DualValue {
  full: number
  short: number
}

// 分析結果數據結構
interface AnalysisResults {
  dynamicDupRate: DualValue
  dynamicDupRateSC: DualValue
  dynamicDupRateTC: DualValue
  dynamicDupRateUnified: DualValue
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
}

// 響應式數據
const isCalculating = ref(false)
const analysisResults = ref<AnalysisResults | null>(null)
const builtinService = new BuiltinCodeTableService()

// 工具提示管理器
const { tooltipVisible, tooltipText, tooltipStyle, showTooltip, hideTooltip } = createTooltipManager()

// 計算字符集的重碼字符數和重碼組數（支持雙碼表）
async function calculateCharsetDuplicates(charsetType: CharsetType, allChars: Set<string>, fullCodeTable: CodeTable, shortCodeTable: CodeTable) {
  // 生成實際有編碼的字符集（基於碼表中的字符）
  const actualCharset = await generateCharset(charsetType, allChars)
  
  // 獲取理論字符集大小
  let theoreticalSize = 0
  if (charsetType === 'gb2312' || charsetType === 'guozi') {
    // 對於GB2312和國字，從JSON文件獲取理論大小
    theoreticalSize = await getTheoreticalCharsetSize(charsetType)
  } else {
    // 對於CJK區域，生成完整的理論字符集
    theoreticalSize = await getTheoreticalCharsetSize(charsetType)
  }
  
  // 計算全碼表的重碼統計
  const fullCodeToChars = new Map<string, string[]>()
  let fullCodeTableMatches = 0
  
  for (const char of actualCharset) {
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
  
  // 計算簡碼表的重碼統計
  const shortCodeToChars = new Map<string, string[]>()
  let shortCodeTableMatches = 0
  
  for (const char of actualCharset) {
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
    theoreticalSize: theoreticalSize, // 理论字符集大小
    encodedSize: actualCharset.size // 实际有编码的字符数
  }
}

// 生成累積CJK字符集緩存
async function generateCJKCharsetCache(allChars: Set<string>) {
  // 定義CJK擴展區順序
  const cjkExtensions = ['cjk_basic', 'cjk_a', 'cjk_b', 'cjk_c', 'cjk_d', 'cjk_e', 'cjk_f', 'cjk_g', 'cjk_h', 'cjk_i'] as const
  
  // 生成各個單獨的实际字符集
  const actualCharsets = await Promise.all(
    cjkExtensions.map(ext => generateCharset(ext, allChars))
  )
  
  // 創建累積实际字符集
  const cumulativeActualCharsets: { [key: string]: Set<string> } = {}
  
  // 為每個階段創建正確的累積集合
  cjkExtensions.forEach((ext, index) => {
    const actualAccumulated = new Set<string>()
    
    // 累積到當前階段的所有字符
    for (let i = 0; i <= index; i++) {
      for (const char of actualCharsets[i]) {
        actualAccumulated.add(char)
      }
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
    cumulativeActualCharsets[targetName] = actualAccumulated
  })
  
  return cumulativeActualCharsets as {
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
async function calculateDirectCharsetDuplicates(actualCharset: Set<string>, theoreticalSizeType: CharsetType, fullCodeTable: CodeTable, shortCodeTable: CodeTable) {
  // 獲取理論字符集大小
  const theoreticalSize = await getTheoreticalCharsetSize(theoreticalSizeType)
  
  // 計算全碼表的重碼統計
  const fullCodeToChars = new Map<string, string[]>()
  let fullCodeTableMatches = 0
  
  for (const char of actualCharset) {
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
  
  // 計算簡碼表的重碼統計
  const shortCodeToChars = new Map<string, string[]>()
  let shortCodeTableMatches = 0
  
  for (const char of actualCharset) {
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
    theoreticalSize: theoreticalSize,
    encodedSize: actualCharset.size
  }
}

// 計算所有指標
async function calculateAllMetrics() {
  if (!props.codeTable || props.codeTable.size === 0) {
    console.warn('沒有可用的碼表數據')
    return
  }
  
  isCalculating.value = true
  
  try {
    // 从码表键中提取所有单个字符（修复：处理多字词条问题）
    const allUniqueChars = new Set<string>()
    for (const key of props.codeTable.keys()) {
      // 将每个词条分解为单个字符
      for (const char of key) {
        allUniqueChars.add(char)
      }
    }
    
    // 使用提取的唯一字符代替原来的码表键
    const allChars = allUniqueChars
    
    // 使用缓存的处理结果，由App.vue统一处理
    const processedTables = codeTableProcessingService.getProcessedTables()
    if (!processedTables) {
      console.error('缓存的码表处理结果不可用，请先在App.vue中处理码表')
      return
    }
    
    const fullCodeTable = processedTables.full
    const shortCodeTable = processedTables.short
    
    // 加載所有字頻數據
    const [charFrequency, charFrequencySC, charFrequencyTC, charFrequencyUnified] = await Promise.all([
      loadCharFrequency(),
      loadCharFrequencySC(),
      loadCharFrequencyTC(),
      loadCharFrequencyUnified()
    ])
    
    // 計算各種動態選重率
    const fullDynamicDupRate = getDynamicDupRate(fullCodeTable, charFrequency)
    const shortDynamicDupRate = getDynamicDupRate(shortCodeTable, charFrequency)
    
    const fullDynamicDupRateSC = getDynamicDupRate(fullCodeTable, charFrequencySC)
    const shortDynamicDupRateSC = getDynamicDupRate(shortCodeTable, charFrequencySC)
    
    const fullDynamicDupRateTC = getDynamicDupRate(fullCodeTable, charFrequencyTC)
    const shortDynamicDupRateTC = getDynamicDupRate(shortCodeTable, charFrequencyTC)
    
    const fullDynamicDupRateUnified = getDynamicDupRate(fullCodeTable, charFrequencyUnified)
    const shortDynamicDupRateUnified = getDynamicDupRate(shortCodeTable, charFrequencyUnified)
    
    // 計算各字符集的重碼統計
    const gb2312Stats = await calculateCharsetDuplicates('gb2312', allChars, fullCodeTable, shortCodeTable)
    const guoziStats = await calculateCharsetDuplicates('guozi', allChars, fullCodeTable, shortCodeTable)
    const cjkBasicStats = await calculateCharsetDuplicates('cjk_basic', allChars, fullCodeTable, shortCodeTable)
    
    // 生成CJK累積字符集緩存
    const cjkCache = await generateCJKCharsetCache(allChars)
    
    // 使用緩存計算累積字符集的重碼統計
    const cjkExtNames = ['cjkToA', 'cjkToB', 'cjkToC', 'cjkToD', 'cjkToE', 'cjkToF', 'cjkToG', 'cjkToH', 'cjkToI'] as const
    const cjkStats: Record<string, any> = {}
    for (const name of cjkExtNames) {
      const theoreticalSizeType = name === 'cjkToA' ? 'cjk_to_a' :
                                  name === 'cjkToB' ? 'cjk_to_b' :
                                  name === 'cjkToC' ? 'cjk_to_c' :
                                  name === 'cjkToD' ? 'cjk_to_d' :
                                  name === 'cjkToE' ? 'cjk_to_e' :
                                  name === 'cjkToF' ? 'cjk_to_f' :
                                  name === 'cjkToG' ? 'cjk_to_g' :
                                  name === 'cjkToH' ? 'cjk_to_h' : 'cjk_to_i'
      
      cjkStats[name] = await calculateDirectCharsetDuplicates(
        cjkCache[name], 
        theoreticalSizeType as CharsetType,
        fullCodeTable, 
        shortCodeTable
      )
    }
    
    // 構建 CJK 重碼字符結果
    const cjkDuplicateChars: any = {}
    cjkExtNames.forEach(name => {
      cjkDuplicateChars[`${name}DuplicateChars`] = cjkStats[name].duplicateChars
    })
    
    // 構建字符集大小結果
    const cjkCharsetSizes: any = {}
    cjkExtNames.forEach(name => {
      cjkCharsetSizes[name] = cjkStats[name].theoreticalSize
    })
    
    analysisResults.value = {
      dynamicDupRate: { full: fullDynamicDupRate, short: shortDynamicDupRate },
      dynamicDupRateSC: { full: fullDynamicDupRateSC, short: shortDynamicDupRateSC },
      dynamicDupRateTC: { full: fullDynamicDupRateTC, short: shortDynamicDupRateTC },
      dynamicDupRateUnified: { full: fullDynamicDupRateUnified, short: shortDynamicDupRateUnified },
      gb2312DuplicateChars: gb2312Stats.duplicateChars,
      guoziDuplicateChars: guoziStats.duplicateChars,
      guoziDuplicateGroups: guoziStats.duplicateGroups,
      gb2312DuplicateGroups: gb2312Stats.duplicateGroups,
      cjkBasicDuplicateChars: cjkBasicStats.duplicateChars,
      ...cjkDuplicateChars,
      charsetSizes: {
        gb2312: gb2312Stats.theoreticalSize,
        guozi: guoziStats.theoreticalSize,
        cjkBasic: cjkBasicStats.theoreticalSize,
        ...cjkCharsetSizes
      },
      charsetEncodedSizes: (() => {
        const result: any = {}
        result.gb2312 = gb2312Stats.encodedSize
        result.guozi = guoziStats.encodedSize
        result.cjkBasic = cjkBasicStats.encodedSize
        cjkExtNames.forEach(name => {
          result[name] = cjkStats[name].encodedSize
        })
        return result
      })()
    }
    
  } catch (error) {
    console.error('計算重碼時出錯:', error)
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

// 組件掛載時自動計算一次
onMounted(() => {
  if (props.codeTable && props.codeTable.size > 0) {
    calculateAllMetrics()
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

.metric-desc {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.info-icon {
  display: inline-block;
  margin-left: 6px;
  color: #6b7280;
  font-size: 0.875rem;
  cursor: help;
  transition: color 0.2s ease;
  vertical-align: middle;
}

.info-icon:hover {
  color: #374151;
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
  .controls {
    justify-content: center;
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

/* 自定義工具提示樣式 */
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
  line-height: 1.5;
}

.tooltip-content {
  display: block;
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
