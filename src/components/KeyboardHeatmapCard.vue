<template>
  <div class="keyboard-heatmap">
    <div class="card-header">
      <div class="header-content">
        <div class="header-text">
          <h3 class="card-title">鍵位熱力圖</h3>
          <p class="card-description">基於全碼加選重按鍵表分析鍵位分布和使用頻率，可視化展示鍵位負擔。</p>
        </div>
        <button @click="toggleCollapsed" class="collapse-button">
          <svg :class="{ 'rotated': isCollapsed }" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </button>
      </div>
    </div>
    
    <div v-show="!isCollapsed" class="card-content">
    <!-- 分析状态 -->
    <div v-if="!analysisReady" class="analysis-placeholder">
      <div class="placeholder-icon">⌨️</div>
      <p class="placeholder-title">等待码表上传</p>
      <p class="placeholder-subtitle">上传码表后将显示键位热力图分析</p>
    </div>

    <!-- 热力图内容 -->
    <div v-else class="keyboard-heatmap-content">
      <!-- 键盘热力图 -->
      <div class="keyboard-wrapper" ref="keyboardWrapper">
        <div class="keyboard-layout" ref="keyboardLayout" :style="{ transform: `scale(${keyboardScale})` }">
          <!-- 数字行 -->
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

        <!-- 手指负担 -->
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
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import KeyButton from './KeyButton.vue'
import { useCollapse } from '../composables/useCollapse'
import { codeTableProcessingService } from '../services'
import type { CodeTable, KeyData, KeyInfo, AnalysisStats } from '../types/index'

interface Props {
  codeTable: CodeTable
  analysisReady: boolean
}

const props = defineProps<Props>()

// 折叠功能
const { isCollapsed, toggleCollapsed, collapse, expand, getCollapsedState } = useCollapse()

// 暴露折叠方法给父组件
defineExpose({
  collapse,
  expand,
  toggle: toggleCollapsed,
  getCollapsedState
})

// 字符频率数据
const charFrequency = ref<Record<string, number>>({})

// 载入字符频率数据
const loadCharFrequency = async () => {
  try {
    const response = await fetch('/data/charFrequencyZhihu.json')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    charFrequency.value = data
  } catch (error) {
    console.error('载入字符频率数据失败:', error)
  }
}

// 响应式数据
const displayMode = ref<'load'>('load') // 固定为按键频率模式
const keyboardScale = ref(1.0)

// 自适应缩放相关
const keyboardWrapper = ref<HTMLElement>()
const keyboardLayout = ref<HTMLElement>()

// 计算自适应缩放
const calculateAdaptiveScale = () => {
  if (!keyboardWrapper.value || !keyboardLayout.value) return
  
  const wrapperWidth = keyboardWrapper.value.clientWidth
  const layoutWidth = 800 // 键盘布局的基础宽度
  const scale = Math.min(1, (wrapperWidth - 32) / layoutWidth) // 减去padding
  
  keyboardScale.value = scale
}

// 窗口大小变化监听
const handleResize = () => {
  calculateAdaptiveScale()
}

// 生命周期钩子
onMounted(() => {
  loadCharFrequency()
  
  // 延迟计算缩放，确保DOM已渲染
  setTimeout(() => {
    calculateAdaptiveScale()
  }, 100)
  
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// 监听分析状态变化，重新计算缩放
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

// 获取处理后的码表（全码加选重按键表）
const processedCodeTable = computed(() => {
  if (!props.analysisReady) return new Map()
  
  const processedTables = codeTableProcessingService.getProcessedTables()
  if (!processedTables) return new Map()
  
  // 使用全码加选重按键表，注意下划线代表空格
  return processedTables.fullWithSelection
})

// 键盘布局定义
const numberRowKeys: KeyInfo[] = [
  { key: '`' }, { key: '1' }, { key: '2' }, { key: '3' }, { key: '4' }, { key: '5' },
  { key: '6' }, { key: '7' }, { key: '8' }, { key: '9' }, { key: '0' }, { key: '-' }, { key: '=' }
]

const firstRowKeys: KeyInfo[] = [
  { key: 'q' }, { key: 'w' }, { key: 'e' }, { key: 'r' }, { key: 't' },
  { key: 'y' }, { key: 'u' }, { key: 'i' }, { key: 'o' }, { key: 'p' }, { key: '[' }, { key: ']' }
]

const secondRowKeys: KeyInfo[] = [
  { key: 'a' }, { key: 's' }, { key: 'd' }, { key: 'f' }, { key: 'g' },
  { key: 'h' }, { key: 'j' }, { key: 'k' }, { key: 'l' }, { key: ';' }, { key: '\'' }
]

const thirdRowKeys: KeyInfo[] = [
  { key: 'z' }, { key: 'x' }, { key: 'c' }, { key: 'v' }, { key: 'b' },
  { key: 'n' }, { key: 'm' }, { key: ',' }, { key: '.' }, { key: '/' }
]

const spaceRowKeys: KeyInfo[] = [
  { key: 'space', label: 'Space', width: 'wide' }
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

// 计算最大键值（用于归一化）
const maxKeyValue = computed(() => {
  if (stats.value.keyDistribution.size === 0) return 1
  return Math.max(...Array.from(stats.value.keyDistribution.values()))
})

// 手指负担百分比
const fingerLoadPercentages = computed(() => {
  const percentages: Record<string, number> = {}
  const totalLoad = Array.from(stats.value.fingerLoad.values()).reduce((sum, load) => sum + load, 0)
  
  if (totalLoad > 0) {
    for (const [finger, load] of stats.value.fingerLoad.entries()) {
      percentages[finger] = (load / totalLoad) * 100
    }
  }
  
  return percentages
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

// 获取键位数据
const getKeyData = (key: string): KeyData => {
  const count = stats.value.keyDistribution.get(key.toLowerCase()) || 0
  // 计算總的加權按鍵使用量
  const totalWeightedKeyUsage = Array.from(stats.value.keyDistribution.values()).reduce((sum, val) => sum + val, 0)
  const frequency = totalWeightedKeyUsage > 0 ? count / totalWeightedKeyUsage : 0
  
  return {
    key: key.toLowerCase(),
    count,
    frequency,
    position: { x: 0, y: 0 } // 简化版本，不需要精确位置
  }
}
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

/* 键盘热力图内容 */
.keyboard-heatmap-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

/* 统计容器 */
.stats-container {
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
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

/* 模块容器 - 单列布局 */
.module-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  width: 100%;
}

/* 全局控制栏 */
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

/* 模块头部 */
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

/* 折叠/展开按钮 */
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

/* 模块内容 */
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
  padding: var(--spacing-md) 0;
  overflow: hidden; /* 防止出现滚动条 */
  width: 100%;
}

/* 键盘布局 */
.keyboard-layout {
  background-color: var(--color-bg-primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  transform-origin: center top;
  width: 800px; /* 固定基础宽度 */
  border: 1px solid var(--color-border-secondary);
  transition: transform 0.3s ease;
}

.keyboard-row {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-bottom: 8px;
}

.number-row {
  margin-left: 0;
}

.first-row {
  margin-left: 25px;
}

.second-row {
  margin-left: 40px;
}

.third-row {
  margin-left: 60px;
}

.space-row {
  margin-top: 8px;
}

/* 统计网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--spacing-md);
}

/* 统计部分样式 */
.stats-section {
  border-bottom: 1px solid var(--color-border);
  padding-bottom: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.stats-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
  border-left: 3px solid var(--color-primary);
  padding-left: var(--spacing-sm);
}

/* 统计项样式 */
.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
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
  font-size: 0.9rem;
  font-weight: 500;
}

.stat-value {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.95rem;
  text-align: right;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .keyboard-heatmap {
    padding: var(--spacing-md);
  }
  
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
  
  .keyboard-layout {
    padding: var(--spacing-md);
    min-width: 600px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-item {
    padding: var(--spacing-sm) var(--spacing-md);
  }
}

@media (max-width: 480px) {
  .keyboard-heatmap {
    padding: var(--spacing-sm);
  }
  
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
    display: none; /* 在小屏幕上只显示图标 */
  }
  
  .module-title {
    font-size: 1rem;
  }
  
  .keyboard-layout {
    min-width: 400px;
    padding: var(--spacing-sm);
  }
  
  .keyboard-row {
    gap: 2px;
    margin-bottom: 4px;
  }
}

/* 滚动条样式优化 */
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
</style>
