import React from 'react'
import { useAtom, useSetAtom } from 'jotai'
import { Space, Typography, InputNumber, ColorPicker, Button, Divider, Card, Alert } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { 主题配置原子, 重置主题配置原子 } from '@/atoms/theme'
import type { Color } from 'antd/es/color-picker'

const { Title, Paragraph, Text } = Typography

const SettingsPage: React.FC = () => {
  const [主题配置, 设置主题配置] = useAtom(主题配置原子)
  const 重置主题配置 = useSetAtom(重置主题配置原子)

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2}>主題設置</Title>
          <Paragraph type="secondary">
            自定義應用的外觀樣式。設置會在當前會話期間有效，刷新頁面後恢復默認值。
          </Paragraph>
        </div>

        <Alert
          message="提示"
          description="所有設置僅在當前會話有效，刷新頁面後將恢復默認值。如需永久修改，請編輯源代碼中的默認主題配置。"
          type="info"
          showIcon
        />

        {/* 全局样式 */}
        <Card title="全局樣式" size="small">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>全局字體大小</Text>
              <div style={{ marginTop: '8px' }}>
                <InputNumber
                  value={主题配置.全局字体大小}
                  min={10}
                  max={20}
                  step={1}
                  addonAfter="px"
                  style={{ width: '150px' }}
                  onChange={值 => {
                    if (值) {
                      设置主题配置({ ...主题配置, 全局字体大小: 值 })
                    }
                  }}
                />
                <Text type="secondary" style={{ marginLeft: '12px' }}>
                  影響所有文字和組件的基礎大小
                </Text>
              </div>
            </div>

            <div>
              <Text strong>全局行高</Text>
              <div style={{ marginTop: '8px' }}>
                <InputNumber
                  value={主题配置.全局行高}
                  min={1.0}
                  max={2.0}
                  step={0.1}
                  style={{ width: '150px' }}
                  onChange={值 => {
                    if (值) {
                      设置主题配置({ ...主题配置, 全局行高: 值 })
                    }
                  }}
                />
                <Text type="secondary" style={{ marginLeft: '12px' }}>
                  影響文字的垂直間距
                </Text>
              </div>
            </div>
          </Space>
        </Card>

        {/* 表格样式 */}
        <Card title="表格樣式" size="small">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>表格字體大小</Text>
              <div style={{ marginTop: '8px' }}>
                <InputNumber
                  value={主题配置.表格.字体大小}
                  min={10}
                  max={20}
                  step={1}
                  addonAfter="px"
                  style={{ width: '150px' }}
                  onChange={值 => {
                    if (值) {
                      设置主题配置({
                        ...主题配置,
                        表格: { ...主题配置.表格, 字体大小: 值 },
                      })
                    }
                  }}
                />
                <Text type="secondary" style={{ marginLeft: '12px' }}>
                  統一應用到所有表格單元格（包括等寬字體）
                </Text>
              </div>
            </div>

            <div>
              <Text strong>單元格垂直内邊距</Text>
              <div style={{ marginTop: '8px' }}>
                <InputNumber
                  value={主题配置.表格.单元格垂直内边距}
                  min={0}
                  max={20}
                  step={1}
                  addonAfter="px"
                  style={{ width: '150px' }}
                  onChange={值 => {
                    if (值 !== null) {
                      设置主题配置({
                        ...主题配置,
                        表格: { ...主题配置.表格, 单元格垂直内边距: 值 },
                      })
                    }
                  }}
                />
                <Text type="secondary" style={{ marginLeft: '12px' }}>
                  單元格上下内邊距
                </Text>
              </div>
            </div>

            <div>
              <Text strong>單元格水平内邊距</Text>
              <div style={{ marginTop: '8px' }}>
                <InputNumber
                  value={主题配置.表格.单元格水平内边距}
                  min={0}
                  max={20}
                  step={1}
                  addonAfter="px"
                  style={{ width: '150px' }}
                  onChange={值 => {
                    if (值 !== null) {
                      设置主题配置({
                        ...主题配置,
                        表格: { ...主题配置.表格, 单元格水平内边距: 值 },
                      })
                    }
                  }}
                />
                <Text type="secondary" style={{ marginLeft: '12px' }}>
                  單元格左右内邊距
                </Text>
              </div>
            </div>

            <div>
              <Text strong>表頭背景色</Text>
              <div style={{ marginTop: '8px' }}>
                <ColorPicker
                  value={主题配置.表格.表头背景色}
                  onChange={(color: Color) => {
                    设置主题配置({
                      ...主题配置,
                      表格: { ...主题配置.表格, 表头背景色: color.toHexString() },
                    })
                  }}
                  showText
                />
              </div>
            </div>

            <div>
              <Text strong>表頭文字顔色</Text>
              <div style={{ marginTop: '8px' }}>
                <ColorPicker
                  value={主题配置.表格.表头文字颜色}
                  onChange={(color: Color) => {
                    设置主题配置({
                      ...主题配置,
                      表格: { ...主题配置.表格, 表头文字颜色: color.toHexString() },
                    })
                  }}
                  showText
                />
              </div>
            </div>
          </Space>
        </Card>

        <Divider />

        {/* 操作按钮 */}
        <Button
          icon={<ReloadOutlined />}
          onClick={() => {
            重置主题配置()
          }}
        >
          恢復默認設置
        </Button>

        {/* 说明 */}
        <Card size="small">
          <Space direction="vertical" size="small">
            <Text strong>CSS 變量機制説明</Text>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              • 表格字體大小使用 <code>var(--table-font-size, 13px)</code>
              <br />• 優先使用 CSS 變量 <code>--table-font-size</code> 的值
              <br />
              • 如果變量未定義，才使用後備值 13px
              <br />
              • 當你設置爲 20px 時，實際應用的是 20px（不是 13px）
              <br />• 所有表格單元格（包括等寬字體）都使用統一的字體大小
            </Paragraph>
          </Space>
        </Card>
      </Space>
    </div>
  )
}

export default SettingsPage
