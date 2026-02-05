/**
 * UI 服務
 * 負責UI相關的功能，包括格式化等
 */

// =============================================================================
// 格式化工具函數
// =============================================================================

/**
 * 格式化比率爲萬分比顯示
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

/**
 * 獲取字符陣列的工具提示文本
 * @param chars 字符陣列
 * @returns 格式化的工具提示文本
 */
export const getCharacterTooltip = (chars: string[]): string => {
  return chars.join(', ')
}
