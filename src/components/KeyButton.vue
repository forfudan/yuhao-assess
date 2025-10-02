<template>
  <div 
    class="key-button"
    :class="[
      `key-${keyInfo.key}`,
      `mode-${displayMode}`,
      { 'hidden-key': keyInfo.hidden }
    ]"
    :style="{ ...keyStyle, ...textColor }"
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
import { computed } from 'vue'
import type { KeyData, KeyInfo } from '../types/index'

interface Props {
  keyData: KeyData
  keyInfo: KeyInfo
  displayMode: 'load' | 'frequency' | 'finger'
  maxValue: number
}

const props = defineProps<Props>()

const emit = defineEmits<{}>()

// 顯示的值
const displayValue = computed(() => {
  return props.keyData.count > 0 ? `${(props.keyData.frequency * 100).toFixed(1)}%` : ''
})

// 是否顯示數值
const showValue = computed(() => {
  return props.keyData.count > 0 && props.displayMode !== 'finger'
})

// 按鍵樣式
const keyStyle = computed(() => {
  let gridColumn = 'span 1' // 預設佔1列
  
  switch (props.keyInfo.width) {
    case 'wide':
      gridColumn = 'span 3' // 寬鍵佔3列
      break
    case 'extra-wide':
      gridColumn = 'span 6' // 空格鍵佔6列（11列佈局中）
      break
    default:
      gridColumn = 'span 1' // 標準鍵佔1列
  }

  return {
    gridColumn,
    aspectRatio: props.keyInfo.width === 'extra-wide' ? '7' : '1', // 空格鍵保持7:1比例，其他保持正方形
    minWidth: '40px',
    minHeight: '40px'
  }
})

// 熱力圖樣式
const heatmapStyle = computed(() => {
  if (props.keyData.count === 0) {
    return {
      '--intensity': 0,
      opacity: 0
    }
  }

  // 使用頻率百分比的絕對映射，而非相對歸一化
  // 這樣高頻鍵會變得非常深，而不會壓縮其他鍵的顏色空間
  const frequencyPercent = props.keyData.frequency * 100 // 轉換為百分比
  
  // 映射函數：使用平方根函數來映射頻率到強度
  // sqrt(x/10) 在 x=1% 時約 0.316，x=5% 時約 0.707，x=10% 時為 1.0
  // 這樣可以讓低頻鍵有足夠的顏色深度，同時高頻鍵會變得很深
  let intensity = Math.sqrt(frequencyPercent / 10)
  
  // 允許強度超過 1.0，最高到 1.5，讓極高頻的鍵可以更深
  intensity = Math.min(intensity, 1.5)
  
  // 使用 CSS 變量
  return {
    '--intensity': intensity,
    opacity: 1
  }
})

// 動態文字顔色
const textColor = computed(() => {
  if (props.keyData.count === 0) {
    return {
      '--key-text-color': 'var(--color-text-secondary)'
    }
  }

  // 使用頻率百分比來決定文字顏色
  const frequencyPercent = props.keyData.frequency * 100
  
  // 當頻率超過 3% 時切換到白色文字以提高可見性
  // 因為 3% 的頻率已經會產生較深的背景色
  const textColor = frequencyPercent > 3 ? '#ffffff' : 'var(--color-text-secondary)'
  
  return {
    '--key-text-color': textColor
  }
})

// 獲取手指顔色
const getFingerColor = (key: string, intensity: number): string => {
  // 手指顔色映射
  const fingerColors: Record<string, string> = {
    '左小指': `rgba(239, 68, 68, ${intensity * 0.8})`,    // 紅色
    '左無名指': `rgba(249, 115, 22, ${intensity * 0.8})`,   // 橙色
    '左中指': `rgba(251, 191, 36, ${intensity * 0.8})`,    // 黄色
    '左食指': `rgba(34, 197, 94, ${intensity * 0.8})`,     // 緑色
    '右食指': `rgba(34, 197, 94, ${intensity * 0.8})`,     // 緑色
    '右中指': `rgba(59, 130, 246, ${intensity * 0.8})`,    // 藍色
    '右無名指': `rgba(139, 92, 246, ${intensity * 0.8})`,   // 紫色
    '右小指': `rgba(236, 72, 153, ${intensity * 0.8})`     // 粉色
  }

  // 手指映射
  const fingerMapping: Record<string, string> = {
    'q': '左小指', 'a': '左小指', 'z': '左小指',
    'w': '左無名指', 's': '左無名指', 'x': '左無名指',
    'e': '左中指', 'd': '左中指', 'c': '左中指',
    'r': '左食指', 'f': '左食指', 'v': '左食指', 't': '左食指', 'g': '左食指', 'b': '左食指',
    'y': '右食指', 'h': '右食指', 'n': '右食指', 'u': '右食指', 'j': '右食指', 'm': '右食指',
    'i': '右中指', 'k': '右中指', ',': '右中指',
    'o': '右無名指', 'l': '右無名指', '.': '右無名指',
    'p': '右小指', ';': '右小指', '/': '右小指',
    '1': '左小指', '2': '左無名指', '3': '左中指', '4': '左食指', '5': '左食指',
    '6': '右食指', '7': '右食指', '8': '右中指', '9': '右無名指', '0': '右小指'
  }

  const finger = fingerMapping[key.toLowerCase()]
  return finger ? fingerColors[finger] : `rgba(156, 163, 175, ${intensity * 0.5})`
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
  width: 100%;
  height: 100%;
}

/* 確保所有標準按鍵都是正方形 */
.key-button:not(.key-space) {
  aspect-ratio: 1;
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

/* 隱藏按鍵樣式 */
.key-button.hidden-key {
  opacity: 0;
  pointer-events: none;
  border: none;
  background: transparent !important;
  box-shadow: none !important;
}

.key-button.hidden-key:hover {
  transform: none !important;
  border-color: transparent !important;
  box-shadow: none !important;
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
  font-size: calc(0.2rem + 1.2vw); /* 優化的線性縮放：基礎0.5rem + 1.2%視窗寬度 */
  font-weight: 600;
  color: var(--color-text-primary);
  text-transform: uppercase;
  font-family: var(--font-mono);
  min-height: 1.2em; /* 確保有足够的行高 */
}

.key-value {
  font-size: calc(0.2rem + 1vw); /* 優化的線性縮放：基礎0.4rem + 1%視窗寬度 */
  font-weight: 500;
  color: var(--key-text-color, var(--color-text-secondary));
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

/* 頻率模式 - 淺色主題（全碼數據 - 現代藍色漸變） */
.key-button.mode-frequency .key-heatmap-overlay {
  background: linear-gradient(135deg, 
    rgba(99, 102, 241, calc(var(--intensity, 0) * 0.9 + 0.1)), 
    rgba(59, 130, 246, calc(var(--intensity, 0) * 0.8 + 0.1))
  );
}

/* 頻率模式 - 深色主題（全碼數據 - 現代青藍色） */
[data-theme="dark"] .key-button.mode-frequency .key-heatmap-overlay {
  background: linear-gradient(135deg, 
    rgba(14, 165, 233, calc(var(--intensity, 0) * 0.9 + 0.1)), 
    rgba(6, 182, 212, calc(var(--intensity, 0) * 0.8 + 0.1))
  );
}

/* 簡碼模式 - 淺色主題（簡碼數據 - 暖橙色漸變） */
.key-button.mode-load .key-heatmap-overlay {
  background: linear-gradient(135deg, 
    rgba(249, 115, 22, calc(var(--intensity, 0) * 0.9 + 0.1)), 
    rgba(234, 88, 12, calc(var(--intensity, 0) * 0.8 + 0.1))
  );
}

/* 簡碼模式 - 深色主題（簡碼數據 - 亮橙色漸變） */
[data-theme="dark"] .key-button.mode-load .key-heatmap-overlay {
  background: linear-gradient(135deg, 
    rgba(251, 146, 60, calc(var(--intensity, 0) * 0.9 + 0.1)), 
    rgba(249, 115, 22, calc(var(--intensity, 0) * 0.8 + 0.1))
  );
}

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

/* 960px以上固定字體大小 */
@media (min-width: 961px) {
  .key-label {
    font-size: 0.92rem; /* 固定在960px時的大小 */
  }
  
  .key-value {
    font-size: 0.8rem; /* 固定在960px時的大小 */
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

/* 無障礙支援 */
.key-button:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* 高對比度模式支援 */
@media (prefers-contrast: high) {
  .key-button {
    border-width: 3px;
  }
  
  .key-label {
    font-weight: 700;
  }
}
</style>
