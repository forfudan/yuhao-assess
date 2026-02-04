import React, { useState, useRef, useEffect } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import { Upload, Button, Input, Alert, Table, Space, Typography } from 'antd'
import {
  DownloadOutlined,
  InboxOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import type { UploadFile } from 'antd'
import type { RcFile } from 'antd/es/upload'
import { 當前方案原子狀態 } from '@/atoms/scheme'
import { 原始碼表原子狀態, 碼表原子狀態, 碼表元數據原子狀態, 碼表加載中原子狀態 } from '@/atoms'
import { 内置碼表服務 } from '@/services/builtinCodeTableService'
import { CodeTableProcessingService } from '@/services/codeTableProcessingService'
import type { RawCodeTable } from '@/types'

const { Title, Paragraph, Text, Link } = Typography

interface 編碼預覽項 {
  char: string
  fullCode: string
  shortCode: string
  fullWithSelection: string
  shortWithSelection: string
}

const ProcessTablePage: React.FC = () => {
  // Jotai 狀態
  const [當前方案] = useAtom(當前方案原子狀態)
  const 設置原始碼表 = useSetAtom(原始碼表原子狀態)
  const 設置碼表 = useSetAtom(碼表原子狀態)
  const 設置碼表元數據 = useSetAtom(碼表元數據原子狀態)
  const [加載中, 設置加載中] = useAtom(碼表加載中原子狀態)

  // 本地狀態
  const [選中的文件, 設置選中的文件] = useState<RcFile | null>(null)
  const [文件預覽數據, 設置文件預覽數據] = useState<string[]>([])
  const [編碼預覽數據, 設置編碼預覽數據] = useState<編碼預覽項[]>([])
  const [錯誤信息, 設置錯誤信息] = useState<string | null>(null)
  const [成功信息, 設置成功信息] = useState<string | null>(null)

  // 服務實例
  const 碼表處理服務 = useRef(CodeTableProcessingService.getInstance())

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

  // 抓取碼表文件
  const 抓取碼表 = async () => {
    if (!當前方案?.元數據.碼表下載鏈接) {
      設置錯誤信息('没有碼表下載鏈接')
      return
    }

    設置加載中(true)
    設置錯誤信息(null)
    設置成功信息(null)

    try {
      const response = await fetch(當前方案.元數據.碼表下載鏈接)
      if (!response.ok) {
        throw new Error(`下載失敗: ${response.status} ${response.statusText}`)
      }

      const 文本 = await response.text()
      const 行數組 = 文本.split('\n').slice(0, 100) // 只顯示前 100 行
      設置文件預覽數據(行數組)
      設置成功信息(`成功抓取碼表，共 ${文本.split('\n').length} 行`)
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
      const 行數組 = 文本.split('\n').slice(0, 100)
      設置文件預覽數據(行數組)
      設置成功信息(`文件已選擇: ${file.name}`)
    } catch (error) {
      設置錯誤信息(error instanceof Error ? error.message : '文件讀取失敗')
    }

    return false // 阻止自動上傳
  }

  // 開始分析碼表
  const 開始分析 = async () => {
    if (!當前方案) {
      設置錯誤信息('請先在首頁選擇或創建方案')
      return
    }

    if (!當前方案.碼表元數據) {
      設置錯誤信息('請先在首頁添加碼表元數據（分隔符、第一列類型等）')
      return
    }

    設置加載中(true)
    設置錯誤信息(null)
    設置成功信息(null)

    try {
      let 原始碼表: RawCodeTable
      let 文件名: string

      if (當前方案.元數據.碼表下載鏈接 && !選中的文件) {
        // 從 URL 抓取
        const response = await fetch(當前方案.元數據.碼表下載鏈接)
        if (!response.ok) {
          throw new Error(`下載失敗: ${response.status}`)
        }

        const 文本 = await response.text()
        const 解析結果 = await 内置碼表服務.解析原始碼表(
          文本,
          當前方案.碼表元數據.分隔符,
          當前方案.碼表元數據.第一列類型
        )

        if (!解析結果.rawCodeTable || 解析結果.rawCodeTable.size === 0) {
          throw new Error('碼表解析爲空，請檢查格式')
        }

        原始碼表 = 解析結果.rawCodeTable
        文件名 = 當前方案.元數據.標識符 + '.txt'
      } else if (選中的文件) {
        // 從上傳文件
        const 文本 = await 讀取文件(選中的文件)
        const 解析結果 = await 内置碼表服務.解析原始碼表(
          文本,
          當前方案.碼表元數據.分隔符,
          當前方案.碼表元數據.第一列類型
        )

        if (!解析結果.rawCodeTable || 解析結果.rawCodeTable.size === 0) {
          throw new Error('碼表解析失敗，請檢查格式是否正確')
        }

        原始碼表 = 解析結果.rawCodeTable
        文件名 = 選中的文件.name
      } else {
        throw new Error('請先抓取或上傳碼表文件')
      }

      // 處理前綴按鍵
      const 前綴按鍵數組 =
        當前方案.方案參數.是否爲前綴碼 && 當前方案.方案參數.前綴鍵
          ? 當前方案.方案參數.前綴鍵
          : undefined

      // 處理碼表
      const 處理結果 = await 碼表處理服務.current.processRawCodeTable(原始碼表, {
        isPrefix: 當前方案.方案參數.是否爲前綴碼,
        prefixKeys: 前綴按鍵數組,
      })

      // 設置全局狀態
      設置原始碼表('')
      設置碼表元數據({
        name: 文件名,
        uploadTime: Date.now(),
        totalChars: 原始碼表.size,
      })
      設置碼表(處理結果 as any)

      // 生成編碼預覽
      const 預覽項: 編碼預覽項[] = []
      let 計數 = 0
      for (const [, [字符]] of 原始碼表) {
        if (計數 >= 100) break
        if (!處理結果.full.has(字符)) continue

        const 全碼數組 = 處理結果.full.get(字符) || []
        const 簡碼數組 = 處理結果.short.get(字符) || []
        const 全碼選重數組 = 處理結果.fullWithSelection.get(字符) || []
        const 簡碼選重數組 = 處理結果.shortWithSelection.get(字符) || []

        預覽項.push({
          char: 字符,
          fullCode: 全碼數組[0] || '-',
          shortCode: 簡碼數組[0] || '-',
          fullWithSelection: 全碼選重數組[0] || '-',
          shortWithSelection: 簡碼選重數組[0] || '-',
        })
        計數++
      }
      設置編碼預覽數據(預覽項)

      設置成功信息(
        `碼表解析完成！共 ${原始碼表.size} 個字符，${處理結果.wordFullCodeWithSelection ? '包含詞語數據' : '僅單字數據'}`
      )
    } catch (error) {
      設置錯誤信息(error instanceof Error ? error.message : '分析失敗')
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
      <Space direction="vertical" style={{ width: '100%' }} size="large">
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
              message="未選擇方案"
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
                  onClick={抓取碼表}
                  loading={加載中}
                  disabled={!當前方案.碼表元數據}
                >
                  抓取文件
                </Button>
              </Space>
            </div>
          </div>
        )}

        {/* 文件上傳 */}
        <div>
          <Upload.Dragger
            accept=".txt,.csv,.yaml,.yml"
            beforeUpload={處理文件變化}
            fileList={
              選中的文件
                ? [
                    {
                      uid: '-1',
                      name: 選中的文件.name,
                      status: 'done',
                      size: 選中的文件.size,
                    } as UploadFile,
                  ]
                : []
            }
            onRemove={移除文件}
            disabled={加載中 || !當前方案}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">點擊上傳或拖拽文件到此處</p>
            <p className="ant-upload-hint">支持 .txt、.csv、.yaml 和 .yml 格式</p>
          </Upload.Dragger>
        </div>

        {/* 文件預覽 */}
        {文件預覽數據.length > 0 && (
          <div>
            <Title level={4}>文件預覽（前 100 行）</Title>
            <div
              style={{
                maxHeight: '300px',
                overflow: 'auto',
                border: '1px solid #d9d9d9',
                padding: '12px',
                borderRadius: '4px',
                backgroundColor: '#fafafa',
              }}
            >
              <pre style={{ margin: 0, fontSize: '12px' }}>
                {文件預覽數據.map((行, 索引) => (
                  <div key={索引}>
                    {索引 + 1}: {行}
                  </div>
                ))}
              </pre>
            </div>
          </div>
        )}

        {/* 操作按鈕 */}
        <Space>
          <Button
            type="primary"
            size="large"
            icon={<ThunderboltOutlined />}
            onClick={開始分析}
            disabled={
              !當前方案 ||
              !當前方案.碼表元數據 ||
              (文件預覽數據.length === 0 && !當前方案.元數據.碼表下載鏈接) ||
              加載中
            }
            loading={加載中}
          >
            {加載中 ? '解析中...' : '開始分析'}
          </Button>
          {(選中的文件 || 文件預覽數據.length > 0) && (
            <Button size="large" icon={<ReloadOutlined />} onClick={移除文件} disabled={加載中}>
              重新選擇
            </Button>
          )}
        </Space>

        {/* 狀態提示 */}
        {錯誤信息 && (
          <Alert
            message="錯誤"
            description={錯誤信息}
            type="error"
            closable
            onClose={() => 設置錯誤信息(null)}
          />
        )}
        {成功信息 && (
          <Alert
            message="成功"
            description={成功信息}
            type="success"
            closable
            onClose={() => 設置成功信息(null)}
          />
        )}

        {/* 編碼預覽 */}
        {編碼預覽數據.length > 0 && (
          <div>
            <Title level={4}>單字編碼預覽（前 100 個）</Title>
            <Table
              size="small"
              pagination={false}
              scroll={{ y: 400 }}
              dataSource={編碼預覽數據}
              rowKey="char"
              columns={[
                { title: '行號', render: (_: any, __: any, index: number) => index + 1, width: 60 },
                { title: '漢字', dataIndex: 'char', width: 60 },
                { title: '全碼', dataIndex: 'fullCode', width: 120 },
                { title: '簡碼', dataIndex: 'shortCode', width: 120 },
                { title: '全碼（帶選重）', dataIndex: 'fullWithSelection', width: 150 },
                { title: '簡碼（帶選重）', dataIndex: 'shortWithSelection', width: 150 },
              ]}
            />
          </div>
        )}
      </Space>
    </div>
  )
}

export default ProcessTablePage
