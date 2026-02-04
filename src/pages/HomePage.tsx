/* eslint-env browser */
import {
  Typography,
  Button,
  Space,
  Select,
  Input,
  InputNumber,
  Checkbox,
  message,
  Upload,
  Tag,
} from 'antd'
import {
  DownloadOutlined,
  UploadOutlined,
  PlusOutlined,
  ReloadOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons'
import { useAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { 當前方案原子狀態, 方案列表原子狀態 } from '@/atoms/scheme'
import { 重碼分析原子狀態 } from '@/atoms/duplicate'
import {
  加載方案,
  列出可用方案,
  導出JSON,
  從JSON導入,
  創建空白方案,
} from '@/services/schemeService'
import type { 方案配置 } from '@/types/scheme'
import type { UploadFile } from 'antd'

const { Paragraph, Text } = Typography
const { Option } = Select
const { TextArea } = Input

function HomePage() {
  const [當前方案, 設置當前方案] = useAtom(當前方案原子狀態)
  const [方案列表, 設置方案列表] = useAtom(方案列表原子狀態)
  const [重碼分析結果, 設置重碼分析結果] = useAtom(重碼分析原子狀態)
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

    // 直接導出，將 atom 的重碼分析結果附加到方案配置
    const 導出數據 = {
      ...當前方案,
      重碼分析結果: 重碼分析結果, // 直接使用 atom 的結構
    }

    const json文本 = JSON.stringify(導出數據, null, 2)
    const blob = new Blob([json文本], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${當前方案.元數據.標識符}.json`
    a.click()
    URL.revokeObjectURL(url)

    const 提示 = 重碼分析結果 ? '（包含重碼分析結果）' : ''
    message.success(`方案配置已導出${提示}`)
  }

  // 導入 JSON
  const 處理導入JSON = async (file: UploadFile) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const 文本 = e.target?.result as string
        const 導入數據 = JSON.parse(文本)

        // 分離方案配置和重碼分析結果
        const { 重碼分析結果, ...方案配置 } = 導入數據

        // 驗證方案配置
        const 方案 = 從JSON導入(JSON.stringify(方案配置))
        設置當前方案(方案)

        // 如果有重碼分析結果，直接寫入 atom
        if (重碼分析結果) {
          設置重碼分析結果(重碼分析結果)
          message.success(`已導入方案「${方案.元數據.方案名}」（包含重碼分析結果）`)
        } else {
          message.success(`已導入方案「${方案.元數據.方案名}」`)
        }
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

  // 更新元數據字段
  const 更新元數據 = (字段名: keyof 方案配置['元數據'], 值: string) => {
    if (!當前方案) return
    設置當前方案({
      ...當前方案,
      元數據: {
        ...當前方案.元數據,
        [字段名]: 值,
        更新時間: new Date().toISOString(),
      },
    })
  }

  // 更新方案參數字段
  const 更新方案參數 = <K extends keyof 方案配置['方案參數']>(
    字段名: K,
    值: 方案配置['方案參數'][K]
  ) => {
    if (!當前方案) return
    設置當前方案({
      ...當前方案,
      方案參數: {
        ...當前方案.方案參數,
        [字段名]: 值,
      },
      元數據: {
        ...當前方案.元數據,
        更新時間: new Date().toISOString(),
      },
    })
  }

  // 更新碼表元數據字段
  const 更新碼表元數據 = <K extends keyof NonNullable<方案配置['碼表元數據']>>(
    字段名: K,
    值: NonNullable<方案配置['碼表元數據']>[K]
  ) => {
    if (!當前方案) return
    設置當前方案({
      ...當前方案,
      碼表元數據: {
        ...當前方案.碼表元數據!,
        [字段名]: 值,
      },
      元數據: {
        ...當前方案.元數據,
        更新時間: new Date().toISOString(),
      },
    })
  }

  // 添加標籤
  const 添加標籤 = (標籤: string) => {
    if (!當前方案 || !標籤.trim()) return
    const 當前標籤 = 當前方案.元數據.標籤 || []
    if (當前標籤.includes(標籤.trim())) {
      message.warning('標籤已存在')
      return
    }
    更新元數據('標籤', [...當前標籤, 標籤.trim()] as never)
  }

  // 删除標籤
  const 删除標籤 = (索引: number) => {
    if (!當前方案) return
    const 新標籤 = [...(當前方案.元數據.標籤 || [])]
    新標籤.splice(索引, 1)
    更新元數據('標籤', 新標籤 as never)
  }

  // 初始化碼表元數據（如果不存在）
  const 初始化碼表元數據 = () => {
    if (!當前方案 || 當前方案.碼表元數據) return
    設置當前方案({
      ...當前方案,
      碼表元數據: {
        分隔符: '空格',
        第一列類型: '字符',
      },
    })
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

      {/* 當前方案配置（可編輯） */}
      {當前方案 && (
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          {/* 元數據 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div>
              <Text type="secondary">方案名</Text>
              <Input
                value={當前方案.元數據.方案名}
                onBlur={e => 更新元數據('方案名', e.target.value)}
                onChange={e =>
                  設置當前方案({
                    ...當前方案,
                    元數據: { ...當前方案.元數據, 方案名: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Text type="secondary">標識符</Text>
              <Input
                value={當前方案.元數據.標識符}
                onBlur={e => 更新元數據('標識符', e.target.value)}
                onChange={e =>
                  設置當前方案({
                    ...當前方案,
                    元數據: { ...當前方案.元數據, 標識符: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Text type="secondary">作者</Text>
              <Input
                value={當前方案.元數據.作者 || ''}
                placeholder="可選"
                onBlur={e => 更新元數據('作者', e.target.value)}
                onChange={e =>
                  設置當前方案({
                    ...當前方案,
                    元數據: { ...當前方案.元數據, 作者: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Text type="secondary">版本</Text>
              <Input
                value={當前方案.元數據.版本}
                onBlur={e => 更新元數據('版本', e.target.value)}
                onChange={e =>
                  設置當前方案({
                    ...當前方案,
                    元數據: { ...當前方案.元數據, 版本: e.target.value },
                  })
                }
              />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <Text type="secondary">官網</Text>
              <Input
                value={當前方案.元數據.官網 || ''}
                placeholder="可選"
                onBlur={e => 更新元數據('官網', e.target.value)}
                onChange={e =>
                  設置當前方案({
                    ...當前方案,
                    元數據: { ...當前方案.元數據, 官網: e.target.value },
                  })
                }
              />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <Text type="secondary">碼表下載鏈接</Text>
              <Input
                value={當前方案.元數據.碼表下載鏈接 || ''}
                placeholder="可選"
                onBlur={e => 更新元數據('碼表下載鏈接', e.target.value)}
                onChange={e =>
                  設置當前方案({
                    ...當前方案,
                    元數據: { ...當前方案.元數據, 碼表下載鏈接: e.target.value },
                  })
                }
              />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <Text type="secondary">描述</Text>
              <TextArea
                value={當前方案.元數據.描述 || ''}
                placeholder="可選"
                rows={2}
                onBlur={e => 更新元數據('描述', e.target.value)}
                onChange={e =>
                  設置當前方案({
                    ...當前方案,
                    元數據: { ...當前方案.元數據, 描述: e.target.value },
                  })
                }
              />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <Text type="secondary">標籤</Text>
              <Space wrap style={{ marginTop: '8px' }}>
                {(當前方案.元數據.標籤 || []).map((標籤, index) => (
                  <Tag
                    key={index}
                    closable
                    onClose={() => 删除標籤(index)}
                    style={{ marginBottom: '4px' }}
                  >
                    {標籤}
                  </Tag>
                ))}
                <Tag
                  icon={<PlusCircleOutlined />}
                  style={{ cursor: 'pointer', marginBottom: '4px' }}
                  onClick={() => {
                    const 標籤 = prompt('輸入新標籤：')
                    if (標籤) 添加標籤(標籤)
                  }}
                >
                  添加標籤
                </Tag>
              </Space>
            </div>
          </div>

          {/* 方案參數 */}
          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <Text type="secondary">最大碼長</Text>
                <InputNumber
                  value={當前方案.方案參數.最大碼長}
                  min={1}
                  max={10}
                  style={{ width: '100%' }}
                  onBlur={() => {}}
                  onChange={值 => 更新方案參數('最大碼長', 值 as number)}
                />
              </div>
              <div>
                <Checkbox
                  checked={當前方案.方案參數.是否爲前綴碼}
                  onChange={e => 更新方案參數('是否爲前綴碼', e.target.checked)}
                >
                  是否爲前綴碼
                </Checkbox>
              </div>
              {當前方案.方案參數.是否爲前綴碼 && (
                <div style={{ gridColumn: 'span 2' }}>
                  <Text type="secondary">前綴鍵（逗號分隔）</Text>
                  <Input
                    value={(當前方案.方案參數.前綴鍵 || []).join(', ')}
                    placeholder="例如：a, o, e, i, u, _"
                    onBlur={e => {
                      const 鍵 = e.target.value
                        .split(',')
                        .map(k => k.trim())
                        .filter(k => k)
                      更新方案參數('前綴鍵', 鍵.length > 0 ? 鍵 : undefined)
                    }}
                    onChange={e =>
                      設置當前方案({
                        ...當前方案,
                        方案參數: {
                          ...當前方案.方案參數,
                          前綴鍵: e.target.value
                            .split(',')
                            .map(k => k.trim())
                            .filter(k => k),
                        },
                      })
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {/* 碼表元數據 */}
          {當前方案.碼表元數據 && (
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {當前方案.碼表元數據.哈希值 && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <Text type="secondary">哈希值（只讀）</Text>
                    <Input value={當前方案.碼表元數據.哈希值} disabled />
                  </div>
                )}
              </div>
            </div>
          )}
          {!當前方案.碼表元數據 && <Button onClick={初始化碼表元數據}>添加碼表元數據</Button>}

          {/* 時間戳（只讀） */}
          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
            <Space>
              <Text type="secondary">
                創建時間：{new Date(當前方案.元數據.創建時間).toLocaleString('zh-CN')}
              </Text>
              <Text type="secondary">
                更新時間：{new Date(當前方案.元數據.更新時間).toLocaleString('zh-CN')}
              </Text>
            </Space>
          </div>
        </Space>
      )}

      {/* 提示信息 */}
      {!當前方案 && <Paragraph type="secondary">請選擇或創建方案以開始測評</Paragraph>}
    </Space>
  )
}

export default HomePage
