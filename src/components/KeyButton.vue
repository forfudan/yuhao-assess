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
  displayMode: 'frequency' | 'load' | 'finger'
  maxValue: number
  colorIntensity: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  keyHover: [keyData: KeyData | null]
}>()

const isActive = ref(false)

// 显示的值
const displayValue = computed(() => {
  switch (props.displayMode) {
    case 'frequency':
      return props.keyData.count > 0 ? props.keyData.count.toString() : ''
    case 'load':
      return props.keyData.count > 0 ? `${(props.keyData.frequency * 100).toFixed(1)}%` : ''
    case 'finger':
      return props.keyData.count > 0 ? props.keyData.count.toString() : ''
    default:
      return ''
  }
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

// 热力图样式
const heatmapStyle = computed(() => {
  if (props.keyData.count === 0 || props.maxValue === 0) {
    return {
      opacity: 0
    }
  }

  // 计算强度（0-1）
  const intensity = (props.keyData.count / props.maxValue) * props.colorIntensity
  const normalizedIntensity = Math.min(Math.max(intensity, 0), 1)

  // 根据显示模式选择颜色 - 仿照 genda.shurufa.app
  let backgroundColor: string
  switch (props.displayMode) {
    case 'frequency':
      // 蓝色系热力图 - 仿照 genda.shurufa.app
      if (normalizedIntensity < 0.25) {
        backgroundColor = 'var(--heatmap-low)'
      } else if (normalizedIntensity < 0.5) {
        backgroundColor = 'var(--heatmap-medium)'
      } else if (normalizedIntensity < 0.75) {
        backgroundColor = 'var(--heatmap-high)'
      } else {
        backgroundColor = 'var(--heatmap-very-high)'
      }
      break
    case 'load':
      // 红橙色系 - 负担程度
      if (normalizedIntensity < 0.25) {
        backgroundColor = '#fff5f5'
      } else if (normalizedIntensity < 0.5) {
        backgroundColor = '#fed7d7'
      } else if (normalizedIntensity < 0.75) {
        backgroundColor = '#feb2b2'
      } else {
        backgroundColor = '#f56565'
      }
      break
    case 'finger':
      // 绿色系 - 手指分工
      if (normalizedIntensity < 0.25) {
        backgroundColor = '#f0fff4'
      } else if (normalizedIntensity < 0.5) {
        backgroundColor = '#c6f6d5'
      } else if (normalizedIntensity < 0.75) {
        backgroundColor = '#9ae6b4'
      } else {
        backgroundColor = '#68d391'
      }
      break
    default:
      backgroundColor = 'var(--heatmap-low)'
  }

  return {
    backgroundColor,
    opacity: 1
  }
})

// 获取手指颜色
const getFingerColor = (key: string, intensity: number): string => {
  // 手指颜色映射
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

// 鼠标事件处理
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

/* 特殊按键样式 */
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

/* 模式特定样式 */
.key-button.mode-frequency {
  /* 频率模式的特定样式 */
}

.key-button.mode-load {
  /* 负担模式的特定样式 */
}

.key-button.mode-finger {
  /* 手指模式的特定样式 */
}

/* 数字行按键 */
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

/* 标点符号按键 */
.key-button.key-semicolon,
.key-button.key-comma,
.key-button.key-period,
.key-button.key-slash {
  background-color: var(--color-bg-tertiary);
}

/* 响应式调整 */
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

/* 按键动画 */
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

/* 热力图渐变效果 */
.key-heatmap-overlay {
  background: radial-gradient(circle at center, transparent 0%, currentColor 100%);
}

/* 无障碍支持 */
.key-button:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .key-button {
    border-width: 3px;
  }
  
  .key-label {
    font-weight: 700;
  }
}
</style>
