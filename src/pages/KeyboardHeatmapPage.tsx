import React, { useState, useMemo, useRef } from 'react'
import { Card, Tabs, Checkbox, Button, Space, Alert, Modal } from 'antd'
import { ReloadOutlined, QuestionCircleOutlined, DownloadOutlined } from '@ant-design/icons'
import { useAtom } from 'jotai'
import styled from 'styled-components'
import { 碼表原子狀態 } from '@/atoms/codeTable'
import { 當前方案原子狀態 } from '@/atoms/scheme'
import { 字頻表緩存原子狀態 } from '@/atoms/charFrequency'
import type { 處理後的碼表結果介面 } from '@/types'

const PageContainer = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`

const KeyboardWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 8px 0;
  overflow: hidden;
  width: 100%;
  flex-direction: column;

  @media (min-width: 1200px) {
    max-width: 80%;
    margin: 0 auto;
    padding: 16px 0;
  }
`

const KeyboardLayout = styled.div<{ scale: number }>`
  background-color: var(--color-bg-primary, #ffffff);
  border-radius: 8px;
  padding: 24px;
  transform-origin: center top;
  transform: scale(${props => props.scale});
  width: 100%;
  height: 100%;
  max-width: 900px;
  max-height: none;
  min-width: 280px;
  border: 1px solid var(--color-border-secondary, #e8e8e8);
  transition: transform 0.3s ease;
  margin: auto;
  display: grid;
  grid-template-rows: repeat(5, 1fr);
  gap: 8px;
  place-items: center;
`

const KeyboardRow = styled.div`
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 4px;
  width: 100%;
  height: 100%;
  align-items: stretch;
`

const KeyButton = styled.button<{
  frequency: number
  maxFreq: number
  hidden?: boolean
}>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background-color: #ffffff;
  cursor: ${props => (props.hidden ? 'default' : 'pointer')};
  transition: all 0.2s ease;
  user-select: none;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, monospace;
  width: 100%;
  height: 100%;
  aspect-ratio: 1;
  min-width: 40px;
  min-height: 40px;
  opacity: ${props => (props.hidden ? 0 : 1)};
  pointer-events: ${props => (props.hidden ? 'none' : 'auto')};

  &:hover {
    border-color: ${props => (props.hidden ? 'transparent' : '#3b82f6')};
    transform: ${props => (props.hidden ? 'none' : 'translateY(-2px)')};
    box-shadow: ${props => (props.hidden ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)')};
    z-index: 10;
  }

  &.wide {
    grid-column: span 3;
    aspect-ratio: 3;
  }

  &.extra-wide {
    grid-column: span 6;
    aspect-ratio: 7;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
    border-radius: 4px;
    background: ${props => {
      if (props.hidden) return 'transparent'
      const frequencyPercent = props.frequency * 100
      const intensity = Math.min(Math.sqrt(frequencyPercent / 10), 1.5)

      // 完全復刻舊版本的藍色漸變
      return `linear-gradient(135deg, 
        rgba(99, 102, 241, ${intensity * 0.9 + 0.1}), 
        rgba(59, 130, 246, ${intensity * 0.8 + 0.1})
      )`
    }};
    transition: all 0.3s ease;
  }
`

const KeyLabel = styled.div`
  position: relative;
  z-index: 2;
  font-size: calc(0.2rem + 1.2vw);
  font-weight: 600;
  color: ${props => props.color || '#1f2937'};
  text-transform: uppercase;
  font-family: monospace;
  min-height: 1.2em;
  transition: color 0.3s ease;
`

const KeyFreq = styled.div<{ intensity: number }>`
  position: relative;
  z-index: 2;
  font-size: calc(0.2rem + 1vw);
  font-weight: 500;
  color: ${props => (props.intensity > 0.03 ? '#ffffff' : '#6b7280')};
  font-family: monospace;
  line-height: 1;
  margin-top: 2px;
  transition: color 0.3s ease;
`

const StatsContainer = styled.div`
  margin-top: 32px;
`

const StatsTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 20px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #1890ff;
`

const StatsSection = styled.div`
  margin-bottom: 28px;

  &:last-child {
    margin-bottom: 0;
  }
`

const SectionTitle = styled.h5`
  font-size: 14px;
  font-weight: 600;
  color: #555;
  margin: 0 0 12px 0;
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
`

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #f5f5f5;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
  transition: all 0.2s ease;

  &:hover {
    background: #e6f7ff;
    border-color: #91d5ff;
  }
`

const StatLabel = styled.span`
  font-size: 13px;
  color: #666;
  font-weight: 500;
`

const StatValue = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #1890ff;
`

const TabsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 16px;
`

const ControlsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

interface KeyData {
  key: string
  count: number
  frequency: number
}

interface KeyInfo {
  key: string
  label?: string
  width?: 'normal' | 'wide' | 'extra-wide'
  hidden?: boolean
}

// 键盘布局定义
const numberRowKeys: KeyInfo[] = [
  { key: '1' },
  { key: '2' },
  { key: '3' },
  { key: '4' },
  { key: '5' },
  { key: '6' },
  { key: '7' },
  { key: '8' },
  { key: '9' },
  { key: '0' },
]

const firstRowKeys: KeyInfo[] = [
  { key: 'q' },
  { key: 'w' },
  { key: 'e' },
  { key: 'r' },
  { key: 't' },
  { key: 'y' },
  { key: 'u' },
  { key: 'i' },
  { key: 'o' },
  { key: 'p' },
]

const secondRowKeys: KeyInfo[] = [
  { key: 'a' },
  { key: 's' },
  { key: 'd' },
  { key: 'f' },
  { key: 'g' },
  { key: 'h' },
  { key: 'j' },
  { key: 'k' },
  { key: 'l' },
  { key: ';' },
]

const thirdRowKeys: KeyInfo[] = [
  { key: 'z' },
  { key: 'x' },
  { key: 'c' },
  { key: 'v' },
  { key: 'b' },
  { key: 'n' },
  { key: 'm' },
  { key: ',' },
  { key: '.' },
  { key: '/' },
]

const spaceRowKeys: KeyInfo[] = [
  { key: 'hidden-7', hidden: true },
  { key: 'hidden-8', hidden: true },
  { key: 'space', label: 'Space', width: 'extra-wide' },
  { key: 'hidden-9', hidden: true },
  { key: "'" },
]

// 手指映射
const fingerMapping: Record<string, string> = {
  '1': '左小指',
  q: '左小指',
  a: '左小指',
  z: '左小指',
  '2': '左无名指',
  w: '左无名指',
  s: '左无名指',
  x: '左无名指',
  '3': '左中指',
  e: '左中指',
  d: '左中指',
  c: '左中指',
  '4': '左食指',
  '5': '左食指',
  r: '左食指',
  t: '左食指',
  f: '左食指',
  g: '左食指',
  v: '左食指',
  b: '左食指',
  '6': '右食指',
  '7': '右食指',
  y: '右食指',
  u: '右食指',
  h: '右食指',
  j: '右食指',
  n: '右食指',
  m: '右食指',
  '8': '右中指',
  i: '右中指',
  k: '右中指',
  ',': '右中指',
  '9': '右无名指',
  o: '右无名指',
  l: '右无名指',
  '.': '右无名指',
  '0': '右小指',
  '-': '右小指',
  '=': '右小指',
  p: '右小指',
  '[': '右小指',
  ']': '右小指',
  ';': '右小指',
  "'": '右小指',
  '/': '右小指',
  space: '双拇指',
}

// 按排映射
const rowMapping: Record<string, string> = {
  '1': '数字排',
  '2': '数字排',
  '3': '数字排',
  '4': '数字排',
  '5': '数字排',
  '6': '数字排',
  '7': '数字排',
  '8': '数字排',
  '9': '数字排',
  '0': '数字排',
  q: '上排',
  w: '上排',
  e: '上排',
  r: '上排',
  t: '上排',
  y: '上排',
  u: '上排',
  i: '上排',
  o: '上排',
  p: '上排',
  a: '中排',
  s: '中排',
  d: '中排',
  f: '中排',
  g: '中排',
  h: '中排',
  j: '中排',
  k: '中排',
  l: '中排',
  ';': '中排',
  "'": '中排',
  z: '下排',
  x: '下排',
  c: '下排',
  v: '下排',
  b: '下排',
  n: '下排',
  m: '下排',
  ',': '下排',
  '.': '下排',
  '/': '下排',
  space: '空格排',
}

// 标点符号按键映射（占总字符13%）
const punctuationKeys: Record<string, number> = {
  ';': 0.1,
  ',': 0.4,
  '.': 0.4,
  '/': 0.05,
  "'": 0.05,
}

const PUNCTUATION_CHAR_RATIO = 0.13

export default function KeyboardHeatmapPage() {
  const [碼表數據] = useAtom(碼表原子狀態)
  const [當前方案] = useAtom(當前方案原子狀態)
  const [字頻表緩存] = useAtom(字頻表緩存原子狀態)
  const [activeTab, setActiveTab] = useState('full')
  const [simulatePunctuation, setSimulatePunctuation] = useState(true)
  const [showHelp, setShowHelp] = useState(false)
  const [keyboardScale] = useState(1.0)
  const keyboardWrapperRef = useRef(null)

  // 類型斷言：碼表數據實際上是 處理後的碼表結果
  const 處理後碼表 = 碼表數據 as 處理後的碼表結果介面 | null

  // 獲取當前字頻數據（使用北語簡體字頻）
  const 當前字頻 = useMemo(() => {
    return 字頻表緩存.get('北語簡體字頻') || {}
  }, [字頻表緩存])

  // 计算按键分布（使用字頻加權，完全復刻舊版本邏輯）
  const keyDistribution = useMemo(() => {
    if (!處理後碼表) return new Map<string, number>()

    const distribution = new Map<string, number>()
    // 使用帶選重鍵的碼表（下劃線代表空格鍵）
    const 當前碼表 = activeTab === 'full' ? 處理後碼表.全碼加選重鍵表 : 處理後碼表.簡碼加選重鍵表

    // 遍歷碼表，使用字頻加權（遍歷所有編碼）
    for (const [字符, codes] of 當前碼表.entries()) {
      if (!codes || codes.length === 0) continue

      // 使用字頻作爲權重（完全復刻老 Vue 組件邏輯）
      const weight = 當前字頻[字符] || 0

      // 遍歷該字符的所有編碼
      for (const code of codes) {
        if (!code) continue

        for (const ch of code.toLowerCase()) {
          const key = ch === '_' ? 'space' : ch
          distribution.set(key, (distribution.get(key) || 0) + weight)
        }
      }
    }

    return distribution
  }, [處理後碼表, activeTab, 當前字頻])

  // 计算统计数据
  const stats = useMemo(() => {
    const fingerLoad = new Map<string, number>()
    const rowDist = new Map<string, number>()
    let leftHand = 0
    let rightHand = 0

    for (const [key, count] of keyDistribution.entries()) {
      const finger = fingerMapping[key]
      if (finger) {
        fingerLoad.set(finger, (fingerLoad.get(finger) || 0) + count)
        if (finger.startsWith('左')) leftHand += count
        else if (finger.startsWith('右')) rightHand += count
      }

      const row = rowMapping[key]
      if (row) {
        rowDist.set(row, (rowDist.get(row) || 0) + count)
      }
    }

    const total = leftHand + rightHand
    return {
      fingerLoad,
      rowDist,
      handBalance: {
        left: total > 0 ? (leftHand / total) * 100 : 0,
        right: total > 0 ? (rightHand / total) * 100 : 0,
      },
    }
  }, [keyDistribution])

  const getKeyData = (key: string): KeyData => {
    const keyLower = key.toLowerCase()
    let count = keyDistribution.get(keyLower) || 0
    let frequency = 0

    const totalWeightedKeyUsage = Array.from(keyDistribution.values()).reduce(
      (sum, val) => sum + val,
      0
    )

    if (simulatePunctuation && totalWeightedKeyUsage > 0) {
      // 計算平均碼長（使用帶選重鍵的碼表，遍歷所有編碼）
      let totalCodeLength = 0
      let totalCodes = 0
      const 當前碼表 =
        activeTab === 'full' ? 處理後碼表?.全碼加選重鍵表 : 處理後碼表?.簡碼加選重鍵表
      if (當前碼表) {
        for (const [, codes] of 當前碼表.entries()) {
          if (!codes || codes.length === 0) continue
          // 遍歷該字符的所有編碼
          for (const code of codes) {
            if (code) {
              totalCodeLength += code.length
              totalCodes++
            }
          }
        }
      }
      const avgCodeLen = totalCodes > 0 ? totalCodeLength / totalCodes : 2

      // 標點模擬邏輯
      const punctuationRatio = PUNCTUATION_CHAR_RATIO
      const hanziRatio = 1 - punctuationRatio
      const punctuationKeyRatio = punctuationRatio / (punctuationRatio + hanziRatio * avgCodeLen)

      const rawFrequency = count / totalWeightedKeyUsage
      const remainingRatio = 1 - punctuationKeyRatio
      const compressedRawFrequency = rawFrequency * remainingRatio

      if (punctuationKeys[keyLower]) {
        const punctuationFrequency = punctuationKeyRatio * (punctuationKeys[keyLower] || 0)
        frequency = compressedRawFrequency + punctuationFrequency
        count = (totalWeightedKeyUsage * frequency) / remainingRatio
        if (count < 0.0001) count = 0.0001
      } else {
        frequency = compressedRawFrequency
      }
    } else {
      frequency = totalWeightedKeyUsage > 0 ? count / totalWeightedKeyUsage : 0
    }

    return {
      key: keyLower,
      count,
      frequency,
    }
  }

  const renderKey = (keyInfo: KeyInfo) => {
    if (keyInfo.hidden) {
      return <KeyButton key={keyInfo.key} frequency={0} maxFreq={1} hidden />
    }

    const data = getKeyData(keyInfo.key)
    const widthClass =
      keyInfo.width === 'wide' ? 'wide' : keyInfo.width === 'extra-wide' ? 'extra-wide' : ''
    const frequencyPercent = data.frequency * 100

    return (
      <KeyButton
        key={keyInfo.key}
        className={widthClass}
        frequency={data.frequency}
        maxFreq={1}
        title={`${keyInfo.label || keyInfo.key.toUpperCase()}\n${(data.frequency * 100).toFixed(2)}%`}
      >
        <KeyLabel color={frequencyPercent > 3 ? '#ffffff' : '#1f2937'}>
          {keyInfo.label || keyInfo.key.toUpperCase()}
        </KeyLabel>
        {data.count > 0 && (
          <KeyFreq intensity={frequencyPercent / 100}>{(data.frequency * 100).toFixed(1)}%</KeyFreq>
        )}
      </KeyButton>
    )
  }

  if (!處理後碼表) {
    return (
      <PageContainer>
        <Card>
          <Alert
            message="等待碼表上傳"
            description="請先在「碼表解析」頁面上傳碼表後，再查看鍵位熱力圖分析"
            type="info"
            showIcon
          />
        </Card>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>⌨️ 鍵位熱力</span>
            {當前方案 && (
              <span style={{ fontSize: '14px', fontWeight: 'normal', opacity: 0.7 }}>
                {當前方案.元數據.方案名}
              </span>
            )}
          </div>
        }
        extra={
          <Space>
            <Button icon={<QuestionCircleOutlined />} onClick={() => setShowHelp(true)}>
              説明
            </Button>
            <Button type="primary" icon={<ReloadOutlined />}>
              刷新
            </Button>
            <Button icon={<DownloadOutlined />}>導出</Button>
          </Space>
        }
      >
        <TabsContainer>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: 'full', label: '全碼' },
              { key: 'short', label: '出簡' },
            ]}
          />

          <ControlsWrapper>
            <Checkbox
              checked={simulatePunctuation}
              onChange={e => setSimulatePunctuation(e.target.checked)}
            >
              模擬標點使用頻率
            </Checkbox>
          </ControlsWrapper>
        </TabsContainer>

        <KeyboardWrapper ref={keyboardWrapperRef}>
          <KeyboardLayout scale={keyboardScale}>
            <KeyboardRow>{numberRowKeys.map(renderKey)}</KeyboardRow>
            <KeyboardRow>{firstRowKeys.map(renderKey)}</KeyboardRow>
            <KeyboardRow>{secondRowKeys.map(renderKey)}</KeyboardRow>
            <KeyboardRow>{thirdRowKeys.map(renderKey)}</KeyboardRow>
            <KeyboardRow>{spaceRowKeys.map(renderKey)}</KeyboardRow>
          </KeyboardLayout>
        </KeyboardWrapper>

        <StatsContainer>
          <StatsTitle>統計分析</StatsTitle>

          <StatsSection>
            <SectionTitle>左右手平衡</SectionTitle>
            <StatsGrid>
              <StatItem>
                <StatLabel>左手</StatLabel>
                <StatValue>{stats.handBalance.left.toFixed(1)}%</StatValue>
              </StatItem>
              <StatItem>
                <StatLabel>右手</StatLabel>
                <StatValue>{stats.handBalance.right.toFixed(1)}%</StatValue>
              </StatItem>
            </StatsGrid>
          </StatsSection>

          <StatsSection>
            <SectionTitle>按排分布</SectionTitle>
            <StatsGrid>
              {Array.from(stats.rowDist.entries()).map(([row, count]) => {
                const total = Array.from(stats.rowDist.values()).reduce((sum, val) => sum + val, 0)
                return (
                  <StatItem key={row}>
                    <StatLabel>{row}</StatLabel>
                    <StatValue>{total > 0 ? ((count / total) * 100).toFixed(1) : 0}%</StatValue>
                  </StatItem>
                )
              })}
            </StatsGrid>
          </StatsSection>

          <StatsSection>
            <SectionTitle>手指負擔</SectionTitle>
            <StatsGrid>
              {[
                '左小指',
                '左无名指',
                '左中指',
                '左食指',
                '双拇指',
                '右食指',
                '右中指',
                '右无名指',
                '右小指',
              ].map(finger => {
                const load = stats.fingerLoad.get(finger) || 0
                const total = Array.from(stats.fingerLoad.values()).reduce(
                  (sum, val) => sum + val,
                  0
                )
                return (
                  <StatItem key={finger}>
                    <StatLabel>{finger}</StatLabel>
                    <StatValue>{total > 0 ? ((load / total) * 100).toFixed(1) : 0}%</StatValue>
                  </StatItem>
                )
              })}
            </StatsGrid>
          </StatsSection>
        </StatsContainer>
      </Card>

      <Modal
        title="模擬標點使用頻率説明"
        open={showHelp}
        onCancel={() => setShowHelp(false)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setShowHelp(false)}>
            我知道了
          </Button>,
        ]}
      >
        <p>
          根據現代漢語文本中標點符號約占 <strong>13%</strong> 的占比，結合碼長計算實際按鍵使用頻率。
        </p>
        <p>
          <strong>分佈規則：</strong>
        </p>
        <ul>
          <li>
            <code>;</code> 鍵 → 分號、冒號（<strong>10%</strong>）
          </li>
          <li>
            <code>,</code> 鍵 → 逗號、左書名號（<strong>40%</strong>）
          </li>
          <li>
            <code>.</code> 鍵 → 句號、右書名號（<strong>40%</strong>）
          </li>
          <li>
            <code>/</code> 鍵 → 問號（<strong>5%</strong>）
          </li>
          <li>
            <code>&apos;</code> 鍵 → 單引號、雙引號（<strong>5%</strong>）
          </li>
        </ul>
        <p>
          <strong>説明：</strong>
        </p>
        <p>
          啓用此選項後，將根據上述分佈規則模擬標點符號按鍵的實際使用頻率，並疊加到現有的按鍵使用統計中，使熱力圖更貼近實際打字情况。
        </p>
      </Modal>
    </PageContainer>
  )
}
