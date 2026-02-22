/* eslint-env browser */
import React, { useState } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import { Upload, Button, Alert, Table, Space, Typography, Select, Input } from 'antd'
import {
  DownloadOutlined,
  InboxOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import type { RcFile } from 'antd/es/upload'
import { 當前方案原子狀態 } from '@/atoms/scheme'
import {
  原始碼表原子狀態,
  碼表原子狀態,
  碼表元數據原子狀態,
  碼表加載中原子狀態,
  編碼預覽數據原子狀態,
} from '@/atoms'
import { 碼表處理服務實例 } from '@/services/codeTableService'
import type { 原始碼表型别 } from '@/types'
import type { 編碼預覽項 } from '@/atoms/codeTable'

const { Title, Paragraph, Text, Link } = Typography
const { Option } = Select

const ProcessTablePage: React.FC = () => {
  // Jotai 狀態
  const [當前方案, 設置當前方案] = useAtom(當前方案原子狀態)
  const 設置原始碼表 = useSetAtom(原始碼表原子狀態)
  const 設置碼表 = useSetAtom(碼表原子狀態)
  const 設置碼表元數據 = useSetAtom(碼表元數據原子狀態)
  const [加載中, 設置加載中] = useAtom(碼表加載中原子狀態)

  // 原子狀態
  const [編碼預覽數據, 設置編碼預覽數據] = useAtom(編碼預覽數據原子狀態)

  // 本地狀態
  const [選中的文件, 設置選中的文件] = useState<RcFile | null>(null)
  const [文件預覽數據, 設置文件預覽數據] = useState<string[]>([])
  const [錯誤信息, 設置錯誤信息] = useState<string | null>(null)
  const [成功信息, 設置成功信息] = useState<string | null>(null)
  const [文件搜索關鍵詞, 設置文件搜索關鍵詞] = useState('')
  const [編碼搜索關鍵詞, 設置編碼搜索關鍵詞] = useState('')

  // 服務實例（不再需要 useRef，直接使用單例）
  // 生成碼表哈希值（SHA-256）
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const 生成碼表哈希值 = async (原始碼表: 原始碼表型别): Promise<string> => {
    // 將原始碼表轉換爲字符串（排序以確保一致性）
    const 排序數據 = Array.from(原始碼表.entries())
      .sort((a, b) => a[0] - b[0]) // 按行號排序
      .map(([_, [字符, 編碼]]) => `${字符}\t${編碼}`)
      .join('\n')

    // 使用 Web Crypto API 計算 SHA-256
    // eslint-disable-next-line no-undef
    const 編碼器 = new TextEncoder()
    const 數據 = 編碼器.encode(排序數據)
    // eslint-disable-next-line no-undef
    const 哈希緩衝 = await crypto.subtle.digest('SHA-256', 數據)

    // 轉換爲十六進制字符串
    const 哈希數組 = Array.from(new Uint8Array(哈希緩衝))
    const 哈希字符串 = 哈希數組.map(b => b.toString(16).padStart(2, '0')).join('')

    return 哈希字符串
  }
  // 讀取文件内容
  const 讀取文件 = (file: RcFile): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => {
        resolve(e.target?.result as string)
      }
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  // 處理碼表（共用邏輯）
  const 處理碼表 = async (原始碼表: 原始碼表型别, _文件名: string) => {
    // 處理碼表
    const 處理結果 = await 碼表處理服務實例.處理原始碼表(原始碼表, {
      編碼終止指示符列表: 當前方案!.方案參數.編碼終止指示符列表,
    })

    // 生成哈希值
    const 哈希值 = await 生成碼表哈希值(原始碼表)
    const 總字符數 = 處理結果.全碼表.size

    // 設置全局狀態
    設置原始碼表('')
    設置碼表元數據({
      uploadTime: Date.now(),
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    設置碼表(處理結果 as any)

    // 更新當前方案的碼表元數據和更新時間
    if (當前方案 && 當前方案.碼表元數據) {
      設置當前方案({
        ...當前方案,
        元數據: {
          ...當前方案.元數據,
          更新時間: new Date().toISOString(),
        },
        碼表元數據: {
          分隔符: 當前方案.碼表元數據.分隔符,
          第一列類型: 當前方案.碼表元數據.第一列類型,
          哈希值,
          總字符數,
        },
      })
    }

    // 生成編碼預覽（遍历处理后的全码表，确保每个字符只出现一次）
    const 預覽項: 編碼預覽項[] = []
    for (const [字符, 全碼數組] of 處理結果.全碼表.entries()) {
      const 簡碼數組 = 處理結果.簡碼表.get(字符) || []
      const 全碼選重數組 = 處理結果.全碼加選重鍵表.get(字符) || []
      const 簡碼選重數組 = 處理結果.簡碼加選重鍵表.get(字符) || []

      預覽項.push({
        char: 字符,
        fullCode: 全碼數組[0] || '-',
        shortCode: 簡碼數組[0] || '-',
        全碼加選重鍵表: 全碼選重數組[0] || '-',
        簡碼加選重鍵表: 簡碼選重數組[0] || '-',
      })
    }
    設置編碼預覽數據(預覽項)
    設置文件預覽數據([]) // 隱藏源文件預覽

    設置成功信息(
      `碼表解析完成！共 ${總字符數} 個字符，${處理結果.詞語全碼加選重鍵表 ? '包含詞語數據' : '僅單字數據'}，哈希值：${哈希值.substring(0, 16)}...`
    )
  }

  // 抓取碼表（仅下載不解析）
  const 抓取碼表 = async () => {
    if (!當前方案?.元數據.碼表下載鏈接) {
      設置錯誤信息('没有碼表下載鏈接')
      return
    }

    設置加載中(true)
    設置錯誤信息(null)
    設置成功信息(null)

    try {
      // 下載碼表
      const response = await fetch(當前方案.元數據.碼表下載鏈接)
      if (!response.ok) {
        throw new Error(`下載失敗: ${response.status} ${response.statusText}`)
      }

      const 文本 = await response.text()

      // 生成文件预览（所有行）
      const 行數組 = 文本.split('\n')
      設置文件預覽數據(行數組)

      // 创建一个虚拟文件对象（用于后续解析）
      const 虚拟文件 = new window.File([文本], 當前方案.元數據.標識符 + '.txt', {
        type: 'text/plain',
      }) as RcFile
      設置選中的文件(虚拟文件)

      設置成功信息('碼表已抓取，請點擊「開始解析」')
    } catch (error) {
      設置錯誤信息(error instanceof Error ? error.message : '抓取失敗')
    } finally {
      設置加載中(false)
    }
  }

  // 處理文件上傳
  const 處理文件變化 = async (file: RcFile) => {
    設置選中的文件(file)
    設置錯誤信息(null)
    設置成功信息(null)
    設置編碼預覽數據([])

    try {
      const 文本 = await 讀取文件(file)
      const 行數組 = 文本.split('\n')
      設置文件預覽數據(行數組)
      設置成功信息(`文件已選擇: ${file.name}，請點擊「開始解析」`)
    } catch (error) {
      設置錯誤信息(error instanceof Error ? error.message : '文件讀取失敗')
    }

    return false // 阻止自動上傳
  }

  // 開始解析（用户上傳文件）
  const 開始解析 = async () => {
    if (!當前方案) {
      設置錯誤信息('請先在首頁選擇或創建方案')
      return
    }

    if (!選中的文件) {
      設置錯誤信息('請先上傳碼表文件')
      return
    }

    // 如果没有碼表元數據，使用默認值創建
    const 分隔符 = 當前方案.碼表元數據?.分隔符 || '製表符'
    const 第一列類型 = 當前方案.碼表元數據?.第一列類型 || '字符'

    設置加載中(true)
    設置錯誤信息(null)
    設置成功信息(null)
    設置編碼預覽數據([])

    try {
      const 文本 = await 讀取文件(選中的文件)
      const 解析結果 = await 碼表處理服務實例.解析原始碼表文本(文本, 分隔符, 第一列類型)

      if (!解析結果.rawCodeTable || 解析結果.rawCodeTable.size === 0) {
        throw new Error('碼表解析失敗，請檢查格式是否正確')
      }

      await 處理碼表(解析結果.rawCodeTable, 選中的文件.name)
    } catch (error) {
      設置錯誤信息(error instanceof Error ? error.message : '解析失敗')
    } finally {
      設置加載中(false)
    }
  }

  // 移除文件
  const 移除文件 = () => {
    設置選中的文件(null)
    設置文件預覽數據([])
    設置編碼預覽數據([])
    設置錯誤信息(null)
    設置成功信息(null)
  }

  return (
    <div style={{ padding: '24px' }}>
      <Space orientation="vertical" style={{ width: '100%' }} size="large">
        <div>
          {當前方案 ? (
            <Paragraph>
              當前方案：<Text strong>{當前方案.元數據.方案名}</Text>
              {當前方案.碼表元數據 && (
                <Text type="secondary">
                  {' '}
                  （分隔符：{當前方案.碼表元數據.分隔符}，第一列：
                  {當前方案.碼表元數據.第一列類型}）
                </Text>
              )}
            </Paragraph>
          ) : (
            <Alert
              title="未選擇方案"
              description="請先在首頁選擇或創建方案"
              type="warning"
              showIcon
            />
          )}
        </div>

        {/* 碼表下載鏈接 */}
        {當前方案?.元數據.碼表下載鏈接 && (
          <div>
            <Text type="secondary">碼表下載鏈接：</Text>
            <div style={{ marginTop: '8px' }}>
              <Space>
                <Link href={當前方案.元數據.碼表下載鏈接} target="_blank">
                  {當前方案.元數據.碼表下載鏈接}
                </Link>
                <Button
                  icon={<DownloadOutlined />}
                  size="middle"
                  onClick={抓取碼表}
                  loading={加載中}
                  disabled={!當前方案.碼表元數據}
                >
                  抓取
                </Button>
              </Space>
            </div>
          </div>
        )}

        {/* 碼表解析配置 */}
        {當前方案 && 選中的文件 && (
          <div style={{ marginBottom: '16px' }}>
            <Space size="large">
              <div>
                <Text type="secondary">分隔符：</Text>
                <Select
                  value={當前方案.碼表元數據?.分隔符 || '製表符'}
                  style={{ width: '120px' }}
                  onChange={值 => {
                    設置當前方案({
                      ...當前方案,
                      元數據: { ...當前方案.元數據, 更新時間: new Date().toISOString() },
                      碼表元數據: {
                        分隔符: 值,
                        第一列類型: 當前方案.碼表元數據?.第一列類型 || '字符',
                      },
                    })
                  }}
                >
                  <Option value="空格">空格</Option>
                  <Option value="製表符">製表符</Option>
                  <Option value="逗號">逗號</Option>
                  <Option value="分號">分號</Option>
                </Select>
              </div>
              <div>
                <Text type="secondary">第一列類型：</Text>
                <Select
                  value={當前方案.碼表元數據?.第一列類型 || '字符'}
                  style={{ width: '120px' }}
                  onChange={值 => {
                    設置當前方案({
                      ...當前方案,
                      元數據: { ...當前方案.元數據, 更新時間: new Date().toISOString() },
                      碼表元數據: {
                        分隔符: 當前方案.碼表元數據?.分隔符 || '製表符',
                        第一列類型: 值,
                      },
                    })
                  }}
                >
                  <Option value="字符">字符</Option>
                  <Option value="編碼">編碼</Option>
                </Select>
              </div>
            </Space>
          </div>
        )}

        {/* 文件上傳 */}
        {!選中的文件 && 編碼預覽數據.length === 0 && (
          <div>
            <Upload.Dragger
              accept=".txt,.csv,.yaml,.yml"
              beforeUpload={處理文件變化}
              disabled={加載中 || !當前方案}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">點擊上傳或拖拽文件到此處</p>
              <p className="ant-upload-hint">支持 .txt、.csv、.yaml 和 .yml 格式</p>
            </Upload.Dragger>
          </div>
        )}

        {/* 文件預覽 */}
        {文件預覽數據.length > 0 && (
          <div>
            <Title level={4}>文件預覽（共 {文件預覽數據.length} 行）</Title>
            <div style={{ marginBottom: 16 }}>
              <Input.Search
                placeholder="搜索行内容..."
                value={文件搜索關鍵詞}
                onChange={e => 設置文件搜索關鍵詞(e.target.value)}
                allowClear
                style={{ width: 400 }}
              />
            </div>
            <Table
              dataSource={文件預覽數據
                .map((行, 索引) => ({ key: 索引, 行號: 索引 + 1, 内容: 行 }))
                .filter(item => {
                  if (!文件搜索關鍵詞) return true
                  return item.内容.includes(文件搜索關鍵詞)
                })}
              pagination={{
                defaultPageSize: 10,
                pageSizeOptions: ['10', '20', '50', '100', '200'],
                showSizeChanger: true,
                showTotal: (total, range) => `顯示 ${range[0]}-${range[1]} 行，共 ${total} 行`,
              }}
              columns={[
                { title: '行號', dataIndex: '行號', width: 80 },
                {
                  title: '内容',
                  dataIndex: '内容',
                  render: (text: string) => <span className="monospace-cell">{text}</span>,
                },
              ]}
            />
          </div>
        )}

        {/* 操作按鈕 */}
        <Space>
          <Button
            type="primary"
            size="middle"
            icon={<ThunderboltOutlined />}
            onClick={開始解析}
            disabled={!當前方案 || !選中的文件 || 加載中}
            loading={加載中}
          >
            {加載中 ? '解析中...' : '開始解析'}
          </Button>
          {(選中的文件 || 編碼預覽數據.length > 0) && (
            <Button size="middle" icon={<ReloadOutlined />} onClick={移除文件} disabled={加載中}>
              重新選擇
            </Button>
          )}
        </Space>

        {/* 錯誤提示 */}
        {錯誤信息 && (
          <Alert
            title="錯誤"
            description={錯誤信息}
            type="error"
            closable
            onClose={() => 設置錯誤信息(null)}
          />
        )}

        {/* 編碼預覽 */}
        {編碼預覽數據.length > 0 && (
          <div>
            <Title level={4}>單字編碼預覽（共 {編碼預覽數據.length} 個）</Title>
            <div style={{ marginBottom: 16 }}>
              <Input.Search
                placeholder="搜索字符或編碼..."
                value={編碼搜索關鍵詞}
                onChange={e => 設置編碼搜索關鍵詞(e.target.value)}
                allowClear
                style={{ width: 400 }}
              />
            </div>
            <Table
              dataSource={編碼預覽數據.filter(item => {
                if (!編碼搜索關鍵詞) return true
                const keyword = 編碼搜索關鍵詞.toLowerCase()
                return (
                  item.char.includes(編碼搜索關鍵詞) ||
                  item.fullCode.toLowerCase().includes(keyword) ||
                  item.shortCode.toLowerCase().includes(keyword) ||
                  item.全碼加選重鍵表.toLowerCase().includes(keyword) ||
                  item.簡碼加選重鍵表.toLowerCase().includes(keyword)
                )
              })}
              rowKey="char"
              pagination={{
                defaultPageSize: 10,
                pageSizeOptions: ['10', '20', '50', '100', '200'],
                showSizeChanger: true,
                showTotal: (total, range) => `顯示 ${range[0]}-${range[1]} 個，共 ${total} 個字符`,
              }}
              columns={[
                {
                  title: '行號',
                  render: (_text: unknown, _record: unknown, index: number) => index + 1,
                  width: 60,
                },
                { title: '漢字', dataIndex: 'char', width: 60 },
                { title: '全碼', dataIndex: 'fullCode', width: 120 },
                { title: '簡碼', dataIndex: 'shortCode', width: 120 },
                { title: '全碼（帶選重）', dataIndex: '全碼加選重鍵表', width: 150 },
                { title: '簡碼（帶選重）', dataIndex: '簡碼加選重鍵表', width: 150 },
              ]}
            />

            {/* 成功提示 */}
            {成功信息 && (
              <Alert
                title="成功"
                description={成功信息}
                type="success"
                closable
                onClose={() => 設置成功信息(null)}
                style={{ marginTop: 16 }}
              />
            )}
          </div>
        )}
      </Space>
    </div>
  )
}

export default ProcessTablePage
