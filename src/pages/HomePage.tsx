/* eslint-env browser */
import { Card, Typography, Button, Space, Select, Descriptions, message, Upload } from 'antd'
import { DownloadOutlined, UploadOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { 當前方案原子狀態, 方案列表原子狀態 } from '@/atoms/scheme'
import {
  加載方案,
  列出可用方案,
  導出JSON,
  從JSON導入,
  創建空白方案,
} from '@/services/schemeService'
import type { 方案配置 } from '@/types/scheme'
import type { UploadFile } from 'antd'

const { Title, Paragraph, Text } = Typography
const { Option } = Select

function HomePage() {
  const [當前方案, 設置當前方案] = useAtom(當前方案原子狀態)
  const [方案列表, 設置方案列表] = useAtom(方案列表原子狀態)
  const [加載中, 設置加載中] = useState(false)

  // 初始化：加載可用方案列表
  useEffect(() => {
    async function 初始化方案列表() {
      try {
        const 方案鍵名列表 = await 列出可用方案()
        const 加載的方案列表 = await Promise.all(
          方案鍵名列表.map(async 鍵名 => {
            try {
              return await 加載方案(鍵名)
            } catch {
              return null
            }
          })
        )
        設置方案列表(加載的方案列表.filter((方案): 方案 is 方案配置 => 方案 !== null))
      } catch (錯誤) {
        message.error('加載方案列表失敗')
      }
    }
    初始化方案列表()
  }, [設置方案列表])

  // 加載預設方案
  const 處理選擇方案 = async (方案鍵名: string) => {
    設置加載中(true)
    try {
      const 方案 = await 加載方案(方案鍵名)
      設置當前方案(方案)
      message.success(`已加載方案「${方案.元數據.方案名}」`)
    } catch (錯誤) {
      message.error(錯誤 instanceof Error ? 錯誤.message : '加載方案失敗')
    } finally {
      設置加載中(false)
    }
  }

  // 導出 JSON
  const 處理導出JSON = () => {
    if (!當前方案) {
      message.warning('請先選擇或創建方案')
      return
    }
    const json文本 = 導出JSON(當前方案, true)
    const blob = new Blob([json文本], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${當前方案.元數據.標識符}.json`
    a.click()
    URL.revokeObjectURL(url)
    message.success('方案配置已導出')
  }

  // 導入 JSON
  const 處理導入JSON = async (file: UploadFile) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const 文本 = e.target?.result as string
        const 方案 = 從JSON導入(文本)
        設置當前方案(方案)
        message.success(`已導入方案「${方案.元數據.方案名}」`)
      } catch (錯誤) {
        message.error(錯誤 instanceof Error ? 錯誤.message : '導入失敗')
      }
    }
    reader.readAsText(file as unknown as Blob)
    return false // 阻止自動上傳
  }

  // 創建新方案
  const 處理創建新方案 = () => {
    const 新方案 = 創建空白方案()
    設置當前方案(新方案)
    message.success('已創建新方案')
  }

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%', padding: '24px' }}>
      {/* 方案選擇與操作 */}
      <Space wrap>
        <Select
          style={{ width: 200 }}
          placeholder="選擇預設方案"
          loading={加載中}
          onChange={處理選擇方案}
          value={當前方案?.元數據.標識符}
        >
          {方案列表.map(方案 => (
            <Option key={方案.元數據.標識符} value={方案.元數據.標識符}>
              {方案.元數據.方案名}
            </Option>
          ))}
        </Select>
        <Upload beforeUpload={處理導入JSON} showUploadList={false} accept=".json">
          <Button icon={<UploadOutlined />}>導入 JSON</Button>
        </Upload>
        <Button icon={<PlusOutlined />} onClick={處理創建新方案}>
          創建新方案
        </Button>
        <Button icon={<DownloadOutlined />} onClick={處理導出JSON} disabled={!當前方案}>
          導出 JSON
        </Button>
        <Button icon={<ReloadOutlined />} onClick={() => 設置當前方案(null)}>
          清除
        </Button>
      </Space>

      {/* 當前方案信息 */}
      {當前方案 && (
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="方案名">{當前方案.元數據.方案名}</Descriptions.Item>
          <Descriptions.Item label="標識符">
            <Text code>{當前方案.元數據.標識符}</Text>
          </Descriptions.Item>
          {當前方案.元數據.作者 && (
            <Descriptions.Item label="作者">{當前方案.元數據.作者}</Descriptions.Item>
          )}
          <Descriptions.Item label="版本">{當前方案.元數據.版本}</Descriptions.Item>
          {當前方案.元數據.官網 && (
            <Descriptions.Item label="官網" span={2}>
              <a href={當前方案.元數據.官網} target="_blank" rel="noopener noreferrer">
                {當前方案.元數據.官網}
              </a>
            </Descriptions.Item>
          )}
          {當前方案.元數據.碼表下載鏈接 && (
            <Descriptions.Item label="碼表下載" span={2}>
              <a href={當前方案.元數據.碼表下載鏈接} target="_blank" rel="noopener noreferrer">
                {當前方案.元數據.碼表下載鏈接}
              </a>
            </Descriptions.Item>
          )}
          {當前方案.元數據.描述 && (
            <Descriptions.Item label="描述" span={2}>
              {當前方案.元數據.描述}
            </Descriptions.Item>
          )}
          {當前方案.元數據.標籤 && 當前方案.元數據.標籤.length > 0 && (
            <Descriptions.Item label="標籤" span={2}>
              <Space size="small">
                {當前方案.元數據.標籤.map((標籤, index) => (
                  <Text key={index} type="secondary">
                    #{標籤}
                  </Text>
                ))}
              </Space>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="前綴碼">
            {當前方案.方案參數.是否爲前綴碼 ? '是' : '否'}
          </Descriptions.Item>
          <Descriptions.Item label="最大碼長">{當前方案.方案參數.最大碼長}</Descriptions.Item>
          {當前方案.方案參數.前綴鍵 && (
            <Descriptions.Item label="前綴鍵" span={2}>
              <Text code>{當前方案.方案參數.前綴鍵.join(', ')}</Text>
            </Descriptions.Item>
          )}
          {當前方案.碼表元數據 && (
            <>
              <Descriptions.Item label="分隔符">{當前方案.碼表元數據.分隔符}</Descriptions.Item>
              <Descriptions.Item label="第一列類型">
                {當前方案.碼表元數據.第一列類型}
              </Descriptions.Item>
            </>
          )}
        </Descriptions>
      )}

      {/* 提示信息 */}
      {!當前方案 && <Paragraph type="secondary">請選擇或創建方案以開始測評</Paragraph>}
    </Space>
  )
}

export default HomePage
