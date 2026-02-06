import React, { useState, useEffect, useMemo } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { Button, Space, Typography, Table, Modal, Checkbox, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { 當前方案原子狀態 } from '@/atoms/scheme'
import { 重碼分析原子狀態 } from '@/atoms/duplicate'
import { 候選個數分析原子狀態 } from '@/atoms/maximumCandidates'
import { 速度當量分析原子狀態 } from '@/atoms/speedEquivalent'
import { 簡碼效率分析原子狀態 } from '@/atoms/shortCodeEfficiency'
import { 獲取内置方案列表, 加載方案, type 内置方案配置 } from '@/services/schemeService'
import type { 方案配置介面 } from '@/types/scheme'
import type { 重碼分析結果介面 } from '@/atoms/duplicate'
import type { 最大候選個數分析結果 } from '@/atoms/maximumCandidates'
import type { 速度當量分析結果介面 } from '@/atoms/speedEquivalent'
import type { 簡碼效率分析結果介面 } from '@/atoms/shortCodeEfficiency'

const { Paragraph } = Typography

// 對比方案數據接口
interface 對比方案數據 {
  方案名: string
  是否當前方案: boolean
  重碼分析?: 重碼分析結果介面 | null
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
  const 重碼分析結果介面 = useAtomValue(重碼分析原子狀態)
  const 候選個數分析結果 = useAtomValue(候選個數分析原子狀態)
  const 速度當量分析結果 = useAtomValue(速度當量分析原子狀態)
  const 簡碼效率分析結果 = useAtomValue(簡碼效率分析原子狀態)

  const [内置方案列表, 設置内置方案列表] = useState<内置方案配置[]>([])
  const [已選方案鍵名列表, 設置已選方案鍵名列表] = useState<string[]>([])
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

  // 構建對比方案數據
  useEffect(() => {
    const 方案列表: 對比方案數據[] = []

    // 添加當前方案（如果存在）
    if (當前方案) {
      方案列表.push({
        方案名: 當前方案.元數據.方案名,
        是否當前方案: true,
        重碼分析: 重碼分析結果介面,
        候選個數分析: 候選個數分析結果,
        速度當量分析: 速度當量分析結果,
        簡碼效率分析: 簡碼效率分析結果,
      })
    }

    設置對比方案列表(方案列表)
  }, [當前方案, 重碼分析結果介面, 候選個數分析結果, 速度當量分析結果, 簡碼效率分析結果])

  // 全選/取消全選
  const 處理全選 = (checked: boolean) => {
    if (checked) {
      設置已選方案鍵名列表(内置方案列表.map(s => s.key))
    } else {
      設置已選方案鍵名列表([])
    }
  }

  // 選擇方案
  const 處理方案選擇 = (key: string, checked: boolean) => {
    if (checked) {
      設置已選方案鍵名列表([...已選方案鍵名列表, key])
    } else {
      設置已選方案鍵名列表(已選方案鍵名列表.filter(k => k !== key))
    }
  }

  // 添加選中的方案
  const 添加選中方案 = async () => {
    if (已選方案鍵名列表.length === 0) {
      message.warning('請選擇至少一個方案')
      return
    }

    設置加載中(true)
    try {
      const 新方案列表: 對比方案數據[] = [...對比方案列表]

      for (const key of 已選方案鍵名列表) {
        // 檢查是否已經添加
        if (新方案列表.some(s => s.方案名 === 内置方案列表.find(b => b.key === key)?.name)) {
          continue
        }

        // 加載方案配置
        const 方案 = await 加載方案(key)
        const 方案信息 = 内置方案列表.find(b => b.key === key)

        // 從方案配置中提取測評結果
        // 測評結果字段直接使用 Atom 的結構，無需轉換
        const 測評結果 = 方案.測評結果

        新方案列表.push({
          方案名: 方案信息?.name || 方案.元數據.方案名,
          是否當前方案: false,
          重碼分析: 測評結果?.重碼分析 || null,
          候選個數分析: 測評結果?.候選個數分析 || null,
          速度當量分析: 測評結果?.速度當量分析 || null,
          簡碼效率分析: 測評結果?.簡碼效率分析 || null,
        })
      }

      設置對比方案列表(新方案列表)
      設置顯示選擇彈窗(false)
      設置已選方案鍵名列表([])
      message.success(`已添加 ${已選方案鍵名列表.length} 個方案`)
    } catch (error) {
      message.error('添加方案失敗: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      設置加載中(false)
    }
  }

  // 靜態重碼字數表格列定義
  const 靜態重碼字數列: ColumnsType<對比方案數據> = [
    {
      title: '方案名',
      dataIndex: '方案名',
      key: '方案名',
      fixed: 'left',
      width: 200,
    },
    {
      title: 'GB2312 全碼',
      key: 'gb2312-full',
      render: (_, record) => record.重碼分析?.GB2312靜態重碼?.全碼?.重碼字數 || '-',
    },
    {
      title: 'GB2312 簡碼',
      key: 'gb2312-short',
      render: (_, record) => record.重碼分析?.GB2312靜態重碼?.簡碼?.重碼字數 || '-',
    },
    {
      title: '通用規範 全碼',
      key: 'tonggui-full',
      render: (_, record) => record.重碼分析?.通用規範靜態重碼?.全碼?.重碼字數 || '-',
    },
    {
      title: '常用國字 全碼',
      key: 'guozi-full',
      render: (_, record) => record.重碼分析?.常用國字靜態重碼?.全碼?.重碼字數 || '-',
    },
    {
      title: 'CJK 基本 全碼',
      key: 'cjk-basic-full',
      render: (_, record) => record.重碼分析?.CJK基本靜態重碼?.全碼?.重碼字數 || '-',
    },
  ]

  // 最大候選數列
  const 最大候選數列: ColumnsType<對比方案數據> = [
    {
      title: '方案名',
      dataIndex: '方案名',
      key: '方案名',
      fixed: 'left',
      width: 200,
    },
    {
      title: 'GB2312',
      key: 'gb2312',
      render: (_, record) => record.候選個數分析?.gb2312?.最大候選個數 || '-',
    },
    {
      title: '常用國字',
      key: 'guozi',
      render: (_, record) => record.候選個數分析?.guozi?.最大候選個數 || '-',
    },
    {
      title: 'CJK 基本',
      key: 'cjk-basic',
      render: (_, record) => record.候選個數分析?.cjk_basic?.最大候選個數 || '-',
    },
  ]

  // 速度當量列（五個字頻的全碼速度當量）
  const 速度當量列: ColumnsType<對比方案數據> = [
    {
      title: '方案名',
      dataIndex: '方案名',
      key: '方案名',
      fixed: 'left',
      width: 200,
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
      dataIndex: '方案名',
      key: '方案名',
      fixed: 'left',
      width: 200,
    },
    {
      title: '知乎簡體',
      key: 'zhihu-full',
      render: (_, record) =>
        record.重碼分析?.知乎簡體動態選重率?.全碼
          ? `${(record.重碼分析.知乎簡體動態選重率.全碼 * 10000).toFixed(2)}‱`
          : '-',
    },
    {
      title: '北語簡體',
      key: 'sc-full',
      render: (_, record) =>
        record.重碼分析?.北語簡體動態選重率?.全碼
          ? `${(record.重碼分析.北語簡體動態選重率.全碼 * 10000).toFixed(2)}‱`
          : '-',
    },
    {
      title: '臺標繁體',
      key: 'tc-full',
      render: (_, record) =>
        record.重碼分析?.臺標繁體動態選重率?.全碼
          ? `${(record.重碼分析.臺標繁體動態選重率.全碼 * 10000).toFixed(2)}‱`
          : '-',
    },
    {
      title: '古籍繁體',
      key: 'guji-full',
      render: (_, record) =>
        record.重碼分析?.古籍繁體動態選重率?.全碼
          ? `${(record.重碼分析.古籍繁體動態選重率.全碼 * 10000).toFixed(2)}‱`
          : '-',
    },
    {
      title: '繁簡聯合',
      key: 'fanjian-full',
      render: (_, record) =>
        record.重碼分析?.繁簡聯合動態選重率?.全碼
          ? `${(record.重碼分析.繁簡聯合動態選重率.全碼 * 10000).toFixed(2)}‱`
          : '-',
    },
  ]

  // 動態重碼率原始排序列（五個字頻源的全碼）
  const 動態重碼率原始排序列: ColumnsType<對比方案數據> = [
    {
      title: '方案名',
      dataIndex: '方案名',
      key: '方案名',
      fixed: 'left',
      width: 200,
    },
    {
      title: '知乎簡體',
      key: 'zhihu-full-orig',
      render: (_, record) =>
        record.重碼分析?.知乎簡體動態選重率原序?.全碼
          ? `${(record.重碼分析.知乎簡體動態選重率原序.全碼 * 10000).toFixed(2)}‱`
          : '-',
    },
    {
      title: '北語簡體',
      key: 'sc-full-orig',
      render: (_, record) =>
        record.重碼分析?.北語簡體動態選重率原序?.全碼
          ? `${(record.重碼分析.北語簡體動態選重率原序.全碼 * 10000).toFixed(2)}‱`
          : '-',
    },
    {
      title: '臺標繁體',
      key: 'tc-full-orig',
      render: (_, record) =>
        record.重碼分析?.臺標繁體動態選重率原序?.全碼
          ? `${(record.重碼分析.臺標繁體動態選重率原序.全碼 * 10000).toFixed(2)}‱`
          : '-',
    },
    {
      title: '古籍繁體',
      key: 'guji-full-orig',
      render: (_, record) =>
        record.重碼分析?.古籍繁體動態選重率原序?.全碼
          ? `${(record.重碼分析.古籍繁體動態選重率原序.全碼 * 10000).toFixed(2)}‱`
          : '-',
    },
    {
      title: '繁簡聯合',
      key: 'fanjian-full-orig',
      render: (_, record) =>
        record.重碼分析?.繁簡聯合動態選重率原序?.全碼
          ? `${(record.重碼分析.繁簡聯合動態選重率原序.全碼 * 10000).toFixed(2)}‱`
          : '-',
    },
  ]

  // 簡碼效率列（僅北語簡體字頻，5 個 N 值）
  const 簡碼效率列: ColumnsType<對比方案數據> = [
    {
      title: '方案名',
      dataIndex: '方案名',
      key: '方案名',
      fixed: 'left',
      width: 200,
    },
    {
      title: 'N=25',
      key: 'n25',
      render: (_, record) => {
        const result = record.簡碼效率分析?.北語簡體字頻下之簡碼效率?.N值結果?.find(
          r => r.最有效率的簡碼個數 === 25
        )
        return result?.簡碼效率值?.toFixed(3) || '-'
      },
    },
    {
      title: 'N=50',
      key: 'n50',
      render: (_, record) => {
        const result = record.簡碼效率分析?.北語簡體字頻下之簡碼效率?.N值結果?.find(
          r => r.最有效率的簡碼個數 === 50
        )
        return result?.簡碼效率值?.toFixed(3) || '-'
      },
    },
    {
      title: 'N=100',
      key: 'n100',
      render: (_, record) => {
        const result = record.簡碼效率分析?.北語簡體字頻下之簡碼效率?.N值結果?.find(
          r => r.最有效率的簡碼個數 === 100
        )
        return result?.簡碼效率值?.toFixed(3) || '-'
      },
    },
    {
      title: 'N=200',
      key: 'n200',
      render: (_, record) => {
        const result = record.簡碼效率分析?.北語簡體字頻下之簡碼效率?.N值結果?.find(
          r => r.最有效率的簡碼個數 === 200
        )
        return result?.簡碼效率值?.toFixed(3) || '-'
      },
    },
    {
      title: 'N=500',
      key: 'n500',
      render: (_, record) => {
        const result = record.簡碼效率分析?.北語簡體字頻下之簡碼效率?.N值結果?.find(
          r => r.最有效率的簡碼個數 === 500
        )
        return result?.簡碼效率值?.toFixed(3) || '-'
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
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Paragraph>對比當前方案與内置方案的各項指標</Paragraph>
        </div>

        {/* Tab 切換 */}
        <Space>
          <Button
            type={當前Tab === 'duplicate' ? 'primary' : 'default'}
            onClick={() => 設置當前Tab('duplicate')}
          >
            靜碼
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
          <Button type="primary" icon={<PlusOutlined />} onClick={() => 設置顯示選擇彈窗(true)}>
            選擇對比方案
          </Button>
        </Space>

        {/* 對比表格 */}
        <Table
          columns={當前列定義}
          dataSource={對比方案列表}
          rowKey="方案名"
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </Space>

      {/* 選擇方案彈窗 */}
      <Modal
        title="選擇對比方案"
        open={顯示選擇彈窗}
        onCancel={() => {
          設置顯示選擇彈窗(false)
          設置已選方案鍵名列表([])
        }}
        onOk={添加選中方案}
        confirmLoading={加載中}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <Checkbox
              checked={已選方案鍵名列表.length === 内置方案列表.length}
              indeterminate={
                已選方案鍵名列表.length > 0 && 已選方案鍵名列表.length < 内置方案列表.length
              }
              onChange={e => 處理全選(e.target.checked)}
            >
              全選
            </Checkbox>
            <span style={{ color: '#999' }}>
              已選 {已選方案鍵名列表.length} / {内置方案列表.length}
            </span>
          </Space>

          <div style={{ maxHeight: 400, overflow: 'auto' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {内置方案列表.map(scheme => (
                <Checkbox
                  key={scheme.key}
                  checked={已選方案鍵名列表.includes(scheme.key)}
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
