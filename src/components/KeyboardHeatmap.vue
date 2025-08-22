<template>
  <div class="keyboard-heatmap">
    <!-- 分析状态 -->
    <div v-if="!analysisReady" class="analysis-placeholder">
      <div class="placeholder-icon">⌨️</div>
      <p class="placeholder-title">等待码表上传</p>
      <p class="placeholder-subtitle">上传码表后将显示键位热力图分析</p>
    </div>

    <!-- 热力图内容 -->
    <div v-else class="heatmap-content">
      <!-- 统计信息 -->
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-label">总字符</span>
          <span class="stat-value">{{ stats.totalChars.toLocaleString() }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">平均码长</span>
          <span class="stat-value">{{ stats.avgCodeLength.toFixed(2) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">左右手比例</span>
          <span class="stat-value">{{ stats.handBalance.left.toFixed(1) }}% : {{ stats.handBalance.right.toFixed(1) }}%</span>
        </div>
      </div>

      <!-- 热力图选项 -->
      <div class="heatmap-options">
        <div class="option-group">
          <label class="option-label">显示模式：</label>
          <select v-model="displayMode" class="option-select">
            <option value="frequency">按鍵頻數</option>
            <option value="load">按鍵頻率</option>
            <option value="finger">手指分工</option>
          </select>
        </div>
      </div>

      <!-- 键盘布局 -->
      <div class="keyboard-layout" :style="{ transform: `scale(${keyboardScale})` }">
        <!-- 数字行 -->
        <div class="keyboard-row number-row">
          <KeyButton 
            v-for="key in numberRowKeys"
            :key="key.key"
            :keyData="getKeyData(key.key)"
            :displayMode="displayMode"
            :maxValue="maxKeyValue"
            :keyInfo="key"
            @key-hover="handleKeyHover"
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
            @key-hover="handleKeyHover"
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
            @key-hover="handleKeyHover"
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
            @key-hover="handleKeyHover"
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
            @key-hover="handleKeyHover"
          />
        </div>
      </div>

      <!-- 键位详情 -->
      <div v-if="hoveredKey" class="key-details">
        <h4 class="details-title">键位详情</h4>
        <div class="details-content">
          <div class="detail-item">
            <span class="detail-label">按键：</span>
            <span class="detail-value key-highlight">{{ hoveredKey.key.toUpperCase() }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">使用次数：</span>
            <span class="detail-value">{{ hoveredKey.count.toLocaleString() }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">使用频率：</span>
            <span class="detail-value">{{ (hoveredKey.frequency * 100).toFixed(2) }}%</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">手指分工：</span>
            <span class="detail-value">{{ getFingerName(hoveredKey.key) }}</span>
          </div>
        </div>
      </div>

      <!-- 手指负担统计 -->
      <div v-if="displayMode === 'finger'" class="finger-stats">
        <h4 class="finger-stats-title">手指负担分布</h4>
        <div class="finger-stats-grid">
          <div 
            v-for="(load, finger) in fingerLoadPercentages" 
            :key="finger"
            class="finger-stat-item"
          >
            <span class="finger-name">{{ finger }}</span>
            <span class="finger-percentage">{{ load.toFixed(1) }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import KeyButton from './KeyButton.vue'
import type { CodeTable, KeyData, KeyInfo, AnalysisStats } from '../types/index'

interface Props {
  codeTable: CodeTable
  analysisReady: boolean
}

const props = defineProps<Props>()

// 响应式数据
const displayMode = ref<'frequency' | 'load' | 'finger'>('load') // 默认改为负担分析模式
const keyboardScale = ref(0.8)
const hoveredKey = ref<KeyData | null>(null)

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

// 手指分工映射
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

// 计算统计数据
const stats = computed<AnalysisStats>(() => {
  if (!props.analysisReady || props.codeTable.size === 0) {
    return {
      totalChars: 0,
      totalCodes: 0,
      avgCodeLength: 0,
      keyDistribution: new Map(),
      fingerLoad: new Map(),
      handBalance: { left: 0, right: 0 }
    }
  }

  const keyDistribution = new Map<string, number>()
  const fingerLoad = new Map<string, number>()
  let totalCodes = 0
  let totalCodeLength = 0

  // 分析码表
  for (const [char, codes] of props.codeTable.entries()) {
    for (const code of codes) {
      totalCodes++
      totalCodeLength += code.length

      // 统计每个按键的使用次数
      for (const key of code.toLowerCase()) {
        keyDistribution.set(key, (keyDistribution.get(key) || 0) + 1)
        
        // 统计手指负担
        const finger = fingerMapping[key]
        if (finger) {
          fingerLoad.set(finger, (fingerLoad.get(finger) || 0) + 1)
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
    totalChars: props.codeTable.size,
    totalCodes,
    avgCodeLength: totalCodes > 0 ? totalCodeLength / totalCodes : 0,
    keyDistribution,
    fingerLoad,
    handBalance: {
      left: leftPercentage,
      right: rightPercentage
    }
  }
})

// 计算最大键值（用于归一化）
const maxKeyValue = computed(() => {
  if (displayMode.value === 'finger') {
    // 手指分工模式：使用最大手指负担值
    if (stats.value.fingerLoad.size === 0) return 1
    return Math.max(...Array.from(stats.value.fingerLoad.values()))
  } else {
    // 其他模式：使用最大按键使用次数
    if (stats.value.keyDistribution.size === 0) return 1
    return Math.max(...Array.from(stats.value.keyDistribution.values()))
  }
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

// 获取键位数据
const getKeyData = (key: string): KeyData => {
  const count = stats.value.keyDistribution.get(key.toLowerCase()) || 0
  const frequency = stats.value.totalCodes > 0 ? count / stats.value.totalCodes : 0
  
  // 对于手指分工模式，我们需要计算该按键所属手指的总负担
  let fingerLoad = 0
  if (displayMode.value === 'finger') {
    const finger = fingerMapping[key.toLowerCase()]
    if (finger && stats.value.fingerLoad.has(finger)) {
      fingerLoad = stats.value.fingerLoad.get(finger) || 0
    }
  }
  
  return {
    key: key.toLowerCase(),
    count: displayMode.value === 'finger' ? fingerLoad : count,
    frequency,
    position: { x: 0, y: 0 } // 简化版本，不需要精确位置
  }
}

// 获取手指名称
const getFingerName = (key: string): string => {
  return fingerMapping[key.toLowerCase()] || '未知'
}

// 处理键位悬停
const handleKeyHover = (keyData: KeyData | null) => {
  hoveredKey.value = keyData
}

// 监听窗口大小变化，调整键盘缩放
const updateKeyboardScale = () => {
  const container = document.querySelector('.keyboard-heatmap')
  if (container) {
    const containerWidth = container.clientWidth
    const keyboardWidth = 600 // 键盘的基础宽度
    keyboardScale.value = Math.min(1, (containerWidth - 40) / keyboardWidth)
  }
}

// 组件挂载时设置缩放
watch(() => props.analysisReady, () => {
  if (props.analysisReady) {
    setTimeout(updateKeyboardScale, 100)
  }
})
</script>

<style scoped>
.keyboard-heatmap {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* 分析占位符 */
.analysis-placeholder {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--color-text-secondary);
}

.placeholder-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
}

.placeholder-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
}

.placeholder-subtitle {
  font-size: 0.875rem;
}

/* 热力图内容 */
.heatmap-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* 统计信息栏 */
.stats-bar {
  display: flex;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

/* 热力图选项 */
.heatmap-options {
  display: flex;
  gap: var(--spacing-xl);
  align-items: center;
  flex-wrap: wrap;
}

.option-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.option-label {
  font-weight: 500;
  color: var(--color-text-primary);
}

.option-select {
  padding: var(--spacing-sm);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-primary);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
}

.option-range {
  width: 100px;
}

.range-value {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  min-width: 40px;
}

/* 键盘布局 */
.keyboard-layout {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  padding: var(--spacing-lg);
  background-color: var(--heatmap-bg);
  border-radius: var(--radius-lg);
  transform-origin: center top;
  transition: transform var(--transition-base);
  border: 1px solid var(--heatmap-key-border);
}

.keyboard-row {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.second-row {
  margin-left: 20px;
}

.third-row {
  margin-left: 40px;
}

.space-row {
  margin-top: 8px;
}

/* 键位详情 */
.key-details {
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
}

.details-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.details-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  color: var(--color-text-secondary);
}

.detail-value {
  font-weight: 500;
  color: var(--color-text-primary);
}

.key-highlight {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
}

/* 手指负担统计 */
.finger-stats {
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  margin-top: var(--spacing-lg);
}

.finger-stats-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.finger-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--spacing-md);
}

.finger-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm);
  background-color: var(--color-bg-primary);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-primary);
}

.finger-name {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.finger-percentage {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.95rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-bar {
    justify-content: center;
  }
  
  .heatmap-options {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-md);
  }
  
  .option-group {
    justify-content: space-between;
  }
  
  .keyboard-layout {
    padding: var(--spacing-md);
  }
  
  .details-content {
    grid-template-columns: 1fr;
  }
  
  .finger-stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
