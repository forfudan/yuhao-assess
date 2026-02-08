import React, { useState, useEffect, useMemo } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { Button, Space, Typography, Table, Modal, Checkbox, message, Alert } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { 當前方案原子狀態 } from '@/atoms/scheme'
import { 選中對比方案鍵名列表原子狀態 } from '@/atoms/comparison'
import { 動態選重分析原子狀態 } from '@/atoms/dynamicDuplicate'
import { 靜態重碼分析原子狀態 } from '@/atoms/staticDuplicate'
import { 候選個數分析原子狀態 } from '@/atoms/maximumCandidates'
import { 速度當量分析原子狀態 } from '@/atoms/speedEquivalent'
import { 簡碼效率分析原子狀態 } from '@/atoms/shortCodeEfficiency'
import { 獲取内置方案列表, 加載方案, type 内置方案配置 } from '@/services/schemeService'
import type { 動態選重分析結果介面 } from '@/atoms/dynamicDuplicate'
import type { 靜態重碼分析結果介面 } from '@/atoms/staticDuplicate'
import type { 最大候選個數分析結果 } from '@/atoms/maximumCandidates'
import type { 速度當量分析結果介面 } from '@/atoms/speedEquivalent'
import type { 簡碼效率分析結果介面 } from '@/atoms/shortCodeEfficiency'

const { Paragraph } = Typography

// 對比方案數據介面
interface 對比方案數據介面 {
  唯一鍵: string // 用於 React key，格式：方案名-current 或 方案名-builtin
  方案名: string
  顯示名稱: string // 顯示用的名稱，當前方案會添加 "(當前方案)" 後綴
  是否當前方案: boolean
  碼表哈希?: string // 用於去重判斷
  動態選重分析?: 動態選重分析結果介面 | null
  靜態重碼分析?: 靜態重碼分析結果介面 | null
  候選個數分析?: 最大候選個數分析結果 | null
  速度當量分析?: 速度當量分析結果介面 | null
  簡碼效率分析?: 簡碼效率分析結果介面 | null
}

// 分析型别
type 分析型别 =
  | '靜態重碼'
  | '頻率降序動態選重'
  | '原始碼表動態選重'
  | '候選個數'
  | '速度當量'
  | '簡碼效率'

// 字頻來源型别
type 字頻來源型别 = '知乎簡體' | '北語簡體' | '臺標繁體' | '古籍繁體' | '繁簡聯合'

// 全碼簡碼型别
type 全碼簡碼型别 = '全碼' | '簡碼'

const ComparisonPage: React.FC = () => {
  const [當前方案] = useAtom(當前方案原子狀態)
  const 動態選重分析結果 = useAtomValue(動態選重分析原子狀態)
  const 靜態重碼分析結果 = useAtomValue(靜態重碼分析原子狀態)
  const 候選個數分析結果 = useAtomValue(候選個數分析原子狀態)
  const 速度當量分析結果 = useAtomValue(速度當量分析原子狀態)
  const 簡碼效率分析結果 = useAtomValue(簡碼效率分析原子狀態)

  const [内置方案列表, 設置内置方案列表] = useState<内置方案配置[]>([])
  const [選中對比方案鍵名列表, 設置選中對比方案鍵名列表] = useAtom(選中對比方案鍵名列表原子狀態)
  const [臨時已選方案鍵名列表, 設置臨時已選方案鍵名列表] = useState<string[]>([])
  const [對比方案列表, 設置對比方案列表] = useState<對比方案數據介面[]>([])
  const [顯示選擇彈窗, 設置顯示選擇彈窗] = useState(false)
  const [加載中, 設置加載中] = useState(false)

  // 三層選擇狀態
  const [當前分析類型, 設置當前分析類型] = useState<分析型别>('靜態重碼')
  const [當前字頻來源, 設置當前字頻來源] = useState<字頻來源型别>('知乎簡體')
  const [當前全碼簡碼, 設置當前全碼簡碼] = useState<全碼簡碼型别>('全碼')

  // 加載内置方案列表
  useEffect(() => {
    const 加載列表 = async () => {
      const 列表 = await 獲取内置方案列表()
      設置内置方案列表(列表)
    }
    加載列表()
  }, [])

  // 加載對比方案數據
  const 加載對比方案數據 = async () => {
    const 方案列表: 對比方案數據介面[] = []
    let 當前方案哈希: string | undefined = undefined

    // 添加當前方案（如果存在且有分析數據）
    if (當前方案 && (動態選重分析結果 || 靜態重碼分析結果)) {
      當前方案哈希 = 當前方案.碼表元數據?.哈希值
      const 方案名 = 當前方案.元數據.方案名

      方案列表.push({
        唯一鍵: `${方案名}-current`,
        方案名,
        顯示名稱: `${方案名}（當前方案）`,
        是否當前方案: true,
        碼表哈希: 當前方案哈希,
        動態選重分析: 動態選重分析結果,
        靜態重碼分析: 靜態重碼分析結果,
        候選個數分析: 候選個數分析結果,
        速度當量分析: 速度當量分析結果,
        簡碼效率分析: 簡碼效率分析結果,
      })
    }

    // 加載選中的内置方案數據
    for (const key of 選中對比方案鍵名列表) {
      try {
        const 方案 = await 加載方案(key)

        const 方案信息 = 内置方案列表.find(b => b.key === key)
        const 測評結果 = 方案.測評結果
        const 方案哈希 = 方案.碼表元數據?.哈希值

        // 如果當前方案存在且哈希值相同，則跳過此内置方案
        if (當前方案哈希 && 方案哈希 && 當前方案哈希 === 方案哈希) {
          continue
        }

        const 方案名 = 方案信息?.name || 方案.元數據.方案名
        const 新方案數據 = {
          唯一鍵: `${方案名}-builtin-${key}`,
          方案名,
          顯示名稱: 方案名,
          是否當前方案: false,
          碼表哈希: 方案哈希,
          動態選重分析: 測評結果?.動態選重分析 || null,
          靜態重碼分析: 測評結果?.靜態重碼分析 || null,
          候選個數分析: 測評結果?.候選個數分析 || null,
          速度當量分析: 測評結果?.速度當量分析 || null,
          簡碼效率分析: 測評結果?.簡碼效率分析 || null,
        }

        方案列表.push(新方案數據)
      } catch (error) {
        console.error(`❌ 加載方案 ${key} 失敗:`, error)
      }
    }

    設置對比方案列表(方案列表)
  }

  // 初始化和刷新對比方案數據
  useEffect(() => {
    if (内置方案列表.length > 0) {
      加載對比方案數據()
    }
  }, [
    當前方案,
    動態選重分析結果,
    靜態重碼分析結果,
    候選個數分析結果,
    速度當量分析結果,
    簡碼效率分析結果,
    選中對比方案鍵名列表,
    内置方案列表,
  ])

  // 打開選擇彈窗時初始化臨時列表
  const 打開選擇彈窗 = () => {
    設置臨時已選方案鍵名列表(選中對比方案鍵名列表)
    設置顯示選擇彈窗(true)
  }

  // 全選/取消全選
  const 處理全選 = (checked: boolean) => {
    if (checked) {
      設置臨時已選方案鍵名列表(内置方案列表.map(s => s.key))
    } else {
      設置臨時已選方案鍵名列表([])
    }
  }

  // 選擇方案
  const 處理方案選擇 = (key: string, checked: boolean) => {
    if (checked) {
      設置臨時已選方案鍵名列表([...臨時已選方案鍵名列表, key])
    } else {
      設置臨時已選方案鍵名列表(臨時已選方案鍵名列表.filter(k => k !== key))
    }
  }

  // 確認選擇的方案
  const 確認選擇方案 = () => {
    設置選中對比方案鍵名列表(臨時已選方案鍵名列表)
    設置顯示選擇彈窗(false)
    message.success('已更新對比方案列表')
  }

  // 刷新對比數據
  const 刷新對比數據 = async () => {
    設置加載中(true)
    try {
      await 加載對比方案數據()
      message.success('刷新成功')
    } catch (error) {
      console.error('❌ 刷新失敗:', error)
      message.error('刷新失敗: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      設置加載中(false)
    }
  }

  // 靜態重碼字數表格列定義（根據全碼/簡碼動態生成，顯示7個字符集）
  const 獲取靜態重碼字數列 = (全碼簡碼: 全碼簡碼型别): ColumnsType<對比方案數據介面> => {
    const 碼類型 = 全碼簡碼 === '全碼' ? '全碼重碼字數' : '簡碼重碼字數'

    return [
      {
        title: '方案名',
        dataIndex: '顯示名稱',
        key: '顯示名稱',
        fixed: 'left',
      },
      {
        title: 'GB2312',
        key: 'gb2312',
        render: (_, record) => {
          const data = record.靜態重碼分析?.GB2312
          if (!data) return '-'
          const 覆蓋率 = data.字集覆蓋率
          return 覆蓋率 !== undefined && 覆蓋率 < 0.99 ? '缺字' : data[碼類型] || '-'
        },
      },
      {
        title: '通用規範',
        key: 'tonggui',
        render: (_, record) => {
          const data = record.靜態重碼分析?.通用規範
          if (!data) return '-'
          const 覆蓋率 = data.字集覆蓋率
          return 覆蓋率 !== undefined && 覆蓋率 < 0.99 ? '缺字' : data[碼類型] || '-'
        },
      },
      {
        title: '常用國字',
        key: 'guozi',
        render: (_, record) => {
          const data = record.靜態重碼分析?.常用國字
          if (!data) return '-'
          const 覆蓋率 = data.字集覆蓋率
          return 覆蓋率 !== undefined && 覆蓋率 < 0.99 ? '缺字' : data[碼類型] || '-'
        },
      },
      {
        title: 'CJK基本',
        key: 'cjk-basic',
        render: (_, record) => {
          const data = record.靜態重碼分析?.CJK基本
          if (!data) return '-'
          const 覆蓋率 = data.字集覆蓋率
          return 覆蓋率 !== undefined && 覆蓋率 < 0.99 ? '缺字' : data[碼類型] || '-'
        },
      },
      {
        title: 'CJK擴B',
        key: 'cjk-b',
        render: (_, record) => {
          const data = record.靜態重碼分析?.到CJKB
          if (!data) return '-'
          const 覆蓋率 = data.字集覆蓋率
          return 覆蓋率 !== undefined && 覆蓋率 < 0.99 ? '缺字' : data[碼類型] || '-'
        },
      },
      {
        title: 'CJK擴H',
        key: 'cjk-h',
        render: (_, record) => {
          const data = record.靜態重碼分析?.到CJKH
          if (!data) return '-'
          const 覆蓋率 = data.字集覆蓋率
          return 覆蓋率 !== undefined && 覆蓋率 < 0.99 ? '缺字' : data[碼類型] || '-'
        },
      },
      {
        title: 'CJK擴J',
        key: 'cjk-j',
        render: (_, record) => {
          const data = record.靜態重碼分析?.到CJKJ
          if (!data) return '-'
          const 覆蓋率 = data.字集覆蓋率
          return 覆蓋率 !== undefined && 覆蓋率 < 0.99 ? '缺字' : data[碼類型] || '-'
        },
      },
    ]
  }

  // 最大候選數列
  const 最大候選數列: ColumnsType<對比方案數據介面> = [
    {
      title: '方案名',
      dataIndex: '顯示名稱',
      key: '顯示名稱',
      fixed: 'left',
    },
    {
      title: 'GB2312',
      key: 'gb2312',
      render: (_, record) => {
        const data = record.候選個數分析?.GB2312
        if (!data) return '-'
        const 覆蓋率 = record.靜態重碼分析?.GB2312.字集覆蓋率
        return 覆蓋率 !== undefined && 覆蓋率 < 0.99 ? '缺字' : data.最大候選個數 || '-'
      },
    },
    {
      title: '通用規範',
      key: 'tonggui',
      render: (_, record) => {
        const data = record.候選個數分析?.通用規範
        if (!data) return '-'
        const 覆蓋率 = record.靜態重碼分析?.通用規範.字集覆蓋率
        return 覆蓋率 !== undefined && 覆蓋率 < 0.99 ? '缺字' : data.最大候選個數 || '-'
      },
    },
    {
      title: '常用國字',
      key: 'guozi',
      render: (_, record) => {
        const data = record.候選個數分析?.常用國字
        if (!data) return '-'
        const 覆蓋率 = record.靜態重碼分析?.常用國字.字集覆蓋率
        return 覆蓋率 !== undefined && 覆蓋率 < 0.99 ? '缺字' : data.最大候選個數 || '-'
      },
    },
    {
      title: 'CJK基本',
      key: 'cjk-basic',
      render: (_, record) => {
        const data = record.候選個數分析?.CJK基本
        if (!data) return '-'
        const 覆蓋率 = record.靜態重碼分析?.CJK基本.字集覆蓋率
        return 覆蓋率 !== undefined && 覆蓋率 < 0.99 ? '缺字' : data.最大候選個數 || '-'
      },
    },
    {
      title: 'CJK擴B',
      key: 'cjk-b',
      render: (_, record) => {
        const data = record.候選個數分析?.CJK擴B
        if (!data) return '-'
        const 覆蓋率 = record.靜態重碼分析?.到CJKB.字集覆蓋率
        return 覆蓋率 !== undefined && 覆蓋率 < 0.99 ? '缺字' : data.最大候選個數 || '-'
      },
    },
    {
      title: 'CJK擴H',
      key: 'cjk-h',
      render: (_, record) => {
        const data = record.候選個數分析?.CJK擴H
        if (!data) return '-'
        const 覆蓋率 = record.靜態重碼分析?.到CJKH.字集覆蓋率
        return 覆蓋率 !== undefined && 覆蓋率 < 0.99 ? '缺字' : data.最大候選個數 || '-'
      },
    },
    {
      title: 'CJK擴J',
      key: 'cjk-j',
      render: (_, record) => {
        const data = record.候選個數分析?.CJK擴J
        if (!data) return '-'
        const 覆蓋率 = record.靜態重碼分析?.到CJKJ.字集覆蓋率
        return 覆蓋率 !== undefined && 覆蓋率 < 0.99 ? '缺字' : data.最大候選個數 || '-'
      },
    },
  ]

  // 速度當量列（根據字頻來源動態生成，顯示4列：全碼、一級簡碼、二級簡碼、全部簡碼）
  const 獲取速度當量列 = (字頻來源: 字頻來源型别): ColumnsType<對比方案數據介面> => {
    const 字頻前綴映射: Record<字頻來源型别, string> = {
      知乎簡體: '知乎簡體字頻',
      北語簡體: '北語簡體字頻',
      臺標繁體: '臺標繁體字頻',
      古籍繁體: '古籍繁體字頻',
      繁簡聯合: '繁簡聯合字頻',
    }

    const 前綴 = 字頻前綴映射[字頻來源]

    return [
      {
        title: '方案名',
        dataIndex: '顯示名稱',
        key: '顯示名稱',
        fixed: 'left',
      },
      {
        title: '全碼當量',
        key: 'full-equiv',
        render: (_, record) => {
          const 值 = (record.速度當量分析 as any)?.[`${前綴}全碼速度當量`]
          return 值 ? 值.toFixed(3) : '-'
        },
      },
      {
        title: '一級簡碼當量',
        key: 'first-short-equiv',
        render: (_, record) => {
          const 值 = (record.速度當量分析 as any)?.[`${前綴}一級簡碼速度當量`]
          return 值 ? 值.toFixed(3) : '-'
        },
      },
      {
        title: '二級簡碼當量',
        key: 'second-short-equiv',
        render: (_, record) => {
          const 值 = (record.速度當量分析 as any)?.[`${前綴}二級簡碼速度當量`]
          return 值 ? 值.toFixed(3) : '-'
        },
      },
      {
        title: '全部簡碼當量',
        key: 'all-short-equiv',
        render: (_, record) => {
          const 值 = (record.速度當量分析 as any)?.[`${前綴}全部簡碼速度當量`]
          return 值 ? 值.toFixed(3) : '-'
        },
      },
    ]
  }

  // 動態重碼率列（根據全碼/簡碼動態生成，顯示5個字頻來源）
  const 獲取動態重碼率列 = (全碼簡碼: 全碼簡碼型别): ColumnsType<對比方案數據介面> => {
    const 碼類型 = 全碼簡碼 === '全碼' ? '全碼' : '簡碼'

    return [
      {
        title: '方案名',
        dataIndex: '顯示名稱',
        key: '顯示名稱',
        fixed: 'left',
      },
      {
        title: '知乎簡體',
        key: '知乎簡體',
        render: (_, record) => {
          const 值 = record.動態選重分析?.知乎簡體動態選重率?.[碼類型]
          return 值 ? `${(值 * 10000).toFixed(2)}‱` : '-'
        },
      },
      {
        title: '北語簡體',
        key: '北語簡體',
        render: (_, record) => {
          const 值 = record.動態選重分析?.北語簡體動態選重率?.[碼類型]
          return 值 ? `${(值 * 10000).toFixed(2)}‱` : '-'
        },
      },
      {
        title: '臺標繁體',
        key: '臺標繁體',
        render: (_, record) => {
          const 值 = record.動態選重分析?.臺標繁體動態選重率?.[碼類型]
          return 值 ? `${(值 * 10000).toFixed(2)}‱` : '-'
        },
      },
      {
        title: '古籍繁體',
        key: '古籍繁體',
        render: (_, record) => {
          const 值 = record.動態選重分析?.古籍繁體動態選重率?.[碼類型]
          return 值 ? `${(值 * 10000).toFixed(2)}‱` : '-'
        },
      },
      {
        title: '繁簡聯合',
        key: '繁簡聯合',
        render: (_, record) => {
          const 值 = record.動態選重分析?.繁簡聯合動態選重率?.[碼類型]
          return 值 ? `${(值 * 10000).toFixed(2)}‱` : '-'
        },
      },
    ]
  }

  // 動態重碼率原始排序列（根據全碼/簡碼動態生成，顯示5個字頻來源）
  const 獲取動態重碼率原始排序列 = (全碼簡碼: 全碼簡碼型别): ColumnsType<對比方案數據介面> => {
    const 碼類型 = 全碼簡碼 === '全碼' ? '全碼' : '簡碼'

    return [
      {
        title: '方案名',
        dataIndex: '顯示名稱',
        key: '顯示名稱',
        fixed: 'left',
      },
      {
        title: '知乎簡體',
        key: 'zhihu-orig',
        render: (_, record) => {
          const 值 = record.動態選重分析?.知乎簡體動態選重率原序?.[碼類型]
          return 值 ? `${(值 * 10000).toFixed(2)}‱` : '-'
        },
      },
      {
        title: '北語簡體',
        key: 'sc-orig',
        render: (_, record) => {
          const 值 = record.動態選重分析?.北語簡體動態選重率原序?.[碼類型]
          return 值 ? `${(值 * 10000).toFixed(2)}‱` : '-'
        },
      },
      {
        title: '臺標繁體',
        key: 'tc-orig',
        render: (_, record) => {
          const 值 = record.動態選重分析?.臺標繁體動態選重率原序?.[碼類型]
          return 值 ? `${(值 * 10000).toFixed(2)}‱` : '-'
        },
      },
      {
        title: '古籍繁體',
        key: 'guji-orig',
        render: (_, record) => {
          const 值 = record.動態選重分析?.古籍繁體動態選重率原序?.[碼類型]
          return 值 ? `${(值 * 10000).toFixed(2)}‱` : '-'
        },
      },
      {
        title: '繁簡聯合',
        key: 'fanjian-orig',
        render: (_, record) => {
          const 值 = record.動態選重分析?.繁簡聯合動態選重率原序?.[碼類型]
          return 值 ? `${(值 * 10000).toFixed(2)}‱` : '-'
        },
      },
    ]
  }

  // 簡碼效率列（根據字頻來源動態生成，顯示5個N值）
  const 獲取簡碼效率列 = (字頻來源: 字頻來源型别): ColumnsType<對比方案數據介面> => {
    const 字頻鍵名映射: Record<字頻來源型别, string> = {
      知乎簡體: '知乎簡體字頻下之簡碼效率',
      北語簡體: '北語簡體字頻下之簡碼效率',
      臺標繁體: '臺標繁體字頻下之簡碼效率',
      古籍繁體: '古籍繁體字頻下之簡碼效率',
      繁簡聯合: '繁簡聯合字頻下之簡碼效率',
    }

    const 字頻鍵 = 字頻鍵名映射[字頻來源]

    return [
      {
        title: '方案名',
        dataIndex: '顯示名稱',
        key: '顯示名稱',
        fixed: 'left',
      },
      {
        title: '25簡碼',
        key: 'n25',
        render: (_, record) => {
          const result = (record.簡碼效率分析 as any)?.[字頻鍵]?.N值結果?.find(
            (r: any) => r.最有效率的簡碼個數 === 25
          )
          return result?.字頻加權碼長?.toFixed(3) || '-'
        },
      },
      {
        title: '50簡碼',
        key: 'n50',
        render: (_, record) => {
          const result = (record.簡碼效率分析 as any)?.[字頻鍵]?.N值結果?.find(
            (r: any) => r.最有效率的簡碼個數 === 50
          )
          return result?.字頻加權碼長?.toFixed(3) || '-'
        },
      },
      {
        title: '100簡碼',
        key: 'n100',
        render: (_, record) => {
          const result = (record.簡碼效率分析 as any)?.[字頻鍵]?.N值結果?.find(
            (r: any) => r.最有效率的簡碼個數 === 100
          )
          return result?.字頻加權碼長?.toFixed(3) || '-'
        },
      },
      {
        title: '200簡碼',
        key: 'n200',
        render: (_, record) => {
          const result = (record.簡碼效率分析 as any)?.[字頻鍵]?.N值結果?.find(
            (r: any) => r.最有效率的簡碼個數 === 200
          )
          return result?.字頻加權碼長?.toFixed(3) || '-'
        },
      },
      {
        title: '500簡碼',
        key: 'n500',
        render: (_, record) => {
          const result = (record.簡碼效率分析 as any)?.[字頻鍵]?.N值結果?.find(
            (r: any) => r.最有效率的簡碼個數 === 500
          )
          return result?.字頻加權碼長?.toFixed(3) || '-'
        },
      },
    ]
  }

  // 根據當前選擇動態生成列定義
  const 當前列定義 = useMemo(() => {
    switch (當前分析類型) {
      case '靜態重碼':
        return 獲取靜態重碼字數列(當前全碼簡碼)
      case '頻率降序動態選重':
        return 獲取動態重碼率列(當前全碼簡碼)
      case '原始碼表動態選重':
        return 獲取動態重碼率原始排序列(當前全碼簡碼)
      case '候選個數':
        return 最大候選數列
      case '速度當量':
        return 獲取速度當量列(當前字頻來源)
      case '簡碼效率':
        return 獲取簡碼效率列(當前字頻來源)
      default:
        return 獲取靜態重碼字數列(當前全碼簡碼)
    }
  }, [當前分析類型, 當前字頻來源, 當前全碼簡碼])

  return (
    <div style={{ padding: 24 }}>
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Paragraph>
            對比當前方案與内置方案的各項指標。
            <br />
            選擇分析種類後，根據需要選擇字頻來源或全碼/簡碼，表格會自動更新。
          </Paragraph>
        </div>

        {/* 第一行：分析種類選擇 */}
        <Space wrap>
          <Button
            type={當前分析類型 === '靜態重碼' ? 'primary' : 'default'}
            onClick={() => 設置當前分析類型('靜態重碼')}
          >
            靜重
          </Button>
          <Button
            type={當前分析類型 === '頻率降序動態選重' ? 'primary' : 'default'}
            onClick={() => 設置當前分析類型('頻率降序動態選重')}
          >
            頻率降序動重
          </Button>
          <Button
            type={當前分析類型 === '原始碼表動態選重' ? 'primary' : 'default'}
            onClick={() => 設置當前分析類型('原始碼表動態選重')}
          >
            原始碼表動重
          </Button>
          <Button
            type={當前分析類型 === '候選個數' ? 'primary' : 'default'}
            onClick={() => 設置當前分析類型('候選個數')}
          >
            候選數
          </Button>
          <Button
            type={當前分析類型 === '速度當量' ? 'primary' : 'default'}
            onClick={() => 設置當前分析類型('速度當量')}
          >
            速度當量
          </Button>
          <Button
            type={當前分析類型 === '簡碼效率' ? 'primary' : 'default'}
            onClick={() => 設置當前分析類型('簡碼效率')}
          >
            簡碼效率
          </Button>
        </Space>

        {/* 第二行：字頻來源選擇（僅在當量和簡碼效率時顯示） */}
        {(當前分析類型 === '速度當量' || 當前分析類型 === '簡碼效率') && (
          <Space wrap>
            <Button
              type={當前字頻來源 === '知乎簡體' ? 'primary' : 'default'}
              onClick={() => 設置當前字頻來源('知乎簡體')}
              size="small"
            >
              知乎簡體
            </Button>
            <Button
              type={當前字頻來源 === '北語簡體' ? 'primary' : 'default'}
              onClick={() => 設置當前字頻來源('北語簡體')}
              size="small"
            >
              北語簡體
            </Button>
            <Button
              type={當前字頻來源 === '臺標繁體' ? 'primary' : 'default'}
              onClick={() => 設置當前字頻來源('臺標繁體')}
              size="small"
            >
              臺標繁體
            </Button>
            <Button
              type={當前字頻來源 === '古籍繁體' ? 'primary' : 'default'}
              onClick={() => 設置當前字頻來源('古籍繁體')}
              size="small"
            >
              古籍繁體
            </Button>
            <Button
              type={當前字頻來源 === '繁簡聯合' ? 'primary' : 'default'}
              onClick={() => 設置當前字頻來源('繁簡聯合')}
              size="small"
            >
              繁簡聯合
            </Button>
          </Space>
        )}

        {/* 第三行：全碼/簡碼選擇（在靜重、動重和原始碼表動重時顯示） */}
        {(當前分析類型 === '靜態重碼' ||
          當前分析類型 === '頻率降序動態選重' ||
          當前分析類型 === '原始碼表動態選重') && (
          <Space wrap>
            <Button
              type={當前全碼簡碼 === '全碼' ? 'primary' : 'default'}
              onClick={() => 設置當前全碼簡碼('全碼')}
              size="small"
            >
              全碼
            </Button>
            <Button
              type={當前全碼簡碼 === '簡碼' ? 'primary' : 'default'}
              onClick={() => 設置當前全碼簡碼('簡碼')}
              size="small"
            >
              簡碼
            </Button>
          </Space>
        )}

        {/* 操作按鈕 */}
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={打開選擇彈窗}>
            選擇對比方案
          </Button>
          <Button icon={<ReloadOutlined />} onClick={刷新對比數據} loading={加載中}>
            刷新
          </Button>
        </Space>

        {/* 對比表格 */}
        <Table
          columns={當前列定義}
          dataSource={對比方案列表}
          rowKey="唯一鍵"
          pagination={false}
          scroll={{ x: 'max-content' }}
        />

        {/* 説明信息 */}
        <Alert
          title="説明"
          description={
            <div>
              <p>如果某方案缺字超過當前字集1%，部分單元格不顯示數據。</p>
            </div>
          }
          type="info"
          showIcon
        />
      </Space>

      {/* 選擇方案彈窗 */}
      <Modal
        title="選擇對比方案"
        open={顯示選擇彈窗}
        onCancel={() => 設置顯示選擇彈窗(false)}
        onOk={確認選擇方案}
        width={600}
      >
        <Space orientation="vertical" style={{ width: '100%' }}>
          <Space>
            <Checkbox
              checked={臨時已選方案鍵名列表.length === 内置方案列表.length}
              indeterminate={
                臨時已選方案鍵名列表.length > 0 && 臨時已選方案鍵名列表.length < 内置方案列表.length
              }
              onChange={e => 處理全選(e.target.checked)}
            >
              全選
            </Checkbox>
            <span style={{ color: '#999' }}>
              已選 {臨時已選方案鍵名列表.length} / {内置方案列表.length}
            </span>
          </Space>

          <div style={{ maxHeight: 400, overflow: 'auto' }}>
            <Space orientation="vertical" style={{ width: '100%' }}>
              {内置方案列表.map(scheme => (
                <Checkbox
                  key={scheme.key}
                  checked={臨時已選方案鍵名列表.includes(scheme.key)}
                  onChange={e => 處理方案選擇(scheme.key, e.target.checked)}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>{scheme.name}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>{scheme.description}</div>
                  </div>
                </Checkbox>
              ))}
            </Space>
          </div>
        </Space>
      </Modal>
    </div>
  )
}

export default ComparisonPage
