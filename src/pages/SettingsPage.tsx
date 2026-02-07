import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAtom, useSetAtom } from 'jotai'
import {
  Space,
  Typography,
  InputNumber,
  ColorPicker,
  Button,
  Divider,
  Card,
  Alert,
  message,
  Progress,
} from 'antd'
import { ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { 主题配置原子, 重置主题配置原子 } from '@/atoms/theme'
import { 當前方案原子狀態 } from '@/atoms/scheme'
import { 動態選重分析原子狀態 } from '@/atoms/dynamicDuplicate'
import { 靜態重碼分析原子狀態 } from '@/atoms/staticDuplicate'
import { 候選個數分析原子狀態 } from '@/atoms/maximumCandidates'
import { 速度當量分析原子狀態 } from '@/atoms/speedEquivalent'
import { 簡碼效率分析原子狀態 } from '@/atoms/shortCodeEfficiency'
import { 碼表原子狀態, 原始碼表原子狀態, 編碼預覽數據原子狀態 } from '@/atoms/codeTable'
import { 從JSON導入 } from '@/services/schemeService'
import { 碼表處理服務實例 } from '@/services/codeTableService'
import { 清空所有Atom, type AtomSetters } from '@/services/atomResetService'
import { 導出方案配置JSON } from '@/services/exportService'
import { 觸發所有分析計算 } from '@/services/triggerAnalysisService'
import type { Color } from 'antd/es/color-picker'
import type { 方案配置介面 } from '@/types/scheme'

const { Title, Paragraph, Text } = Typography

const SettingsPage: React.FC = () => {
  const navigate = useNavigate()
  const [主题配置, 设置主题配置] = useAtom(主题配置原子)
  const 重置主题配置 = useSetAtom(重置主题配置原子)

  // 批量生成相关状态
  const [顯示批量生成按鈕, 設置顯示批量生成按鈕] = useState(false)
  const [點擊次數, 設置點擊次數] = useState(0)
  const [批量生成進行中, 設置批量生成進行中] = useState(false)
  const [當前進度, 設置當前進度] = useState({ current: 0, total: 0, schemeName: '' })

  // Atom setters
  const 設置當前方案 = useSetAtom(當前方案原子狀態)
  const 設置動態選重分析結果 = useSetAtom(動態選重分析原子狀態)
  const 設置靜態重碼分析結果 = useSetAtom(靜態重碼分析原子狀態)
  const 設置候選個數分析結果 = useSetAtom(候選個數分析原子狀態)
  const 設置速度當量分析結果 = useSetAtom(速度當量分析原子狀態)
  const 設置簡碼效率分析結果 = useSetAtom(簡碼效率分析原子狀態)

  // 读取分析结果用于导出
  const [靜態重碼分析結果取值] = useAtom(靜態重碼分析原子狀態)
  const [動態選重分析結果取值] = useAtom(動態選重分析原子狀態)
  const [候選個數分析結果取值] = useAtom(候選個數分析原子狀態)
  const [速度當量分析結果取值] = useAtom(速度當量分析原子狀態)
  const [簡碼效率分析結果取值] = useAtom(簡碼效率分析原子狀態)
  const 設置碼表數據 = useSetAtom(碼表原子狀態)
  const 設置原始碼表 = useSetAtom(原始碼表原子狀態)
  const 設置編碼預覽數據 = useSetAtom(編碼預覽數據原子狀態)

  // 清空所有 atom
  const 清空所有原子狀態 = () => {
    清空所有Atom({
      設置碼表數據,
      設置原始碼表,
      設置編碼預覽數據,
      設置靜態重碼分析結果,
      設置動態選重分析結果,
      設置候選個數分析結果,
      設置速度當量分析結果,
      設置簡碼效率分析結果,
    })
  }

  // 激活隐藏按钮
  const 處理標題點擊 = () => {
    const 新點擊次數 = 點擊次數 + 1
    設置點擊次數(新點擊次數)
    if (新點擊次數 >= 3) {
      設置顯示批量生成按鈕(true)
      message.success('已激活批量生成功能')
      設置點擊次數(0)
    }
  }

  // 批量生成所有方案配置
  const 批量生成所有方案 = async () => {
    try {
      設置批量生成進行中(true)

      // 1. 获取所有启用的方案
      const builtinSchemesRes = await fetch('/settings/builtin-schemes.json')
      const builtinSchemes = await builtinSchemesRes.json()
      const enabledSchemes = builtinSchemes.schemes.filter((s: any) => s.enabled)

      設置當前進度({ current: 0, total: enabledSchemes.length, schemeName: '' })

      for (let i = 0; i < enabledSchemes.length; i++) {
        const scheme = enabledSchemes[i]
        設置當前進度({ current: i + 1, total: enabledSchemes.length, schemeName: scheme.name })

        try {
          // 2. 加载方案配置
          const schemeRes = await fetch(`/schemes/${scheme.key}.json`)
          const schemeData = await schemeRes.json()

          // 清空所有 atom
          清空所有原子狀態()

          // 3. 设置当前方案
          const 方案 = 從JSON導入(JSON.stringify(schemeData))
          設置當前方案(方案)

          // 4. 抓取并解析码表
          if (!方案.元數據.碼表下載鏈接) {
            console.warn(`方案 ${scheme.name} 没有码表下载链接，跳过`)
            continue
          }

          const 碼表響應 = await fetch(方案.元數據.碼表下載鏈接)
          const 碼表文本 = await 碼表響應.text()

          const 解析結果 = await 碼表處理服務實例.解析原始碼表文本(
            碼表文本,
            方案.碼表元數據?.分隔符 || '空格',
            方案.碼表元數據?.第一列類型 || '字符'
          )

          if (!解析結果.rawCodeTable || 解析結果.rawCodeTable.size === 0) {
            console.warn(`方案 ${scheme.name} 码表解析失败，跳过`)
            continue
          }

          // 5. 处理码表
          const 處理結果 = await 碼表處理服務實例.處理原始碼表(解析結果.rawCodeTable, {
            編碼終止指示符列表: 方案.方案參數.編碼終止指示符列表,
          })

          設置碼表數據(處理結果 as any)

          // 6. 触发所有分析（导航到各个页面触发计算）
          await 觸發所有分析計算(navigate, '/settings')

          // 7. 导出JSON（此时atom中已有所有分析结果）
          // 等待一小段时间确保atom更新完成
          await new Promise(resolve => setTimeout(resolve, 300))

          const 導出結果 = 導出方案配置JSON(
            方案,
            {
              靜態重碼分析結果: 靜態重碼分析結果取值,
              動態選重分析結果: 動態選重分析結果取值,
              候選個數分析結果: 候選個數分析結果取值,
              速度當量分析結果: 速度當量分析結果取值,
              簡碼效率分析結果: 簡碼效率分析結果取值,
            },
            true
          )

          if (!導出結果.success) {
            console.warn(`方案 ${scheme.name} 导出失败:`, 導出結果.message)
          }

          // 短暂延迟，避免浏览器阻止多个下载
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (error) {
          console.error(`处理方案 ${scheme.name} 失败:`, error)
          message.error(`方案 ${scheme.name} 处理失败`)
        }
      }

      message.success(`成功生成 ${enabledSchemes.length} 个方案配置！`)
    } catch (error) {
      console.error('批量生成失败:', error)
      message.error('批量生成失败')
    } finally {
      設置批量生成進行中(false)
      設置當前進度({ current: 0, total: 0, schemeName: '' })
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2} onClick={處理標題點擊} style={{ cursor: 'pointer', userSelect: 'none' }}>
            主題設置
          </Title>
          <Paragraph type="secondary">
            自定義應用的外觀樣式。設置會在當前會話期間有效，刷新頁面後恢復默認值。
          </Paragraph>
        </div>

        {/* 批量生成按钮（隐藏功能） */}
        {顯示批量生成按鈕 && (
          <Alert
            title="開發者功能"
            description={
              <Space orientation="vertical" style={{ width: '100%' }}>
                <Text>批量生成所有啓用方案的完整配置文件（包含動態選重率和靜態重碼分析）</Text>
                <Button
                  type="primary"
                  danger
                  icon={<ThunderboltOutlined />}
                  loading={批量生成進行中}
                  onClick={批量生成所有方案}
                >
                  批量生成並導出所有方案
                </Button>
                {批量生成進行中 && (
                  <div>
                    <Progress
                      percent={Math.round((當前進度.current / 當前進度.total) * 100)}
                      status="active"
                    />
                    <Text type="secondary">
                      正在處理: {當前進度.schemeName} ({當前進度.current}/{當前進度.total})
                    </Text>
                  </div>
                )}
              </Space>
            }
            type="warning"
            showIcon
            closable
            onClose={() => 設置顯示批量生成按鈕(false)}
          />
        )}

        <Alert
          title="提示"
          description="所有設置僅在當前會話有效，刷新頁面後將恢復默認值。"
          type="info"
          showIcon
        />

        {/* 全局样式 */}
        <Card title="全局樣式" size="small">
          <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
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
          <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
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
          <Space orientation="vertical" size="small">
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
