<template>
  <div 
    class="key-button"
    :class="[
      `key-${keyInfo.key}`,
      `mode-${displayMode}`,
      { 'key-active': isActive }
    ]"
    :style="keyStyle"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="key-content">
      <div class="key-label">{{ keyInfo.label || keyInfo.key.toUpperCase() }}</div>
      <div v-if="showValue" class="key-value">
        {{ displayValue }}
      </div>
    </div>
    
    <!-- 热力图覆盖层 -->
    <div 
      class="key-heatmap-overlay"
      :style="heatmapStyle"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { KeyData, KeyInfo } from '../types/index'

interface Props {
  keyData: KeyData
  keyInfo: KeyInfo
  displayMode: 'load'
  maxValue: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  keyHover: [keyData: KeyData | null]
}>()

const isActive = ref(false)

// 显示的值
const displayValue = computed(() => {
  return props.keyData.count > 0 ? `${(props.keyData.frequency * 100).toFixed(1)}%` : ''
})

// 是否显示数值
const showValue = computed(() => {
  return props.keyData.count > 0 && props.displayMode !== 'finger'
})

// 按键样式
const keyStyle = computed(() => {
  let width = '50px'
  
  switch (props.keyInfo.width) {
    case 'wide':
      width = '150px' // 空格鍵等寬鍵
      break
    case 'extra-wide':
      width = '200px'
      break
    default:
      width = '50px'
  }

  return {
    width,
    height: '50px'
  }
})

// 熱力圖樣式
const heatmapStyle = computed(() => {
  if (props.keyData.count === 0 || props.maxValue === 0) {
    return {
      '--intensity': 0,
      opacity: 0
    }
  }

  // 計算強度（0-1）
  const intensity = props.keyData.count / props.maxValue
  const normalizedIntensity = Math.min(Math.max(intensity, 0), 1)

  // 使用 CSS 變量
  return {
    '--intensity': normalizedIntensity,
    opacity: 1
  }
})

// 獲取手指顏色
const getFingerColor = (key: string, intensity: number): string => {
  // 手指顏色映射
  const fingerColors: Record<string, string> = {
    '左小指': `rgba(239, 68, 68, ${intensity * 0.8})`,    // 红色
    '左无名指': `rgba(249, 115, 22, ${intensity * 0.8})`,   // 橙色
    '左中指': `rgba(251, 191, 36, ${intensity * 0.8})`,    // 黄色
    '左食指': `rgba(34, 197, 94, ${intensity * 0.8})`,     // 绿色
    '右食指': `rgba(34, 197, 94, ${intensity * 0.8})`,     // 绿色
    '右中指': `rgba(59, 130, 246, ${intensity * 0.8})`,    // 蓝色
    '右无名指': `rgba(139, 92, 246, ${intensity * 0.8})`,   // 紫色
    '右小指': `rgba(236, 72, 153, ${intensity * 0.8})`     // 粉色
  }

  // 手指映射
  const fingerMapping: Record<string, string> = {
    'q': '左小指', 'a': '左小指', 'z': '左小指',
    'w': '左无名指', 's': '左无名指', 'x': '左无名指',
    'e': '左中指', 'd': '左中指', 'c': '左中指',
    'r': '左食指', 'f': '左食指', 'v': '左食指', 't': '左食指', 'g': '左食指', 'b': '左食指',
    'y': '右食指', 'h': '右食指', 'n': '右食指', 'u': '右食指', 'j': '右食指', 'm': '右食指',
    'i': '右中指', 'k': '右中指', ',': '右中指',
    'o': '右无名指', 'l': '右无名指', '.': '右无名指',
    'p': '右小指', ';': '右小指', '/': '右小指',
    '1': '左小指', '2': '左无名指', '3': '左中指', '4': '左食指', '5': '左食指',
    '6': '右食指', '7': '右食指', '8': '右中指', '9': '右无名指', '0': '右小指'
  }

  const finger = fingerMapping[key.toLowerCase()]
  return finger ? fingerColors[finger] : `rgba(156, 163, 175, ${intensity * 0.5})`
}

// 鼠標事件處理
const handleMouseEnter = () => {
  isActive.value = true
  emit('keyHover', props.keyData)
}

const handleMouseLeave = () => {
  isActive.value = false
  emit('keyHover', null)
}
</script>

<style scoped>
.key-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--heatmap-key-border);
  border-radius: var(--radius-md);
  background-color: var(--heatmap-key-bg);
  color: var(--heatmap-key-text);
  cursor: pointer;
  transition: all var(--transition-base);
  user-select: none;
  overflow: hidden;
  font-family: var(--font-mono);
}

.key-button:hover {
  border-color: var(--heatmap-key-active);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  z-index: 10;
}

.key-button.key-active {
  border-color: var(--heatmap-key-active);
  box-shadow: var(--shadow-lg);
}

.key-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.key-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
  text-transform: uppercase;
  font-family: var(--font-mono);
}

.key-value {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
  line-height: 1;
}

/* 熱力圖樣式 */
.key-heatmap-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  border-radius: calc(var(--radius-md) - 2px);
  transition: all 0.3s ease;
}

/* 頻率模式 - 淺色主題（蓝色） */
.key-button.mode-frequency .key-heatmap-overlay {
  background-color: rgba(59, 130, 246, calc(var(--intensity, 0) * 0.8 + 0.1));
}

/* 頻率模式 - 深色主題（青色） */
[data-theme="dark"] .key-button.mode-frequency .key-heatmap-overlay {
  background-color: rgba(0, 188, 212, calc(var(--intensity, 0) * 0.8 + 0.1));
}

/* 負擔模式（蓝色 - 与频率模式相同） */
.key-button.mode-load .key-heatmap-overlay {
  background-color: rgba(59, 130, 246, calc(var(--intensity, 0) * 0.8 + 0.1));
}

/* 负担模式 - 深色主题（青色 - 与频率模式相同） */
[data-theme="dark"] .key-button.mode-load .key-heatmap-overlay {
  background-color: rgba(0, 188, 212, calc(var(--intensity, 0) * 0.8 + 0.1));
}

/* 手指模式（綠色） */
.key-button.mode-finger .key-heatmap-overlay {
  background-color: rgba(34, 197, 94, calc(var(--intensity, 0) * 0.8 + 0.1));
}

/* 特殊按鍵樣式 */
.key-button.key-space {
  width: 200px;
}

.key-button.key-tab {
  width: 75px;
}

.key-button.key-caps {
  width: 90px;
}

.key-button.key-shift {
  width: 110px;
}

.key-button.key-ctrl,
.key-button.key-alt,
.key-button.key-cmd {
  width: 70px;
}

/* 模式特定樣式已通過熱力圖覆蓋層實現 */

/* 數字行按鍵 */
.key-button.key-1,
.key-button.key-2,
.key-button.key-3,
.key-button.key-4,
.key-button.key-5,
.key-button.key-6,
.key-button.key-7,
.key-button.key-8,
.key-button.key-9,
.key-button.key-0 {
  background-color: var(--color-bg-tertiary);
}

/* 標點符號按鍵 */
.key-button.key-semicolon,
.key-button.key-comma,
.key-button.key-period,
.key-button.key-slash {
  background-color: var(--color-bg-tertiary);
}

/* 響應式調整 */
@media (max-width: 768px) {
  .key-button {
    border-width: 1px;
  }
  
  .key-label {
    font-size: 0.8rem;
  }
  
  .key-value {
    font-size: 0.7rem;
  }
}

/* 按鍵動畫 */
@keyframes keyPress {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
  }
}

.key-button:active {
  animation: keyPress 0.1s ease-in-out;
}

/* 無障礙支持 */
.key-button:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* 高對比度模式支持 */
@media (prefers-contrast: high) {
  .key-button {
    border-width: 3px;
  }
  
  .key-label {
    font-weight: 700;
  }
}
</style>
