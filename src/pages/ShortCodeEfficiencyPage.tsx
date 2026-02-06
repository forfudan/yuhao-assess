import React, { useState, useEffect, useMemo } from 'react'
import { useAtom } from 'jotai'
import { Button, Typography, Alert, Spin, Modal, message, Space } from 'antd'
import { ReloadOutlined, CopyOutlined } from '@ant-design/icons'
import styled from 'styled-components'
import { 碼表原子狀態 } from '../atoms/codeTable'
import { 簡碼效率分析原子狀態 } from '../atoms/shortCodeEfficiency'
import { 字頻表緩存原子狀態 } from '../atoms/charFrequency'
import { 當前方案原子狀態 } from '../atoms/scheme'
import { 計算指定字頻下之簡碼效率 } from '../services/shortCodeEfficiencyService'
import type { 處理後的碼表結果介面, 頻率數據型别 } from '../types'
import type { 單個字頻簡碼效率結果介面 } from '../atoms/shortCodeEfficiency'

const { Paragraph } = Typography

// ===================
// 樣式組件
// ===================

const TableContainer = styled.div`
  overflow-x: auto;
  margin-bottom: 24px;
`

const MetricsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border: 1px solid #e5e7eb;

  th {
    text-align: center;
    background: #f8fafc;
    border-bottom: 1px solid #e5e7eb;
  }

  td {
    text-align: center;
    border-bottom: 1px solid #e5e7eb;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }
`

const NValueCell = styled.td`
  background: #f8fafc;
`

const MetricValueCell = styled.td<{ $clickable?: boolean; $colorClass?: string }>`
  cursor: ${props => (props.$clickable ? 'pointer' : 'help')};

  /* 根據顔色類别應用不同的背景色 */
  ${props => {
    switch (props.$colorClass) {
      case 'very-high':
        return `
          background: #fee2e2 !important;
          color: #991b1b;
        `
      case 'high':
        return `
          background: #fef3c7 !important;
          color: #92400e;
        `
      case 'medium':
        return `
          background: #dcfce7 !important;
          color: #166534;
        `
      case 'low':
        return `
          background: #dbeafe !important;
          color: #1e40af;
        `
      case 'very-low':
        return `
          background: #f3e8ff !important;
          color: #7c3aed;
        `
      default:
        return `
          color: #059669;
        `
    }
  }}

  &:hover {
    opacity: 0.8;
  }
`

const HiddenCell = styled.td`
  background: transparent !important;
  color: transparent !important;
  pointer-events: none;
`

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  h4 {
    margin: 0 0 8px 0;
    color: #374151;
    font-size: 18px;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
`

const ModalCharGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 8px;
  padding: 16px 0;

  @media (max-width: 900px) {
    grid-template-columns: repeat(5, 1fr);
  }
`

const ModalCharItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 4px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    background: #eff6ff;
    border-color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
  }
`

const ModalChar = styled.div`
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 6px;
`

const ModalCodes = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 100%;
`

const ModalCharCode = styled.div<{ $type?: 'short' | 'full' | 'saving' }>`
  font-size: 11px;
  // font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  background: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 600;

  ${props => {
    switch (props.$type) {
      case 'short':
        return `
          color: #059669;
          border: 1px solid #dcfce7;
        `
      case 'full':
        return `
          color: #3b82f6;
          border: 1px solid #dbeafe;
        `
      case 'saving':
        return `
          color: #ea580c;
          border: 1px solid #fed7aa;
        `
      default:
        return `
          color: #6b7280;
          border: 1px solid #e5e7eb;
        `
    }
  }}
`

// ===================
// 類型定義
// ===================

/**
 * 表格行數據介面
 *
 * 表示簡碼效率分析表格中的一行數據，包含不同字頻類型下的效率指標。
 *
 * @property 最有效率的簡碼個數 - N 值，表示使用簡碼的字符個數（例如 500 表示前 500 個最有效率的字使用簡碼）
 *
 * @property 知乎簡體字頻加權碼長 - 在知乎簡體字頻下，使用 N 個簡碼時的平均碼長（值越小越好）
 * @property 北語簡體字頻加權碼長 - 在北語簡體字頻下，使用 N 個簡碼時的平均碼長
 * @property 臺標繁體字頻加權碼長 - 在臺標繁體字頻下，使用 N 個簡碼時的平均碼長
 * @property 古籍繁體字頻加權碼長 - 在古籍繁體字頻下，使用 N 個簡碼時的平均碼長
 * @property 繁簡聯合字頻加權碼長 - 在繁簡聯合字頻下，使用 N 個簡碼時的平均碼長
 *
 * @property 知乎簡體字頻字符 - 在知乎簡體字頻下，這 N 個使用簡碼的字符列表
 * @property 北語簡體字頻字符 - 在北語簡體字頻下，這 N 個使用簡碼的字符列表
 * @property 臺標繁體字頻字符 - 在臺標繁體字頻下，這 N 個使用簡碼的字符列表
 * @property 古籍繁體字頻字符 - 在古籍繁體字頻下，這 N 個使用簡碼的字符列表
 * @property 繁簡聯合字頻字符 - 在繁簡聯合字頻下，這 N 個使用簡碼的字符列表
 */
interface 表格行數據 {
  最有效率的簡碼個數: number
  知乎簡體字頻加權碼長: number
  北語簡體字頻加權碼長: number
  臺標繁體字頻加權碼長: number
  古籍繁體字頻加權碼長: number
  繁簡聯合字頻加權碼長: number
  知乎簡體字頻字符: string[]
  北語簡體字頻字符: string[]
  臺標繁體字頻字符: string[]
  古籍繁體字頻字符: string[]
  繁簡聯合字頻字符: string[]
}

// ===================
// 輔助函數
// ===================

/**
 * 獲取顔色類别
 *
 * 根據簡碼效率值（平均碼長）返回對應的顔色類别。
 * 值越小越好（表示平均每個字需要按的鍵數越少），所以：
 * - very-low (紫色)：< 2.5  - 最好
 * - low (藍色)：2.5 - 2.9 - 很好
 * - medium (緑色)：2.9 - 3.3 - 良好
 * - high (黄色)：3.3 - 3.7 - 一般
 * - very-high (紅色)：≥ 3.7 - 較差
 *
 * @param 值 - 簡碼效率值（字頻加權平均碼長）
 * @returns 顔色類别字符串
 */
const 獲取顔色類别 = (值: number): string => {
  if (值 <= 0) return ''
  if (值 >= 3.7) return 'very-high'
  if (值 >= 3.3) return 'high'
  if (值 >= 2.9) return 'medium'
  if (值 >= 2.5) return 'low'
  return 'very-low'
}

// ===================
// 主組件
// ===================

const ShortCodeEfficiencyPage: React.FC = () => {
  const [碼表數據] = useAtom(碼表原子狀態)
  const [分析結果, 設置分析結果] = useAtom(簡碼效率分析原子狀態)
  const [字頻表緩存] = useAtom(字頻表緩存原子狀態)
  const [當前方案] = useAtom(當前方案原子狀態)

  const [計算中, 設置計算中] = useState(false)
  const [錯誤信息, 設置錯誤信息] = useState<string | null>(null)
  const [顯示詳情, 設置顯示詳情] = useState(false)
  const [詳情標題, 設置詳情標題] = useState('')
  const [詳情字符列表, 設置詳情字符列表] = useState<string[]>([])
  const [詳情字頻類型, 設置詳情字頻類型] = useState('')

  // 類型斷言：碼表數據實際上是處理後的碼表結果
  const 處理後碼表 = 碼表數據 as 處理後的碼表結果介面 | null

  /**
   * 計算簡碼效率
   *
   * 主要流程：
   * 1. 從碼表中提取簡碼和全碼映射（Map<字符, 編碼>）
   * 2. 對 5 種字頻類型分别計算簡碼效率
   * 3. 每種字頻類型返回 28 個 N 值下的效率數據
   * 4. 儲存結果到全局狀態（支持導入導出）
   */
  const 計算簡碼效率 = async () => {
    if (!處理後碼表) {
      設置錯誤信息('請先在「碼表解析」頁面上傳碼表')
      return
    }

    if (!字頻表緩存 || 字頻表緩存.size === 0) {
      設置錯誤信息('字頻表尚未加載')
      return
    }

    設置計算中(true)
    設置錯誤信息(null)

    try {
      // 步驟 1：創建字符到編碼的映射
      // 這些 Map 是從 ProcessTablePage 處理後的碼表中提取的，已經包含了選重鍵
      const 簡碼映射 = new Map<string, string>()
      const 全碼映射 = new Map<string, string>()

      // 從簡碼加選重鍵表創建映射（取最短碼）
      // 例：'的' -> ['d', 'da', 'dal'] -> 'd'
      for (const [字符, 編碼數組] of 處理後碼表.簡碼加選重鍵表.entries()) {
        if (編碼數組.length > 0) {
          const 最短碼 = 編碼數組.reduce((a, b) => (a.length <= b.length ? a : b))
          簡碼映射.set(字符, 最短碼)
        }
      }

      // 從全碼加選重鍵表創建映射（取最長碼）
      // 例：'的' -> ['dal', 'dalm'] -> 'dalm'
      for (const [字符, 編碼數組] of 處理後碼表.全碼加選重鍵表.entries()) {
        if (編碼數組.length > 0) {
          const 最長碼 = 編碼數組.reduce((a, b) => (a.length >= b.length ? a : b))
          全碼映射.set(字符, 最長碼)
        }
      }

      const 最大碼長 = 當前方案?.方案參數?.最大碼長 || 4

      // 步驟 2：爲每個字頻數據計算簡碼效率
      // 每種字頻類型都會生成 28 個 N 值（0, 5, 10, ..., 2000）下的效率數據
      const 知乎簡體字頻 = 字頻表緩存.get('知乎簡體字頻') || {}
      const 北語簡體字頻 = 字頻表緩存.get('北語簡體字頻') || {}
      const 臺標繁體字頻 = 字頻表緩存.get('臺標繁體字頻') || {}
      const 古籍繁體字頻 = 字頻表緩存.get('古籍繁體字頻') || {}
      const 繁簡聯合字頻 = 字頻表緩存.get('繁簡聯合字頻') || {}

      // 步驟 3：調用 Service 函數計算效率
      // 這裏使用的是已處理好的 Map，不需要再處理選重邏輯

      const N值列表 = [
        0, // 全部使用全碼（基準線）
        5,
        10,
        25,
        50,
        75,
        100,
        150,
        200,
        250,
        300,
        400,
        500,
        600,
        700,
        800,
        900,
        1000,
        1100,
        1200,
        1300,
        1400,
        1500,
        1600,
        1700,
        1800,
        1900,
        2000, // 前 2000 個字使用簡碼
      ]
      const 新結果 = {
        知乎簡體字頻下之簡碼效率: 計算指定字頻下之簡碼效率(
          知乎簡體字頻,
          簡碼映射,
          全碼映射,
          最大碼長,
          N值列表
        ),
        北語簡體字頻下之簡碼效率: 計算指定字頻下之簡碼效率(
          北語簡體字頻,
          簡碼映射,
          全碼映射,
          最大碼長,
          N值列表
        ),
        臺標繁體字頻下之簡碼效率: 計算指定字頻下之簡碼效率(
          臺標繁體字頻,
          簡碼映射,
          全碼映射,
          最大碼長,
          N值列表
        ),
        古籍繁體字頻下之簡碼效率: 計算指定字頻下之簡碼效率(
          古籍繁體字頻,
          簡碼映射,
          全碼映射,
          最大碼長,
          N值列表
        ),
        繁簡聯合字頻下之簡碼效率: 計算指定字頻下之簡碼效率(
          繁簡聯合字頻,
          簡碼映射,
          全碼映射,
          最大碼長,
          N值列表
        ),
        計算時間: Date.now(),
      }

      設置分析結果(新結果)
      message.success('簡碼效率計算完成')
    } catch (err) {
      const 錯誤消息 = err instanceof Error ? err.message : String(err)
      設置錯誤信息(`計算簡碼效率時出錯: ${錯誤消息}`)
      console.error('簡碼效率計算錯誤:', err)
    } finally {
      設置計算中(false)
    }
  }

  /**
   * 重新計算
   */
  const 重新計算 = async () => {
    await 計算簡碼效率()
  }

  /**
   * 自動計算（碼表或字頻表變化時）
   */
  useEffect(() => {
    if (處理後碼表 && 字頻表緩存 && 字頻表緩存.size > 0 && !分析結果) {
      計算簡碼效率()
    }
  }, [處理後碼表, 字頻表緩存])

  /**
   * 構建表格數據
   *
   * 此函數的主要作用是：
   * 1. 合併 5 種字頻類型的計算結果到一個表格
   * 2. 智能過濾重複或無意義的行（例如：N 從 100 增加到 150，但實際簡碼字没有變化）
   * 3. 只顯示有效率提升的數據點
   *
   * 過濾邏輯：
   * - N=0（全部用全碼）是基準行，永遠顯示
   * - 如果某行没有任何新增簡碼字（5 列都没增加），則隱藏
   * - 如果某行所有列的值都與上一行相同，則隱藏（避免顯示重複數據）
   */
  const 表格數據 = useMemo<表格行數據[]>(() => {
    if (!分析結果) return []

    const {
      知乎簡體字頻下之簡碼效率,
      北語簡體字頻下之簡碼效率,
      臺標繁體字頻下之簡碼效率,
      古籍繁體字頻下之簡碼效率,
      繁簡聯合字頻下之簡碼效率,
    } = 分析結果

    if (
      !知乎簡體字頻下之簡碼效率.N值結果.length ||
      !北語簡體字頻下之簡碼效率.N值結果.length ||
      !臺標繁體字頻下之簡碼效率.N值結果.length ||
      !古籍繁體字頻下之簡碼效率.N值結果.length ||
      !繁簡聯合字頻下之簡碼效率.N值結果.length
    ) {
      return []
    }

    // 將 5 種字頻類型的結果合併到一個表格中
    // 每一行代表一個 N 值下的效率數據
    const N值列表 = 知乎簡體字頻下之簡碼效率.N值結果.map(r => r.最有效率的簡碼個數)

    const 所有行 = N值列表.map(N => {
      const 知乎結果 = 知乎簡體字頻下之簡碼效率.N值結果.find(r => r.最有效率的簡碼個數 === N)
      const 北語結果 = 北語簡體字頻下之簡碼效率.N值結果.find(r => r.最有效率的簡碼個數 === N)
      const 臺標結果 = 臺標繁體字頻下之簡碼效率.N值結果.find(r => r.最有效率的簡碼個數 === N)
      const 古籍結果 = 古籍繁體字頻下之簡碼效率.N值結果.find(r => r.最有效率的簡碼個數 === N)
      const 繁簡結果 = 繁簡聯合字頻下之簡碼效率.N值結果.find(r => r.最有效率的簡碼個數 === N)

      return {
        最有效率的簡碼個數: N,
        知乎簡體字頻加權碼長: 知乎結果?.簡碼效率值 || 0,
        北語簡體字頻加權碼長: 北語結果?.簡碼效率值 || 0,
        臺標繁體字頻加權碼長: 臺標結果?.簡碼效率值 || 0,
        古籍繁體字頻加權碼長: 古籍結果?.簡碼效率值 || 0,
        繁簡聯合字頻加權碼長: 繁簡結果?.簡碼效率值 || 0,
        // 從完整字符字符串中截取前 N 個字符（正確處理 Unicode 多位元組字符）
        知乎簡體字頻字符: Array.from(知乎簡體字頻下之簡碼效率.完整字符字符串).slice(0, N),
        北語簡體字頻字符: Array.from(北語簡體字頻下之簡碼效率.完整字符字符串).slice(0, N),
        臺標繁體字頻字符: Array.from(臺標繁體字頻下之簡碼效率.完整字符字符串).slice(0, N),
        古籍繁體字頻字符: Array.from(古籍繁體字頻下之簡碼效率.完整字符字符串).slice(0, N),
        繁簡聯合字頻字符: Array.from(繁簡聯合字頻下之簡碼效率.完整字符字符串).slice(0, N),
      }
    })

    // 智能過濾表格行：
    // 目標是只顯示有意義的數據點，隱藏没有新增簡碼字且數值重複的行
    // 例如：如果方案只有 500 個簡碼字，那麽 N=600, 700, ..., 2000 的行都會被過濾掉
    const 過濾後的行: 表格行數據[] = []
    // 追蹤前一行的簡碼字數量，用於判斷是否有新增
    let 前知乎計數 = 0
    let 前北語計數 = 0
    let 前臺標計數 = 0
    let 前古籍計數 = 0
    let 前繁簡計數 = 0

    for (let i = 0; i < 所有行.length; i++) {
      const 當前行 = 所有行[i]!
      const 當前知乎計數 = 當前行.知乎簡體字頻字符.length
      const 當前北語計數 = 當前行.北語簡體字頻字符.length
      const 當前臺標計數 = 當前行.臺標繁體字頻字符.length
      const 當前古籍計數 = 當前行.古籍繁體字頻字符.length
      const 當前繁簡計數 = 當前行.繁簡聯合字頻字符.length

      // 檢查是否有任何一列有新增簡碼字
      // 例如：從 N=100 到 N=150，如果至少有一列的簡碼字數量增加了，就應該顯示這一行
      const 有新知乎 = 當前知乎計數 > 前知乎計數
      const 有新北語 = 當前北語計數 > 前北語計數
      const 有新臺標 = 當前臺標計數 > 前臺標計數
      const 有新古籍 = 當前古籍計數 > 前古籍計數
      const 有新繁簡 = 當前繁簡計數 > 前繁簡計數

      // 決定是否顯示這一行：
      // 1. N=0 是基準行（全部用全碼），必須顯示
      // 2. 或者至少有一列有新增簡碼字
      let 應顯示 =
        當前行.最有效率的簡碼個數 === 0 || 有新知乎 || 有新北語 || 有新臺標 || 有新古籍 || 有新繁簡

      // 額外檢查：如果該行所有列的值都與上一行完全相同，則不顯示
      // 這處理了邊緣情况：雖然簡碼字數量增加了，但平均碼長没有變化（可能是增加的字頻率極低）
      if (應顯示 && i > 0) {
        const 前一行 = 所有行[i - 1]!
        const 所有列相同 =
          當前行.知乎簡體字頻加權碼長.toFixed(3) === 前一行.知乎簡體字頻加權碼長.toFixed(3) &&
          當前行.北語簡體字頻加權碼長.toFixed(3) === 前一行.北語簡體字頻加權碼長.toFixed(3) &&
          當前行.臺標繁體字頻加權碼長.toFixed(3) === 前一行.臺標繁體字頻加權碼長.toFixed(3) &&
          當前行.古籍繁體字頻加權碼長.toFixed(3) === 前一行.古籍繁體字頻加權碼長.toFixed(3) &&
          當前行.繁簡聯合字頻加權碼長.toFixed(3) === 前一行.繁簡聯合字頻加權碼長.toFixed(3)

        if (所有列相同) {
          應顯示 = false
        }
      }

      if (應顯示) {
        過濾後的行.push(當前行)
      }

      // 更新前一行的計數
      前知乎計數 = 當前知乎計數
      前北語計數 = 當前北語計數
      前臺標計數 = 當前臺標計數
      前古籍計數 = 當前古籍計數
      前繁簡計數 = 當前繁簡計數
    }

    return 過濾後的行
  }, [分析結果])

  /**
   * 檢查是否有省略的行
   */
  const 有省略行 = useMemo(() => {
    if (!分析結果) return false
    const 原始行數 = 分析結果.知乎簡體字頻下之簡碼效率.N值結果.length
    return 原始行數 > 表格數據.length
  }, [分析結果, 表格數據])

  /**
   * 判斷單元格是否應該隱藏
   *
   * 如果某個單元格的值與上一行完全相同，則隱藏該單元格的顯示。
   * 這樣可以讓表格更簡潔，用户可以快速看到哪些數值發生了變化。
   *
   * @param 行索引 - 當前行在表格中的索引
   * @param 列名 - 要檢查的列名
   * @returns true 表示應該隱藏，false 表示應該顯示
   */
  const 應隱藏單元格 = (
    行索引: number,
    列名: keyof Pick<
      表格行數據,
      | '知乎簡體字頻加權碼長'
      | '北語簡體字頻加權碼長'
      | '臺標繁體字頻加權碼長'
      | '古籍繁體字頻加權碼長'
      | '繁簡聯合字頻加權碼長'
    >
  ): boolean => {
    if (行索引 === 0) return false

    const 當前行 = 表格數據[行索引]!
    const 前一行 = 表格數據[行索引 - 1]!

    const 當前值 = 當前行[列名].toFixed(3)
    const 前一值 = 前一行[列名].toFixed(3)

    return 當前值 === 前一值
  }

  /**
   * 獲取前一個 N 值
   */
  const 獲取前一個N值 = (當前N: number): number => {
    const N值列表 = 表格數據.map(r => r.最有效率的簡碼個數).sort((a, b) => a - b)
    const 當前索引 = N值列表.indexOf(當前N)
    return 當前索引 > 0 ? (N值列表[當前索引 - 1] ?? 0) : 0
  }

  /**
   * 獲取前一個 N 值對應的字符
   */
  const 獲取前一個N的字符 = (前N: number, 字頻類型: string): string[] => {
    const 前一行 = 表格數據.find(r => r.最有效率的簡碼個數 === 前N)
    if (!前一行) return []

    switch (字頻類型) {
      case '知乎':
        return 前一行.知乎簡體字頻字符
      case '北語':
        return 前一行.北語簡體字頻字符
      case '臺標':
        return 前一行.臺標繁體字頻字符
      case '古籍':
        return 前一行.古籍繁體字頻字符
      case '繁簡':
        return 前一行.繁簡聯合字頻字符
      default:
        return []
    }
  }

  /**
   * 顯示詳情模態框
   */
  const 顯示詳情模態框 = (字符: string[], 當前N: number, 字頻類型: string) => {
    const 字頻名稱: Record<string, string> = {
      知乎: '知乎簡體字頻',
      北語: '北語簡體字頻',
      臺標: '臺標繁體字頻',
      古籍: '古籍繁體字頻',
      繁簡: '繁簡聯合字頻',
    }

    let 顯示字符: string[] = []
    const 前N = 獲取前一個N值(當前N)

    if (字符.length === 0) {
      設置詳情標題(`${字頻名稱[字頻類型]} · 無簡碼字`)
      設置詳情字符列表([])
      設置詳情字頻類型(字頻類型)
      設置顯示詳情(true)
      return
    }

    if (前N > 0) {
      const 前字符 = 獲取前一個N的字符(前N, 字頻類型)
      顯示字符 = 字符.filter(c => !前字符.includes(c))

      const 排名開始 = 前N + 1
      const 排名結束 = 當前N
      設置詳情標題(`${字頻名稱[字頻類型]} · 效率排名 ${排名開始} 到 ${排名結束} 的簡碼字`)
    } else {
      顯示字符 = 字符
      const 排名結束 = 當前N
      if (排名結束 === 0) {
        設置詳情標題(`${字頻名稱[字頻類型]} · 無簡碼字`)
      } else {
        設置詳情標題(`${字頻名稱[字頻類型]} · 簡碼效率排名 1 到 ${排名結束} 的簡碼字`)
      }
    }

    設置詳情字符列表(顯示字符)
    設置詳情字頻類型(字頻類型)
    設置顯示詳情(true)
  }

  /**
   * 複製字符到剪貼板
   */
  const 複製到剪貼板 = async () => {
    if (詳情字符列表.length === 0) return

    try {
      const 文本 = 詳情字符列表.join('')
      if (typeof window !== 'undefined' && window.navigator?.clipboard) {
        await window.navigator.clipboard.writeText(文本)
        message.success('已複製到剪貼板')
      } else {
        message.error('您的瀏覽器不支持剪貼板功能')
      }
    } catch (err) {
      console.error('複製失敗:', err)
      message.error('複製失敗，請重試')
    }
  }

  /**
   * 獲取簡碼（帶選重）
   */
  const 獲取簡碼 = (字符: string): string => {
    if (!處理後碼表) return ''
    const 編碼數組 = 處理後碼表.簡碼加選重鍵表.get(字符)
    if (!編碼數組 || 編碼數組.length === 0) return ''
    return 編碼數組.reduce((a, b) => (a.length <= b.length ? a : b))
  }

  /**
   * 獲取全碼（帶選重）
   */
  const 獲取全碼 = (字符: string): string => {
    if (!處理後碼表) return ''
    const 編碼數組 = 處理後碼表.全碼加選重鍵表.get(字符)
    if (!編碼數組 || 編碼數組.length === 0) return ''
    return 編碼數組.reduce((a, b) => (a.length >= b.length ? a : b))
  }

  /**
   * 獲取加權節約碼長
   */
  const 獲取加權節約碼長 = (字符: string, 字頻類型: string): string => {
    if (!字頻表緩存) return '-0.0000'

    let 歸一化字頻 = 0

    switch (字頻類型) {
      case '知乎':
        歸一化字頻 = (字頻表緩存.get('知乎簡體字頻') || {})[字符] || 0
        break
      case '北語':
        歸一化字頻 = (字頻表緩存.get('北語簡體字頻') || {})[字符] || 0
        break
      case '臺標':
        歸一化字頻 = (字頻表緩存.get('臺標繁體字頻') || {})[字符] || 0
        break
      case '古籍':
        歸一化字頻 = (字頻表緩存.get('古籍繁體字頻') || {})[字符] || 0
        break
      case '繁簡':
        歸一化字頻 = (字頻表緩存.get('繁簡聯合字頻') || {})[字符] || 0
        break
      default:
        return '-0.0000'
    }

    const 簡碼 = 獲取簡碼(字符)
    const 全碼 = 獲取全碼(字符)

    if (!簡碼 || !全碼) {
      return '-0.0000'
    }

    const 節約碼長 = 歸一化字頻 * (全碼.length - 簡碼.length)
    return `-${節約碼長.toFixed(4)}`
  }

  // ===================
  // 渲染
  // ===================

  if (!處理後碼表) {
    return (
      <div style={{ padding: 24 }}>
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Paragraph>計算使用效率最高的若干簡碼下的字頻加權平均碼長</Paragraph>
          </div>

          <EmptyState>
            <div className="empty-icon">📊</div>
            <h4>等待碼表數據</h4>
            <p>請先在「碼表解析」頁面上傳碼表文件</p>
          </EmptyState>
        </Space>
      </div>
    )
  }

  return (
    <div style={{ padding: 24 }}>
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Paragraph>計算使用效率最高的若干簡碼下的字頻加權平均碼長</Paragraph>
        </div>

        {/* 操作按鈕 */}
        <Space>
          <Button type="primary" icon={<ReloadOutlined />} onClick={重新計算} loading={計算中}>
            {計算中 ? '計算中...' : '重新計算'}
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
            <p style={{ marginTop: 16 }}>正在計算簡碼效率...</p>
          </div>
        )}

        {/* 數據表格 */}
        {!計算中 && 表格數據.length > 0 && (
          <>
            <TableContainer>
              <MetricsTable>
                <thead>
                  <tr>
                    <th>簡碼數量</th>
                    <th>知乎簡體字頻</th>
                    <th>北語簡體字頻</th>
                    <th>臺標繁體字頻</th>
                    <th>古籍繁體字頻</th>
                    <th>繁簡聯合字頻</th>
                  </tr>
                </thead>
                <tbody>
                  {表格數據.map((行, 索引) => (
                    <tr key={行.最有效率的簡碼個數}>
                      <NValueCell>{行.最有效率的簡碼個數}</NValueCell>

                      {應隱藏單元格(索引, '知乎簡體字頻加權碼長') ? (
                        <HiddenCell />
                      ) : (
                        <MetricValueCell
                          $clickable
                          $colorClass={獲取顔色類别(行.知乎簡體字頻加權碼長)}
                          onClick={() =>
                            顯示詳情模態框(行.知乎簡體字頻字符, 行.最有效率的簡碼個數, '知乎')
                          }
                        >
                          {行.知乎簡體字頻加權碼長.toFixed(3)}
                        </MetricValueCell>
                      )}

                      {應隱藏單元格(索引, '北語簡體字頻加權碼長') ? (
                        <HiddenCell />
                      ) : (
                        <MetricValueCell
                          $clickable
                          $colorClass={獲取顔色類别(行.北語簡體字頻加權碼長)}
                          onClick={() =>
                            顯示詳情模態框(行.北語簡體字頻字符, 行.最有效率的簡碼個數, '北語')
                          }
                        >
                          {行.北語簡體字頻加權碼長.toFixed(3)}
                        </MetricValueCell>
                      )}

                      {應隱藏單元格(索引, '臺標繁體字頻加權碼長') ? (
                        <HiddenCell />
                      ) : (
                        <MetricValueCell
                          $clickable
                          $colorClass={獲取顔色類别(行.臺標繁體字頻加權碼長)}
                          onClick={() =>
                            顯示詳情模態框(行.臺標繁體字頻字符, 行.最有效率的簡碼個數, '臺標')
                          }
                        >
                          {行.臺標繁體字頻加權碼長.toFixed(3)}
                        </MetricValueCell>
                      )}

                      {應隱藏單元格(索引, '古籍繁體字頻加權碼長') ? (
                        <HiddenCell />
                      ) : (
                        <MetricValueCell
                          $clickable
                          $colorClass={獲取顔色類别(行.古籍繁體字頻加權碼長)}
                          onClick={() =>
                            顯示詳情模態框(行.古籍繁體字頻字符, 行.最有效率的簡碼個數, '古籍')
                          }
                        >
                          {行.古籍繁體字頻加權碼長.toFixed(3)}
                        </MetricValueCell>
                      )}

                      {應隱藏單元格(索引, '繁簡聯合字頻加權碼長') ? (
                        <HiddenCell />
                      ) : (
                        <MetricValueCell
                          $clickable
                          $colorClass={獲取顔色類别(行.繁簡聯合字頻加權碼長)}
                          onClick={() =>
                            顯示詳情模態框(行.繁簡聯合字頻字符, 行.最有效率的簡碼個數, '繁簡')
                          }
                        >
                          {行.繁簡聯合字頻加權碼長.toFixed(3)}
                        </MetricValueCell>
                      )}
                    </tr>
                  ))}
                </tbody>
              </MetricsTable>
            </TableContainer>

            <Alert
              message="説明"
              description={
                <div>
                  <ul style={{ marginBottom: 0 }}>
                    {有省略行 && (
                      <li>
                        <strong>注意：</strong>繼續出簡不再降低碼長（部分行已省略顯示）
                      </li>
                    )}
                    <li>本模塊使用前 N 個（最大爲 2000 個）最有效率的簡碼時的平均碼長</li>
                    <li>簡碼字的效率取決於漢字字頻 × 節約碼長</li>
                    <li>僅考慮簡碼長度小於全碼長度且小於最大碼長的漢字，實際簡碼數量可能小於 N</li>
                    <li>點擊數字可查看該區間所有高效簡碼字的詳細列表</li>
                  </ul>
                </div>
              }
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />

            {當前方案?.元數據?.方案名 && (
              <div style={{ marginTop: 16, textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
                當前方案：{當前方案.元數據.方案名}
              </div>
            )}
          </>
        )}
      </Space>

      {/* 詳情模態框 */}
      <Modal
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{詳情標題}</span>
            <Button
              type="primary"
              icon={<CopyOutlined />}
              size="small"
              onClick={複製到剪貼板}
              style={{ marginLeft: 16 }}
            >
              複製
            </Button>
          </div>
        }
        open={顯示詳情}
        onCancel={() => 設置顯示詳情(false)}
        footer={null}
        width={900}
        style={{ maxHeight: '80vh' }}
      >
        {詳情字符列表.length > 0 ? (
          <ModalCharGrid>
            {詳情字符列表.map((字符, 索引) => (
              <ModalCharItem key={`${字符}-${索引}`}>
                <ModalChar>{字符}</ModalChar>
                <ModalCodes>
                  <ModalCharCode $type="short">{獲取簡碼(字符)}</ModalCharCode>
                  <ModalCharCode $type="full">{獲取全碼(字符)}</ModalCharCode>
                  <ModalCharCode $type="saving">
                    {獲取加權節約碼長(字符, 詳情字頻類型)}
                  </ModalCharCode>
                </ModalCodes>
              </ModalCharItem>
            ))}
          </ModalCharGrid>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>無數據</div>
        )}
      </Modal>
    </div>
  )
}

export default ShortCodeEfficiencyPage
