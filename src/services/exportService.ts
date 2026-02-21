import type { 方案配置介面 } from '@/types/scheme'
import type { 靜態重碼分析結果介面 } from '@/atoms/staticDuplicate'
import type { 動態選重分析結果介面 } from '@/atoms/dynamicDuplicate'
import type { 最大候選個數分析結果 } from '@/atoms/maximumCandidates'
import type { 速度當量分析結果介面 } from '@/atoms/speedEquivalent'
import type { 簡碼效率分析結果介面 } from '@/atoms/shortCodeEfficiency'
import type { 鍵位熱力分析結果介面 } from '@/atoms/keyboardHeatmap'

/**
 * 分析結果集合
 */
export interface 分析結果集 {
  靜態重碼分析結果: 靜態重碼分析結果介面 | null
  動態選重分析結果: 動態選重分析結果介面 | null
  候選個數分析結果: 最大候選個數分析結果 | null
  速度當量分析結果: 速度當量分析結果介面 | null
  簡碼效率分析結果: 簡碼效率分析結果介面 | null
  鍵位熱力分析結果: 鍵位熱力分析結果介面 | null
}

/**
 * 導出方案配置爲JSON，自動下載
 * @param 當前方案 方案配置對象
 * @param 分析結果 包含各種分析結果的對象
 * @param 簡易文件名 是否使用簡易文件名（僅包含方案唯一識别符），默認爲false
 * @returns 返回導出結果對象，包含成功與否和提示訊息
 */
export function 導出方案配置JSON(
  當前方案: 方案配置介面,
  分析結果: 分析結果集,
  簡易文件名: boolean
): { success: boolean; message?: string } {
  try {
    // 構建導出數據
    const 導出數據: 方案配置介面 = {
      ...當前方案,
      測評結果: {
        靜態重碼分析: 分析結果.靜態重碼分析結果 ?? undefined,
        動態選重分析: 分析結果.動態選重分析結果 ?? undefined,
        候選個數分析: 分析結果.候選個數分析結果 ?? undefined,
        速度當量分析: 分析結果.速度當量分析結果 ?? undefined,
        簡碼效率分析: 分析結果.簡碼效率分析結果 ?? undefined,
        鍵位熱力: 分析結果.鍵位熱力分析結果 ?? undefined,
      },
    }

    // 生成JSON並下載
    const json文本 = JSON.stringify(導出數據, null, 2)
    const blob = new Blob([json文本], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url

    // 文件名格式：標識符-方案名-作者-版本號.json
    const 標識符 = 當前方案.元數據.標識符
    const 方案名 = 當前方案.元數據.方案名
    const 作者 = 當前方案.元數據.作者 || 'unknown'
    const 版本 = 當前方案.元數據.版本 || '1.0.0'
    if (簡易文件名) {
      a.download = `${標識符}.json`
    } else {
      a.download = `${標識符}-${方案名}-${作者}-${版本}.json`
    }

    a.click()
    URL.revokeObjectURL(url)

    // 生成提示訊息
    const 結果列表 = [
      分析結果.靜態重碼分析結果 && '靜態重碼分析',
      分析結果.動態選重分析結果 && '動態選重分析',
      分析結果.候選個數分析結果 && '候選個數分析',
      分析結果.速度當量分析結果 && '速度當量分析',
      分析結果.簡碼效率分析結果 && '簡碼效率分析',
      分析結果.鍵位熱力分析結果 && '鍵位熱力分析',
    ].filter(Boolean)
    const 提示 = 結果列表.length > 0 ? `（包含${結果列表.join('、')}結果）` : ''

    return {
      success: true,
      message: `方案配置已導出${提示}`,
    }
  } catch (錯誤) {
    console.error('[exportService] 導出配置失敗:', 錯誤)
    return {
      success: false,
      message: '導出配置失敗',
    }
  }
}
