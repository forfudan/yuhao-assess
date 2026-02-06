import React, { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { Button, Space, Typography, Alert, Spin, Table, message } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { 碼表原子狀態 } from '../atoms/codeTable'
import { 靜態重碼分析原子狀態 } from '../atoms/staticDuplicate'
import type { 靜態重碼分析結果介面 } from '../atoms/staticDuplicate'
import { 計算某字符集的重碼數據 } from '../services/duplicateAnalysisService'
import type { 處理後的碼表結果介面 } from '../types'

const { Paragraph, Link } = Typography

/**
 * 靜態重碼分析頁面
 * 展示各字符集的靜態重碼數據、字集覆蓋率
 */
const StaticDuplicateAnalysisPage: React.FC = () => {
  const [碼表數據] = useAtom(碼表原子狀態)
  const [分析結果, 設置分析結果] = useAtom(靜態重碼分析原子狀態)
  const [計算中, 設置計算中] = useState(false)
  const [錯誤信息, 設置錯誤信息] = useState<string | null>(null)

  // 類型斷言：碼表數據實際上是 處理後的碼表結果
  const 處理後碼表 = 碼表數據 as 處理後的碼表結果介面 | null

  /**
   * 檢查數據是否完整
   */
  const 檢查數據完整性 = (): boolean => {
    if (!分析結果) return false

    const 必需字段 = [
      'GB2312',
      '通用規範',
      '常用國字',
      'CJK基本',
      '到CJKA',
      '到CJKB',
      '到CJKC',
      '到CJKD',
      '到CJKE',
      '到CJKF',
      '到CJKG',
      '到CJKH',
      '到CJKI',
      '到CJKJ',
    ]

    return 必需字段.every(字段 => 字段 in 分析結果)
  }

  /**
   * 重新計算靜態重碼數據
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

      // 計算所有字符集的重碼數據
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
        計算某字符集的重碼數據(全碼表, 'gb2312'),
        計算某字符集的重碼數據(全碼表, 'tonggui'),
        計算某字符集的重碼數據(全碼表, 'guozi'),
        計算某字符集的重碼數據(全碼表, 'cjk_basic'),
        計算某字符集的重碼數據(全碼表, 'cjk_to_a'),
        計算某字符集的重碼數據(全碼表, 'cjk_to_b'),
        計算某字符集的重碼數據(全碼表, 'cjk_to_c'),
        計算某字符集的重碼數據(全碼表, 'cjk_to_d'),
        計算某字符集的重碼數據(全碼表, 'cjk_to_e'),
        計算某字符集的重碼數據(全碼表, 'cjk_to_f'),
        計算某字符集的重碼數據(全碼表, 'cjk_to_g'),
        計算某字符集的重碼數據(全碼表, 'cjk_to_h'),
        計算某字符集的重碼數據(全碼表, 'cjk_to_i'),
        計算某字符集的重碼數據(全碼表, 'cjk_to_j'),
      ])

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
        計算某字符集的重碼數據(簡碼表, 'gb2312'),
        計算某字符集的重碼數據(簡碼表, 'tonggui'),
        計算某字符集的重碼數據(簡碼表, 'guozi'),
        計算某字符集的重碼數據(簡碼表, 'cjk_basic'),
        計算某字符集的重碼數據(簡碼表, 'cjk_to_a'),
        計算某字符集的重碼數據(簡碼表, 'cjk_to_b'),
        計算某字符集的重碼數據(簡碼表, 'cjk_to_c'),
        計算某字符集的重碼數據(簡碼表, 'cjk_to_d'),
        計算某字符集的重碼數據(簡碼表, 'cjk_to_e'),
        計算某字符集的重碼數據(簡碼表, 'cjk_to_f'),
        計算某字符集的重碼數據(簡碼表, 'cjk_to_g'),
        計算某字符集的重碼數據(簡碼表, 'cjk_to_h'),
        計算某字符集的重碼數據(簡碼表, 'cjk_to_i'),
        計算某字符集的重碼數據(簡碼表, 'cjk_to_j'),
      ])

      const 新結果: 靜態重碼分析結果介面 = {
        GB2312: {
          全碼重碼組數: GB2312數據全碼.duplicateGroupCount,
          簡碼重碼組數: GB2312數據簡碼.duplicateGroupCount,
          全碼重碼字數: GB2312數據全碼.duplicateCount,
          簡碼重碼字數: GB2312數據簡碼.duplicateCount,
          實際字符數: GB2312數據全碼.totalChars,
          理論字符數: GB2312數據全碼.theoreticalSize,
          字集覆蓋率: GB2312數據全碼.totalChars / GB2312數據全碼.theoreticalSize,
        },
        通用規範: {
          全碼重碼組數: 通用規範數據全碼.duplicateGroupCount,
          簡碼重碼組數: 通用規範數據簡碼.duplicateGroupCount,
          全碼重碼字數: 通用規範數據全碼.duplicateCount,
          簡碼重碼字數: 通用規範數據簡碼.duplicateCount,
          實際字符數: 通用規範數據全碼.totalChars,
          理論字符數: 通用規範數據全碼.theoreticalSize,
          字集覆蓋率: 通用規範數據全碼.totalChars / 通用規範數據全碼.theoreticalSize,
        },
        常用國字: {
          全碼重碼組數: 常用國字數據全碼.duplicateGroupCount,
          簡碼重碼組數: 常用國字數據簡碼.duplicateGroupCount,
          全碼重碼字數: 常用國字數據全碼.duplicateCount,
          簡碼重碼字數: 常用國字數據簡碼.duplicateCount,
          實際字符數: 常用國字數據全碼.totalChars,
          理論字符數: 常用國字數據全碼.theoreticalSize,
          字集覆蓋率: 常用國字數據全碼.totalChars / 常用國字數據全碼.theoreticalSize,
        },
        CJK基本: {
          全碼重碼組數: CJK基本數據全碼.duplicateGroupCount,
          簡碼重碼組數: CJK基本數據簡碼.duplicateGroupCount,
          全碼重碼字數: CJK基本數據全碼.duplicateCount,
          簡碼重碼字數: CJK基本數據簡碼.duplicateCount,
          實際字符數: CJK基本數據全碼.totalChars,
          理論字符數: CJK基本數據全碼.theoreticalSize,
          字集覆蓋率: CJK基本數據全碼.totalChars / CJK基本數據全碼.theoreticalSize,
        },
        到CJKA: {
          全碼重碼組數: CJKA數據全碼.duplicateGroupCount,
          簡碼重碼組數: CJKA數據簡碼.duplicateGroupCount,
          全碼重碼字數: CJKA數據全碼.duplicateCount,
          簡碼重碼字數: CJKA數據簡碼.duplicateCount,
          實際字符數: CJKA數據全碼.totalChars,
          理論字符數: CJKA數據全碼.theoreticalSize,
          字集覆蓋率: CJKA數據全碼.totalChars / CJKA數據全碼.theoreticalSize,
        },
        到CJKB: {
          全碼重碼組數: CJKB數據全碼.duplicateGroupCount,
          簡碼重碼組數: CJKB數據簡碼.duplicateGroupCount,
          全碼重碼字數: CJKB數據全碼.duplicateCount,
          簡碼重碼字數: CJKB數據簡碼.duplicateCount,
          實際字符數: CJKB數據全碼.totalChars,
          理論字符數: CJKB數據全碼.theoreticalSize,
          字集覆蓋率: CJKB數據全碼.totalChars / CJKB數據全碼.theoreticalSize,
        },
        到CJKC: {
          全碼重碼組數: CJKC數據全碼.duplicateGroupCount,
          簡碼重碼組數: CJKC數據簡碼.duplicateGroupCount,
          全碼重碼字數: CJKC數據全碼.duplicateCount,
          簡碼重碼字數: CJKC數據簡碼.duplicateCount,
          實際字符數: CJKC數據全碼.totalChars,
          理論字符數: CJKC數據全碼.theoreticalSize,
          字集覆蓋率: CJKC數據全碼.totalChars / CJKC數據全碼.theoreticalSize,
        },
        到CJKD: {
          全碼重碼組數: CJKD數據全碼.duplicateGroupCount,
          簡碼重碼組數: CJKD數據簡碼.duplicateGroupCount,
          全碼重碼字數: CJKD數據全碼.duplicateCount,
          簡碼重碼字數: CJKD數據簡碼.duplicateCount,
          實際字符數: CJKD數據全碼.totalChars,
          理論字符數: CJKD數據全碼.theoreticalSize,
          字集覆蓋率: CJKD數據全碼.totalChars / CJKD數據全碼.theoreticalSize,
        },
        到CJKE: {
          全碼重碼組數: CJKE數據全碼.duplicateGroupCount,
          簡碼重碼組數: CJKE數據簡碼.duplicateGroupCount,
          全碼重碼字數: CJKE數據全碼.duplicateCount,
          簡碼重碼字數: CJKE數據簡碼.duplicateCount,
          實際字符數: CJKE數據全碼.totalChars,
          理論字符數: CJKE數據全碼.theoreticalSize,
          字集覆蓋率: CJKE數據全碼.totalChars / CJKE數據全碼.theoreticalSize,
        },
        到CJKF: {
          全碼重碼組數: CJKF數據全碼.duplicateGroupCount,
          簡碼重碼組數: CJKF數據簡碼.duplicateGroupCount,
          全碼重碼字數: CJKF數據全碼.duplicateCount,
          簡碼重碼字數: CJKF數據簡碼.duplicateCount,
          實際字符數: CJKF數據全碼.totalChars,
          理論字符數: CJKF數據全碼.theoreticalSize,
          字集覆蓋率: CJKF數據全碼.totalChars / CJKF數據全碼.theoreticalSize,
        },
        到CJKG: {
          全碼重碼組數: CJKG數據全碼.duplicateGroupCount,
          簡碼重碼組數: CJKG數據簡碼.duplicateGroupCount,
          全碼重碼字數: CJKG數據全碼.duplicateCount,
          簡碼重碼字數: CJKG數據簡碼.duplicateCount,
          實際字符數: CJKG數據全碼.totalChars,
          理論字符數: CJKG數據全碼.theoreticalSize,
          字集覆蓋率: CJKG數據全碼.totalChars / CJKG數據全碼.theoreticalSize,
        },
        到CJKH: {
          全碼重碼組數: CJKH數據全碼.duplicateGroupCount,
          簡碼重碼組數: CJKH數據簡碼.duplicateGroupCount,
          全碼重碼字數: CJKH數據全碼.duplicateCount,
          簡碼重碼字數: CJKH數據簡碼.duplicateCount,
          實際字符數: CJKH數據全碼.totalChars,
          理論字符數: CJKH數據全碼.theoreticalSize,
          字集覆蓋率: CJKH數據全碼.totalChars / CJKH數據全碼.theoreticalSize,
        },
        到CJKI: {
          全碼重碼組數: CJKI數據全碼.duplicateGroupCount,
          簡碼重碼組數: CJKI數據簡碼.duplicateGroupCount,
          全碼重碼字數: CJKI數據全碼.duplicateCount,
          簡碼重碼字數: CJKI數據簡碼.duplicateCount,
          實際字符數: CJKI數據全碼.totalChars,
          理論字符數: CJKI數據全碼.theoreticalSize,
          字集覆蓋率: CJKI數據全碼.totalChars / CJKI數據全碼.theoreticalSize,
        },
        到CJKJ: {
          全碼重碼組數: CJKJ數據全碼.duplicateGroupCount,
          簡碼重碼組數: CJKJ數據簡碼.duplicateGroupCount,
          全碼重碼字數: CJKJ數據全碼.duplicateCount,
          簡碼重碼字數: CJKJ數據簡碼.duplicateCount,
          實際字符數: CJKJ數據全碼.totalChars,
          理論字符數: CJKJ數據全碼.theoreticalSize,
          字集覆蓋率: CJKJ數據全碼.totalChars / CJKJ數據全碼.theoreticalSize,
        },
        更新時間: new Date().toISOString(),
      }

      設置分析結果(新結果)
      message.success('靜態重碼分析計算完成')
    } catch (error) {
      設置錯誤信息(error instanceof Error ? error.message : '計算失敗')
    } finally {
      設置計算中(false)
    }
  }

  /**
   * 組件掛載時檢查數據
   */
  useEffect(() => {
    if (!分析結果 || !檢查數據完整性()) {
      // 數據不完整，自動觸發計算
      if (處理後碼表) {
        重新計算()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * 渲染數據表格
   */
  const 渲染表格 = () => {
    if (!分析結果) return null

    type 表格數據項 = {
      key: string
      字集名稱: string
      全碼重碼組數: string
      簡碼重碼組數: string
      全碼重碼字數: string
      簡碼重碼字數: string
      實際字符數: string
      理論字符數: string
      字集覆蓋率: string
    }

    const 靜態重碼數據: 表格數據項[] = [
      {
        key: '1',
        字集名稱: 'GB2312',
        全碼重碼組數: 分析結果.GB2312.全碼重碼組數.toLocaleString(),
        簡碼重碼組數: 分析結果.GB2312.簡碼重碼組數.toLocaleString(),
        全碼重碼字數: 分析結果.GB2312.全碼重碼字數.toLocaleString(),
        簡碼重碼字數: 分析結果.GB2312.簡碼重碼字數.toLocaleString(),
        實際字符數: 分析結果.GB2312.實際字符數.toLocaleString(),
        理論字符數: 分析結果.GB2312.理論字符數.toLocaleString(),
        字集覆蓋率: (分析結果.GB2312.字集覆蓋率 * 100).toFixed(2) + '%',
      },
      {
        key: '2',
        字集名稱: '通用規範',
        全碼重碼組數: 分析結果.通用規範.全碼重碼組數.toLocaleString(),
        簡碼重碼組數: 分析結果.通用規範.簡碼重碼組數.toLocaleString(),
        全碼重碼字數: 分析結果.通用規範.全碼重碼字數.toLocaleString(),
        簡碼重碼字數: 分析結果.通用規範.簡碼重碼字數.toLocaleString(),
        實際字符數: 分析結果.通用規範.實際字符數.toLocaleString(),
        理論字符數: 分析結果.通用規範.理論字符數.toLocaleString(),
        字集覆蓋率: (分析結果.通用規範.字集覆蓋率 * 100).toFixed(2) + '%',
      },
      {
        key: '3',
        字集名稱: '常用國字',
        全碼重碼組數: 分析結果.常用國字.全碼重碼組數.toLocaleString(),
        簡碼重碼組數: 分析結果.常用國字.簡碼重碼組數.toLocaleString(),
        全碼重碼字數: 分析結果.常用國字.全碼重碼字數.toLocaleString(),
        簡碼重碼字數: 分析結果.常用國字.簡碼重碼字數.toLocaleString(),
        實際字符數: 分析結果.常用國字.實際字符數.toLocaleString(),
        理論字符數: 分析結果.常用國字.理論字符數.toLocaleString(),
        字集覆蓋率: (分析結果.常用國字.字集覆蓋率 * 100).toFixed(2) + '%',
      },
      {
        key: '4',
        字集名稱: 'CJK基本',
        全碼重碼組數: 分析結果.CJK基本.全碼重碼組數.toLocaleString(),
        簡碼重碼組數: 分析結果.CJK基本.簡碼重碼組數.toLocaleString(),
        全碼重碼字數: 分析結果.CJK基本.全碼重碼字數.toLocaleString(),
        簡碼重碼字數: 分析結果.CJK基本.簡碼重碼字數.toLocaleString(),
        實際字符數: 分析結果.CJK基本.實際字符數.toLocaleString(),
        理論字符數: 分析結果.CJK基本.理論字符數.toLocaleString(),
        字集覆蓋率: (分析結果.CJK基本.字集覆蓋率 * 100).toFixed(2) + '%',
      },
      {
        key: '5',
        字集名稱: '到CJK-A',
        全碼重碼組數: 分析結果.到CJKA.全碼重碼組數.toLocaleString(),
        簡碼重碼組數: 分析結果.到CJKA.簡碼重碼組數.toLocaleString(),
        全碼重碼字數: 分析結果.到CJKA.全碼重碼字數.toLocaleString(),
        簡碼重碼字數: 分析結果.到CJKA.簡碼重碼字數.toLocaleString(),
        實際字符數: 分析結果.到CJKA.實際字符數.toLocaleString(),
        理論字符數: 分析結果.到CJKA.理論字符數.toLocaleString(),
        字集覆蓋率: (分析結果.到CJKA.字集覆蓋率 * 100).toFixed(2) + '%',
      },
      {
        key: '6',
        字集名稱: '到CJK-B',
        全碼重碼組數: 分析結果.到CJKB.全碼重碼組數.toLocaleString(),
        簡碼重碼組數: 分析結果.到CJKB.簡碼重碼組數.toLocaleString(),
        全碼重碼字數: 分析結果.到CJKB.全碼重碼字數.toLocaleString(),
        簡碼重碼字數: 分析結果.到CJKB.簡碼重碼字數.toLocaleString(),
        實際字符數: 分析結果.到CJKB.實際字符數.toLocaleString(),
        理論字符數: 分析結果.到CJKB.理論字符數.toLocaleString(),
        字集覆蓋率: (分析結果.到CJKB.字集覆蓋率 * 100).toFixed(2) + '%',
      },
      {
        key: '7',
        字集名稱: '到CJK-C',
        全碼重碼組數: 分析結果.到CJKC.全碼重碼組數.toLocaleString(),
        簡碼重碼組數: 分析結果.到CJKC.簡碼重碼組數.toLocaleString(),
        全碼重碼字數: 分析結果.到CJKC.全碼重碼字數.toLocaleString(),
        簡碼重碼字數: 分析結果.到CJKC.簡碼重碼字數.toLocaleString(),
        實際字符數: 分析結果.到CJKC.實際字符數.toLocaleString(),
        理論字符數: 分析結果.到CJKC.理論字符數.toLocaleString(),
        字集覆蓋率: (分析結果.到CJKC.字集覆蓋率 * 100).toFixed(2) + '%',
      },
      {
        key: '8',
        字集名稱: '到CJK-D',
        全碼重碼組數: 分析結果.到CJKD.全碼重碼組數.toLocaleString(),
        簡碼重碼組數: 分析結果.到CJKD.簡碼重碼組數.toLocaleString(),
        全碼重碼字數: 分析結果.到CJKD.全碼重碼字數.toLocaleString(),
        簡碼重碼字數: 分析結果.到CJKD.簡碼重碼字數.toLocaleString(),
        實際字符數: 分析結果.到CJKD.實際字符數.toLocaleString(),
        理論字符數: 分析結果.到CJKD.理論字符數.toLocaleString(),
        字集覆蓋率: (分析結果.到CJKD.字集覆蓋率 * 100).toFixed(2) + '%',
      },
      {
        key: '9',
        字集名稱: '到CJK-E',
        全碼重碼組數: 分析結果.到CJKE.全碼重碼組數.toLocaleString(),
        簡碼重碼組數: 分析結果.到CJKE.簡碼重碼組數.toLocaleString(),
        全碼重碼字數: 分析結果.到CJKE.全碼重碼字數.toLocaleString(),
        簡碼重碼字數: 分析結果.到CJKE.簡碼重碼字數.toLocaleString(),
        實際字符數: 分析結果.到CJKE.實際字符數.toLocaleString(),
        理論字符數: 分析結果.到CJKE.理論字符數.toLocaleString(),
        字集覆蓋率: (分析結果.到CJKE.字集覆蓋率 * 100).toFixed(2) + '%',
      },
      {
        key: '10',
        字集名稱: '到CJK-F',
        全碼重碼組數: 分析結果.到CJKF.全碼重碼組數.toLocaleString(),
        簡碼重碼組數: 分析結果.到CJKF.簡碼重碼組數.toLocaleString(),
        全碼重碼字數: 分析結果.到CJKF.全碼重碼字數.toLocaleString(),
        簡碼重碼字數: 分析結果.到CJKF.簡碼重碼字數.toLocaleString(),
        實際字符數: 分析結果.到CJKF.實際字符數.toLocaleString(),
        理論字符數: 分析結果.到CJKF.理論字符數.toLocaleString(),
        字集覆蓋率: (分析結果.到CJKF.字集覆蓋率 * 100).toFixed(2) + '%',
      },
      {
        key: '11',
        字集名稱: '到CJK-G',
        全碼重碼組數: 分析結果.到CJKG.全碼重碼組數.toLocaleString(),
        簡碼重碼組數: 分析結果.到CJKG.簡碼重碼組數.toLocaleString(),
        全碼重碼字數: 分析結果.到CJKG.全碼重碼字數.toLocaleString(),
        簡碼重碼字數: 分析結果.到CJKG.簡碼重碼字數.toLocaleString(),
        實際字符數: 分析結果.到CJKG.實際字符數.toLocaleString(),
        理論字符數: 分析結果.到CJKG.理論字符數.toLocaleString(),
        字集覆蓋率: (分析結果.到CJKG.字集覆蓋率 * 100).toFixed(2) + '%',
      },
      {
        key: '12',
        字集名稱: '到CJK-H',
        全碼重碼組數: 分析結果.到CJKH.全碼重碼組數.toLocaleString(),
        簡碼重碼組數: 分析結果.到CJKH.簡碼重碼組數.toLocaleString(),
        全碼重碼字數: 分析結果.到CJKH.全碼重碼字數.toLocaleString(),
        簡碼重碼字數: 分析結果.到CJKH.簡碼重碼字數.toLocaleString(),
        實際字符數: 分析結果.到CJKH.實際字符數.toLocaleString(),
        理論字符數: 分析結果.到CJKH.理論字符數.toLocaleString(),
        字集覆蓋率: (分析結果.到CJKH.字集覆蓋率 * 100).toFixed(2) + '%',
      },
      {
        key: '13',
        字集名稱: '到CJK-I',
        全碼重碼組數: 分析結果.到CJKI.全碼重碼組數.toLocaleString(),
        簡碼重碼組數: 分析結果.到CJKI.簡碼重碼組數.toLocaleString(),
        全碼重碼字數: 分析結果.到CJKI.全碼重碼字數.toLocaleString(),
        簡碼重碼字數: 分析結果.到CJKI.簡碼重碼字數.toLocaleString(),
        實際字符數: 分析結果.到CJKI.實際字符數.toLocaleString(),
        理論字符數: 分析結果.到CJKI.理論字符數.toLocaleString(),
        字集覆蓋率: (分析結果.到CJKI.字集覆蓋率 * 100).toFixed(2) + '%',
      },
      {
        key: '14',
        字集名稱: '到CJK-J',
        全碼重碼組數: 分析結果.到CJKJ.全碼重碼組數.toLocaleString(),
        簡碼重碼組數: 分析結果.到CJKJ.簡碼重碼組數.toLocaleString(),
        全碼重碼字數: 分析結果.到CJKJ.全碼重碼字數.toLocaleString(),
        簡碼重碼字數: 分析結果.到CJKJ.簡碼重碼字數.toLocaleString(),
        實際字符數: 分析結果.到CJKJ.實際字符數.toLocaleString(),
        理論字符數: 分析結果.到CJKJ.理論字符數.toLocaleString(),
        字集覆蓋率: (分析結果.到CJKJ.字集覆蓋率 * 100).toFixed(2) + '%',
      },
    ]

    const 列定義: ColumnsType<表格數據項> = [
      {
        title: '字集名稱',
        dataIndex: '字集名稱',
        key: '字集名稱',
        width: 120,
        fixed: 'left',
      },
      {
        title: '全碼重碼組數',
        dataIndex: '全碼重碼組數',
        key: '全碼重碼組數',
        align: 'right',
        width: 120,
      },
      {
        title: '簡碼重碼組數',
        dataIndex: '簡碼重碼組數',
        key: '簡碼重碼組數',
        align: 'right',
        width: 120,
      },
      {
        title: '全碼重碼字數',
        dataIndex: '全碼重碼字數',
        key: '全碼重碼字數',
        align: 'right',
        width: 120,
      },
      {
        title: '簡碼重碼字數',
        dataIndex: '簡碼重碼字數',
        key: '簡碼重碼字數',
        align: 'right',
        width: 120,
      },
      {
        title: '實際字符數',
        dataIndex: '實際字符數',
        key: '實際字符數',
        align: 'right',
        width: 120,
      },
      {
        title: '理論字符數',
        dataIndex: '理論字符數',
        key: '理論字符數',
        align: 'right',
        width: 120,
      },
      {
        title: '字集覆蓋率',
        dataIndex: '字集覆蓋率',
        key: '字集覆蓋率',
        align: 'right',
        width: 120,
      },
    ]

    return (
      <Table
        columns={列定義}
        dataSource={靜態重碼數據}
        pagination={false}
        bordered
        style={{ marginTop: 16 }}
      />
    )
  }

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 頁面標題 */}
        <div>
          <Paragraph>
            分析各字符集的靜態重碼數據，包括重碼字數、實際字符數、理論字符數和字集覆蓋率。
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
          <Alert message={錯誤信息} type="error" closable onClose={() => 設置錯誤信息(null)} />
        )}

        {/* 加載中 */}
        {計算中 && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Spin size="large" />
            <p style={{ marginTop: 16 }}>正在計算靜態重碼數據...</p>
          </div>
        )}

        {/* 數據表格 */}
        {!計算中 && 分析結果 && 渲染表格()}

        {/* 無數據提示 */}
        {!計算中 && !分析結果 && !錯誤信息 && (
          <Alert
            message="請點擊「重新計算」來查看分析結果"
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Space>
    </div>
  )
}

export default StaticDuplicateAnalysisPage
