import React, { useState, useEffect, useRef } from 'react'
import { useAtom } from 'jotai'
import { Button, Space, Typography, Alert, Spin, Modal, Table, message } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { 碼表原子狀態 } from '../atoms/codeTable'
import { 候選個數分析原子狀態 } from '../atoms/maximumCandidates'
import type { 最大候選個數分析結果, 最大候選個數結果 } from '../atoms/maximumCandidates'
import { getAllMaximumCandidates } from '../services/maximumCandidatesService'
import type { 處理後的碼表結果介面 } from '../types'

const { Paragraph, Text, Link } = Typography

/**
 * 候選個數分析頁面
 * 展示不同字符集下的最大候選項個數
 */
const MaximumCandidatesPage: React.FC = () => {
  const [碼表數據] = useAtom(碼表原子狀態)
  const [分析結果, 設置分析結果] = useAtom(候選個數分析原子狀態)
  const [計算中, 設置計算中] = useState(false)
  const [錯誤信息, 設置錯誤信息] = useState<string | null>(null)
  const [字符總數, 設置字符總數] = useState(0)
  const 已初始化計算 = useRef(false)

  // 編碼詳情 Modal
  const [顯示詳情, 設置顯示詳情] = useState(false)
  const [詳情標題, 設置詳情標題] = useState('')
  const [詳情編碼, 設置詳情編碼] = useState('')
  const [詳情字符列表, 設置詳情字符列表] = useState<string[]>([])

  // 編碼展開狀態
  const [展開狀態, 設置展開狀態] = useState<Set<string>>(new Set())

  // 類型斷言：碼表數據實際上是 處理後的碼表結果
  const 處理後碼表 = 碼表數據 as 處理後的碼表結果介面 | null

  /**
   * 字符集信息映射
   */
  const 字符集信息 = {
    GB2312: { name: 'GB2312' },
    通用規範: { name: '通用規範漢字表' },
    常用國字: { name: '國字常用' },
    CJK基本: { name: 'CJK基本區' },
    CJK擴A: { name: '到CJK-A' },
    CJK擴B: { name: '到CJK-B' },
    CJK擴C: { name: '到CJK-C' },
    CJK擴D: { name: '到CJK-D' },
    CJK擴E: { name: '到CJK-E' },
    CJK擴F: { name: '到CJK-F' },
    CJK擴G: { name: '到CJK-G' },
    CJK擴H: { name: '到CJK-H' },
    CJK擴I: { name: '到CJK-I' },
    CJK擴J: { name: '到CJK-J' },
  }

  /**
   * 切換編碼展開狀態
   */
  const 切換展開 = (字符集: string) => {
    const 新狀態 = new Set(展開狀態)
    if (新狀態.has(字符集)) {
      新狀態.delete(字符集)
    } else {
      新狀態.add(字符集)
    }
    設置展開狀態(新狀態)
  }

  /**
   * 顯示編碼詳情（從碼表實時計算字符）
   */
  const 顯示編碼詳情 = (編碼: string) => {
    if (!處理後碼表) return

    // 從全碼表實時獲取該編碼對應的所有字符
    const 字符列表: string[] = []
    for (const [char, codes] of 處理後碼表.全碼表.entries()) {
      if (codes && codes.length > 0 && codes[0] === 編碼) {
        字符列表.push(char)
      }
    }

    設置詳情編碼(編碼)
    設置詳情字符列表(字符列表)
    設置詳情標題(`編碼 ${編碼} 的候選項`)
    設置顯示詳情(true)
  }

  /**
   * 重新計算候選個數
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

      // 計算所有字符集的候選個數
      const 結果 = await getAllMaximumCandidates(全碼表)

      // 計算總字符數
      const 總字符數 = 全碼表.size

      const 新結果: 最大候選個數分析結果 = {
        GB2312: 結果['GB2312'],
        通用規範: 結果['通用規範'],
        常用國字: 結果['常用國字'],
        CJK基本: 結果['CJK基本'],
        到CJK擴A: 結果['到CJK擴A'],
        到CJK擴B: 結果['到CJK擴B'],
        到CJK擴C: 結果['到CJK擴C'],
        到CJK擴D: 結果['到CJK擴D'],
        到CJK擴E: 結果['到CJK擴E'],
        到CJK擴F: 結果['到CJK擴F'],
        到CJK擴G: 結果['到CJK擴G'],
        到CJK擴H: 結果['到CJK擴H'],
        到CJK擴I: 結果['到CJK擴I'],
        到CJK擴J: 結果['到CJK擴J'],
        字符數: 總字符數,
        更新時間: new Date().toISOString(),
      }

      設置分析結果(新結果)
      設置字符總數(總字符數)
      message.success('最大候選項計算完成')
    } catch (error) {
      設置錯誤信息(error instanceof Error ? error.message : '計算失敗')
    } finally {
      設置計算中(false)
    }
  }

  /**
   * 導出 JSON（已移除，改爲在首頁統一導出）
   */

  /**
   * 導入 JSON（已移除，改爲在首頁統一導入）
   */

  /**
   * 組件掛載時自動計算
   */
  useEffect(() => {
    if (!分析結果 && 處理後碼表 && !已初始化計算.current) {
      已初始化計算.current = true
      重新計算()
    } else if (分析結果?.字符數) {
      設置字符總數(分析結果.字符數)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [處理後碼表])

  /**
   * 渲染表格
   */
  const 渲染表格 = () => {
    if (!分析結果) return null

    type 表格數據項 = {
      key: string
      字符集: string
      候選個數: number
      編碼列表: string[]
      是否展開: boolean
    }

    // 定義字符集顯示順序
    const 字符集順序 = [
      'GB2312',
      '常用國字',
      '通用規範',
      'CJK基本',
      'CJK擴A',
      'CJK擴B',
      'CJK擴C',
      'CJK擴D',
      'CJK擴E',
      'CJK擴F',
      'CJK擴G',
      'CJK擴H',
      'CJK擴I',
      'CJK擴J',
    ]

    const 表格數據: 表格數據項[] = Object.entries(分析結果)
      .filter(([key]) => key !== '更新時間' && key !== '碼表哈希' && key !== '字符數')
      .map(([key, value]) => {
        const result = value as 最大候選個數結果
        // 防御性检查：确保数据结构完整
        if (!result || typeof result.最大候選個數 !== 'number' || !Array.isArray(result.編碼列表)) {
          console.warn(`⚠️ 字符集 ${key} 的数据结构不完整，跳过`)
          return null
        }
        return {
          key,
          字符集: 字符集信息[key as keyof typeof 字符集信息]?.name || key,
          候選個數: result.最大候選個數,
          編碼列表: result.編碼列表,
          是否展開: 展開狀態.has(key),
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => {
        const indexA = 字符集順序.indexOf(a.key)
        const indexB = 字符集順序.indexOf(b.key)
        return indexA - indexB
      })

    const 列定義: ColumnsType<表格數據項> = [
      {
        title: '字符集',
        dataIndex: '字符集',
        key: '字符集',
      },
      {
        title: '候選個數',
        dataIndex: '候選個數',
        key: '候選個數',
        align: 'center',
        render: (count: number) => {
          let color = '#dcfce7'
          let textColor = '#166534'
          if (count > 5) {
            color = '#fee2e2'
            textColor = '#991b1b'
          } else if (count > 2) {
            color = '#fef3c7'
            textColor = '#92400e'
          }
          return (
            <span
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '20px',
                fontWeight: 600,
                background: color,
                color: textColor,
              }}
            >
              {count}
            </span>
          )
        },
      },
      {
        title: '對應編碼',
        key: '編碼',
        render: (record: 表格數據項) => {
          const 顯示編碼 = record.是否展開 ? record.編碼列表 : record.編碼列表.slice(0, 3)
          const 有更多 = record.編碼列表.length > 3

          return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
              {顯示編碼.map((編碼, index) => (
                <React.Fragment key={編碼}>
                  <Text code style={{ cursor: 'pointer' }} onClick={() => 顯示編碼詳情(編碼)}>
                    {編碼}
                  </Text>
                  {index < 顯示編碼.length - 1 && <span>,</span>}
                </React.Fragment>
              ))}
              {有更多 && !record.是否展開 && <span>...</span>}
              {有更多 && (
                <Button
                  size="small"
                  type="link"
                  onClick={() => 切換展開(record.key)}
                  style={{ padding: '0 4px', height: 'auto' }}
                >
                  {record.是否展開 ? '收起' : `展開全部(${record.編碼列表.length})`}
                </Button>
              )}
            </div>
          )
        },
      },
    ]

    return (
      <Table columns={列定義} dataSource={表格數據} pagination={false} style={{ marginTop: 16 }} />
    )
  }

  return (
    <div style={{ padding: 24 }}>
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Paragraph>
            分析不同字符集下方案的最大候選項個數，借以反映方案的檢字效率。閲讀
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
            <p style={{ marginTop: 16 }}>正在計算候選個數...</p>
          </div>
        )}

        {/* 數據表格 */}
        {!計算中 && 分析結果 && (
          <>
            {渲染表格()}

            {/* 數據説明 */}
            <Alert
              title="提示"
              description={
                <div>
                  <p>
                    本方案累計收録 {字符總數.toLocaleString()} 個漢字（CJK 基本區到擴展 J 區共
                    101,984 個漢字）
                  </p>
                  <p>
                    最大候選項個數評估輸入法的選字體驗，數值越小表示翻頁次數越少，檢字效率越高。
                    計算考慮了：一、單字全碼和指定字符集，統計每個編碼對應的漢字數量；二、取所有編碼中候選項個數的最大值作爲該字符集的評估指標。
                  </p>
                  <p>
                    {' '}
                    顔色標示：
                    <span style={{ color: '#059669', fontWeight: 600 }}>≤2</span>、
                    <span style={{ color: '#d97706', fontWeight: 600 }}>3-5</span>、
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>&gt;5</span>
                  </p>
                  <p>點擊編碼可查看該編碼對應的所有漢字。</p>
                </div>
              }
              type="info"
              showIcon
            />
          </>
        )}

        {/* 無數據提示 */}
        {!計算中 && !分析結果 && !錯誤信息 && (
          <Alert
            title="請點擊「重新計算」來查看分析結果"
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Space>

      {/* 編碼詳情 Modal */}
      <Modal
        title={詳情標題}
        open={顯示詳情}
        onCancel={() => 設置顯示詳情(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => 設置顯示詳情(false)}>
            關閉
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))',
              gap: 8,
            }}
          >
            {詳情字符列表.map(char => (
              <div
                key={char}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 12,
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                  fontSize: '1.5rem',
                  fontWeight: 500,
                }}
              >
                {char}
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16, color: '#6b7280' }}>
          <p>
            編碼：<Text code>{詳情編碼}</Text>
          </p>
          <p>候選項個數：{詳情字符列表.length}</p>
        </div>
      </Modal>
    </div>
  )
}

export default MaximumCandidatesPage
