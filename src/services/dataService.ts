/**
 * 数据服务
 * 
 * 负责加载各种数据文件，包括字频数据、等效值表等
 */

import type { CharFrequency } from '../types'
import { BuiltinCodeTableService } from './builtinCodeTableService'

// =============================================================================
// 字频数据加载
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
// 等效值表加载
// =============================================================================

/**
 * 加载等效值表数据
 */
export async function loadEquivTable(): Promise<Record<string, number>> {
  try {
    const response = await fetch('/data/equivTable.json')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const equivTableData = await response.json()
    return equivTableData.data || {}
  } catch (error) {
    console.error('加载当量表失败:', error)
    throw new Error('加载当量表失败')
  }
}
