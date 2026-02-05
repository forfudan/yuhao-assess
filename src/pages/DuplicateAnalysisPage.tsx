import React, { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { Button, Space, Typography, Alert, Spin, Tooltip, Modal, Table } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { 碼表原子狀態 } from '../atoms/codeTable'
import { 重碼分析原子狀態 } from '../atoms/duplicate'
import type { 重碼分析結果 } from '../atoms/duplicate'
import {
  getDynamicDupRate,
  getDynamicDupRateFromOriginalOrder,
  calculateCharsetDuplicates,
} from '../services/duplicateAnalysisService'
import { 字頻表服務類別 } from '../services/charFrequencyService'
import type { CodeTable, 處理後的碼表結果 } from '../types'

const { Paragraph, Link } = Typography

/**
 * 重碼分析頁面
 * 展示動態選重率、靜態重碼等數據
 */
const DuplicatePage: React.FC = () => {
  const [碼表數據] = useAtom(碼表原子狀態)
  const [分析結果, 設置分析結果] = useAtom(重碼分析原子狀態)
  const [計算中, 設置計算中] = useState(false)
  const [錯誤信息, 設置錯誤信息] = useState<string | null>(null)

  // 重碼詳情 Modal
  const [顯示詳情, 設置顯示詳情] = useState(false)
  const [詳情標題, 設置詳情標題] = useState('')
  const [重碼詳情列表, 設置重碼詳情列表] = useState<
    Array<{
      序號: number
      字符: string
      編碼: string
      字頻: number
      重碼字符列表: string
    }>
  >([])
  const [詳情計算中, 設置詳情計算中] = useState(false)

  // 類型斷言：碼表數據實際上是 處理後的碼表結果
  const 處理後碼表 = 碼表數據 as 處理後的碼表結果 | null

  /**
   * 檢查數據是否完整
   */
  const 檢查數據完整性 = (): boolean => {
    if (!分析結果) {
      console.log('[DuplicateAnalysisPage] 檢查完整性: 無分析結果')
      return false
    }

    const 必需字段 = [
      '知乎簡體動態選重率',
      '北語簡體動態選重率',
      '臺標繁體動態選重率',
      '古籍繁體動態選重率',
      '繁簡聯合動態選重率',
      '知乎簡體動態選重率原序',
      'GB2312靜態重碼',
      '通用規範靜態重碼',
      '常用國字靜態重碼',
    ]

    const 完整 = 必需字段.every(字段 => 字段 in 分析結果)

    if (!完整) {
      const 缺少字段 = 必需字段.filter(字段 => !(字段 in 分析結果))
      console.log('[DuplicateAnalysisPage] 檢查完整性: 數據不完整，缺少字段:', 缺少字段)
      return false
    }

    // 驗證靜態重碼數據結構類型（必須是嵌套結構：{ 全碼: {...}, 簡碼: {...} }）
    const 靜態重碼字段 = ['GB2312靜態重碼', '通用規範靜態重碼', '常用國字靜態重碼']
    for (const 字段 of 靜態重碼字段) {
      const 數據 = 分析結果[字段 as keyof typeof 分析結果] as any
      if (數據) {
        // 檢查是否有正確的嵌套結構
        if (typeof 數據 !== 'object' || !('全碼' in 數據) || !('簡碼' in 數據)) {
          console.log(
            `[DuplicateAnalysisPage] 檢查完整性: ${字段} 類型不匹配（缺少全碼或簡碼），需要重新計算`
          )
          return false
        }
        // 檢查嵌套對象是否有必需的字段
        const 全碼數據 = 數據.全碼
        const 簡碼數據 = 數據.簡碼
        if (
          !全碼數據 ||
          !簡碼數據 ||
          typeof 全碼數據 !== 'object' ||
          typeof 簡碼數據 !== 'object' ||
          !('重碼組數' in 全碼數據) ||
          !('重碼組數' in 簡碼數據)
        ) {
          console.log(`[DuplicateAnalysisPage] 檢查完整性: ${字段} 嵌套結構不完整，需要重新計算`)
          return false
        }
      }
    }

    console.log('[DuplicateAnalysisPage] 檢查完整性: 數據完整且類型正確')
    return true
  }

  /**
   * 重新計算重碼數據
   */
  const 重新計算 = async () => {
    if (!處理後碼表) {
      設置錯誤信息('請先在「碼表解析」頁面上傳碼表')
      return
    }

    設置計算中(true)
    設置錯誤信息(null)

    try {
      const 全碼表 = 處理後碼表.全碼表
      const 簡碼表 = 處理後碼表.簡碼表
      const 全碼加選重鍵表 = 處理後碼表.全碼加選重鍵表
      const 簡碼加選重鍵表 = 處理後碼表.簡碼加選重鍵表

      // 加載字頻數據
      const [知乎字頻, 北語字頻, 臺標字頻, 古籍字頻] = await Promise.all([
        字頻表服務類別.加載知乎簡體字頻(),
        字頻表服務類別.加載北語簡體字頻(),
        字頻表服務類別.加載臺標繁體字頻(),
        字頻表服務類別.加載古籍繁體字頻(),
      ])

      // 計算繁簡聯合字頻（北語 + 臺標）
      const 繁簡聯合字頻 = await 字頻表服務類別.計算繁簡聯合字頻()

      // ========== 動態選重率（按字頻重排） ==========
      const 知乎簡體動態選重率 = {
        全碼: getDynamicDupRate(全碼表, 知乎字頻, true),
        簡碼: getDynamicDupRate(簡碼表, 知乎字頻, true),
      }

      const 北語簡體動態選重率 = {
        全碼: getDynamicDupRate(全碼表, 北語字頻, true),
        簡碼: getDynamicDupRate(簡碼表, 北語字頻, true),
      }

      const 臺標繁體動態選重率 = {
        全碼: getDynamicDupRate(全碼表, 臺標字頻, true),
        簡碼: getDynamicDupRate(簡碼表, 臺標字頻, true),
      }

      const 古籍繁體動態選重率 = {
        全碼: getDynamicDupRate(全碼表, 古籍字頻, true),
        簡碼: getDynamicDupRate(簡碼表, 古籍字頻, true),
      }

      const 繁簡聯合動態選重率 = {
        全碼: getDynamicDupRate(全碼表, 繁簡聯合字頻, true),
        簡碼: getDynamicDupRate(簡碼表, 繁簡聯合字頻, true),
      }

      // ========== 動態選重率（保持原序） ==========
      const 知乎簡體動態選重率原序 = {
        全碼: getDynamicDupRateFromOriginalOrder(全碼加選重鍵表, 知乎字頻),
        簡碼: getDynamicDupRateFromOriginalOrder(簡碼加選重鍵表, 知乎字頻),
      }

      const 北語簡體動態選重率原序 = {
        全碼: getDynamicDupRateFromOriginalOrder(全碼加選重鍵表, 北語字頻),
        簡碼: getDynamicDupRateFromOriginalOrder(簡碼加選重鍵表, 北語字頻),
      }

      const 臺標繁體動態選重率原序 = {
        全碼: getDynamicDupRateFromOriginalOrder(全碼加選重鍵表, 臺標字頻),
        簡碼: getDynamicDupRateFromOriginalOrder(簡碼加選重鍵表, 臺標字頻),
      }

      const 古籍繁體動態選重率原序 = {
        全碼: getDynamicDupRateFromOriginalOrder(全碼加選重鍵表, 古籍字頻),
        簡碼: getDynamicDupRateFromOriginalOrder(簡碼加選重鍵表, 古籍字頻),
      }

      const 繁簡聯合動態選重率原序 = {
        全碼: getDynamicDupRateFromOriginalOrder(全碼加選重鍵表, 繁簡聯合字頻),
        簡碼: getDynamicDupRateFromOriginalOrder(簡碼加選重鍵表, 繁簡聯合字頻),
      }

      // ========== 靜態重碼 ==========
      // 全碼表計算
      const [
        GB2312數據全碼,
        通用規範數據全碼,
        常用國字數據全碼,
        CJK基本數據全碼,
        CJKA數據全碼,
        CJKB數據全碼,
        CJKC數據全碼,
        CJKD數據全碼,
        CJKE數據全碼,
        CJKF數據全碼,
        CJKG數據全碼,
        CJKH數據全碼,
        CJKI數據全碼,
        CJKJ數據全碼,
      ] = await Promise.all([
        calculateCharsetDuplicates(全碼表, 'gb2312'),
        calculateCharsetDuplicates(全碼表, 'tonggui'),
        calculateCharsetDuplicates(全碼表, 'guozi'),
        calculateCharsetDuplicates(全碼表, 'cjk_basic'),
        calculateCharsetDuplicates(全碼表, 'cjk_to_a'),
        calculateCharsetDuplicates(全碼表, 'cjk_to_b'),
        calculateCharsetDuplicates(全碼表, 'cjk_to_c'),
        calculateCharsetDuplicates(全碼表, 'cjk_to_d'),
        calculateCharsetDuplicates(全碼表, 'cjk_to_e'),
        calculateCharsetDuplicates(全碼表, 'cjk_to_f'),
        calculateCharsetDuplicates(全碼表, 'cjk_to_g'),
        calculateCharsetDuplicates(全碼表, 'cjk_to_h'),
        calculateCharsetDuplicates(全碼表, 'cjk_to_i'),
        calculateCharsetDuplicates(全碼表, 'cjk_to_j'),
      ])

      // 簡碼表計算
      const [
        GB2312數據簡碼,
        通用規範數據簡碼,
        常用國字數據簡碼,
        CJK基本數據簡碼,
        CJKA數據簡碼,
        CJKB數據簡碼,
        CJKC數據簡碼,
        CJKD數據簡碼,
        CJKE數據簡碼,
        CJKF數據簡碼,
        CJKG數據簡碼,
        CJKH數據簡碼,
        CJKI數據簡碼,
        CJKJ數據簡碼,
      ] = await Promise.all([
        calculateCharsetDuplicates(簡碼表, 'gb2312'),
        calculateCharsetDuplicates(簡碼表, 'tonggui'),
        calculateCharsetDuplicates(簡碼表, 'guozi'),
        calculateCharsetDuplicates(簡碼表, 'cjk_basic'),
        calculateCharsetDuplicates(簡碼表, 'cjk_to_a'),
        calculateCharsetDuplicates(簡碼表, 'cjk_to_b'),
        calculateCharsetDuplicates(簡碼表, 'cjk_to_c'),
        calculateCharsetDuplicates(簡碼表, 'cjk_to_d'),
        calculateCharsetDuplicates(簡碼表, 'cjk_to_e'),
        calculateCharsetDuplicates(簡碼表, 'cjk_to_f'),
        calculateCharsetDuplicates(簡碼表, 'cjk_to_g'),
        calculateCharsetDuplicates(簡碼表, 'cjk_to_h'),
        calculateCharsetDuplicates(簡碼表, 'cjk_to_i'),
        calculateCharsetDuplicates(簡碼表, 'cjk_to_j'),
      ])

      const 新結果: 重碼分析結果 = {
        知乎簡體動態選重率,
        北語簡體動態選重率,
        臺標繁體動態選重率,
        古籍繁體動態選重率,
        繁簡聯合動態選重率,
        知乎簡體動態選重率原序,
        北語簡體動態選重率原序,
        臺標繁體動態選重率原序,
        古籍繁體動態選重率原序,
        繁簡聯合動態選重率原序,
        GB2312靜態重碼: {
          全碼: {
            重碼組數: GB2312數據全碼.duplicateGroupCount,
            重碼字數: GB2312數據全碼.duplicateCount,
            總字符數: GB2312數據全碼.totalChars,
            重碼率: GB2312數據全碼.duplicateRate,
          },
          簡碼: {
            重碼組數: GB2312數據簡碼.duplicateGroupCount,
            重碼字數: GB2312數據簡碼.duplicateCount,
            總字符數: GB2312數據簡碼.totalChars,
            重碼率: GB2312數據簡碼.duplicateRate,
          },
        },
        通用規範靜態重碼: {
          全碼: {
            重碼組數: 通用規範數據全碼.duplicateGroupCount,
            重碼字數: 通用規範數據全碼.duplicateCount,
            總字符數: 通用規範數據全碼.totalChars,
            重碼率: 通用規範數據全碼.duplicateRate,
          },
          簡碼: {
            重碼組數: 通用規範數據簡碼.duplicateGroupCount,
            重碼字數: 通用規範數據簡碼.duplicateCount,
            總字符數: 通用規範數據簡碼.totalChars,
            重碼率: 通用規範數據簡碼.duplicateRate,
          },
        },
        常用國字靜態重碼: {
          全碼: {
            重碼組數: 常用國字數據全碼.duplicateGroupCount,
            重碼字數: 常用國字數據全碼.duplicateCount,
            總字符數: 常用國字數據全碼.totalChars,
            重碼率: 常用國字數據全碼.duplicateRate,
          },
          簡碼: {
            重碼組數: 常用國字數據簡碼.duplicateGroupCount,
            重碼字數: 常用國字數據簡碼.duplicateCount,
            總字符數: 常用國字數據簡碼.totalChars,
            重碼率: 常用國字數據簡碼.duplicateRate,
          },
        },
        CJK基本靜態重碼: {
          全碼: {
            重碼組數: CJK基本數據全碼.duplicateGroupCount,
            重碼字數: CJK基本數據全碼.duplicateCount,
            總字符數: CJK基本數據全碼.totalChars,
            重碼率: CJK基本數據全碼.duplicateRate,
          },
          簡碼: {
            重碼組數: CJK基本數據簡碼.duplicateGroupCount,
            重碼字數: CJK基本數據簡碼.duplicateCount,
            總字符數: CJK基本數據簡碼.totalChars,
            重碼率: CJK基本數據簡碼.duplicateRate,
          },
        },
        CJK擴A靜態重碼: {
          全碼: {
            重碼組數: CJKA數據全碼.duplicateGroupCount,
            重碼字數: CJKA數據全碼.duplicateCount,
            總字符數: CJKA數據全碼.totalChars,
            重碼率: CJKA數據全碼.duplicateRate,
          },
          簡碼: {
            重碼組數: CJKA數據簡碼.duplicateGroupCount,
            重碼字數: CJKA數據簡碼.duplicateCount,
            總字符數: CJKA數據簡碼.totalChars,
            重碼率: CJKA數據簡碼.duplicateRate,
          },
        },
        CJK擴B靜態重碼: {
          全碼: {
            重碼組數: CJKB數據全碼.duplicateGroupCount,
            重碼字數: CJKB數據全碼.duplicateCount,
            總字符數: CJKB數據全碼.totalChars,
            重碼率: CJKB數據全碼.duplicateRate,
          },
          簡碼: {
            重碼組數: CJKB數據簡碼.duplicateGroupCount,
            重碼字數: CJKB數據簡碼.duplicateCount,
            總字符數: CJKB數據簡碼.totalChars,
            重碼率: CJKB數據簡碼.duplicateRate,
          },
        },
        CJK擴C靜態重碼: {
          全碼: {
            重碼組數: CJKC數據全碼.duplicateGroupCount,
            重碼字數: CJKC數據全碼.duplicateCount,
            總字符數: CJKC數據全碼.totalChars,
            重碼率: CJKC數據全碼.duplicateRate,
          },
          簡碼: {
            重碼組數: CJKC數據簡碼.duplicateGroupCount,
            重碼字數: CJKC數據簡碼.duplicateCount,
            總字符數: CJKC數據簡碼.totalChars,
            重碼率: CJKC數據簡碼.duplicateRate,
          },
        },
        CJK擴D靜態重碼: {
          全碼: {
            重碼組數: CJKD數據全碼.duplicateGroupCount,
            重碼字數: CJKD數據全碼.duplicateCount,
            總字符數: CJKD數據全碼.totalChars,
            重碼率: CJKD數據全碼.duplicateRate,
          },
          簡碼: {
            重碼組數: CJKD數據簡碼.duplicateGroupCount,
            重碼字數: CJKD數據簡碼.duplicateCount,
            總字符數: CJKD數據簡碼.totalChars,
            重碼率: CJKD數據簡碼.duplicateRate,
          },
        },
        CJK擴E靜態重碼: {
          全碼: {
            重碼組數: CJKE數據全碼.duplicateGroupCount,
            重碼字數: CJKE數據全碼.duplicateCount,
            總字符數: CJKE數據全碼.totalChars,
            重碼率: CJKE數據全碼.duplicateRate,
          },
          簡碼: {
            重碼組數: CJKE數據簡碼.duplicateGroupCount,
            重碼字數: CJKE數據簡碼.duplicateCount,
            總字符數: CJKE數據簡碼.totalChars,
            重碼率: CJKE數據簡碼.duplicateRate,
          },
        },
        CJK擴F靜態重碼: {
          全碼: {
            重碼組數: CJKF數據全碼.duplicateGroupCount,
            重碼字數: CJKF數據全碼.duplicateCount,
            總字符數: CJKF數據全碼.totalChars,
            重碼率: CJKF數據全碼.duplicateRate,
          },
          簡碼: {
            重碼組數: CJKF數據簡碼.duplicateGroupCount,
            重碼字數: CJKF數據簡碼.duplicateCount,
            總字符數: CJKF數據簡碼.totalChars,
            重碼率: CJKF數據簡碼.duplicateRate,
          },
        },
        CJK擴G靜態重碼: {
          全碼: {
            重碼組數: CJKG數據全碼.duplicateGroupCount,
            重碼字數: CJKG數據全碼.duplicateCount,
            總字符數: CJKG數據全碼.totalChars,
            重碼率: CJKG數據全碼.duplicateRate,
          },
          簡碼: {
            重碼組數: CJKG數據簡碼.duplicateGroupCount,
            重碼字數: CJKG數據簡碼.duplicateCount,
            總字符數: CJKG數據簡碼.totalChars,
            重碼率: CJKG數據簡碼.duplicateRate,
          },
        },
        CJK擴H靜態重碼: {
          全碼: {
            重碼組數: CJKH數據全碼.duplicateGroupCount,
            重碼字數: CJKH數據全碼.duplicateCount,
            總字符數: CJKH數據全碼.totalChars,
            重碼率: CJKH數據全碼.duplicateRate,
          },
          簡碼: {
            重碼組數: CJKH數據簡碼.duplicateGroupCount,
            重碼字數: CJKH數據簡碼.duplicateCount,
            總字符數: CJKH數據簡碼.totalChars,
            重碼率: CJKH數據簡碼.duplicateRate,
          },
        },
        CJK擴I靜態重碼: {
          全碼: {
            重碼組數: CJKI數據全碼.duplicateGroupCount,
            重碼字數: CJKI數據全碼.duplicateCount,
            總字符數: CJKI數據全碼.totalChars,
            重碼率: CJKI數據全碼.duplicateRate,
          },
          簡碼: {
            重碼組數: CJKI數據簡碼.duplicateGroupCount,
            重碼字數: CJKI數據簡碼.duplicateCount,
            總字符數: CJKI數據簡碼.totalChars,
            重碼率: CJKI數據簡碼.duplicateRate,
          },
        },
        CJK擴J靜態重碼: {
          全碼: {
            重碼組數: CJKJ數據全碼.duplicateGroupCount,
            重碼字數: CJKJ數據全碼.duplicateCount,
            總字符數: CJKJ數據全碼.totalChars,
            重碼率: CJKJ數據全碼.duplicateRate,
          },
          簡碼: {
            重碼組數: CJKJ數據簡碼.duplicateGroupCount,
            重碼字數: CJKJ數據簡碼.duplicateCount,
            總字符數: CJKJ數據簡碼.totalChars,
            重碼率: CJKJ數據簡碼.duplicateRate,
          },
        },
        更新時間: new Date().toISOString(),
      }

      設置分析結果(新結果)
    } catch (error) {
      設置錯誤信息(error instanceof Error ? error.message : '計算失敗')
    } finally {
      設置計算中(false)
    }
  }

  /**
   * 組件掛載時檢查數據
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    console.log('[DuplicateAnalysisPage] 組件掛載，檢查數據完整性')
    console.log('[DuplicateAnalysisPage] 分析結果:', 分析結果)
    console.log('[DuplicateAnalysisPage] 數據完整性:', 檢查數據完整性())

    if (!分析結果 || !檢查數據完整性()) {
      console.log('[DuplicateAnalysisPage] 數據不完整，檢查是否需要重新計算')
      // 數據不完整，自動觸發計算
      if (處理後碼表) {
        console.log('[DuplicateAnalysisPage] 有碼表數據，觸發重新計算')
        重新計算()
      } else {
        console.log('[DuplicateAnalysisPage] 無碼表數據，跳過計算')
      }
    } else {
      console.log('[DuplicateAnalysisPage] 數據完整，直接顯示')
    }
  }, [])

  /**
   * 顯示重碼詳情（臨時計算，不存到 atom）
   */
  const 顯示重碼字符詳情 = async (
    字頻類型: string,
    碼表類型: '全碼' | '簡碼',
    是否按字頻排序: boolean = true
  ) => {
    if (!處理後碼表) return

    設置詳情計算中(true)
    設置顯示詳情(true)

    try {
      const 使用碼表: CodeTable = 碼表類型 === '全碼' ? 處理後碼表.全碼表 : 處理後碼表.簡碼表

      // 加載對應字頻
      let 字頻數據: Record<string, number>
      if (字頻類型 === 'zhihu') {
        字頻數據 = await 字頻表服務類別.加載知乎簡體字頻()
        設置詳情標題(`知乎簡體${碼表類型}動態選重詳情${是否按字頻排序 ? '' : '（原序）'}`)
      } else if (字頻類型 === 'sc') {
        字頻數據 = await 字頻表服務類別.加載北語簡體字頻()
        設置詳情標題(`北語簡體${碼表類型}動態選重詳情${是否按字頻排序 ? '' : '（原序）'}`)
      } else if (字頻類型 === 'tc') {
        字頻數據 = await 字頻表服務類別.加載臺標繁體字頻()
        設置詳情標題(`臺標繁體${碼表類型}動態選重詳情${是否按字頻排序 ? '' : '（原序）'}`)
      } else if (字頻類型 === 'guji') {
        字頻數據 = await 字頻表服務類別.加載古籍繁體字頻()
        設置詳情標題(`古籍繁體${碼表類型}動態選重詳情${是否按字頻排序 ? '' : '（原序）'}`)
      } else if (字頻類型 === 'unified') {
        字頻數據 = await 字頻表服務類別.計算繁簡聯合字頻()
        設置詳情標題(`繁簡聯合${碼表類型}動態選重詳情${是否按字頻排序 ? '' : '（原序）'}`)
      } else {
        throw new Error('未知的字頻類型')
      }

      // 計算重碼詳情
      const 編碼映射 = new Map<string, Array<{ 字符: string; 字頻: number }>>()

      for (const [字符, 編碼數組] of 使用碼表.entries()) {
        const 編碼 = 編碼數組[0]
        if (編碼) {
          const 字頻 = 字頻數據[字符] || 0

          if (!編碼映射.has(編碼)) {
            編碼映射.set(編碼, [])
          }
          編碼映射.get(編碼)!.push({ 字符, 字頻 })
        }
      }

      // 生成詳情列表（只包含重碼）
      const 詳情列表: Array<{
        序號: number
        字符: string
        編碼: string
        字頻: number
        重碼字符列表: string
      }> = []
      let 序號 = 1

      for (const [編碼, 字符列表] of 編碼映射.entries()) {
        if (字符列表.length > 1) {
          // 按字頻排序
          if (是否按字頻排序) {
            字符列表.sort((a, b) => b.字頻 - a.字頻)
          }

          // 爲每個需要選重的字符（除首選外）添加一行
          for (let i = 1; i < 字符列表.length; i++) {
            const 當前字符 = 字符列表[i]
            if (!當前字符) continue // 類型守衛

            詳情列表.push({
              序號,
              字符: 當前字符.字符,
              編碼,
              字頻: 當前字符.字頻,
              重碼字符列表: 字符列表
                .map(c => `${c.字符}(${(c.字頻 * 10000).toFixed(2)}‱)`)
                .join('、'),
            })
            序號++
          }
        }
      }

      // 按字頻降序排列詳情列表
      詳情列表.sort((a, b) => b.字頻 - a.字頻)

      // 重新編號
      詳情列表.forEach((item, index) => {
        item.序號 = index + 1
      })

      設置重碼詳情列表(詳情列表)
    } catch (error) {
      設置錯誤信息(error instanceof Error ? error.message : '計算詳情失敗')
    } finally {
      設置詳情計算中(false)
    }
  }

  /**
   * 渲染數據表格
   */
  const 渲染表格 = () => {
    if (!分析結果) return null

    type 表格數據項 = {
      key: string
      指標: string
      全碼: string
      簡碼: string
      説明: React.ReactNode
      提示?: string
      可點擊?: boolean
      點擊處理?: (碼表類型: '全碼' | '簡碼') => void
    }

    const 動態選重率數據: 表格數據項[] = [
      {
        key: '1',
        指標: '知乎簡體動態選重率',
        全碼: 分析結果.知乎簡體動態選重率
          ? (分析結果.知乎簡體動態選重率.全碼 * 10000).toFixed(2) + '‱'
          : '-',
        簡碼: 分析結果.知乎簡體動態選重率
          ? (分析結果.知乎簡體動態選重率.簡碼 * 10000).toFixed(2) + '‱'
          : '-',
        説明: (
          <>
            基於
            <Link href="https://github.com/forfudan/chinese-characters-frequency" target="_blank">
              知乎字頻表
            </Link>
            的加權選重率，‱ 爲萬分符
          </>
        ),
        提示: '計算動態選衝率時，會使用字頻數據對漢字進行降序重排，以方便不同方案進行比較。因此上，計算結果可能會稍低於真實選重率。',
        可點擊: true,
        點擊處理: (碼表類型: '全碼' | '簡碼') => 顯示重碼字符詳情('zhihu', 碼表類型, true),
      },
      {
        key: '2',
        指標: '北語簡體動態選重率',
        全碼: 分析結果.北語簡體動態選重率
          ? (分析結果.北語簡體動態選重率.全碼 * 10000).toFixed(2) + '‱'
          : '-',
        簡碼: 分析結果.北語簡體動態選重率
          ? (分析結果.北語簡體動態選重率.簡碼 * 10000).toFixed(2) + '‱'
          : '-',
        説明: (
          <>
            基於北京語言大學邢紅兵
            <Link
              href="https://faculty.blcu.edu.cn/xinghb/zh_CN/article/167473/content/1437.htm"
              target="_blank"
            >
              簡體字頻表
            </Link>
            的加權選重率
          </>
        ),
        提示: '計算動態選衝率時，會使用字頻數據對漢字進行降序重排，以方便不同方案進行比較。因此上，計算結果可能會稍低於真實選重率。',
        可點擊: true,
        點擊處理: (碼表類型: '全碼' | '簡碼') => 顯示重碼字符詳情('sc', 碼表類型, true),
      },
      {
        key: '3',
        指標: '臺標繁體動態選重率',
        全碼: 分析結果.臺標繁體動態選重率
          ? (分析結果.臺標繁體動態選重率.全碼 * 10000).toFixed(2) + '‱'
          : '-',
        簡碼: 分析結果.臺標繁體動態選重率
          ? (分析結果.臺標繁體動態選重率.簡碼 * 10000).toFixed(2) + '‱'
          : '-',
        説明: (
          <>
            基於
            <Link
              href="https://language.moe.gov.tw/001/Upload/files/SITE_CONTENT/M0001/PIN/biau1.htm"
              target="_blank"
            >
              臺灣繁體字頻表
            </Link>
            的加權選重率
          </>
        ),
        提示: '計算動態選衝率時，會使用字頻數據對漢字進行降序重排，以方便不同方案進行比較。因此上，計算結果可能會稍低於真實選重率。',
        可點擊: true,
        點擊處理: (碼表類型: '全碼' | '簡碼') => 顯示重碼字符詳情('tc', 碼表類型, true),
      },
      {
        key: '4',
        指標: '古籍繁體動態選重率',
        全碼: 分析結果.古籍繁體動態選重率
          ? (分析結果.古籍繁體動態選重率.全碼 * 10000).toFixed(2) + '‱'
          : '-',
        簡碼: 分析結果.古籍繁體動態選重率
          ? (分析結果.古籍繁體動態選重率.簡碼 * 10000).toFixed(2) + '‱'
          : '-',
        説明: '基於史書（史記、漢書、後漢書、三國志等）字頻的加權選重率',
        提示: '計算動態選衝率時，會使用字頻數據對漢字進行降序重排，以方便不同方案進行比較。因此上，計算結果可能會稍低於真實選重率。',
        可點擊: true,
        點擊處理: (碼表類型: '全碼' | '簡碼') => 顯示重碼字符詳情('guji', 碼表類型, true),
      },
      {
        key: '5',
        指標: '繁簡聯合動態選重率',
        全碼: 分析結果.繁簡聯合動態選重率
          ? (分析結果.繁簡聯合動態選重率.全碼 * 10000).toFixed(2) + '‱'
          : '-',
        簡碼: 分析結果.繁簡聯合動態選重率
          ? (分析結果.繁簡聯合動態選重率.簡碼 * 10000).toFixed(2) + '‱'
          : '-',
        説明: '基於繁簡聯合字頻表（北語字頻+臺標字頻）的加權選重率',
        提示: '計算動態選衝率時，會使用字頻數據對漢字進行降序重排，以方便不同方案進行比較。因此上，計算結果可能會稍低於真實選重率。',
        可點擊: true,
        點擊處理: (碼表類型: '全碼' | '簡碼') => 顯示重碼字符詳情('unified', 碼表類型, true),
      },
      {
        key: '6',
        指標: '知乎簡體動重·原序',
        全碼: 分析結果.知乎簡體動態選重率原序
          ? (分析結果.知乎簡體動態選重率原序.全碼 * 10000).toFixed(2) + '‱'
          : '-',
        簡碼: 分析結果.知乎簡體動態選重率原序
          ? (分析結果.知乎簡體動態選重率原序.簡碼 * 10000).toFixed(2) + '‱'
          : '-',
        説明: '基於知乎字頻，保持碼表原始排序的加權選重率',
        提示: '不對重碼字符按字頻重新排序，保持碼表原始順序進行選重率計算。反映碼表實際使用時的選重率。',
        可點擊: true,
        點擊處理: (碼表類型: '全碼' | '簡碼') => 顯示重碼字符詳情('zhihu', 碼表類型, false),
      },
      {
        key: '7',
        指標: '北語簡體動重·原序',
        全碼: 分析結果.北語簡體動態選重率原序
          ? (分析結果.北語簡體動態選重率原序.全碼 * 10000).toFixed(2) + '‱'
          : '-',
        簡碼: 分析結果.北語簡體動態選重率原序
          ? (分析結果.北語簡體動態選重率原序.簡碼 * 10000).toFixed(2) + '‱'
          : '-',
        説明: '基於北語字頻，保持碼表原始排序的加權選重率',
        提示: '不對重碼字符按字頻重新排序，保持碼表原始順序進行選重率計算。反映碼表實際使用時的選重率。',
        可點擊: true,
        點擊處理: (碼表類型: '全碼' | '簡碼') => 顯示重碼字符詳情('sc', 碼表類型, false),
      },
      {
        key: '8',
        指標: '臺標繁體動重·原序',
        全碼: 分析結果.臺標繁體動態選重率原序
          ? (分析結果.臺標繁體動態選重率原序.全碼 * 10000).toFixed(2) + '‱'
          : '-',
        簡碼: 分析結果.臺標繁體動態選重率原序
          ? (分析結果.臺標繁體動態選重率原序.簡碼 * 10000).toFixed(2) + '‱'
          : '-',
        説明: '基於臺標字頻，保持碼表原始排序的加權選重率',
        提示: '不對重碼字符按字頻重新排序，保持碼表原始順序進行選重率計算。反映碼表實際使用時的選重率。',
        可點擊: true,
        點擊處理: (碼表類型: '全碼' | '簡碼') => 顯示重碼字符詳情('tc', 碼表類型, false),
      },
      {
        key: '9',
        指標: '古籍繁體動重·原序',
        全碼: 分析結果.古籍繁體動態選重率原序
          ? (分析結果.古籍繁體動態選重率原序.全碼 * 10000).toFixed(2) + '‱'
          : '-',
        簡碼: 分析結果.古籍繁體動態選重率原序
          ? (分析結果.古籍繁體動態選重率原序.簡碼 * 10000).toFixed(2) + '‱'
          : '-',
        説明: '基於古籍字頻，保持碼表原始排序的加權選重率',
        提示: '不對重碼字符按字頻重新排序，保持碼表原始順序進行選重率計算。反映碼表實際使用時的選重率。',
        可點擊: true,
        點擊處理: (碼表類型: '全碼' | '簡碼') => 顯示重碼字符詳情('guji', 碼表類型, false),
      },
      {
        key: '10',
        指標: '繁簡聯合動重·原序',
        全碼: 分析結果.繁簡聯合動態選重率原序
          ? (分析結果.繁簡聯合動態選重率原序.全碼 * 10000).toFixed(2) + '‱'
          : '-',
        簡碼: 分析結果.繁簡聯合動態選重率原序
          ? (分析結果.繁簡聯合動態選重率原序.簡碼 * 10000).toFixed(2) + '‱'
          : '-',
        説明: '基於繁簡聯合字頻表（北語字頻+臺標字頻），保持碼表原始排序的加權選重率',
        提示: '不對重碼字符按字頻重新排序，保持碼表原始順序進行選重率計算。反映碼表實際使用時的選重率。',
        可點擊: true,
        點擊處理: (碼表類型: '全碼' | '簡碼') => 顯示重碼字符詳情('unified', 碼表類型, false),
      },
      {
        key: '11',
        指標: 'GB2312重碼組數',
        全碼: 分析結果.GB2312靜態重碼?.全碼?.重碼組數?.toLocaleString() ?? '-',
        簡碼: 分析結果.GB2312靜態重碼?.簡碼?.重碼組數?.toLocaleString() ?? '-',
        説明: 'GB2312字符集中的重碼組數',
        可點擊: false,
      },
      {
        key: '12',
        指標: '通規重碼組數',
        全碼: 分析結果.通用規範靜態重碼?.全碼?.重碼組數?.toLocaleString() ?? '-',
        簡碼: 分析結果.通用規範靜態重碼?.簡碼?.重碼組數?.toLocaleString() ?? '-',
        説明: '通用規範漢字表字符集中的重碼組數',
        可點擊: false,
      },
      {
        key: '13',
        指標: '國字重碼組數',
        全碼: 分析結果.常用國字靜態重碼?.全碼?.重碼組數?.toLocaleString() ?? '-',
        簡碼: 分析結果.常用國字靜態重碼?.簡碼?.重碼組數?.toLocaleString() ?? '-',
        説明: '常用國字標準字體表字符集中的重碼組數',
        可點擊: false,
      },
      {
        key: '14',
        指標: 'GB2312重碼字數',
        全碼: 分析結果.GB2312靜態重碼?.全碼?.重碼字數?.toLocaleString() ?? '-',
        簡碼: 分析結果.GB2312靜態重碼?.簡碼?.重碼字數?.toLocaleString() ?? '-',
        説明: 分析結果.GB2312靜態重碼?.全碼?.總字符數
          ? `${分析結果.GB2312靜態重碼.全碼.總字符數.toLocaleString()} 之 ${分析結果.GB2312靜態重碼.全碼.總字符數.toLocaleString()} 有編碼`
          : '-',
        可點擊: false,
      },
      {
        key: '15',
        指標: '通規重碼字數',
        全碼: 分析結果.通用規範靜態重碼?.全碼?.重碼字數?.toLocaleString() ?? '-',
        簡碼: 分析結果.通用規範靜態重碼?.簡碼?.重碼字數?.toLocaleString() ?? '-',
        説明: 分析結果.通用規範靜態重碼?.全碼?.總字符數
          ? `${分析結果.通用規範靜態重碼.全碼.總字符數.toLocaleString()} 之 ${分析結果.通用規範靜態重碼.全碼.總字符數.toLocaleString()} 有編碼`
          : '-',
        可點擊: false,
      },
      {
        key: '16',
        指標: '國字重碼字數',
        全碼: 分析結果.常用國字靜態重碼?.全碼?.重碼字數?.toLocaleString() ?? '-',
        簡碼: 分析結果.常用國字靜態重碼?.簡碼?.重碼字數?.toLocaleString() ?? '-',
        説明: 分析結果.常用國字靜態重碼?.全碼?.總字符數
          ? `${分析結果.常用國字靜態重碼.全碼.總字符數.toLocaleString()} 之 ${分析結果.常用國字靜態重碼.全碼.總字符數.toLocaleString()} 有編碼`
          : '-',
        可點擊: false,
      },
      {
        key: '17',
        指標: 'CJK基本區重碼字數',
        全碼: 分析結果.CJK基本靜態重碼?.全碼?.重碼字數?.toLocaleString() ?? '-',
        簡碼: 分析結果.CJK基本靜態重碼?.簡碼?.重碼字數?.toLocaleString() ?? '-',
        説明: 分析結果.CJK基本靜態重碼?.全碼?.總字符數
          ? `${分析結果.CJK基本靜態重碼.全碼.總字符數.toLocaleString()} 之 ${分析結果.CJK基本靜態重碼.全碼.總字符數.toLocaleString()} 有編碼`
          : '-',
        可點擊: false,
      },
      {
        key: '18',
        指標: '到CJK-A重碼字數',
        全碼: 分析結果.CJK擴A靜態重碼?.全碼?.重碼字數?.toLocaleString() ?? '-',
        簡碼: 分析結果.CJK擴A靜態重碼?.簡碼?.重碼字數?.toLocaleString() ?? '-',
        説明: 分析結果.CJK擴A靜態重碼?.全碼?.總字符數
          ? `${分析結果.CJK擴A靜態重碼.全碼.總字符數.toLocaleString()} 之 ${分析結果.CJK擴A靜態重碼.全碼.總字符數.toLocaleString()} 有編碼`
          : '-',
        可點擊: false,
      },
      {
        key: '19',
        指標: '到CJK-B重碼字數',
        全碼: 分析結果.CJK擴B靜態重碼?.全碼?.重碼字數?.toLocaleString() ?? '-',
        簡碼: 分析結果.CJK擴B靜態重碼?.簡碼?.重碼字數?.toLocaleString() ?? '-',
        説明: 分析結果.CJK擴B靜態重碼?.全碼?.總字符數
          ? `${分析結果.CJK擴B靜態重碼.全碼.總字符數.toLocaleString()} 之 ${分析結果.CJK擴B靜態重碼.全碼.總字符數.toLocaleString()} 有編碼`
          : '-',
        可點擊: false,
      },
      {
        key: '20',
        指標: '到CJK-C重碼字數',
        全碼: 分析結果.CJK擴C靜態重碼?.全碼?.重碼字數?.toLocaleString() ?? '-',
        簡碼: 分析結果.CJK擴C靜態重碼?.簡碼?.重碼字數?.toLocaleString() ?? '-',
        説明: 分析結果.CJK擴C靜態重碼?.全碼?.總字符數
          ? `${分析結果.CJK擴C靜態重碼.全碼.總字符數.toLocaleString()} 之 ${分析結果.CJK擴C靜態重碼.全碼.總字符數.toLocaleString()} 有編碼`
          : '-',
        可點擊: false,
      },
      {
        key: '21',
        指標: '到CJK-D重碼字數',
        全碼: 分析結果.CJK擴D靜態重碼?.全碼?.重碼字數?.toLocaleString() ?? '-',
        簡碼: 分析結果.CJK擴D靜態重碼?.簡碼?.重碼字數?.toLocaleString() ?? '-',
        説明: 分析結果.CJK擴D靜態重碼?.全碼?.總字符數
          ? `${分析結果.CJK擴D靜態重碼.全碼.總字符數.toLocaleString()} 之 ${分析結果.CJK擴D靜態重碼.全碼.總字符數.toLocaleString()} 有編碼`
          : '-',
        可點擊: false,
      },
      {
        key: '22',
        指標: '到CJK-E重碼字數',
        全碼: 分析結果.CJK擴E靜態重碼?.全碼?.重碼字數?.toLocaleString() ?? '-',
        簡碼: 分析結果.CJK擴E靜態重碼?.簡碼?.重碼字數?.toLocaleString() ?? '-',
        説明: 分析結果.CJK擴E靜態重碼?.全碼?.總字符數
          ? `${分析結果.CJK擴E靜態重碼.全碼.總字符數.toLocaleString()} 之 ${分析結果.CJK擴E靜態重碼.全碼.總字符數.toLocaleString()} 有編碼`
          : '-',
        可點擊: false,
      },
      {
        key: '23',
        指標: '到CJK-F重碼字數',
        全碼: 分析結果.CJK擴F靜態重碼?.全碼?.重碼字數?.toLocaleString() ?? '-',
        簡碼: 分析結果.CJK擴F靜態重碼?.簡碼?.重碼字數?.toLocaleString() ?? '-',
        説明: 分析結果.CJK擴F靜態重碼?.全碼?.總字符數
          ? `${分析結果.CJK擴F靜態重碼.全碼.總字符數.toLocaleString()} 之 ${分析結果.CJK擴F靜態重碼.全碼.總字符數.toLocaleString()} 有編碼`
          : '-',
        可點擊: false,
      },
      {
        key: '24',
        指標: '到CJK-G重碼字數',
        全碼: 分析結果.CJK擴G靜態重碼?.全碼?.重碼字數?.toLocaleString() ?? '-',
        簡碼: 分析結果.CJK擴G靜態重碼?.簡碼?.重碼字數?.toLocaleString() ?? '-',
        説明: 分析結果.CJK擴G靜態重碼?.全碼?.總字符數
          ? `${分析結果.CJK擴G靜態重碼.全碼.總字符數.toLocaleString()} 之 ${分析結果.CJK擴G靜態重碼.全碼.總字符數.toLocaleString()} 有編碼`
          : '-',
        可點擊: false,
      },
      {
        key: '25',
        指標: '到CJK-H重碼字數',
        全碼: 分析結果.CJK擴H靜態重碼?.全碼?.重碼字數?.toLocaleString() ?? '-',
        簡碼: 分析結果.CJK擴H靜態重碼?.簡碼?.重碼字數?.toLocaleString() ?? '-',
        説明: 分析結果.CJK擴H靜態重碼?.全碼?.總字符數
          ? `${分析結果.CJK擴H靜態重碼.全碼.總字符數.toLocaleString()} 之 ${分析結果.CJK擴H靜態重碼.全碼.總字符數.toLocaleString()} 有編碼`
          : '-',
        可點擊: false,
      },
      {
        key: '26',
        指標: '到CJK-I重碼字數',
        全碼: 分析結果.CJK擴I靜態重碼?.全碼?.重碼字數?.toLocaleString() ?? '-',
        簡碼: 分析結果.CJK擴I靜態重碼?.簡碼?.重碼字數?.toLocaleString() ?? '-',
        説明: 分析結果.CJK擴I靜態重碼?.全碼?.總字符數
          ? `${分析結果.CJK擴I靜態重碼.全碼.總字符數.toLocaleString()} 之 ${分析結果.CJK擴I靜態重碼.全碼.總字符數.toLocaleString()} 有編碼`
          : '-',
        可點擊: false,
      },
      {
        key: '27',
        指標: '到CJK-J重碼字數',
        全碼: 分析結果.CJK擴J靜態重碼?.全碼?.重碼字數?.toLocaleString() ?? '-',
        簡碼: 分析結果.CJK擴J靜態重碼?.簡碼?.重碼字數?.toLocaleString() ?? '-',
        説明: 分析結果.CJK擴J靜態重碼?.全碼?.總字符數
          ? `${分析結果.CJK擴J靜態重碼.全碼.總字符數.toLocaleString()} 之 ${分析結果.CJK擴J靜態重碼.全碼.總字符數.toLocaleString()} 有編碼`
          : '-',
        可點擊: false,
      },
    ]

    const 列定義: ColumnsType<表格數據項> = [
      {
        title: '單字指標',
        dataIndex: '指標',
        key: '指標',
        render: (text, record) =>
          record.提示 ? (
            <Tooltip title={record.提示}>
              <span style={{ cursor: 'help', borderBottom: '1px dotted #999' }}>{text}</span>
            </Tooltip>
          ) : (
            text
          ),
      },
      {
        title: '全碼',
        dataIndex: '全碼',
        key: '全碼',
        align: 'right',
        render: (text, record) =>
          record.可點擊 ? (
            <span
              style={{ cursor: 'pointer', color: '#1890ff' }}
              onClick={() => record.點擊處理?.('全碼')}
            >
              {text}
            </span>
          ) : (
            text
          ),
      },
      {
        title: (
          <Tooltip title="計算簡碼時，會提取碼表相同漢字中編碼長度最小之編碼，並視之爲簡碼。故而出現多重簡碼、兼容編碼、無理碼等特殊情况時，該列數據會出現失真現象。欲獲取更加準確之統計，請對碼表進行處理。">
            <span style={{ cursor: 'help', borderBottom: '1px dotted #999' }}>出簡</span>
          </Tooltip>
        ),
        dataIndex: '簡碼',
        key: '簡碼',
        width: 120,
        align: 'right',
        render: (text, record) =>
          record.可點擊 ? (
            <span
              style={{ cursor: 'pointer', color: '#1890ff' }}
              onClick={() => record.點擊處理?.('簡碼')}
            >
              {text}
            </span>
          ) : (
            text
          ),
      },
      {
        title: '説明',
        dataIndex: '説明',
        key: '説明',
      },
    ]

    return (
      <Table
        columns={列定義}
        dataSource={動態選重率數據}
        pagination={false}
        bordered
        style={{ marginTop: 16 }}
      />
    )
  }

  /**
   * 重碼詳情表格列定義
   */
  type 詳情表格數據項 = {
    序號: number
    字符: string
    編碼: string
    字頻: number
    重碼字符列表: string
  }

  const 詳情列定義: ColumnsType<詳情表格數據項> = [
    { title: '#', dataIndex: '序號', key: '序號', width: 60 },
    { title: '重碼字', dataIndex: '字符', key: '字符', width: 80 },
    { title: '編碼', dataIndex: '編碼', key: '編碼', width: 100 },
    {
      title: '字頻（‱）',
      dataIndex: '字頻',
      key: '字頻',
      width: 100,
      render: (v: number) => (v * 10000).toFixed(2),
    },
    {
      title: '該編碼上的字符（字頻降序）',
      dataIndex: '重碼字符列表',
      key: '重碼字符列表',
      ellipsis: true,
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        {/* 頁面標題 */}
        <div>
          <Paragraph>
            分析不同字符集下的重碼情况，計算靜態重碼率和動態選重率。閲讀
            <Link href="https://shurufa.app/docs/concepts.html" target="_blank">
              瓊林擷英
            </Link>
            瞭解詳細定義。‱ 爲萬分符。
          </Paragraph>
        </div>

        {/* 操作按鈕 */}
        <Space>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={重新計算}
            loading={計算中}
            disabled={!碼表數據}
          >
            重新計算
          </Button>
        </Space>

        {/* 錯誤提示 */}
        {錯誤信息 && (
          <Alert title={錯誤信息} type="error" closable onClose={() => 設置錯誤信息(null)} />
        )}

        {/* 加載中 */}
        {計算中 && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Spin size="large" />
            <p style={{ marginTop: 16 }}>正在計算重碼數據...</p>
          </div>
        )}

        {/* 數據表格 */}
        {!計算中 && 分析結果 && 渲染表格()}

        {/* 無數據提示 */}
        {!計算中 && !分析結果 && !錯誤信息 && (
          <Alert
            title="請點擊「重新計算」來查看分析結果"
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}

        {/* 提示信息 */}
        {分析結果 && (
          <Alert
            title="💡 提示"
            description="點擊動態選重率的數值，可查看具體需要選重的字符及其編碼詳情。"
            type="info"
            showIcon
          />
        )}
      </Space>

      {/* 重碼詳情 Modal */}
      <Modal
        title={詳情標題}
        open={顯示詳情}
        onCancel={() => 設置顯示詳情(false)}
        width={1200}
        footer={[
          <Button key="close" onClick={() => 設置顯示詳情(false)}>
            關閉
          </Button>,
        ]}
      >
        {詳情計算中 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
            <p style={{ marginTop: 16 }}>正在計算重碼詳情...</p>
          </div>
        ) : (
          <Table
            columns={詳情列定義}
            dataSource={重碼詳情列表}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: total => `共 ${total} 條`,
            }}
            bordered
            size="small"
            scroll={{ y: 500 }}
          />
        )}
      </Modal>
    </div>
  )
}

export default DuplicatePage
