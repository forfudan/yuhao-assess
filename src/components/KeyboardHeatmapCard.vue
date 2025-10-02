<template>
  <div ref="cardRef" class="keyboard-heatmap">
    <div class="card-header">
      <div class="header-content">
        <div class="header-text">
          <h3 class="card-title">鍵位熱力</h3>
          <p class="card-description">基於單字全碼以及可能的選重鍵，分析各個按鍵的使用頻率，可視化展示手指負擔。</p>
        </div>
        <div class="header-buttons">
          <button @click="exportCard" class="export-btn" :disabled="!analysisReady || !processedCodeTable" title="导出图片">
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
    <!-- 分析狀態 -->
    <div v-if="!analysisReady" class="analysis-placeholder">
      <div class="placeholder-icon">⌨️</div>
      <p class="placeholder-title">等待碼表上傳</p>
      <p class="placeholder-subtitle">上傳碼表後將顯示鍵位熱力圖分析</p>
    </div>

    <!-- 熱力圖内容 -->
    <div v-else class="keyboard-heatmap-content">
      <!-- Tab 切換器 -->
      <div class="tabs-container">
        <div class="tab-list">
          <button 
            v-for="tab in tabs" 
            :key="tab.key"
            :class="['tab-button', { 'active': activeTab === tab.key }]"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
        
        <!-- 模擬標點使用頻率選項 -->
        <div class="punctuation-wrapper">
          <div class="punctuation-option">
            <label class="option-label">
              <input 
                type="checkbox" 
                v-model="simulatePunctuation"
                class="option-checkbox"
              />
              <span class="option-text">模擬標點使用頻率</span>
            </label>
          </div>
          <button 
            @click="showPunctuationHelp = true"
            class="help-button"
            title="點擊查看說明"
            type="button"
          >
            ?
          </button>
        </div>
      </div>

      <!-- 鍵盤熱力圖 -->
      <div class="keyboard-wrapper" ref="keyboardWrapper">
        <div class="keyboard-layout" ref="keyboardLayout" :style="{ transform: `scale(${keyboardScale})` }">
          <!-- 數字行 -->
          <div class="keyboard-row number-row">
            <KeyButton 
              v-for="key in numberRowKeys"
              :key="key.key"
              :keyData="getKeyData(key.key)"
              :displayMode="displayMode"
              :maxValue="maxKeyValue"
              :keyInfo="key"
            />
          </div>

          <!-- 第一行 -->
          <div class="keyboard-row first-row">
            <KeyButton 
              v-for="key in firstRowKeys"
              :key="key.key"
              :keyData="getKeyData(key.key)"
              :displayMode="displayMode"
              :maxValue="maxKeyValue"
              :keyInfo="key"
            />
          </div>

          <!-- 第二行 -->
          <div class="keyboard-row second-row">
            <KeyButton 
              v-for="key in secondRowKeys"
              :key="key.key"
              :keyData="getKeyData(key.key)"
              :displayMode="displayMode"
              :maxValue="maxKeyValue"
              :keyInfo="key"
            />
          </div>

          <!-- 第三行 -->
          <div class="keyboard-row third-row">
            <KeyButton 
              v-for="key in thirdRowKeys"
              :key="key.key"
              :keyData="getKeyData(key.key)"
              :displayMode="displayMode"
              :maxValue="maxKeyValue"
              :keyInfo="key"
            />
          </div>

          <!-- 空格鍵行 -->
          <div class="keyboard-row space-row">
            <KeyButton 
              v-for="key in spaceRowKeys"
              :key="key.key"
              :keyData="getKeyData(key.key)"
              :displayMode="displayMode"
              :maxValue="maxKeyValue"
              :keyInfo="key"
            />
          </div>
        </div>
      </div>

      <!-- 統計分析 -->
      <div class="stats-container">
        <h4 class="stats-title">統計分析</h4>
        
        <!-- 左右手平衡 -->
        <div class="stats-section">
          <h5 class="section-title">左右手平衡</h5>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">左手</span>
              <span class="stat-value">{{ handBalance.left.toFixed(1) }}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">右手</span>
              <span class="stat-value">{{ handBalance.right.toFixed(1) }}%</span>
            </div>
          </div>
        </div>

        <!-- 按排分布 -->
        <div class="stats-section">
          <h5 class="section-title">按排分布</h5>
          <div class="stats-grid">
            <div 
              v-for="(percentage, row) in rowDistributionPercentages" 
              :key="row"
              class="stat-item"
            >
              <span class="stat-label">{{ row }}</span>
              <span class="stat-value">{{ percentage.toFixed(1) }}%</span>
            </div>
          </div>
        </div>

        <!-- 手指負擔 -->
        <div class="stats-section">
          <h5 class="section-title">手指負擔</h5>
          <div class="stats-grid">
            <div 
              v-for="(load, finger) in fingerLoadPercentages" 
              :key="finger"
              class="stat-item"
            >
              <span class="stat-label">{{ finger }}</span>
              <span class="stat-value">{{ load.toFixed(1) }}%</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 方案名稱標註 -->
      <div v-if="codeTableName" class="scheme-name-annotation">
        <span>當前方案：{{ codeTableName }}</span>
      </div>
    </div>
    </div>
    
  </div>

  <!-- 標點模擬幫助信息框 - 使用 Teleport 傳送到 body -->
  <Teleport to="body">
    <div v-if="showPunctuationHelp" class="help-modal-overlay" @click="showPunctuationHelp = false">
      <div class="help-modal" @click.stop>
        <div class="help-header">
          <h4>模擬標點使用頻率說明</h4>
          <button @click="showPunctuationHelp = false" class="help-close-btn">×</button>
        </div>
        <div class="help-content">
          <p>根據現代漢語文本中標點符號約占 <strong>13%</strong> 的占比，結合碼長計算實際按鍵使用頻率。</p>
          <p><strong>分佈規則：</strong></p>
          <ul>
            <li><code>;</code> 鍵 → 分號、冒號（<strong>10%</strong>）</li>
            <li><code>,</code> 鍵 → 逗號、左書名號（<strong>40%</strong>）</li>
            <li><code>.</code> 鍵 → 句號、右書名號（<strong>40%</strong>）</li>
            <li><code>/</code> 鍵 → 問號（<strong>5%</strong>）</li>
            <li><code>'</code> 鍵 → 單引號、雙引號（<strong>5%</strong>）</li>
          </ul>
          <p><strong>說明：</strong></p>
          <p>啟用此選項後，將根據上述分佈規則模擬標點符號按鍵的實際使用頻率，並疊加到現有的按鍵使用統計中，使熱力圖更貼近實際打字情況。</p>
        </div>
        <div class="help-footer">
          <button @click="showPunctuationHelp = false" class="btn btn-primary">我知道了</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import KeyButton from './KeyButton.vue'
import { useCollapse } from '../composables/useCollapse'
import { codeTableProcessingService } from '../services'
import { ExportService } from '../services/exportService'
import type { CodeTable, KeyData, KeyInfo, AnalysisStats } from '../types/index'

interface Props {
  codeTable: CodeTable
  analysisReady: boolean
  codeTableName?: string
}

const props = defineProps<Props>()

// 折疊功能
const { isCollapsed, toggleCollapsed, collapse, expand, getCollapsedState } = useCollapse()

// 幫助模態框狀態
const showPunctuationHelp = ref(false)

// 卡片引用
const cardRef = ref<HTMLElement>()

// 導出功能
async function exportCard() {
  if (!cardRef.value || !props.analysisReady || !processedCodeTable.value) {
    console.warn('卡片元素或數據不可用')
    return
  }

  try {
    await ExportService.exportDualModeCard(cardRef.value, '鍵位熱力', props.codeTableName || '未命名方案', {
      copyToClipboard: ExportService.isClipboardSupported(),
      download: true,
      switchTabCallback: (mode: 'full' | 'short') => {
        // 切換標籤頁的回調函數
        activeTab.value = mode
        // 等待DOM更新
        return new Promise(resolve => {
          nextTick(() => {
            setTimeout(resolve, 100) // 額外等待100ms確保渲染完成
          })
        })
      }
    })
  } catch (error) {
    console.error('導出失敗:', error)
    alert('導出失敗，請重試')
  }
}

// 字符頻率數據
const charFrequency = ref<Record<string, number>>({})

// 載入字符頻率數據
const loadCharFrequency = async () => {
  try {
    const response = await fetch('/data/charFrequencyZhihu.json')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    charFrequency.value = data
  } catch (error) {
    console.error('載入字符頻率數據失敗:', error)
  }
}

// 響應式數據
const keyboardScale = ref(1.0)
const refreshTrigger = ref(0) // 用於強制刷新的觸發器

// Tab 切換相關
const activeTab = ref<'full' | 'short'>('full')
const tabs = [
  { key: 'full', label: '全碼數據' },
  { key: 'short', label: '出簡數據' }
] as const

// 模擬標點使用頻率選項（默認勾選）
const simulatePunctuation = ref(true)



// 標點符號按鍵映射（宇浩輸入法）
// 根據現代漢語標點使用統計
const punctuationKeys: Record<string, number> = {
  ';': 0.10,    // 分號、冒號：10%
  ',': 0.40,    // 逗號、左書名號：40%
  '.': 0.40,    // 句號、右書名號：40%
  '/': 0.05,    // 問號：5%
  '\'': 0.05   // 單引號、雙引號：5%
}

// 標點符號在文本中的占比（現代漢語統計數據）
const PUNCTUATION_CHAR_RATIO = 0.13 // 13%

// 根據當前tab計算displayMode
const displayMode = computed(() => {
  return activeTab.value === 'full' ? 'frequency' : 'load'
})

// 自適應縮放相關
const keyboardWrapper = ref<HTMLElement>()
const keyboardLayout = ref<HTMLElement>()

// 計算自適應縮放
const calculateAdaptiveScale = () => {
  if (!keyboardWrapper.value || !keyboardLayout.value) return
  
  const wrapperWidth = keyboardWrapper.value.clientWidth
  const layoutWidth = keyboardLayout.value.offsetWidth
  
  // 固定960px樣式：當容器寬度超過960px時，按960px計算縮放
  if (layoutWidth > 0) {
    const targetWidth = Math.min(wrapperWidth, 960) // 最大按960px計算
    
    // 根據屏幕寬度調整邊距策略
    let margin = 20 // 默認邊距
    if (targetWidth <= 600) {
      margin = 10 // 中等屏幕減少邊距
    }
    if (targetWidth <= 480) {
      margin = 5 // 小屏幕進一步減少邊距
    }
    
    const availableWidth = targetWidth - margin
    const scale = Math.min(1.5, availableWidth / layoutWidth) // 允許放大到1.5倍
    keyboardScale.value = Math.max(0.3, scale) // 降低最小縮放到0.3倍，允許更小
  } else {
    keyboardScale.value = 1.0
  }
}

// 窗口大小變化監聽
const handleResize = () => {
  calculateAdaptiveScale()
}

// 生命週期鈎子
onMounted(() => {
  loadCharFrequency()
  
  // 延遲計算縮放，確保DOM已渲染
  setTimeout(() => {
    calculateAdaptiveScale()
  }, 100)
  
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// 監聽分析狀態變化，重新計算縮放
watch(
  () => props.analysisReady,
  (newReady) => {
    if (newReady) {
      setTimeout(() => {
        calculateAdaptiveScale()
      }, 100)
    }
  }
)

// 獲取處理後的碼表（根據Tab切換全碼或簡碼）
const processedCodeTable = computed(() => {
  // 依賴refreshTrigger來強制刷新
  refreshTrigger.value
  
  if (!props.analysisReady) return new Map()
  
  const processedTables = codeTableProcessingService.getProcessedTables()
  if (!processedTables) return new Map()
  
  // 根據activeTab選擇不同的碼表
  const selectedTable = activeTab.value === 'full' 
    ? processedTables.fullWithSelection 
    : processedTables.shortWithSelection
  
  // 調試：輸出前100個末尾是下划線的編碼
  debugUnderscoreEndings(selectedTable)
  
  // 使用選定的碼表，注意下划線代表空格
  return selectedTable
})

// 調試函數：分析末尾是下划線的編碼
const debugUnderscoreEndings = (codeTable: CodeTable) => {
  const underscoreEndingCodes: string[] = []
  
  for (const [char, codes] of codeTable.entries()) {
    for (const code of codes) {
      if (code.endsWith('_')) {
        underscoreEndingCodes.push(`${char}: ${code}`)
      }
    }
  }
  
  // 刪除調試輸出，只保留isPrefix相關的追蹤
}

// 監聽碼表變化，確保切換方案時熱力圖會刷新
watch(
  () => props.codeTable,
  (newCodeTable) => {
    if (props.analysisReady && newCodeTable.size > 0) {
      // 觸發刷新
      refreshTrigger.value++
      
      // 重新計算縮放
      setTimeout(() => {
        calculateAdaptiveScale()
      }, 100)
    }
  },
  { deep: true }
)

// 鍵盤佈局定義
const numberRowKeys: KeyInfo[] = [
  { key: '1' }, { key: '2' }, { key: '3' }, { key: '4' }, { key: '5' },
  { key: '6' }, { key: '7' }, { key: '8' }, { key: '9' }, { key: '0' }
]

const firstRowKeys: KeyInfo[] = [
  { key: 'q' }, { key: 'w' }, { key: 'e' }, { key: 'r' }, { key: 't' },
  { key: 'y' }, { key: 'u' }, { key: 'i' }, { key: 'o' }, { key: 'p' }
]

const secondRowKeys: KeyInfo[] = [
  { key: 'a' }, { key: 's' }, { key: 'd' }, { key: 'f' }, { key: 'g' },
  { key: 'h' }, { key: 'j' }, { key: 'k' }, { key: 'l' }, { key: ';' }
]

const thirdRowKeys: KeyInfo[] = [
  { key: 'z' }, { key: 'x' }, { key: 'c' }, { key: 'v' }, { key: 'b' },
  { key: 'n' }, { key: 'm' }, { key: ',' }, { key: '.' }, { key: '/' }
]

const spaceRowKeys: KeyInfo[] = [
  { key: 'hidden-7', hidden: true }, // 左侧隐藏按键 1
  { key: 'hidden-8', hidden: true }, // 左侧隐藏按键 2
  { key: 'space', label: 'Space', width: 'extra-wide' }, // 空格键占6格
  { key: 'hidden-9', hidden: true },  // / 下方的隐藏按键
  { key: '\'' }  // 單引號鍵，在 / 下方
]

// 手指映射
const fingerMapping: Record<string, string> = {
  '1': '左小指', 'q': '左小指', 'a': '左小指', 'z': '左小指',
  '2': '左无名指', 'w': '左无名指', 's': '左无名指', 'x': '左无名指',
  '3': '左中指', 'e': '左中指', 'd': '左中指', 'c': '左中指',
  '4': '左食指', '5': '左食指', 'r': '左食指', 't': '左食指', 'f': '左食指', 'g': '左食指', 'v': '左食指', 'b': '左食指',
  '6': '右食指', '7': '右食指', 'y': '右食指', 'u': '右食指', 'h': '右食指', 'j': '右食指', 'n': '右食指', 'm': '右食指',
  '8': '右中指', 'i': '右中指', 'k': '右中指', ',': '右中指',
  '9': '右无名指', 'o': '右无名指', 'l': '右无名指', '.': '右无名指',
  '0': '右小指', '-': '右小指', '=': '右小指', 'p': '右小指', '[': '右小指', ']': '右小指', ';': '右小指', '\'': '右小指', '/': '右小指',
  'space': '双拇指'
}

// 按排映射 - 五排分布
const rowMapping: Record<string, string> = {
  // 數字排
  '1': '數字排', '2': '數字排', '3': '數字排', '4': '數字排', '5': '數字排',
  '6': '數字排', '7': '數字排', '8': '數字排', '9': '數字排', '0': '數字排', '-': '數字排', '=': '數字排',
  // 上排（第一字母排）
  'q': '上排', 'w': '上排', 'e': '上排', 'r': '上排', 't': '上排',
  'y': '上排', 'u': '上排', 'i': '上排', 'o': '上排', 'p': '上排', '[': '上排', ']': '上排',
  // 中排（第二字母排/主排）
  'a': '中排', 's': '中排', 'd': '中排', 'f': '中排', 'g': '中排',
  'h': '中排', 'j': '中排', 'k': '中排', 'l': '中排', ';': '中排', '\'': '中排',
  // 下排（第三字母排）
  'z': '下排', 'x': '下排', 'c': '下排', 'v': '下排', 'b': '下排',
  'n': '下排', 'm': '下排', ',': '下排', '.': '下排', '/': '下排',
  // 空格排
  'space': '空格排'
}

// 計算統計数据
const stats = computed<AnalysisStats>(() => {
  if (!props.analysisReady || processedCodeTable.value.size === 0) {
    return {
      totalChars: 0,
      totalCodes: 0,
      avgCodeLength: 0,
      keyDistribution: new Map(),
      fingerLoad: new Map(),
      rowDistribution: new Map(),
      handBalance: { left: 0, right: 0 }
    }
  }

  const keyDistribution = new Map<string, number>()
  const fingerLoad = new Map<string, number>()
  const rowDistribution = new Map<string, number>()
  let totalCodes = 0
  let totalCodeLength = 0

  // 分析碼表 - 使用字频权重
  for (const [char, codes] of processedCodeTable.value.entries()) {
    // 获取字符频率权重，默认为1
    const charWeight = charFrequency.value[char] || 1
    
    for (const code of codes) {
      totalCodes++
      totalCodeLength += code.length

      // 統計每个按键的使用次数（应用字频权重）
      // 注意：这里需要特殊處理下划线，将其视为空格键
      for (const key of code.toLowerCase()) {
        const actualKey = key === '_' ? 'space' : key
        
        keyDistribution.set(actualKey, (keyDistribution.get(actualKey) || 0) + charWeight)
        
        // 統計手指负担
        const finger = fingerMapping[actualKey]
        if (finger) {
          fingerLoad.set(finger, (fingerLoad.get(finger) || 0) + charWeight)
        }
        
        // 統計按排分布
        const row = rowMapping[actualKey]
        if (row) {
          rowDistribution.set(row, (rowDistribution.get(row) || 0) + charWeight)
        }
      }
    }
  }

  // 計算左右手比例
  let leftHandCount = 0
  let rightHandCount = 0

  for (const [finger, count] of fingerLoad.entries()) {
    if (finger.startsWith('左')) {
      leftHandCount += count
    } else if (finger.startsWith('右')) {
      rightHandCount += count
    }
  }

  const totalHandCount = leftHandCount + rightHandCount
  const leftPercentage = totalHandCount > 0 ? (leftHandCount / totalHandCount) * 100 : 0
  const rightPercentage = totalHandCount > 0 ? (rightHandCount / totalHandCount) * 100 : 0

  return {
    totalChars: processedCodeTable.value.size,
    totalCodes,
    avgCodeLength: totalCodes > 0 ? totalCodeLength / totalCodes : 0,
    keyDistribution,
    fingerLoad,
    rowDistribution,
    handBalance: {
      left: leftPercentage,
      right: rightPercentage
    }
  }
})

// 不再需要計算最大鍵值，因為使用絕對頻率映射
// 保留這個計算屬性只是為了兼容 KeyButton 組件的 props
const maxKeyValue = computed(() => {
  return 1 // 占位符，不再實際使用
})

// 左右手平衡 - 考虑模擬標點
const handBalance = computed(() => {
  let leftHandCount = 0
  let rightHandCount = 0

  // 先計算原始的左右手負擔
  for (const [finger, count] of stats.value.fingerLoad.entries()) {
    if (finger.startsWith('左')) {
      leftHandCount += count
    } else if (finger.startsWith('右')) {
      rightHandCount += count
    }
  }

  // 如果模擬標點，需要加入標點按鍵的負擔
  if (simulatePunctuation.value && stats.value.avgCodeLength > 0) {
    const avgCodeLen = stats.value.avgCodeLength
    const punctuationRatio = PUNCTUATION_CHAR_RATIO
    const hanziRatio = 1 - punctuationRatio
    const punctuationKeyRatio = punctuationRatio / (punctuationRatio + hanziRatio * avgCodeLen)
    
    const totalLoad = leftHandCount + rightHandCount
    const punctuationLoad = totalLoad * punctuationKeyRatio / (1 - punctuationKeyRatio)
    
    // 為每個標點按鍵分配負擔
    for (const [key, ratio] of Object.entries(punctuationKeys)) {
      const keyLoad = punctuationLoad * ratio
      const finger = fingerMapping[key]
      if (finger) {
        if (finger.startsWith('左')) {
          leftHandCount += keyLoad
        } else if (finger.startsWith('右')) {
          rightHandCount += keyLoad
        }
      }
    }
  }

  const totalHandCount = leftHandCount + rightHandCount
  const leftPercentage = totalHandCount > 0 ? (leftHandCount / totalHandCount) * 100 : 0
  const rightPercentage = totalHandCount > 0 ? (rightHandCount / totalHandCount) * 100 : 0

  return {
    left: leftPercentage,
    right: rightPercentage
  }
})

// 手指負擔百分比 - 按照指定順序排列
const fingerLoadPercentages = computed(() => {
  const percentages: Record<string, number> = {}
  let totalLoad = Array.from(stats.value.fingerLoad.values()).reduce((sum, load) => sum + load, 0)
  
  // 如果模擬標點，需要加入標點按鍵的負擔
  if (simulatePunctuation.value && stats.value.avgCodeLength > 0) {
    const avgCodeLen = stats.value.avgCodeLength
    const punctuationRatio = PUNCTUATION_CHAR_RATIO
    const hanziRatio = 1 - punctuationRatio
    const punctuationKeyRatio = punctuationRatio / (punctuationRatio + hanziRatio * avgCodeLen)
    
    // 計算標點按鍵的總負擔（使用相同的單位）
    const punctuationLoad = totalLoad * punctuationKeyRatio / (1 - punctuationKeyRatio)
    
    // 為每個標點按鍵分配負擔
    for (const [key, ratio] of Object.entries(punctuationKeys)) {
      const keyLoad = punctuationLoad * ratio
      const finger = fingerMapping[key]
      if (finger) {
        const currentLoad = stats.value.fingerLoad.get(finger) || 0
        percentages[finger] = ((currentLoad + keyLoad) / (totalLoad + punctuationLoad)) * 100
      }
    }
    
    // 更新總負擔
    totalLoad += punctuationLoad
    
    // 計算其他手指的百分比
    for (const [finger, load] of stats.value.fingerLoad.entries()) {
      if (!percentages[finger]) {
        percentages[finger] = (load / totalLoad) * 100
      }
    }
  } else {
    // 不模擬標點，使用原始計算
    if (totalLoad > 0) {
      for (const [finger, load] of stats.value.fingerLoad.entries()) {
        percentages[finger] = (load / totalLoad) * 100
      }
    }
  }
  
  // 按照指定順序排列手指
  const fingerOrder = [
    '左小指', '左无名指', '左中指', '左食指', 
    '双拇指', 
    '右食指', '右中指', '右无名指', '右小指'
  ]
  
  const orderedPercentages: Record<string, number> = {}
  fingerOrder.forEach(finger => {
    if (percentages[finger] !== undefined) {
      orderedPercentages[finger] = percentages[finger]
    }
  })
  
  return orderedPercentages
})

// 按排分布百分比
const rowDistributionPercentages = computed(() => {
  const percentages: Record<string, number> = {}
  let totalKeys = Array.from(stats.value.rowDistribution.values()).reduce((sum, count) => sum + count, 0)
  
  // 如果模擬標點，需要加入標點按鍵的分布
  if (simulatePunctuation.value && stats.value.avgCodeLength > 0) {
    const avgCodeLen = stats.value.avgCodeLength
    const punctuationRatio = PUNCTUATION_CHAR_RATIO
    const hanziRatio = 1 - punctuationRatio
    const punctuationKeyRatio = punctuationRatio / (punctuationRatio + hanziRatio * avgCodeLen)
    
    // 計算標點按鍵的總數量
    const punctuationKeyCount = totalKeys * punctuationKeyRatio / (1 - punctuationKeyRatio)
    
    // 為每個標點按鍵分配到對應的排
    for (const [key, ratio] of Object.entries(punctuationKeys)) {
      const keyCount = punctuationKeyCount * ratio
      const row = rowMapping[key]
      if (row) {
        const currentCount = stats.value.rowDistribution.get(row) || 0
        percentages[row] = ((currentCount + keyCount) / (totalKeys + punctuationKeyCount)) * 100
      }
    }
    
    // 更新總數量
    totalKeys += punctuationKeyCount
    
    // 計算其他排的百分比
    for (const [row, count] of stats.value.rowDistribution.entries()) {
      if (!percentages[row]) {
        percentages[row] = (count / totalKeys) * 100
      }
    }
  } else {
    // 不模擬標點，使用原始計算
    if (totalKeys > 0) {
      for (const [row, count] of stats.value.rowDistribution.entries()) {
        percentages[row] = (count / totalKeys) * 100
      }
    }
  }
  
  return percentages
})

// Tooltip 功能
// 獲取鍵位數據
const getKeyData = (key: string): KeyData => {
  const keyLower = key.toLowerCase()
  let count = stats.value.keyDistribution.get(keyLower) || 0
  let frequency = 0
  
  if (simulatePunctuation.value && stats.value.avgCodeLength > 0) {
    // 模擬標點使用頻率
    // 計算標點符號的實際按鍵占比
    // 公式：標點比例 = 標點數量 / (標點數量 + 漢字數量 × 平均碼長)
    const avgCodeLen = stats.value.avgCodeLength
    const punctuationRatio = PUNCTUATION_CHAR_RATIO
    const hanziRatio = 1 - punctuationRatio
    const punctuationKeyRatio = punctuationRatio / (punctuationRatio + hanziRatio * avgCodeLen)
    
    // 獲取當前按鍵的原始頻率（來自碼表）
    const totalWeightedKeyUsage = Array.from(stats.value.keyDistribution.values()).reduce((sum, val) => sum + val, 0)
    const rawFrequency = totalWeightedKeyUsage > 0 ? count / totalWeightedKeyUsage : 0
    
    // 計算壓縮後的原始頻率（為標點騰出空間）
    const remainingRatio = 1 - punctuationKeyRatio
    const compressedRawFrequency = rawFrequency * remainingRatio
    
    // 如果是標點按鍵，疊加標點頻率到原有頻率上
    if (punctuationKeys[keyLower]) {
      const punctuationFrequency = punctuationKeyRatio * punctuationKeys[keyLower]
      // 最終頻率 = 壓縮後的原始頻率 + 標點頻率（疊加而非覆蓋）
      frequency = compressedRawFrequency + punctuationFrequency
      // 更新 count 以反映疊加後的頻率
      count = Math.round(totalWeightedKeyUsage * frequency / remainingRatio)
    } else {
      // 其他按鍵使用壓縮後的頻率
      frequency = compressedRawFrequency
    }
  } else {
    // 不模擬標點，使用原始計算方式
    const totalWeightedKeyUsage = Array.from(stats.value.keyDistribution.values()).reduce((sum, val) => sum + val, 0)
    frequency = totalWeightedKeyUsage > 0 ? count / totalWeightedKeyUsage : 0
  }
  
  return {
    key: keyLower,
    count,
    frequency,
    position: { x: 0, y: 0 } // 簡化版本，不需要精確位置
  }
}
// 暴露方法給父組件（包括標籤頁控制）
defineExpose({
  collapse,
  expand,
  toggle: toggleCollapsed,
  getCollapsedState,
  activeTab,
  setActiveTab: (tab: 'full' | 'short') => {
    activeTab.value = tab
  }
})
</script>

<style scoped>
/* 標點符號選項樣式 */
.punctuation-wrapper {
  margin-top: var(--spacing-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.punctuation-option {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-secondary);
  width: fit-content;
}

.option-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  user-select: none;
}

.option-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.option-text {
  font-size: 0.9rem;
  color: var(--color-text-primary);
  font-weight: 500;
}

.help-button {
  width: 28px;
  height: 28px;
  border: 1px solid var(--color-border-secondary);
  border-radius: 50%;
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.help-button:hover {
  background: var(--color-bg-secondary);
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: scale(1.05);
}

/* 幫助信息框樣式 */
.help-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999999;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease-out;
}

.help-modal {
  background: var(--color-bg-primary);
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
}

.help-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--color-border-primary);
}

.help-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.help-close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.help-close-btn:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.help-content {
  padding: 20px 24px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  overflow-y: auto;
  max-height: 50vh;
}

.help-content p {
  margin: 0 0 12px 0;
  color: var(--color-text-primary);
}

.help-content ul {
  margin: 8px 0 16px 20px;
  padding: 0;
}

.help-content li {
  margin-bottom: 8px;
  color: var(--color-text-primary);
}

.help-content strong {
  color: var(--color-primary);
  font-weight: 600;
}

.help-content code {
  background: var(--color-bg-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.9em;
  color: var(--color-primary);
}

.help-footer {
  padding: 16px 24px 20px;
  border-top: 1px solid var(--color-border-primary);
  display: flex;
  justify-content: flex-end;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Custom Tooltip Styles */
.custom-tooltip {
  position: fixed;
  z-index: 10000;
  padding: 12px 16px;
  background-color: rgba(0, 0, 0, 0.9);
  color: white;
  border-radius: 8px;
  font-size: 0.85rem;
  line-height: 1.6;
  max-width: 350px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  pointer-events: none;
  white-space: pre-line;
  word-wrap: break-word;
}

.custom-tooltip::before {
  content: '';
  position: absolute;
  top: 100%;
  left: 20px;
  border: 6px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.9);
}

/* 卡片頭部佈局 */
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
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

/* 折疊按鈕樣式 */
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

/* 分析占位符 */
.analysis-placeholder {
  text-align: center;
  padding: var(--spacing-xxl);
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  color: var(--color-text-secondary);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.placeholder-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
  opacity: 0.6;
}

.placeholder-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
}

.placeholder-subtitle {
  font-size: 1rem;
  opacity: 0.8;
}

/* 鍵盤熱力圖内容 */
.keyboard-heatmap-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm); /* 從xl改爲sm，大幅減少組件間間距 */
}

/* 統計容器 */
.stats-container {
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md); /* 減少padding提高密度 */
  border: 1px solid var(--color-border-primary);
}

.stats-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-lg) 0;
  border-bottom: 2px solid var(--color-primary);
  padding-bottom: var(--spacing-sm);
}

/* 模塊容器 - 單列佈局 */
.module-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  width: 100%;
}

/* 全局控制欄 */
.global-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--color-border-primary);
  margin-bottom: var(--spacing-md);
}

.controls-left {
  flex: 1;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.controls-right {
  flex-shrink: 0;
}

.global-toggle-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.global-toggle-btn:hover {
  background-color: var(--color-primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.global-toggle-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-icon {
  font-size: 1rem;
}

.btn-text {
  font-size: 0.9rem;
}

/* 统一的模块卡片样式 */
.module-card {
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--color-border-primary);
  overflow: hidden;
  transition: all 0.3s ease;
  width: 100%;
}

.module-card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

/* 模塊頭部 */
.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  background-color: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border-primary);
}

.module-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

/* 折疊/展開按鈕 */
.toggle-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  min-height: 32px;
}

.toggle-button:hover {
  background-color: var(--color-bg-secondary);
}

.toggle-icon {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  transition: transform 0.3s ease;
  transform-origin: center;
}

.toggle-icon.collapsed {
  transform: rotate(-90deg);
}

/* 模塊内容 */
.module-content {
  padding: var(--spacing-lg);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 键盘包装器 */
.keyboard-wrapper {
  display: flex;
  justify-content: center;
  padding: var(--spacing-xs) 0; /* 從md改爲xs，減少上下内邊距 */
  overflow: hidden; /* 防止出現滚動條 */
  width: 100%;
  height: 100%; /* 佔滿容器高度 */
  flex-direction: column; /* 垂直佈局 */
}

/* 大屏幕寬度限制 */
@media (min-width: 1200px) {
  .keyboard-wrapper {
    max-width: 80%; /* 限制爲容器的80%宽度 */
    margin: 0 auto; /* 居中顯示 */
    padding: var(--spacing-sm) 0; /* 減少垂直padding，從lg改爲sm */
  }
}

/* 键盘布局 */
.keyboard-layout {
  background-color: var(--color-bg-primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  transform-origin: center top;
  width: 100%; /* 容器寬度百分比 */
  height: 100%; /* 容器高度百分比 */
  max-width: none; /* 最大寬度限制 */
  max-height: none; /* 最大高度限制 */
  min-width: 280px; /* 減小最小寬度，允許在更窄屏幕上縮小 */
  border: 1px solid var(--color-border-secondary);
  transition: transform 0.3s ease;
  margin: auto;
  display: grid;
  grid-template-rows: repeat(5, 1fr); /* 5行，每行等高 */
  gap: 8px;
  place-items: center;
}

.keyboard-row {
  display: grid;
  grid-template-columns: repeat(10, 1fr); /* 10列，每列等宽 */
  gap: 4px;
  width: 100%;
  height: 100%;
  align-items: stretch;
}

.space-row {
  margin-top: 0; /* 移除上邊距，因爲grid已經處理間距 */
}

/* 統計網格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); /* 減小最小寬度提高密度 */
  gap: var(--spacing-xs); /* 減小間距 */
}

/* 統計部分樣式 */
.stats-section {
  border-bottom: 1px solid var(--color-border);
  padding-bottom: var(--spacing-sm); /* 減少底部padding */
  margin-bottom: var(--spacing-sm); /* 減少底部margin */
}

.stats-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-title {
  font-size: 0.9rem; /* 減小標題字體 */
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs); /* 減少底部margin */
  border-left: 3px solid var(--color-primary);
  padding-left: var(--spacing-sm);
}

/* 統計項樣式 */
.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-sm); /* 減少padding */
  background-color: var(--color-bg-primary);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-secondary);
  transition: all 0.2s ease;
}

.stat-item:hover {
  background-color: var(--color-bg-secondary);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-label {
  color: var(--color-text-secondary);
  font-size: 0.8rem; /* 減小字體 */
  font-weight: 500;
}

.stat-value {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.85rem; /* 減小字體 */
  text-align: right;
}

/* 大屏幕優化 */
@media (min-width: 1200px) {
  .keyboard-layout {
    width: 100%; /* 在wrapper限制下佔滿寬度 */
    max-width: none; /* 移除最大寬度限制 */
  }
}

/* 中等屏幕優化（600px左右） */
@media (max-width: 768px) and (min-width: 481px) {
  .keyboard-wrapper {
    padding: var(--spacing-xs) 0; /* 進一步減少包裝器padding */
  }
  
  .keyboard-layout {
    padding: var(--spacing-sm); /* 減少内邊距 */
    width: 100% !important;
    min-width: unset !important;
    max-width: 100%;
  }
}

/* 響應式設計 */
@media (max-width: 768px) {
  .module-container {
    gap: var(--spacing-md);
  }
  
  .global-controls {
    padding: var(--spacing-md);
    flex-direction: column;
    gap: var(--spacing-md);
    text-align: center;
  }
  
  .page-title {
    font-size: 1.3rem;
  }
  
  .module-header {
    padding: var(--spacing-md);
  }
  
  .module-content {
    padding: var(--spacing-md);
  }
  
  .module-title {
    font-size: 1.1rem;
  }
  
  .keyboard-wrapper {
    padding: var(--spacing-sm) 0; /* 減少包裝器的padding */
  }
  
  .keyboard-layout {
    padding: var(--spacing-md);
    width: 99% !important; /* 在平板上使用更多寬度，從98%改爲99% */
    min-width: unset !important;
    max-width: 100%;
  }
  
  .stats-container {
    padding: var(--spacing-md); /* 減少統計容器的padding */
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-item {
    padding: var(--spacing-sm) var(--spacing-md);
  }
}

@media (max-width: 480px) {
  .global-controls {
    padding: var(--spacing-sm);
  }
  
  .page-title {
    font-size: 1.2rem;
  }
  
  .global-toggle-btn {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: 0.8rem;
  }
  
  .btn-text {
    display: none; /* 在小屏幕上只顯示圖標 */
  }
  
  .module-title {
    font-size: 1rem;
  }
  
  /* 移動端Tab間距進一步縮減 */
  .tabs-container {
    margin-bottom: 2px; /* 極小間距，從xs進一步減少 */
  }
  
  .tab-list {
    margin-bottom: 2px; /* 保持極小間距 */
  }
  
  .keyboard-wrapper {
    padding: 0; /* 移除包裝器padding */
    margin: 0 calc(-1 * var(--spacing-md)); /* 負邊距來抵消card-content的padding */
  }
  
  .keyboard-layout {
    width: 100% !important;
    min-width: 250px !important; /* 進一步減小最小寬度 */
    max-width: 100%;
    padding: var(--spacing-xs); /* 減少内邊距 */
    border-radius: 0; /* 移除圓角以避免在邊緣的視覺問題 */
    border-left: none;
    border-right: none;
  }
  
  .stats-container {
    padding: var(--spacing-sm);
  }
  
  .keyboard-row {
    gap: 1px; /* 進一步減小按鍵間距 */
    margin-bottom: 2px; /* 減小行間距 */
  }
}

/* 滚動條樣式優化 */
.keyboard-wrapper::-webkit-scrollbar {
  height: 6px;
}

.keyboard-wrapper::-webkit-scrollbar-track {
  background: var(--color-bg-secondary);
  border-radius: 3px;
}

.keyboard-wrapper::-webkit-scrollbar-thumb {
  background: var(--color-border-primary);
  border-radius: 3px;
}

.keyboard-wrapper::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-secondary);
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

[data-theme="dark"] .scheme-name {
  background: var(--color-bg-secondary);
}

[data-theme="dark"] .scheme-name span {
  color: var(--color-text-secondary);
}
</style>
