import React, { useState, useEffect, useRef } from 'react'
import { useAtom } from 'jotai'
import {
  Button,
  Space,
  Typography,
  Alert,
  Spin,
  Modal,
  Table,
  Input,
  Select,
  Divider,
  message,
} from 'antd'
import { ReloadOutlined, LineChartOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { 碼表原子狀態 } from '../atoms/codeTable'
import { 當前方案原子狀態 } from '../atoms/scheme'
import { 速度當量分析原子狀態, 當量詳情原子狀態 } from '../atoms/speedEquivalent'
import type { 速度當量分析結果介面, 當量例字信息介面 } from '../atoms/speedEquivalent'
import { 連續文本當量分析原子狀態 } from '../atoms/continuousEquivalent'
import type { 連續文本當量碼表口徑, 連續文本當量分析結果介面 } from '../atoms/continuousEquivalent'
import { 字頻表緩存原子狀態 } from '../atoms/charFrequency'
import { 當量表原子狀態 } from '../atoms/equivTable'
import {
  從碼表計算加權速度當量,
  生成一級簡碼加選重鍵表,
  生成二級簡碼加選重鍵表,
  計算編碼對頻率,
  計算速度當量分佈,
  替換選重鍵,
} from '../services/speedEquivalentService'
import type { EquivDistributionItem } from '../services/speedEquivalentService'
import {
  加載連續文本,
  清洗連續文本,
  蒙特卡洛連續文本當量,
} from '../services/continuousEquivalentService'
import { 當量表服務實例 } from '../services/equivTableService'
import { 字頻表服務類别 } from '../services/charFrequencyService'
import ContinuousEquivalentChart from '../components/ContinuousEquivalentChart'
import { 取參考分佈, 參考方案名 } from '../data/continuousEquivalentReference'
import { 默認選重鍵表 } from '../types/scheme'
import type { 處理後的碼表結果介面 } from '../types'

const { Paragraph, Text, Link } = Typography

/** 連續文本當量：參與分析的碼表口徑 */
const 連續文本當量口徑列表: 連續文本當量碼表口徑[] = ['全碼加選重', '全部簡碼加選重']

/**
 * 速度當量分析頁面
 */
const SpeedEquivalentPage: React.FC = () => {
  const [碼表數據] = useAtom(碼表原子狀態)
  const [分析結果, 設置分析結果] = useAtom(速度當量分析原子狀態)
  const [當量詳情, 設置當量詳情] = useAtom(當量詳情原子狀態)
  const [字頻表緩存] = useAtom(字頻表緩存原子狀態)
  const [當量表] = useAtom(當量表原子狀態)
  const [當前方案] = useAtom(當前方案原子狀態)

  const [計算中, 設置計算中] = useState(false)
  const [錯誤信息, 設置錯誤信息] = useState<string | null>(null)
  const [顯示詳情, 設置顯示詳情] = useState(false)
  const [詳情計算中, 設置詳情計算中] = useState(false)
  const [搜索关键词, 設置搜索关键词] = useState('')
  const [顯示當量分佈, 設置顯示當量分佈] = useState(false)
  const [當量分佈數據, 設置當量分佈數據] = useState<EquivDistributionItem[]>([])
  const [當量分佈標題, 設置當量分佈標題] = useState('')
  const [分佈計算中, 設置分佈計算中] = useState(false)
  const 已初始化計算 = useRef(false)

  // 連續文本當量相關狀態
  const [連續文本當量結果, 設置連續文本當量結果] = useAtom(連續文本當量分析原子狀態)
  const [連續文本當量計算中, 設置連續文本當量計算中] = useState(false)
  const [連續文本當量錯誤, 設置連續文本當量錯誤] = useState<string | null>(null)
  const [窗口長度, 設置窗口長度] = useState(100)
  const [樣本數, 設置樣本數] = useState(20000)
  // 記住上次算過的碼表對象，換方案後自動重算（而不是留着上一個方案的圖）
  const 上次連續文本當量碼表 = useRef<unknown>(null)

  // 類型斷言：碼表數據實際上是 處理後的碼表結果
  const 處理後碼表 = 碼表數據 as 處理後的碼表結果介面 | null

  // 選重鍵按方案配置折算（如二重按 ; 、三重按 '）
  const 選重鍵表 = 當前方案?.方案參數?.選重鍵表 ?? 默認選重鍵表

  /**
   * 加載當量表（使用服务）
   */
  const 加載當量表 = async (): Promise<Record<string, number>> => {
    return await 當量表服務實例.加載當量表()
  }

  /**
   * 重新計算速度當量
   */
  const 重新計算 = async () => {
    if (!處理後碼表) {
      設置錯誤信息('請先在「碼表解析」頁面上傳碼表')
      return
    }

    if (!字頻表緩存) {
      設置錯誤信息('字頻表尚未加載')
      return
    }

    設置計算中(true)
    設置錯誤信息(null)

    try {
      // 確保所有字頻數據已加載（如果緩存爲空）
      if (字頻表緩存.size === 0) {
        await Promise.all([
          字頻表服務類别.加載知乎簡體字頻(),
          字頻表服務類别.加載北語簡體字頻(),
          字頻表服務類别.加載臺標繁體字頻(),
          字頻表服務類别.加載古籍繁體字頻(),
          字頻表服務類别.計算繁簡聯合字頻(),
        ])
      }

      // 加載當量表
      const 當量表數據 = Object.keys(當量表).length > 0 ? 當量表 : await 加載當量表()

      const 全碼加選重鍵表 = 處理後碼表.全碼加選重鍵表
      const 簡碼加選重鍵表 = 處理後碼表.簡碼加選重鍵表

      // 計算全碼當量
      const 知乎簡體字頻全碼速度當量 = 從碼表計算加權速度當量(
        全碼加選重鍵表,
        字頻表緩存.get('知乎簡體字頻') || {},
        當量表數據,
        選重鍵表
      )
      const 北語簡體字頻全碼速度當量 = 從碼表計算加權速度當量(
        全碼加選重鍵表,
        字頻表緩存.get('北語簡體字頻') || {},
        當量表數據,
        選重鍵表
      )
      const 臺標繁體字頻全碼速度當量 = 從碼表計算加權速度當量(
        全碼加選重鍵表,
        字頻表緩存.get('臺標繁體字頻') || {},
        當量表數據,
        選重鍵表
      )
      const 古籍繁體字頻全碼速度當量 = 從碼表計算加權速度當量(
        全碼加選重鍵表,
        字頻表緩存.get('古籍繁體字頻') || {},
        當量表數據,
        選重鍵表
      )
      const 繁簡聯合字頻全碼速度當量 = 從碼表計算加權速度當量(
        全碼加選重鍵表,
        字頻表緩存.get('繁簡聯合字頻') || {},
        當量表數據,
        選重鍵表
      )

      // 計算簡碼當量
      const 知乎簡體字頻全部簡碼速度當量 = 從碼表計算加權速度當量(
        簡碼加選重鍵表,
        字頻表緩存.get('知乎簡體字頻') || {},
        當量表數據,
        選重鍵表
      )
      const 北語簡體字頻全部簡碼速度當量 = 從碼表計算加權速度當量(
        簡碼加選重鍵表,
        字頻表緩存.get('北語簡體字頻') || {},
        當量表數據,
        選重鍵表
      )
      const 臺標繁體字頻全部簡碼速度當量 = 從碼表計算加權速度當量(
        簡碼加選重鍵表,
        字頻表緩存.get('臺標繁體字頻') || {},
        當量表數據,
        選重鍵表
      )
      const 古籍繁體字頻全部簡碼速度當量 = 從碼表計算加權速度當量(
        簡碼加選重鍵表,
        字頻表緩存.get('古籍繁體字頻') || {},
        當量表數據,
        選重鍵表
      )
      const 繁簡聯合字頻全部簡碼速度當量 = 從碼表計算加權速度當量(
        簡碼加選重鍵表,
        字頻表緩存.get('繁簡聯合字頻') || {},
        當量表數據,
        選重鍵表
      )

      // 生成一級簡碼表和二級簡碼表
      const 一級簡碼加選重鍵表 = 生成一級簡碼加選重鍵表(
        簡碼加選重鍵表,
        全碼加選重鍵表,
        [] // 如果有上屏鍵配置，可以從方案配置中讀取
      )
      const 二級簡碼加選重鍵表 = 生成二級簡碼加選重鍵表(
        簡碼加選重鍵表,
        全碼加選重鍵表,
        [] // 如果有上屏鍵配置，可以從方案配置中讀取
      )

      // 計算一級簡碼當量
      const 知乎簡體字頻一級簡碼速度當量 = 從碼表計算加權速度當量(
        一級簡碼加選重鍵表,
        字頻表緩存.get('知乎簡體字頻') || {},
        當量表數據,
        選重鍵表
      )
      const 北語簡體字頻一級簡碼速度當量 = 從碼表計算加權速度當量(
        一級簡碼加選重鍵表,
        字頻表緩存.get('北語簡體字頻') || {},
        當量表數據,
        選重鍵表
      )
      const 臺標繁體字頻一級簡碼速度當量 = 從碼表計算加權速度當量(
        一級簡碼加選重鍵表,
        字頻表緩存.get('臺標繁體字頻') || {},
        當量表數據,
        選重鍵表
      )
      const 古籍繁體字頻一級簡碼速度當量 = 從碼表計算加權速度當量(
        一級簡碼加選重鍵表,
        字頻表緩存.get('古籍繁體字頻') || {},
        當量表數據,
        選重鍵表
      )
      const 繁簡聯合字頻一級簡碼速度當量 = 從碼表計算加權速度當量(
        一級簡碼加選重鍵表,
        字頻表緩存.get('繁簡聯合字頻') || {},
        當量表數據,
        選重鍵表
      )

      // 計算二級簡碼當量
      const 知乎簡體字頻二級簡碼速度當量 = 從碼表計算加權速度當量(
        二級簡碼加選重鍵表,
        字頻表緩存.get('知乎簡體字頻') || {},
        當量表數據,
        選重鍵表
      )
      const 北語簡體字頻二級簡碼速度當量 = 從碼表計算加權速度當量(
        二級簡碼加選重鍵表,
        字頻表緩存.get('北語簡體字頻') || {},
        當量表數據,
        選重鍵表
      )
      const 臺標繁體字頻二級簡碼速度當量 = 從碼表計算加權速度當量(
        二級簡碼加選重鍵表,
        字頻表緩存.get('臺標繁體字頻') || {},
        當量表數據,
        選重鍵表
      )
      const 古籍繁體字頻二級簡碼速度當量 = 從碼表計算加權速度當量(
        二級簡碼加選重鍵表,
        字頻表緩存.get('古籍繁體字頻') || {},
        當量表數據,
        選重鍵表
      )
      const 繁簡聯合字頻二級簡碼速度當量 = 從碼表計算加權速度當量(
        二級簡碼加選重鍵表,
        字頻表緩存.get('繁簡聯合字頻') || {},
        當量表數據,
        選重鍵表
      )

      const 新結果: 速度當量分析結果介面 = {
        知乎簡體字頻全碼速度當量,
        北語簡體字頻全碼速度當量,
        臺標繁體字頻全碼速度當量,
        古籍繁體字頻全碼速度當量,
        繁簡聯合字頻全碼速度當量,
        知乎簡體字頻一級簡碼速度當量,
        北語簡體字頻一級簡碼速度當量,
        臺標繁體字頻一級簡碼速度當量,
        古籍繁體字頻一級簡碼速度當量,
        繁簡聯合字頻一級簡碼速度當量,
        知乎簡體字頻二級簡碼速度當量,
        北語簡體字頻二級簡碼速度當量,
        臺標繁體字頻二級簡碼速度當量,
        古籍繁體字頻二級簡碼速度當量,
        繁簡聯合字頻二級簡碼速度當量,
        知乎簡體字頻全部簡碼速度當量,
        北語簡體字頻全部簡碼速度當量,
        臺標繁體字頻全部簡碼速度當量,
        古籍繁體字頻全部簡碼速度當量,
        繁簡聯合字頻全部簡碼速度當量,
        更新時間: new Date().toISOString(),
      }

      設置分析結果(新結果)
      message.success('速度當量計算完成')
    } catch (error) {
      設置錯誤信息(error instanceof Error ? error.message : '計算失敗')
    } finally {
      設置計算中(false)
    }
  }

  /**
   * 計算連續文本當量（蒙特卡洛抽樣連續文本）
   */
  const 計算連續文本當量 = async () => {
    if (!處理後碼表) {
      設置連續文本當量錯誤('請先在「碼表解析」頁面上傳碼表')
      return
    }

    設置連續文本當量計算中(true)
    設置連續文本當量錯誤(null)

    try {
      const [原始文本, 當量表數據] = await Promise.all([
        加載連續文本(),
        Object.keys(當量表).length > 0 ? Promise.resolve(當量表) : 加載當量表(),
      ])

      const 清洗後文本 = 清洗連續文本(原始文本)

      const 碼表映射: Record<連續文本當量碼表口徑, Map<string, string[]>> = {
        全碼加選重: 處理後碼表.全碼加選重鍵表,
        全部簡碼加選重: 處理後碼表.簡碼加選重鍵表,
      }

      const 統計: 連續文本當量分析結果介面['統計'] = {}
      for (const 口徑 of 連續文本當量口徑列表) {
        統計[口徑] = 蒙特卡洛連續文本當量(清洗後文本, 碼表映射[口徑], 當量表數據, {
          窗口長度,
          樣本數,
          選重鍵表,
        })
      }

      設置連續文本當量結果({
        統計,
        樣本數,
        窗口長度,
        更新時間: new Date().toISOString(),
      })
      message.success('連續文本當量計算完成')
    } catch (error) {
      設置連續文本當量錯誤(error instanceof Error ? error.message : '連續文本當量計算失敗')
    } finally {
      設置連續文本當量計算中(false)
    }
  }

  /**
   * 顯示當量分佈（點擊當量數值）
   */
  const 顯示當量分佈詳情 = async (字頻類型: string, 碼類型: string) => {
    if (!處理後碼表 || !字頻表緩存) return

    設置分佈計算中(true)
    設置顯示當量分佈(true)

    const 字頻名稱映射: Record<string, string> = {
      知乎簡體字頻: '知乎簡體字頻',
      北語簡體字頻: '北語簡體字頻',
      臺標繁體字頻: '臺標繁體字頻',
      古籍繁體字頻: '古籍繁體字頻',
      繁簡聯合字頻: '繁簡聯合字頻',
    }
    const 碼類型名稱映射: Record<string, string> = {
      全碼: '全碼',
      一級簡碼: '一簡',
      二級簡碼: '二簡',
      簡碼: '全簡',
    }
    設置當量分佈標題(`${字頻名稱映射[字頻類型]} - ${碼類型名稱映射[碼類型]}當量分佈`)

    try {
      // 選擇碼表
      let 使用碼表: Map<string, string[]>
      if (碼類型 === '全碼') {
        使用碼表 = 處理後碼表.全碼加選重鍵表
      } else if (碼類型 === '一級簡碼') {
        使用碼表 = 生成一級簡碼加選重鍵表(處理後碼表.簡碼加選重鍵表, 處理後碼表.全碼加選重鍵表, [])
      } else if (碼類型 === '二級簡碼') {
        使用碼表 = 生成二級簡碼加選重鍵表(處理後碼表.簡碼加選重鍵表, 處理後碼表.全碼加選重鍵表, [])
      } else {
        使用碼表 = 處理後碼表.簡碼加選重鍵表
      }

      // 獲取字頻
      type 字頻來源型别 =
        | '知乎簡體字頻'
        | '北語簡體字頻'
        | '臺標繁體字頻'
        | '古籍繁體字頻'
        | '繁簡聯合字頻'
      const 字頻 = 字頻表緩存.get(字頻類型 as 字頻來源型别) || {}

      // 加載當量表
      const 當量表數據 = Object.keys(當量表).length > 0 ? 當量表 : await 加載當量表()

      // 計算碼對頻率
      const 碼對頻率 = 計算編碼對頻率(使用碼表, 字頻, 選重鍵表)

      // 計算當量分佈
      const 分佈 = 計算速度當量分佈(碼對頻率, 當量表數據)
      設置當量分佈數據(分佈)
    } catch (error) {
      console.error('計算當量分佈失敗:', error)
      設置當量分佈數據([])
    } finally {
      設置分佈計算中(false)
    }
  }

  /**
   * 顯示當量詳情（點擊字頻來源）
   */
  const 顯示當量例字 = async (字頻類型: string) => {
    if (!處理後碼表 || !字頻表緩存) return

    設置詳情計算中(true)
    設置顯示詳情(true)

    try {
      const 全碼表 = 處理後碼表.全碼加選重鍵表
      const 簡碼表 = 處理後碼表.簡碼加選重鍵表

      // 使用更嚴格的類型定義
      type 字頻來源型别 =
        | '知乎簡體字頻'
        | '北語簡體字頻'
        | '臺標繁體字頻'
        | '古籍繁體字頻'
        | '繁簡聯合字頻'
      const 字頻映射: Record<字頻來源型别, Record<string, number>> = {
        知乎簡體字頻: 字頻表緩存.get('知乎簡體字頻') || {},
        北語簡體字頻: 字頻表緩存.get('北語簡體字頻') || {},
        臺標繁體字頻: 字頻表緩存.get('臺標繁體字頻') || {},
        古籍繁體字頻: 字頻表緩存.get('古籍繁體字頻') || {},
        繁簡聯合字頻: 字頻表緩存.get('繁簡聯合字頻') || {},
      }

      // 類型檢查：確保 字頻類型 是有效的鍵
      if (!(字頻類型 in 字頻映射)) {
        throw new Error(`無效的字頻類型: ${字頻類型}`)
      }
      const 字頻 = 字頻映射[字頻類型 as 字頻來源型别]

      // 計算碼對頻率（不使用，但保留以備將來使用）
      const 當量表數據 = Object.keys(當量表).length > 0 ? 當量表 : await 加載當量表()

      // 計算每個字符的全碼和簡碼當量
      const 例字列表: 當量例字信息介面[] = []

      // 獲取所有字符（從全碼表和簡碼表的並集）
      const 所有字符 = new Set([...全碼表.keys(), ...簡碼表.keys()])

      for (const 字符 of 所有字符) {
        const 字頻值 = 字頻[字符] || 0
        if (字頻值 === 0) continue

        // 獲取全碼和簡碼
        const 全碼編碼數組 = 全碼表.get(字符)
        const 簡碼編碼數組 = 簡碼表.get(字符)

        if (!全碼編碼數組 || !簡碼編碼數組) continue

        // 選重鍵 2、3 換成實際按鍵 `;`、`'` 後再算當量
        const 全碼 = 全碼編碼數組[0] ? 替換選重鍵(全碼編碼數組[0], 選重鍵表) : undefined
        const 簡碼 = 簡碼編碼數組[0] ? 替換選重鍵(簡碼編碼數組[0], 選重鍵表) : undefined

        if (!全碼 || !簡碼) continue

        // 計算全碼當量
        let 全碼總當量 = 0
        let 全碼碼對數 = 0
        for (let i = 0; i < 全碼.length - 1; i++) {
          const 碼對 = 全碼.substring(i, i + 2)
          const 當量值 = 當量表數據[碼對]
          if (當量值 !== undefined) {
            全碼總當量 += 當量值
            全碼碼對數++
          }
        }
        const 全碼平均當量 = 全碼碼對數 > 0 ? 全碼總當量 / 全碼碼對數 : 0

        // 計算簡碼當量
        let 簡碼總當量 = 0
        let 簡碼碼對數 = 0
        for (let i = 0; i < 簡碼.length - 1; i++) {
          const 碼對 = 簡碼.substring(i, i + 2)
          const 當量值 = 當量表數據[碼對]
          if (當量值 !== undefined) {
            簡碼總當量 += 當量值
            簡碼碼對數++
          }
        }
        const 簡碼平均當量 = 簡碼碼對數 > 0 ? 簡碼總當量 / 簡碼碼對數 : 0

        // 計算加權當量差
        const 加權當量差 = (簡碼平均當量 - 全碼平均當量) * 字頻值

        例字列表.push({
          字符,
          全碼,
          簡碼,
          全碼當量: 全碼平均當量,
          簡碼當量: 簡碼平均當量,
          字頻: 字頻值,
          加權當量差,
        })
      }

      // 按加權當量差降序排列
      例字列表.sort((a, b) => Math.abs(b.加權當量差) - Math.abs(a.加權當量差))

      設置當量詳情({
        字頻類型,
        例字列表,
      })
    } catch (error) {
      console.error('計算當量詳情失敗:', error)
      設置當量詳情(null)
    } finally {
      設置詳情計算中(false)
    }
  }

  /**
   * 組件掛載時檢查數據
   */
  useEffect(() => {
    if (!分析結果 && 處理後碼表 && 字頻表緩存 && !已初始化計算.current) {
      已初始化計算.current = true
      重新計算()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [處理後碼表, 字頻表緩存])

  /**
   * 碼表變化後自動重算連續文本當量
   *
   * 換方案時 連續文本當量分析原子狀態 會被清空，這裡把圖補回來；
   * 用碼表對象本身做標記，即使頁面没有重新掛載（在本頁直接載入新方案）也能觸發。
   * 計算失敗時結果仍爲空，但標記已更新，不會反覆重試。
   */
  useEffect(() => {
    if (處理後碼表 && !連續文本當量結果 && 上次連續文本當量碼表.current !== 處理後碼表) {
      上次連續文本當量碼表.current = 處理後碼表
      計算連續文本當量()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [處理後碼表, 連續文本當量結果])

  /**
   * 渲染表格
   */
  const 渲染表格 = () => {
    if (!分析結果) return null

    type 表格數據項型别 = {
      key: string
      字頻來源: string
      全碼當量: number
      一級簡碼當量: number
      二級簡碼當量: number
      簡碼當量: number
      説明: React.ReactNode
    }

    const 表格數據: 表格數據項型别[] = [
      {
        key: '知乎簡體字頻',
        字頻來源: '知乎簡體字頻',
        全碼當量: 分析結果.知乎簡體字頻全碼速度當量,
        一級簡碼當量: 分析結果.知乎簡體字頻一級簡碼速度當量,
        二級簡碼當量: 分析結果.知乎簡體字頻二級簡碼速度當量,
        簡碼當量: 分析結果.知乎簡體字頻全部簡碼速度當量,
        説明: (
          <>
            基於
            <Link href="https://github.com/forfudan/chinese-characters-frequency" target="_blank">
              知乎字頻表
            </Link>
          </>
        ),
      },
      {
        key: '北語簡體字頻',
        字頻來源: '北語簡體字頻',
        全碼當量: 分析結果.北語簡體字頻全碼速度當量,
        一級簡碼當量: 分析結果.北語簡體字頻一級簡碼速度當量,
        二級簡碼當量: 分析結果.北語簡體字頻二級簡碼速度當量,
        簡碼當量: 分析結果.北語簡體字頻全部簡碼速度當量,
        説明: (
          <>
            基於
            <Link
              href="https://faculty.blcu.edu.cn/xinghb/zh_CN/article/167473/content/1437.htm"
              target="_blank"
            >
              簡體字頻表
            </Link>
          </>
        ),
      },
      {
        key: '臺標繁體字頻',
        字頻來源: '臺標繁體字頻',
        全碼當量: 分析結果.臺標繁體字頻全碼速度當量,
        一級簡碼當量: 分析結果.臺標繁體字頻一級簡碼速度當量,
        二級簡碼當量: 分析結果.臺標繁體字頻二級簡碼速度當量,
        簡碼當量: 分析結果.臺標繁體字頻全部簡碼速度當量,
        説明: (
          <>
            基於
            <Link
              href="https://language.moe.gov.tw/001/Upload/files/SITE_CONTENT/M0001/PIN/biau1.htm"
              target="_blank"
            >
              臺標繁體字頻表
            </Link>
          </>
        ),
      },
      {
        key: '古籍繁體字頻',
        字頻來源: '古籍繁體字頻',
        全碼當量: 分析結果.古籍繁體字頻全碼速度當量,
        一級簡碼當量: 分析結果.古籍繁體字頻一級簡碼速度當量,
        二級簡碼當量: 分析結果.古籍繁體字頻二級簡碼速度當量,
        簡碼當量: 分析結果.古籍繁體字頻全部簡碼速度當量,
        説明: '基於古籍字頻',
      },
      {
        key: '繁簡聯合字頻',
        字頻來源: '繁簡聯合字頻',
        全碼當量: 分析結果.繁簡聯合字頻全碼速度當量,
        一級簡碼當量: 分析結果.繁簡聯合字頻一級簡碼速度當量,
        二級簡碼當量: 分析結果.繁簡聯合字頻二級簡碼速度當量,
        簡碼當量: 分析結果.繁簡聯合字頻全部簡碼速度當量,
        説明: '基於繁簡聯合字頻表',
      },
    ]

    const 列定義: ColumnsType<表格數據項型别> = [
      {
        title: '字頻來源',
        dataIndex: '字頻來源',
        key: '字頻來源',
        fixed: 'left',
        width: 110,
        render: (value: string, record) => (
          <span
            style={{ cursor: 'pointer', color: '#1890ff', textDecoration: 'underline' }}
            onClick={() => 顯示當量例字(record.key)}
          >
            {value}
          </span>
        ),
      },
      {
        title: '全碼當量',
        dataIndex: '全碼當量',
        key: '全碼當量',
        align: 'right',
        width: 80,
        render: (value: number, record) => (
          <span
            style={{ cursor: 'pointer', color: '#1890ff' }}
            onClick={() => 顯示當量分佈詳情(record.key, '全碼')}
          >
            {value.toFixed(4)}
          </span>
        ),
      },
      {
        title: '一級簡碼',
        dataIndex: '一級簡碼當量',
        key: '一級簡碼當量',
        align: 'right',
        width: 80,
        render: (value: number, record) => (
          <span
            style={{ cursor: 'pointer', color: '#1890ff' }}
            onClick={() => 顯示當量分佈詳情(record.key, '一級簡碼')}
          >
            {value.toFixed(4)}
          </span>
        ),
      },
      {
        title: '二級簡碼',
        dataIndex: '二級簡碼當量',
        key: '二級簡碼當量',
        align: 'right',
        width: 80,
        render: (value: number, record) => (
          <span
            style={{ cursor: 'pointer', color: '#1890ff' }}
            onClick={() => 顯示當量分佈詳情(record.key, '二級簡碼')}
          >
            {value.toFixed(4)}
          </span>
        ),
      },
      {
        title: '全部簡碼',
        dataIndex: '簡碼當量',
        key: '簡碼當量',
        align: 'right',
        width: 80,
        render: (value: number, record) => (
          <span
            style={{ cursor: 'pointer', color: '#1890ff' }}
            onClick={() => 顯示當量分佈詳情(record.key, '簡碼')}
          >
            {value.toFixed(4)}
          </span>
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
        dataSource={表格數據}
        pagination={false}
        bordered
        style={{ marginTop: 16 }}
      />
    )
  }

  /**
   * 渲染連續文本當量分析區塊
   */
  const 渲染連續文本當量 = () => {
    // 兩張圖共用 x 軸範圍，便於橫向比較全碼與簡碼的分佈位置
    const 全部統計 = 連續文本當量結果
      ? 連續文本當量口徑列表
          .map(口徑 => 連續文本當量結果.統計[口徑])
          .filter((項): 項 is NonNullable<typeof 項> => 項 !== undefined)
      : []
    // x 軸範圍要同時容下實測分佈和參考曲線的 ±3σ，
    // 否則參考方案和當前方案差得遠時，曲線會整條落在畫面外
    const 參考端點: number[] = []
    if (連續文本當量結果) {
      for (const 口徑 of 連續文本當量口徑列表) {
        const 參考 = 取參考分佈(口徑, 連續文本當量結果.窗口長度)
        if (參考) {
          參考端點.push(參考.平均數 - 3 * 參考.標準差, 參考.平均數 + 3 * 參考.標準差)
        }
      }
    }
    const 共用範圍 =
      全部統計.length > 0
        ? {
            最小值: Math.min(...全部統計.map(項 => 項.最小值), ...參考端點),
            最大值: Math.max(...全部統計.map(項 => 項.最大值), ...參考端點),
          }
        : undefined

    return (
      <div>
        <Divider titlePlacement="start" style={{ marginTop: 8 }}>
          連續文本當量
        </Divider>

        <Paragraph type="secondary" style={{ marginBottom: 12 }}>
          上表的當量按單字加權，衡量的是孤立單字的擊鍵成本。
          <strong>連續文本當量</strong>
          則衡量方案在成段文本下的表現：把語料只保留漢字與逗號句號，逐字映射爲按鍵串（逗號句號直接映射爲{' '}
          <code>,</code> <code>.</code>），再用蒙特卡洛在語料中隨機截取連續{窗口長度}
          字的窗口，計算窗口內相鄰碼對的平均當量，重複多次得到當量的分佈。不足一個窗口的尾部不參與計算。
        </Paragraph>

        <Paragraph type="secondary" style={{ marginBottom: 12 }}>
          <strong>90% VaR</strong> 是右側 90% 分位數：只有一成的文本比它更慢。
          <strong>90% CVaR</strong> 是這一成最慢文本的平均當量，圖中紅色區域即這批樣本。 VaR
          只給出門檻，CVaR 進一步告訴你「真碰上難打的段落時，平均有多慢」。
        </Paragraph>

        <Space wrap style={{ marginBottom: 12 }}>
          <Space size={4}>
            <Text type="secondary">窗口長度</Text>
            <Select
              value={窗口長度}
              onChange={設置窗口長度}
              style={{ width: 100 }}
              options={[10, 20, 50, 100, 200].map(值 => ({ value: 值, label: `${值} 字` }))}
            />
          </Space>
          <Space size={4}>
            <Text type="secondary">抽樣次數</Text>
            <Select
              value={樣本數}
              onChange={設置樣本數}
              style={{ width: 110 }}
              options={[5000, 20000, 50000, 100000].map(值 => ({
                value: 值,
                label: 值.toLocaleString(),
              }))}
            />
          </Space>
          <Button
            type="primary"
            icon={<LineChartOutlined />}
            onClick={計算連續文本當量}
            loading={連續文本當量計算中}
            disabled={!處理後碼表}
          >
            計算連續文本當量
          </Button>
        </Space>

        {連續文本當量錯誤 && (
          <Alert
            title={連續文本當量錯誤}
            type="error"
            closable
            onClose={() => 設置連續文本當量錯誤(null)}
            style={{ marginBottom: 12 }}
          />
        )}

        {連續文本當量計算中 && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Spin size="large" />
            <p style={{ marginTop: 16 }}>正在抽樣計算連續文本當量...</p>
          </div>
        )}

        {!連續文本當量計算中 && !連續文本當量結果 && !連續文本當量錯誤 && (
          <Alert
            title={
              處理後碼表
                ? '點擊「計算連續文本當量」查看方案在成段文本下的當量分佈'
                : '請先在「碼表解析」頁面上傳碼表'
            }
            type="info"
            showIcon
          />
        )}

        {!連續文本當量計算中 && 連續文本當量結果 && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
                gap: 32,
              }}
            >
              {連續文本當量口徑列表.map(口徑 => {
                const 統計 = 連續文本當量結果.統計[口徑]
                if (!統計) return null
                return (
                  <ContinuousEquivalentChart
                    key={口徑}
                    統計={統計}
                    標題={口徑}
                    共用範圍={共用範圍}
                    參考分佈={取參考分佈(口徑, 連續文本當量結果.窗口長度)}
                    參考方案名={參考方案名}
                  />
                )
              })}
            </div>

            {全部統計[0] && (
              <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 16 }}>
                語料：
                <Link
                  href="https://github.com/forfudan/yuhao-assess-data/blob/main/texts/literature.txt"
                  target="_blank"
                >
                  literature.txt
                </Link>
                （經典文學作品節選），清洗後共 {全部統計[0].語料字數.toLocaleString()} 字。
                {全部統計[0].未編碼字數 > 0 && (
                  <>其中 {全部統計[0].未編碼字數.toLocaleString()} 字不在碼表内，已跳過。</>
                )}
                {全部統計.some(項 => 項.碼對覆蓋率 < 0.9999) && (
                  <>
                    {' '}
                    碼對覆蓋率{' '}
                    {全部統計.map(項 => (項.碼對覆蓋率 * 100).toFixed(2) + '%').join(' / ')}
                    ，未覆蓋的碼對（多爲選重鍵數字）不計入平均。
                  </>
                )}
              </Paragraph>
            )}
          </>
        )}
      </div>
    )
  }

  /**
   * 詳情表格列定義
   */
  const 詳情列定義: ColumnsType<當量例字信息介面> = [
    {
      title: '#',
      render: (_text: unknown, _record: unknown, index: number) => index + 1,
      width: 60,
    },
    { title: '字符', dataIndex: '字符', width: 80 },
    { title: '全碼', dataIndex: '全碼', width: 100 },
    { title: '簡碼', dataIndex: '簡碼', width: 100 },
    {
      title: '全碼當量',
      dataIndex: '全碼當量',
      width: 100,
      align: 'right',
      render: (v: number) => v.toFixed(4),
    },
    {
      title: '簡碼當量',
      dataIndex: '簡碼當量',
      width: 100,
      align: 'right',
      render: (v: number) => v.toFixed(4),
    },
    {
      title: '字頻（‱）',
      dataIndex: '字頻',
      width: 100,
      align: 'right',
      render: (v: number) => (v * 10000).toFixed(2),
    },
    {
      title: '加權當量差',
      dataIndex: '加權當量差',
      width: 120,
      align: 'right',
      render: (v: number) => (
        <span style={{ color: v < 0 ? '#52c41a' : v > 0 ? '#ff4d4f' : undefined }}>
          {v.toFixed(6)}
        </span>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        {/* 頁面標題 */}
        <div>
          <Paragraph>
            分析輸入法的速度當量，計算基於字頻加權的全碼按鍵組合。閲讀
            <Link href="https://shurufa.app/docs/concepts.html" target="_blank">
              瓊林擷英
            </Link>
            瞭解詳細定義。
          </Paragraph>
        </div>

        {/* 操作按鈕 */}
        <Space>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={重新計算}
            loading={計算中}
            disabled={!處理後碼表 || !字頻表緩存}
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
            <p style={{ marginTop: 16 }}>正在計算速度當量...</p>
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
            title="説明"
            description="點擊字頻來源，可查看該字頻類型下全碼與簡碼的當量對比。選重鍵按實際輸入習慣折算：二重記爲 ; 、三重記爲 ' ，四重及以後仍記爲數字鍵。"
            type="info"
            showIcon
          />
        )}

        {/* 連續文本當量分析 */}
        {渲染連續文本當量()}
      </Space>

      {/* 當量分佈 Modal */}
      <Modal
        title={當量分佈標題}
        open={顯示當量分佈}
        onCancel={() => 設置顯示當量分佈(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => 設置顯示當量分佈(false)}>
            關閉
          </Button>,
        ]}
      >
        {分佈計算中 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
            <p style={{ marginTop: 16 }}>正在計算當量分佈...</p>
          </div>
        ) : 當量分佈數據.length > 0 ? (
          <Table
            columns={[
              {
                title: '當量值',
                dataIndex: 'equivValue',
                key: 'equivValue',
                width: 80,
                render: (v: number) => v.toFixed(1),
              },
              {
                title: '按鍵組合',
                dataIndex: 'keyPairs',
                key: 'keyPairs',
                render: (pairs: string[]) => (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {pairs.map(pair => (
                      <span
                        key={pair}
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 4,
                          border: '1px solid #d9d9d9',
                          fontSize: 12,
                          fontFamily: 'monospace',
                        }}
                      >
                        {pair}
                      </span>
                    ))}
                  </div>
                ),
              },
              {
                title: '説明',
                dataIndex: 'description',
                key: 'description',
                width: 200,
              },
              {
                title: '頻率',
                dataIndex: 'frequencyRatio',
                key: 'frequencyRatio',
                width: 80,
                align: 'right' as const,
                render: (v: number) => (v * 100).toFixed(2) + '%',
              },
            ]}
            dataSource={當量分佈數據}
            rowKey="equivValue"
            pagination={false}
            bordered
          />
        ) : (
          <p>無數據</p>
        )}
      </Modal>

      {/* 當量詳情 Modal */}
      <Modal
        title={當量詳情 ? `${當量詳情.字頻類型} - 簡碼與全碼當量對比` : '當量詳情'}
        open={顯示詳情}
        onCancel={() => {
          設置顯示詳情(false)
          設置搜索关键词('')
        }}
        width={1200}
        footer={[
          <Button
            key="close"
            onClick={() => {
              設置顯示詳情(false)
              設置搜索关键词('')
            }}
          >
            關閉
          </Button>,
        ]}
      >
        {詳情計算中 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
            <p style={{ marginTop: 16 }}>正在計算當量詳情...</p>
          </div>
        ) : 當量詳情 ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <Input.Search
                placeholder="搜索字符或編碼..."
                value={搜索关键词}
                onChange={e => 設置搜索关键词(e.target.value)}
                onSearch={value => 設置搜索关键词(value)}
                allowClear
                style={{ width: 300 }}
              />
            </div>
            <Table
              columns={詳情列定義}
              dataSource={當量詳情.例字列表.filter(item => {
                if (!搜索关键词) return true
                const keyword = 搜索关键词.toLowerCase()
                return (
                  item.字符.includes(搜索关键词) ||
                  item.全碼.toLowerCase().includes(keyword) ||
                  item.簡碼.toLowerCase().includes(keyword)
                )
              })}
              rowKey="字符"
              pagination={{
                defaultPageSize: 50,
                pageSizeOptions: ['20', '50', '100', '200'],
                showSizeChanger: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 項，共 ${total} 個字符`,
              }}
              bordered
              scroll={{ y: 500 }}
            />
          </>
        ) : null}
      </Modal>
    </div>
  )
}

export default SpeedEquivalentPage
