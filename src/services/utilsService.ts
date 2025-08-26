import { ref } from 'vue'
import type { CharFrequency, CodeTable } from '../types'
import { BuiltinCodeTableService } from './builtinCodeTableService'

/**
 * 通用工具服务
 * 包含格式化、字频加载、速度等效计算和工具提示等常用功能
 */

// =============================================================================
// 格式化工具函数
// =============================================================================

/**
 * 格式化比率为万分比
 * @param rate 比率值 (0-1)
 * @returns 格式化的万分比字符串
 */
export const formatRate = (rate?: number): string => {
  return rate ? (rate * 10000).toFixed(2) + '‱' : '-'
}

/**
 * 格式化数字，千位分隔符
 * @param num 数字
 * @returns 格式化的数字字符串
 */
export const formatNumber = (num?: number): string => {
  return num ? num.toLocaleString() : '-'
}

/**
 * 格式化等效值，保留小数位
 * @param equiv 等效值
 * @returns 格式化的等效值字符串
 */
export const formatEquiv = (equiv?: number): string => {
  return equiv ? equiv.toFixed(4) : '-'
}

// =============================================================================
// 字频数据加载工具函数
// =============================================================================

const builtinService = new BuiltinCodeTableService()

/**
 * 加载知乎字频数据
 */
export async function loadCharFrequency(): Promise<CharFrequency> {
  try {
    return await builtinService.loadCharFrequency()
  } catch (error) {
    console.error('加载知乎字频数据失败:', error)
    throw error
  }
}

/**
 * 加载简体字频数据
 */
export async function loadCharFrequencySC(): Promise<CharFrequency> {
  try {
    return await builtinService.loadCharFrequencySC()
  } catch (error) {
    console.error('加载简体字频数据失败:', error)
    throw error
  }
}

/**
 * 加载繁体字频数据
 */
export async function loadCharFrequencyTC(): Promise<CharFrequency> {
  try {
    return await builtinService.loadCharFrequencyTC()
  } catch (error) {
    console.error('加载繁体字频数据失败:', error)
    throw error
  }
}

/**
 * 加载统一字频数据
 */
export async function loadCharFrequencyUnified(): Promise<CharFrequency> {
  try {
    return await builtinService.loadCharFrequencyUnified()
  } catch (error) {
    console.error('加载统一字频数据失败:', error)
    throw error
  }
}

/**
 * 并行加载所有字频数据
 * @returns 包含所有字频数据的对象
 */
export async function loadAllCharFrequencies() {
  const [zhihuFreq, scFreq, tcFreq, unifiedFreq] = await Promise.all([
    loadCharFrequency(),
    loadCharFrequencySC(),
    loadCharFrequencyTC(),
    loadCharFrequencyUnified()
  ])
  
  return {
    zhihuFreq,
    scFreq,
    tcFreq,
    unifiedFreq
  }
}

// =============================================================================
// 速度等效计算工具函数
// =============================================================================

/**
 * 计算速度等效值（简化版本）
 * @param pairFrequencies 码对频率数据
 * @param equivTable 等效值表
 * @returns 计算出的速度等效值
 */
export function calculateSpeedEquiv(
  pairFrequencies: Record<string, number>,
  equivTable: Record<string, number>
): number {
  let totalWeightedEquiv = 0
  let totalFrequency = 0
  
  for (const [pair, frequency] of Object.entries(pairFrequencies)) {
    const equiv = equivTable[pair]
    if (equiv !== undefined) {
      totalWeightedEquiv += equiv * frequency
      totalFrequency += frequency
    }
  }
  
  return totalFrequency > 0 ? totalWeightedEquiv / totalFrequency : 0
}

/**
 * 计算速度等效值（完整版本，包含码表和字频处理）
 * @param codeTable 码表
 * @param charFrequency 字频数据
 * @param equivTable 等效值表
 * @returns 计算出的速度等效值
 */
export function calculateSpeedEquivFromCodeTable(
  codeTable: CodeTable,
  charFrequency: Record<string, number>,
  equivTable: Record<string, number>
): number {
  const pairFrequencies = calculateCodePairFrequencies(codeTable, charFrequency)
  return calculateSpeedEquiv(pairFrequencies, equivTable)
}

/**
 * 计算码对频率
 * @param codeTable 码表
 * @param charFrequency 字频数据
 * @returns 码对频率数据
 */
export function calculateCodePairFrequencies(
  codeTable: CodeTable,
  charFrequency: Record<string, number>
): Record<string, number> {
  const pairFrequencies: Record<string, number> = {}
  
  for (const [char, codes] of codeTable.entries()) {
    const frequency = charFrequency[char] || 0
    if (frequency === 0 || codes.length === 0) continue
    
    const code = codes[0] // 使用第一個編碼
    
    // 生成所有相鄰的編碼對
    for (let i = 0; i < code.length - 1; i++) {
      const pair = code.substring(i, i + 2)
      pairFrequencies[pair] = (pairFrequencies[pair] || 0) + frequency
    }
  }
  
  return pairFrequencies
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
// 数组操作工具函数
// =============================================================================

/**
 * 获取字符数组的工具提示文本
 * @param chars 字符数组
 * @returns 格式化的工具提示文本
 */
export const getCharacterTooltip = (chars: string[]): string => {
  return chars.join(', ')
}
