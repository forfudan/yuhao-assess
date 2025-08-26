/**
 * UI 服務
 * 負責UI相關的功能，包括格式化、工具提示等
 */

import { ref } from 'vue'

// =============================================================================
// 格式化工具函數
// =============================================================================

/**
 * 格式化比率為萬分比顯示
 * @param rate 比率值 (0-1)
 * @returns 格式化的萬分比字符串
 */
export const formatRate = (rate?: number): string => {
  return rate !== undefined && rate !== null ? (rate * 10000).toFixed(2) + '‱' : '-'
}

/**
 * 格式化數字，千位分隔符
 * @param num 數字
 * @returns 格式化的數字字符串
 */
export const formatNumber = (num?: number): string => {
  return num !== undefined && num !== null ? num.toLocaleString() : '-'
}

/**
 * 格式化當量，保留小数位
 * @param equiv 當量
 * @returns 格式化的當量字符串
 */
export const formatEquiv = (equiv?: number): string => {
  return equiv !== undefined && equiv !== null ? equiv.toFixed(4) : '-'
}

// =============================================================================
// 工具提示管理
// =============================================================================

export interface TooltipState {
  visible: boolean
  text: string
  style: {
    position: string
    left: string
    top: string
    zIndex: number
  }
}

/**
 * 创建工具提示管理器
 * @returns 工具提示管理器对象
 */
export function createTooltipManager() {
  const tooltipVisible = ref(false)
  const tooltipText = ref('')
  const tooltipStyle = ref({
    position: 'fixed' as const,
    left: '0px',
    top: '0px',
    zIndex: 9999
  })

  /**
   * 显示工具提示
   * @param event 鼠标事件
   * @param text 提示文本
   */
  const showTooltip = (event: MouseEvent, text: string) => {
    tooltipText.value = text
    tooltipVisible.value = true
    
    const rect = (event.target as HTMLElement).getBoundingClientRect()
    const tooltipLeft = Math.min(rect.left, window.innerWidth - 320)
    const tooltipTop = rect.bottom + 8
    
    tooltipStyle.value = {
      position: 'fixed' as const,
      left: `${tooltipLeft}px`,
      top: `${tooltipTop}px`,
      zIndex: 9999
    }
  }

  /**
   * 隐藏工具提示
   */
  const hideTooltip = () => {
    tooltipVisible.value = false
  }

  return {
    tooltipVisible,
    tooltipText,
    tooltipStyle,
    showTooltip,
    hideTooltip
  }
}

// =============================================================================
// 陣列操作工具函數
// =============================================================================

/**
 * 獲取字符陣列的工具提示文本
 * @param chars 字符陣列
 * @returns 格式化的工具提示文本
 */
export const getCharacterTooltip = (chars: string[]): string => {
  return chars.join(', ')
}
