/**
 * 數據服務
 * 
 * 負責加載各種數據文件，包括字頻數據、當量表等
 */

import type { CharFrequency } from '../types'
import { BuiltinCodeTableService } from './builtinCodeTableService'

// =============================================================================
// 字頻數據加載
// =============================================================================

const builtinService = new BuiltinCodeTableService()

/**
 * 加載知乎字頻數據
 */
export async function loadCharFrequency(): Promise<CharFrequency> {
  try {
    return await builtinService.loadCharFrequency()
  } catch (error) {
    console.error('加載知乎字頻數據失敗:', error)
    throw error
  }
}

/**
 * 加載簡體字頻數據
 */
export async function loadCharFrequencySC(): Promise<CharFrequency> {
  try {
    return await builtinService.loadCharFrequencySC()
  } catch (error) {
    console.error('加載簡體字頻數據失敗:', error)
    throw error
  }
}

/**
 * 加載繁體字頻數據
 */
export async function loadCharFrequencyTC(): Promise<CharFrequency> {
  try {
    return await builtinService.loadCharFrequencyTC()
  } catch (error) {
    console.error('加載繁體字頻數據失敗:', error)
    throw error
  }
}

/**
 * 加載統一字頻數據
 */
export async function loadCharFrequencyUnified(): Promise<CharFrequency> {
  try {
    return await builtinService.loadCharFrequencyUnified()
  } catch (error) {
    console.error('加載統一字頻數據失敗:', error)
    throw error
  }
}

/**
 * 並行加載所有字頻數據
 * @returns 包含所有字頻數據的對象
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
// 當量表加載
// =============================================================================

/**
 * 加載當量表數據
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
