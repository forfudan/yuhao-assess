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

      <!-- 统计分析 -->
      <div class="stats-container">
        <h4 class="stats-title">統計分析</h4>
        
        <!-- 左右手平衡 -->
        <div class="stats-section">
          <h5 class="section-title">左右手平衡</h5>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">左手</span>
              <span class="stat-value">{{ stats.handBalance.left.toFixed(1) }}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">右手</span>
              <span class="stat-value">{{ stats.handBalance.right.toFixed(1) }}%</span>
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

// 暴露折疊方法給父組件
defineExpose({
  collapse,
  expand,
  toggle: toggleCollapsed,
  getCollapsedState
})

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
  
  // 删除調試輸出，只保留isPrefix相關的追蹤
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
  { key: '`' }, { key: '1' }, { key: '2' }, { key: '3' }, { key: '4' }, { key: '5' },
  { key: '6' }, { key: '7' }, { key: '8' }, { key: '9' }, { key: '0' }
]

const firstRowKeys: KeyInfo[] = [
  { key: 'q' }, { key: 'w' }, { key: 'e' }, { key: 'r' }, { key: 't' },
  { key: 'y' }, { key: 'u' }, { key: 'i' }, { key: 'o' }, { key: 'p' },
  { key: 'hidden-bracket', hidden: true }
]

const secondRowKeys: KeyInfo[] = [
  { key: 'a' }, { key: 's' }, { key: 'd' }, { key: 'f' }, { key: 'g' },
  { key: 'h' }, { key: 'j' }, { key: 'k' }, { key: 'l' }, { key: ';' }, { key: '\'' }
]

const thirdRowKeys: KeyInfo[] = [
  { key: 'z' }, { key: 'x' }, { key: 'c' }, { key: 'v' }, { key: 'b' },
  { key: 'n' }, { key: 'm' }, { key: ',' }, { key: '.' }, { key: '/' },
  { key: 'hidden-4', hidden: true }
]

const spaceRowKeys: KeyInfo[] = [
  { key: 'hidden-7', hidden: true }, // 左侧隐藏按键 1
  { key: 'hidden-8', hidden: true }, // 左侧隐藏按键 2
  { key: 'space', label: 'Space', width: 'extra-wide' }, // 空格键占6格
  { key: 'hidden-9', hidden: true },  // 右侧隐藏按键 1
  { key: 'hidden-10', hidden: true }  // 右侧隐藏按键 2
]

// 手指映射
const fingerMapping: Record<string, string> = {
  '`': '左小指', '1': '左小指', 'q': '左小指', 'a': '左小指', 'z': '左小指',
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
  // 数字排
  '`': '数字排', '1': '数字排', '2': '数字排', '3': '数字排', '4': '数字排', '5': '数字排',
  '6': '数字排', '7': '数字排', '8': '数字排', '9': '数字排', '0': '数字排', '-': '数字排', '=': '数字排',
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

// 计算统计数据
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

  // 分析码表 - 使用字频权重
  for (const [char, codes] of processedCodeTable.value.entries()) {
    // 获取字符频率权重，默认为1
    const charWeight = charFrequency.value[char] || 1
    
    for (const code of codes) {
      totalCodes++
      totalCodeLength += code.length

      // 统计每个按键的使用次数（应用字频权重）
      // 注意：这里需要特殊处理下划线，将其视为空格键
      for (const key of code.toLowerCase()) {
        const actualKey = key === '_' ? 'space' : key
        
        keyDistribution.set(actualKey, (keyDistribution.get(actualKey) || 0) + charWeight)
        
        // 统计手指负担
        const finger = fingerMapping[actualKey]
        if (finger) {
          fingerLoad.set(finger, (fingerLoad.get(finger) || 0) + charWeight)
        }
        
        // 统计按排分布
        const row = rowMapping[actualKey]
        if (row) {
          rowDistribution.set(row, (rowDistribution.get(row) || 0) + charWeight)
        }
      }
    }
  }

  // 计算左右手比例
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

// 計算最大鍵值（用于歸一化）
const maxKeyValue = computed(() => {
  if (stats.value.keyDistribution.size === 0) return 1
  return Math.max(...Array.from(stats.value.keyDistribution.values()))
})

// 手指負擔百分比 - 按照指定順序排列
const fingerLoadPercentages = computed(() => {
  const percentages: Record<string, number> = {}
  const totalLoad = Array.from(stats.value.fingerLoad.values()).reduce((sum, load) => sum + load, 0)
  
  if (totalLoad > 0) {
    for (const [finger, load] of stats.value.fingerLoad.entries()) {
      percentages[finger] = (load / totalLoad) * 100
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
  const totalKeys = Array.from(stats.value.rowDistribution.values()).reduce((sum, count) => sum + count, 0)
  
  if (totalKeys > 0) {
    for (const [row, count] of stats.value.rowDistribution.entries()) {
      percentages[row] = (count / totalKeys) * 100
    }
  }
  
  return percentages
})

// 獲取鍵位數據
const getKeyData = (key: string): KeyData => {
  const count = stats.value.keyDistribution.get(key.toLowerCase()) || 0
  // 計算總的加權按鍵使用量
  const totalWeightedKeyUsage = Array.from(stats.value.keyDistribution.values()).reduce((sum, val) => sum + val, 0)
  const frequency = totalWeightedKeyUsage > 0 ? count / totalWeightedKeyUsage : 0
  
  return {
    key: key.toLowerCase(),
    count,
    frequency,
    position: { x: 0, y: 0 } // 簡化版本，不需要精確位置
  }
}
</script>

<style scoped>
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
  grid-template-columns: repeat(11, 1fr); /* 11列，每列等寬 */
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
