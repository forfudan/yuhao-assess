import React, { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { Button, Space, Typography, Alert, Spin, Modal, Table } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { 碼表原子狀態 } from '../atoms/codeTable'
import { 速度當量分析原子狀態, 當量詳情原子狀態 } from '../atoms/speedEquivalent'
import type { 速度當量分析結果, 當量例字信息 } from '../atoms/speedEquivalent'
import { 字頻表緩存原子狀態 } from '../atoms/charFrequency'
import { 當量表原子狀態 } from '../atoms/equivTable'
import {
  calculateSpeedEquivFromCodeTable,
  計算編碼對頻率,
} from '../services/speedEquivalentService'
import { 當量表服務實例 } from '../services/equivTableService'
import type { 處理後的碼表結果 } from '../types'

const { Paragraph, Link } = Typography

/**
 * 速度當量分析頁面
 */
const SpeedEquivalentPage: React.FC = () => {
  const [碼表數據] = useAtom(碼表原子狀態)
  const [分析結果, 設置分析結果] = useAtom(速度當量分析原子狀態)
  const [當量詳情, 設置當量詳情] = useAtom(當量詳情原子狀態)
  const [字頻表緩存] = useAtom(字頻表緩存原子狀態)
  const [當量表] = useAtom(當量表原子狀態)

  const [計算中, 設置計算中] = useState(false)
  const [錯誤信息, 設置錯誤信息] = useState<string | null>(null)
  const [顯示詳情, 設置顯示詳情] = useState(false)
  const [詳情計算中, 設置詳情計算中] = useState(false)

  // 類型斷言：碼表數據實際上是 處理後的碼表結果
  const 處理後碼表 = 碼表數據 as 處理後的碼表結果 | null

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
      // 加載當量表
      const 當量表數據 = Object.keys(當量表).length > 0 ? 當量表 : await 加載當量表()

      const 全碼加選重鍵表 = 處理後碼表.全碼加選重鍵表
      const 簡碼加選重鍵表 = 處理後碼表.簡碼加選重鍵表

      // 計算全碼當量
      const 知乎簡體字頻全碼速度當量 = calculateSpeedEquivFromCodeTable(
        全碼加選重鍵表,
        字頻表緩存.get('知乎字頻') || {},
        當量表數據
      )
      const 北語簡體字頻全碼速度當量 = calculateSpeedEquivFromCodeTable(
        全碼加選重鍵表,
        字頻表緩存.get('簡體字頻') || {},
        當量表數據
      )
      const 臺標繁體字頻全碼速度當量 = calculateSpeedEquivFromCodeTable(
        全碼加選重鍵表,
        字頻表緩存.get('繁體字頻') || {},
        當量表數據
      )
      const 古籍繁體字頻全碼速度當量 = calculateSpeedEquivFromCodeTable(
        全碼加選重鍵表,
        字頻表緩存.get('古籍字頻') || {},
        當量表數據
      )
      const 繁简联合字頻全碼速度當量 = calculateSpeedEquivFromCodeTable(
        全碼加選重鍵表,
        字頻表緩存.get('繁简联合') || {},
        當量表數據
      )

      // 計算簡碼當量
      const 知乎簡體字頻全部簡碼速度當量 = calculateSpeedEquivFromCodeTable(
        簡碼加選重鍵表,
        字頻表緩存.get('知乎字頻') || {},
        當量表數據
      )
      const 北語簡體字頻全部簡碼速度當量 = calculateSpeedEquivFromCodeTable(
        簡碼加選重鍵表,
        字頻表緩存.get('簡體字頻') || {},
        當量表數據
      )
      const 臺標繁體字頻全部簡碼速度當量 = calculateSpeedEquivFromCodeTable(
        簡碼加選重鍵表,
        字頻表緩存.get('繁體字頻') || {},
        當量表數據
      )
      const 古籍繁體字頻全部簡碼速度當量 = calculateSpeedEquivFromCodeTable(
        簡碼加選重鍵表,
        字頻表緩存.get('古籍字頻') || {},
        當量表數據
      )
      const 繁简联合字頻全部簡碼速度當量 = calculateSpeedEquivFromCodeTable(
        簡碼加選重鍵表,
        字頻表緩存.get('繁简联合') || {},
        當量表數據
      )

      // 簡化版本：不計算一簡、二簡當量（需要額外的邏輯生成一簡/二簡碼表）
      const 新結果: 速度當量分析結果 = {
        知乎簡體字頻全碼速度當量,
        北語簡體字頻全碼速度當量,
        臺標繁體字頻全碼速度當量,
        古籍繁體字頻全碼速度當量,
        繁简联合字頻全碼速度當量,
        知乎簡體字頻一級簡碼速度當量: 0, // 暫不實現
        北語簡體字頻一級簡碼速度當量: 0,
        臺標繁體字頻一級簡碼速度當量: 0,
        古籍繁體字頻一級簡碼速度當量: 0,
        繁简联合字頻一級簡碼速度當量: 0,
        知乎簡體字頻二級簡碼速度當量: 0, // 暫不實現
        北語簡體字頻二級簡碼速度當量: 0,
        臺標繁體字頻二級簡碼速度當量: 0,
        古籍繁體字頻二級簡碼速度當量: 0,
        繁简联合字頻二級簡碼速度當量: 0,
        知乎簡體字頻全部簡碼速度當量,
        北語簡體字頻全部簡碼速度當量,
        臺標繁體字頻全部簡碼速度當量,
        古籍繁體字頻全部簡碼速度當量,
        繁简联合字頻全部簡碼速度當量,
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
   * 顯示當量詳情（點擊表格單元格）
   */
  const 顯示當量例字 = async (字頻類型: string, 碼表類型: '全碼' | '簡碼') => {
    if (!處理後碼表 || !字頻表緩存) return

    設置詳情計算中(true)
    設置顯示詳情(true)

    try {
      const 碼表 = 碼表類型 === '全碼' ? 處理後碼表.全碼加選重鍵表 : 處理後碼表.簡碼加選重鍵表
      const 字頻映射: Record<string, Record<string, number>> = {
        zhihu: 字頻表緩存.get('知乎字頻') || {},
        sc: 字頻表緩存.get('簡體字頻') || {},
        tc: 字頻表緩存.get('繁體字頻') || {},
        guji: 字頻表緩存.get('古籍字頻') || {},
        unified: 字頻表緩存.get('繁简联合') || {},
      }
      const 字頻 = 字頻映射[字頻類型]

      // 計算碼對頻率
      const 碼對頻率 = 計算編碼對頻率(碼表, 字頻)
      const 當量表數據 = Object.keys(當量表).length > 0 ? 當量表 : await 加載當量表()

      // 計算每個字符的當量值並排序
      const 例字列表: 當量例字信息[] = []
      for (const [字符, 編碼數組] of 碼表.entries()) {
        if (編碼數組.length === 0) continue
        const 編碼 = 編碼數組[0]
        const 字頻值 = 字頻[字符] || 0
        if (字頻值 === 0) continue

        // 計算該字符的當量值
        let 總當量 = 0
        let 碼對數 = 0
        for (let i = 0; i < 編碼.length - 1; i++) {
          const 碼對 = 編碼.substring(i, i + 2)
          const 當量值 = 當量表數據[碼對]
          if (當量值 !== undefined) {
            總當量 += 當量值
            碼對數++
          }
        }
        const 平均當量 = 碼對數 > 0 ? 總當量 / 碼對數 : 0

        例字列表.push({
          字符,
          編碼,
          按鍵組合: 編碼,
          當量值: 平均當量,
          字頻: 字頻值,
        })
      }

      // 按當量值降序排序，取前100個
      例字列表.sort((a, b) => b.當量值 - a.當量值)
      const 顯示列表 = 例字列表.slice(0, 100)

      設置當量詳情({
        字頻類型,
        碼表類型,
        例字列表: 顯示列表,
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
    if (!分析結果 && 處理後碼表 && 字頻表緩存) {
      重新計算()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [處理後碼表, 字頻表緩存])

  /**
   * 渲染表格
   */
  const 渲染表格 = () => {
    if (!分析結果) return null

    type 表格數據項 = {
      key: string
      字頻來源: string
      全碼當量: number
      簡碼當量: number
      説明: React.ReactNode
    }

    const 表格數據: 表格數據項[] = [
      {
        key: 'zhihu',
        字頻來源: '知乎簡體字頻',
        全碼當量: 分析結果.知乎簡體字頻全碼速度當量,
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
        key: 'sc',
        字頻來源: '北語簡體字頻',
        全碼當量: 分析結果.北語簡體字頻全碼速度當量,
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
        key: 'tc',
        字頻來源: '臺標繁體字頻',
        全碼當量: 分析結果.臺標繁體字頻全碼速度當量,
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
        key: 'guji',
        字頻來源: '古籍繁體字頻',
        全碼當量: 分析結果.古籍繁體字頻全碼速度當量,
        簡碼當量: 分析結果.古籍繁體字頻全部簡碼速度當量,
        説明: '基於古籍字頻',
      },
      {
        key: 'unified',
        字頻來源: '繁簡聯合字頻',
        全碼當量: 分析結果.繁简联合字頻全碼速度當量,
        簡碼當量: 分析結果.繁简联合字頻全部簡碼速度當量,
        説明: '基於繁簡聯合字頻表',
      },
    ]

    const 列定義: ColumnsType<表格數據項> = [
      {
        title: '字頻來源',
        dataIndex: '字頻來源',
        key: '字頻來源',
      },
      {
        title: '全碼當量',
        dataIndex: '全碼當量',
        key: '全碼當量',
        align: 'right',
        render: (value: number, record) => (
          <span
            style={{ cursor: 'pointer', color: '#1890ff' }}
            onClick={() => 顯示當量例字(record.key, '全碼')}
          >
            {value.toFixed(4)}
          </span>
        ),
      },
      {
        title: '簡碼當量',
        dataIndex: '簡碼當量',
        key: '簡碼當量',
        align: 'right',
        render: (value: number, record) => (
          <span
            style={{ cursor: 'pointer', color: '#1890ff' }}
            onClick={() => 顯示當量例字(record.key, '簡碼')}
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
   * 詳情表格列定義
   */
  const 詳情列定義: ColumnsType<當量例字信息> = [
    { title: '#', render: (_: any, __: any, index: number) => index + 1, width: 60 },
    { title: '字符', dataIndex: '字符', width: 80 },
    { title: '編碼', dataIndex: '編碼', width: 120 },
    {
      title: '當量值',
      dataIndex: '當量值',
      width: 100,
      render: (v: number) => v.toFixed(4),
    },
    {
      title: '字頻（‱）',
      dataIndex: '字頻',
      width: 100,
      render: (v: number) => (v * 10000).toFixed(2),
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
            title="💡 提示"
            description="點擊當量值，可查看該字頻類型下當量最高的100個字符及其編碼。"
            type="info"
            showIcon
          />
        )}
      </Space>

      {/* 當量詳情 Modal */}
      <Modal
        title={當量詳情 ? `${當量詳情.字頻類型} - ${當量詳情.碼表類型}當量最高的字符` : '當量詳情'}
        open={顯示詳情}
        onCancel={() => 設置顯示詳情(false)}
        width={1000}
        footer={[
          <Button key="close" onClick={() => 設置顯示詳情(false)}>
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
          <Table
            columns={詳情列定義}
            dataSource={當量詳情.例字列表}
            rowKey="字符"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: total => `共 ${total} 個字符`,
            }}
            bordered
            scroll={{ y: 500 }}
          />
        ) : null}
      </Modal>
    </div>
  )
}

export default SpeedEquivalentPage
