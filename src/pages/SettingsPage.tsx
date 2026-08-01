import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAtom, useSetAtom, useStore } from 'jotai'
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
} from 'antd'
import { ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { 主题配置原子, 重置主题配置原子 } from '@/atoms/theme'
import { 當前方案原子狀態 } from '@/atoms/scheme'
import { 動態選重分析原子狀態 } from '@/atoms/dynamicDuplicate'
import { 靜態重碼分析原子狀態 } from '@/atoms/staticDuplicate'
import { 候選個數分析原子狀態 } from '@/atoms/maximumCandidates'
import { 速度當量分析原子狀態 } from '@/atoms/speedEquivalent'
import { 簡碼效率分析原子狀態 } from '@/atoms/shortCodeEfficiency'
import { 鍵位熱力分析原子狀態 } from '@/atoms/keyboardHeatmap'
import { 連續文本當量分析原子狀態 } from '@/atoms/continuousEquivalent'
import { 碼表原子狀態 } from '@/atoms/codeTable'
import { 從JSON導入 } from '@/services/schemeService'
import { 碼表處理服務實例 } from '@/services/codeTableService'
import { 導出方案配置JSON } from '@/services/exportService'
import { 觸發所有分析計算 } from '@/services/triggerAnalysisService'
import type { Color } from 'antd/es/color-picker'
import type { 方案配置介面 } from '@/types/scheme'

const { Title, Paragraph, Text } = Typography

const SettingsPage: React.FC = () => {
  const navigate = useNavigate()
  const store = useStore()
  const [主题配置, 设置主题配置] = useAtom(主题配置原子)
  const 重置主题配置 = useSetAtom(重置主题配置原子)

  // 生成相关状态
  const [生成進行中, 設置生成進行中] = useState(false)

  // 读取当前方案
  const [當前方案] = useAtom(當前方案原子狀態)

  // Atom setters
  const 設置動態選重分析結果 = useSetAtom(動態選重分析原子狀態)
  const 設置靜態重碼分析結果 = useSetAtom(靜態重碼分析原子狀態)
  const 設置候選個數分析結果 = useSetAtom(候選個數分析原子狀態)
  const 設置速度當量分析結果 = useSetAtom(速度當量分析原子狀態)
  const 設置簡碼效率分析結果 = useSetAtom(簡碼效率分析原子狀態)
  const 設置鍵位熱力分析結果 = useSetAtom(鍵位熱力分析原子狀態)
  const 設置連續文本當量分析結果 = useSetAtom(連續文本當量分析原子狀態)
  const 設置碼表數據 = useSetAtom(碼表原子狀態)

  // 生成并导出当前方案
  const 生成並導出當前方案 = async () => {
    if (!當前方案) {
      message.error('請先選擇方案')
      return
    }

    try {
      設置生成進行中(true)
      console.log('🚀 ========== 開始生成當前方案 ==========')
      console.log('方案名稱:', 當前方案.元數據.方案名)

      // 步骤1：抓取并处理码表
      console.log('[步驟 1] 抓取并处理码表...')
      if (!當前方案.元數據.碼表下載鏈接) {
        message.error('當前方案没有碼表下載鏈接')
        return
      }

      const 碼表響應 = await fetch(當前方案.元數據.碼表下載鏈接)
      const 碼表文本 = await 碼表響應.text()
      console.log(`  → 码表下载完成，大小: ${碼表文本.length} 字符`)

      const 解析結果 = await 碼表處理服務實例.解析原始碼表文本(
        碼表文本,
        當前方案.碼表元數據?.分隔符 || '空格',
        當前方案.碼表元數據?.第一列類型 || '字符'
      )

      if (!解析結果.rawCodeTable || 解析結果.rawCodeTable.size === 0) {
        message.error('碼表解析失敗')
        return
      }

      console.log(`  → 码表解析完成，字符数: ${解析結果.rawCodeTable.size}`)

      const 處理結果 = await 碼表處理服務實例.處理原始碼表(解析結果.rawCodeTable, {
        編碼終止指示符列表: 當前方案.方案參數.編碼終止指示符列表,
      })

      設置碼表數據(處理結果 as any)
      console.log('  ✓ 码表处理完成并设置到atom')

      // 步骤2：清除所有分析结果（和AppHeader重算按钮一样）
      console.log('[步驟 2] 清除所有分析结果...')
      設置靜態重碼分析結果(null)
      設置動態選重分析結果(null)
      設置候選個數分析結果(null)
      設置速度當量分析結果(null)
      設置簡碼效率分析結果(null)
      設置鍵位熱力分析結果(null)
      設置連續文本當量分析結果(null)
      console.log('  ✓ 分析结果已清空')

      message.loading('正在觸發所有分析計算...', 1)

      // 步骤3：触发所有分析计算（和AppHeader重算按钮一样）
      console.log('[步驟 3] 触发所有分析计算...')
      await 觸發所有分析計算(navigate, '/')
      console.log('  ✓ 分析触发完成')

      // 步骤4：等待计算完成
      console.log('[步驟 4] 等待计算完成 (1000ms)...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('  ✓ 等待完成')

      // 步骤5：从atom中读取最新的分析结果
      console.log('[步驟 5] 从 atom 中读取最新分析结果...')
      const 靜態重碼分析結果 = store.get(靜態重碼分析原子狀態)
      const 動態選重分析結果 = store.get(動態選重分析原子狀態)
      const 候選個數分析結果 = store.get(候選個數分析原子狀態)
      const 速度當量分析結果 = store.get(速度當量分析原子狀態)
      const 簡碼效率分析結果 = store.get(簡碼效率分析原子狀態)
      const 鍵位熱力分析結果 = store.get(鍵位熱力分析原子狀態)
      const 連續文本當量分析結果 = store.get(連續文本當量分析原子狀態)

      console.log('  检查 atom 状态:')
      console.log('  - 靜態重碼:', 靜態重碼分析結果 ? '✓ 有数据' : '✗ 无数据')
      console.log('  - 動態選重:', 動態選重分析結果 ? '✓ 有数据' : '✗ 无数据')
      console.log('  - 候選個數:', 候選個數分析結果 ? '✓ 有数据' : '✗ 无数据')
      console.log('  - 速度當量:', 速度當量分析結果 ? '✓ 有数据' : '✗ 无数据')
      console.log('  - 簡碼效率:', 簡碼效率分析結果 ? '✓ 有数据' : '✗ 无数据')
      console.log('  - 鍵位熱力:', 鍵位熱力分析結果 ? '✓ 有数据' : '✗ 无数据')
      console.log('  - 連續文本當量:', 連續文本當量分析結果 ? '✓ 有数据' : '✗ 无数据')

      // 步骤6：导出JSON
      console.log('[步驟 6] 导出 JSON...')
      const 導出結果 = 導出方案配置JSON(
        當前方案,
        {
          靜態重碼分析結果,
          動態選重分析結果,
          候選個數分析結果,
          速度當量分析結果,
          簡碼效率分析結果,
          鍵位熱力分析結果,
          連續文本當量分析結果,
        },
        true
      )

      if (!導出結果.success) {
        message.error(`導出失敗: ${導出結果.message}`)
      } else {
        message.success('生成並導出成功！')
        console.log('  ✓ 导出成功')
      }

      console.log('✅ ========== 生成完成 ==========')
    } catch (error) {
      console.error('❌ 生成失敗:', error)
      message.error('生成失敗')
    } finally {
      設置生成進行中(false)
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2}>主題設置</Title>
          <Paragraph type="secondary">
            自定義應用的外觀樣式。設置會在當前會話期間有效，刷新頁面後恢復默認值。
          </Paragraph>
        </div>

        {/* 开发者功能 */}
        <Alert
          title="開發者功能"
          description={
            <Space orientation="vertical" style={{ width: '100%' }}>
              <Text>生成當前方案的完整配置文件（拉取碼表 + 計算所有分析 + 導出JSON）</Text>
              <Button
                type="primary"
                danger
                icon={<ThunderboltOutlined />}
                loading={生成進行中}
                onClick={生成並導出當前方案}
                disabled={!當前方案}
              >
                生成並導出當前方案
              </Button>
              {!當前方案 && <Text type="secondary">請先選擇方案</Text>}
            </Space>
          }
          type="warning"
          showIcon
        />

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
