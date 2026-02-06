import React, { useState, useEffect, useMemo } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { Button, Space, Typography, Table, Modal, Checkbox, message } from 'antd'
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
import type { 方案配置介面 } from '@/types/scheme'
import type { 動態選重分析結果介面 } from '@/atoms/dynamicDuplicate'
import type { 靜態重碼分析結果介面 } from '@/atoms/staticDuplicate'
import type { 最大候選個數分析結果 } from '@/atoms/maximumCandidates'
import type { 速度當量分析結果介面 } from '@/atoms/speedEquivalent'
import type { 簡碼效率分析結果介面 } from '@/atoms/shortCodeEfficiency'

const { Paragraph } = Typography

// 對比方案數據接口
interface 對比方案數據 {
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

// Tab 類型
type TabType =
  | 'duplicate'
  | 'dynamicDupRate'
  | 'dynamicDupRateOriginal'
  | 'maxCandidates'
  | 'speedEquiv'
  | 'shortCodeEfficiency'

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
  const [對比方案列表, 設置對比方案列表] = useState<對比方案數據[]>([])
  const [顯示選擇彈窗, 設置顯示選擇彈窗] = useState(false)
  const [加載中, 設置加載中] = useState(false)
  const [當前Tab, 設置當前Tab] = useState<TabType>('duplicate')

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
    console.log('🔵 [Step 1] 開始加載對比方案數據')
    console.log('🔵 選中的方案鍵名列表:', 選中對比方案鍵名列表)
    console.log('🔵 内置方案列表:', 内置方案列表)

    const 方案列表: 對比方案數據[] = []
    let 當前方案哈希: string | undefined = undefined

    // 添加當前方案（如果存在且有分析數據）
    if (當前方案 && (動態選重分析結果 || 靜態重碼分析結果)) {
      console.log('🟢 [Step 2] 添加當前方案:', 當前方案.元數據.方案名)
      console.log('🟢 當前方案的動態選重率:', 動態選重分析結果)
      console.log('🟢 當前方案的靜態重碼:', 靜態重碼分析結果)

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
    } else {
      console.log('⚠️ 没有當前方案或没有分析數據')
    }

    // 加載選中的内置方案數據
    console.log('🔵 [Step 3] 開始加載内置方案，共', 選中對比方案鍵名列表.length, '個')

    for (const key of 選中對比方案鍵名列表) {
      try {
        console.log(`🟡 正在加載方案: ${key}`)
        const 方案 = await 加載方案(key)
        console.log(`🟡 方案 ${key} 加載成功:`, 方案)

        const 方案信息 = 内置方案列表.find(b => b.key === key)
        const 測評結果 = 方案.測評結果
        const 方案哈希 = 方案.碼表元數據?.哈希值

        console.log(`🟡 方案 ${key} 的測評結果:`, 測評結果)
        console.log(`🟡 方案 ${key} 的碼表元數據:`, 方案.碼表元數據)
        console.log(`🟡 方案 ${key} 的哈希值:`, 方案哈希)

        // 如果當前方案存在且哈希值相同，則跳過此内置方案
        if (當前方案哈希 && 方案哈希 && 當前方案哈希 === 方案哈希) {
          console.log(`⚠️ 方案 ${key} 與當前方案哈希值相同，跳過`)
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

        console.log(`🟢 方案 ${key} 添加到列表:`, 新方案數據)
        方案列表.push(新方案數據)
      } catch (error) {
        console.error(`❌ 加載方案 ${key} 失敗:`, error)
      }
    }

    console.log('🔵 [Step 4] 最終方案列表:', 方案列表)
    設置對比方案列表(方案列表)
  }

  // 初始化和刷新對比方案數據
  useEffect(() => {
    console.log('🔄 useEffect 觸發')
    console.log('🔄 内置方案列表長度:', 内置方案列表.length)
    console.log('🔄 選中對比方案鍵名列表:', 選中對比方案鍵名列表)

    if (内置方案列表.length > 0) {
      console.log('🔄 開始執行加載對比方案數據')
      加載對比方案數據()
    } else {
      console.log('⚠️ 内置方案列表爲空，跳過加載')
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
    console.log('✅ 確認選擇方案')
    console.log('✅ 臨時已選:', 臨時已選方案鍵名列表)
    console.log('✅ 保存到 atom 之前:', 選中對比方案鍵名列表)

    設置選中對比方案鍵名列表(臨時已選方案鍵名列表)

    console.log('✅ 保存到 atom 之後 (實際會在下次渲染生效)')
    設置顯示選擇彈窗(false)
    message.success('已更新對比方案列表')
  }

  // 刷新對比數據
  const 刷新對比數據 = async () => {
    console.log('🔄 手動刷新對比數據')
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

  // 靜態重碼字數表格列定義
  const 靜態重碼字數列: ColumnsType<對比方案數據> = [
    {
      title: '方案名',
      dataIndex: '顯示名稱',
      key: '顯示名稱',
      fixed: 'left',
    },
    {
      title: 'GB2312 全碼',
      key: 'gb2312-full',
      render: (_, record) => {
        const value = record.靜態重碼分析?.GB2312?.全碼重碼字數
        console.log(`📊 [${record.方案名}] GB2312全碼重碼字數:`, value)
        console.log(`📊 [${record.方案名}] 靜態重碼分析結構:`, record.靜態重碼分析)
        return value || '-'
      },
    },
    {
      title: 'GB2312 簡碼',
      key: 'gb2312-short',
      render: (_, record) => record.靜態重碼分析?.GB2312?.簡碼重碼字數 || '-',
    },
    {
      title: '通用規範 全碼',
      key: 'tonggui-full',
      render: (_, record) => record.靜態重碼分析?.通用規範?.全碼重碼字數 || '-',
    },
    {
      title: '常用國字 全碼',
      key: 'guozi-full',
      render: (_, record) => record.靜態重碼分析?.常用國字?.全碼重碼字數 || '-',
    },
    {
      title: 'CJK 基本 全碼',
      key: 'cjk-basic-full',
      render: (_, record) => record.靜態重碼分析?.CJK基本?.全碼重碼字數 || '-',
    },
  ]

  // 最大候選數列
  const 最大候選數列: ColumnsType<對比方案數據> = [
    {
      title: '方案名',
      dataIndex: '顯示名稱',
      key: '顯示名稱',
      fixed: 'left',
    },
    {
      title: 'GB2312',
      key: 'gb2312',
      render: (_, record) => record.候選個數分析?.GB2312?.最大候選個數 || '-',
    },
    {
      title: '常用國字',
      key: 'guozi',
      render: (_, record) => record.候選個數分析?.常用國字?.最大候選個數 || '-',
    },
    {
      title: 'CJK 基本',
      key: 'cjk-basic',
      render: (_, record) => record.候選個數分析?.CJK基本?.最大候選個數 || '-',
    },
  ]

  // 速度當量列（五個字頻的全碼速度當量）
  const 速度當量列: ColumnsType<對比方案數據> = [
    {
      title: '方案名',
      dataIndex: '顯示名稱',
      key: '顯示名稱',
      fixed: 'left',
    },
    {
      title: '知乎簡體',
      key: 'zhihu',
      render: (_, record) => record.速度當量分析?.知乎簡體字頻全碼速度當量?.toFixed(2) || '-',
    },
    {
      title: '北語簡體',
      key: 'sc',
      render: (_, record) => record.速度當量分析?.北語簡體字頻全碼速度當量?.toFixed(2) || '-',
    },
    {
      title: '臺標繁體',
      key: 'tc',
      render: (_, record) => record.速度當量分析?.臺標繁體字頻全碼速度當量?.toFixed(2) || '-',
    },
    {
      title: '古籍繁體',
      key: 'guji',
      render: (_, record) => record.速度當量分析?.古籍繁體字頻全碼速度當量?.toFixed(2) || '-',
    },
    {
      title: '繁簡聯合',
      key: 'fanjian',
      render: (_, record) => record.速度當量分析?.繁簡聯合字頻全碼速度當量?.toFixed(2) || '-',
    },
  ]

  // 動態重碼率列（五個字頻源的全碼）
  const 動態重碼率列: ColumnsType<對比方案數據> = [
    {
      title: '方案名',
      dataIndex: '顯示名稱',
      key: '顯示名稱',
      fixed: 'left',
    },
    {
      title: '知乎簡體',
      key: 'zhihu-full',
      render: (_, record) =>
        record.動態選重分析?.知乎簡體動態選重率?.全碼
          ? `${(record.動態選重分析.知乎簡體動態選重率.全碼 * 10000).toFixed(2)}‱`
          : '-',
    },
    {
      title: '北語簡體',
      key: 'sc-full',
      render: (_, record) =>
        record.動態選重分析?.北語簡體動態選重率?.全碼
          ? `${(record.動態選重分析.北語簡體動態選重率.全碼 * 10000).toFixed(2)}‱`
          : '-',
    },
    {
      title: '臺標繁體',
      key: 'tc-full',
      render: (_, record) =>
        record.動態選重分析?.臺標繁體動態選重率?.全碼
          ? `${(record.動態選重分析.臺標繁體動態選重率.全碼 * 10000).toFixed(2)}‱`
          : '-',
    },
    {
      title: '古籍繁體',
      key: 'guji-full',
      render: (_, record) =>
        record.動態選重分析?.古籍繁體動態選重率?.全碼
          ? `${(record.動態選重分析.古籍繁體動態選重率.全碼 * 10000).toFixed(2)}‱`
          : '-',
    },
    {
      title: '繁簡聯合',
      key: 'fanjian-full',
      render: (_, record) =>
        record.動態選重分析?.繁簡聯合動態選重率?.全碼
          ? `${(record.動態選重分析.繁簡聯合動態選重率.全碼 * 10000).toFixed(2)}‱`
          : '-',
    },
  ]

  // 動態重碼率原始排序列（五個字頻源的全碼）
  const 動態重碼率原始排序列: ColumnsType<對比方案數據> = [
    {
      title: '方案名',
      dataIndex: '顯示名稱',
      key: '顯示名稱',
      fixed: 'left',
    },
    {
      title: '知乎簡體',
      key: 'zhihu-full-orig',
      render: (_, record) =>
        record.動態選重分析?.知乎簡體動態選重率原序?.全碼
          ? `${(record.動態選重分析.知乎簡體動態選重率原序.全碼 * 10000).toFixed(2)}‱`
          : '-',
    },
    {
      title: '北語簡體',
      key: 'sc-full-orig',
      render: (_, record) =>
        record.動態選重分析?.北語簡體動態選重率原序?.全碼
          ? `${(record.動態選重分析.北語簡體動態選重率原序.全碼 * 10000).toFixed(2)}‱`
          : '-',
    },
    {
      title: '臺標繁體',
      key: 'tc-full-orig',
      render: (_, record) =>
        record.動態選重分析?.臺標繁體動態選重率原序?.全碼
          ? `${(record.動態選重分析.臺標繁體動態選重率原序.全碼 * 10000).toFixed(2)}‱`
          : '-',
    },
    {
      title: '古籍繁體',
      key: 'guji-full-orig',
      render: (_, record) =>
        record.動態選重分析?.古籍繁體動態選重率原序?.全碼
          ? `${(record.動態選重分析.古籍繁體動態選重率原序.全碼 * 10000).toFixed(2)}‱`
          : '-',
    },
    {
      title: '繁簡聯合',
      key: 'fanjian-full-orig',
      render: (_, record) =>
        record.動態選重分析?.繁簡聯合動態選重率原序?.全碼
          ? `${(record.動態選重分析.繁簡聯合動態選重率原序.全碼 * 10000).toFixed(2)}‱`
          : '-',
    },
  ]

  // 簡碼效率列（僅北語簡體字頻，5 個 N 值）
  const 簡碼效率列: ColumnsType<對比方案數據> = [
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
        const result = record.簡碼效率分析?.北語簡體字頻下之簡碼效率?.N值結果?.find(
          r => r.最有效率的簡碼個數 === 25
        )
        return result?.字頻加權碼長?.toFixed(3) || '-'
      },
    },
    {
      title: '50簡碼',
      key: 'n50',
      render: (_, record) => {
        const result = record.簡碼效率分析?.北語簡體字頻下之簡碼效率?.N值結果?.find(
          r => r.最有效率的簡碼個數 === 50
        )
        return result?.字頻加權碼長?.toFixed(3) || '-'
      },
    },
    {
      title: '100簡碼',
      key: 'n100',
      render: (_, record) => {
        const result = record.簡碼效率分析?.北語簡體字頻下之簡碼效率?.N值結果?.find(
          r => r.最有效率的簡碼個數 === 100
        )
        return result?.字頻加權碼長?.toFixed(3) || '-'
      },
    },
    {
      title: '200簡碼',
      key: 'n200',
      render: (_, record) => {
        const result = record.簡碼效率分析?.北語簡體字頻下之簡碼效率?.N值結果?.find(
          r => r.最有效率的簡碼個數 === 200
        )
        return result?.字頻加權碼長?.toFixed(3) || '-'
      },
    },
    {
      title: '500簡碼',
      key: 'n500',
      render: (_, record) => {
        const result = record.簡碼效率分析?.北語簡體字頻下之簡碼效率?.N值結果?.find(
          r => r.最有效率的簡碼個數 === 500
        )
        return result?.字頻加權碼長?.toFixed(3) || '-'
      },
    },
  ]

  // 根據當前 Tab 選擇列定義
  const 當前列定義 = useMemo(() => {
    switch (當前Tab) {
      case 'duplicate':
        return 靜態重碼字數列
      case 'dynamicDupRate':
        return 動態重碼率列
      case 'dynamicDupRateOriginal':
        return 動態重碼率原始排序列
      case 'maxCandidates':
        return 最大候選數列
      case 'speedEquiv':
        return 速度當量列
      case 'shortCodeEfficiency':
        return 簡碼效率列
      default:
        return 靜態重碼字數列
    }
  }, [當前Tab])

  return (
    <div style={{ padding: 24 }}>
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Paragraph>對比當前方案與内置方案的各項指標</Paragraph>
        </div>

        {/* Tab 切換 */}
        <Space>
          <Button
            type={當前Tab === 'duplicate' ? 'primary' : 'default'}
            onClick={() => 設置當前Tab('duplicate')}
          >
            靜重
          </Button>
          <Button
            type={當前Tab === 'dynamicDupRate' ? 'primary' : 'default'}
            onClick={() => 設置當前Tab('dynamicDupRate')}
          >
            動重
          </Button>
          <Button
            type={當前Tab === 'dynamicDupRateOriginal' ? 'primary' : 'default'}
            onClick={() => 設置當前Tab('dynamicDupRateOriginal')}
          >
            原始碼表動重
          </Button>
          <Button
            type={當前Tab === 'maxCandidates' ? 'primary' : 'default'}
            onClick={() => 設置當前Tab('maxCandidates')}
          >
            候選數
          </Button>
          <Button
            type={當前Tab === 'speedEquiv' ? 'primary' : 'default'}
            onClick={() => 設置當前Tab('speedEquiv')}
          >
            當量
          </Button>
          <Button
            type={當前Tab === 'shortCodeEfficiency' ? 'primary' : 'default'}
            onClick={() => 設置當前Tab('shortCodeEfficiency')}
          >
            簡碼
          </Button>
        </Space>

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
      </Space>

      {/* 選擇方案彈窗 */}
      <Modal
        title="選擇對比方案"
        open={顯示選擇彈窗}
        onCancel={() => 設置顯示選擇彈窗(false)}
        onOk={確認選擇方案}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
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
            <Space direction="vertical" style={{ width: '100%' }}>
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
