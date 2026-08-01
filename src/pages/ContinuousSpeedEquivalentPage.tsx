import React, { useState, useEffect, useRef } from 'react'
import { useAtom } from 'jotai'
import { Button, Space, Typography, Alert, Spin, Select, Divider, message } from 'antd'
import { LineChartOutlined } from '@ant-design/icons'
import { 碼表原子狀態 } from '../atoms/codeTable'
import { 當前方案原子狀態 } from '../atoms/scheme'
import { 當量表原子狀態 } from '../atoms/equivTable'
import { 連續文本當量分析原子狀態 } from '../atoms/continuousEquivalent'
import type { 連續文本當量碼表口徑, 連續文本當量分析結果介面 } from '../atoms/continuousEquivalent'
import {
  加載連續文本,
  清洗連續文本,
  蒙特卡洛連續文本當量,
} from '../services/continuousEquivalentService'
import { 當量表服務實例 } from '../services/equivTableService'
import ContinuousEquivalentChart from '../components/ContinuousEquivalentChart'
import {
  取參考分佈,
  取參考方案名,
  參考方案列表,
  默認參考方案,
} from '../data/continuousEquivalentReference'
import type { 參考方案鍵名 } from '../data/continuousEquivalentReference'
import { 默認選重鍵表 } from '../types/scheme'
import type { 處理後的碼表結果介面 } from '../types'

const { Paragraph, Text, Link } = Typography

/** 參與分析的碼表口徑 */
const 連續文本當量口徑列表: 連續文本當量碼表口徑[] = ['全碼加選重', '全部簡碼加選重']

/** 參考曲線的下拉選項值：某個參考方案，或關掉不畫 */
type 參考方案選擇 = 參考方案鍵名 | '不顯示'

/**
 * 連續文本當量分析頁面
 *
 * 「速度當量」頁按單字加權，衡量孤立單字的擊鍵成本；這一頁改用蒙特卡洛
 * 在連續語料上抽樣，看的是成段文本下的當量分佈與尾部風險（VaR / CVaR）。
 */
const ContinuousSpeedEquivalentPage: React.FC = () => {
  const [碼表數據] = useAtom(碼表原子狀態)
  const [當量表] = useAtom(當量表原子狀態)
  const [當前方案] = useAtom(當前方案原子狀態)
  const [連續文本當量結果, 設置連續文本當量結果] = useAtom(連續文本當量分析原子狀態)

  const [計算中, 設置計算中] = useState(false)
  const [錯誤信息, 設置錯誤信息] = useState<string | null>(null)
  const [窗口長度, 設置窗口長度] = useState(100)
  const [樣本數, 設置樣本數] = useState(20000)
  const [參考方案, 設置參考方案] = useState<參考方案選擇>(默認參考方案)
  // 記住上次算過的碼表對象，換方案後自動重算（而不是留着上一個方案的圖）
  const 上次碼表 = useRef<unknown>(null)
  // 已經按存檔對齊過下拉選單的那個結果對象，避免蓋掉用戶隨後的手動選擇
  const 已對齊的結果 = useRef<unknown>(null)

  // 類型斷言：碼表數據實際上是 處理後的碼表結果
  const 處理後碼表 = 碼表數據 as 處理後的碼表結果介面 | null

  // 選重鍵按方案配置折算（如二重按 ; 、三重按 '）
  const 選重鍵表 = 當前方案?.方案參數?.選重鍵表 ?? 默認選重鍵表

  /**
   * 計算連續文本當量（蒙特卡洛抽樣連續文本）
   */
  const 計算連續文本當量 = async () => {
    if (!處理後碼表) {
      設置錯誤信息('請先在「碼表解析」頁面上傳碼表')
      return
    }

    設置計算中(true)
    設置錯誤信息(null)

    try {
      const [原始文本, 當量表數據] = await Promise.all([
        加載連續文本(),
        Object.keys(當量表).length > 0 ? Promise.resolve(當量表) : 當量表服務實例.加載當量表(),
      ])

      const 清洗後文本 = 清洗連續文本(原始文本)

      const 碼表映射: Record<連續文本當量碼表口徑, Map<string, string[]>> = {
        全碼加選重: 處理後碼表.全碼加選重鍵表,
        全部簡碼加選重: 處理後碼表.簡碼加選重鍵表,
      }

      const 統計: 連續文本當量分析結果介面['統計'] = {}
      for (const 口徑 of 連續文本當量口徑列表) {
        統計[口徑] = 蒙特卡洛連續文本當量(清洗後文本, 碼表映射[口徑], 當量表數據, {
          窗口長度,
          樣本數,
          選重鍵表,
        })
      }

      設置連續文本當量結果({
        統計,
        樣本數,
        窗口長度,
        更新時間: new Date().toISOString(),
      })
      message.success('連續文本當量計算完成')
    } catch (error) {
      設置錯誤信息(error instanceof Error ? error.message : '連續文本當量計算失敗')
    } finally {
      設置計算中(false)
    }
  }

  /**
   * 碼表變化後自動重算
   *
   * 換方案時 連續文本當量分析原子狀態 會被清空，這裡把圖補回來；
   * 用碼表對象本身做標記，即使頁面没有重新掛載（在本頁直接載入新方案）也能觸發。
   * 計算失敗時結果仍爲空，但標記已更新，不會反覆重試。
   */
  useEffect(() => {
    if (處理後碼表 && !連續文本當量結果 && 上次碼表.current !== 處理後碼表) {
      上次碼表.current = 處理後碼表
      計算連續文本當量()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [處理後碼表, 連續文本當量結果])

  /**
   * 讓下拉選單跟上結果本身的抽樣設置
   *
   * 從方案 JSON 導入的結果可能是用别的窗口長度算的，
   * 選單停在默認值就會和圖上畫的東西對不上，看起來像算錯了。
   * 只在結果對象換掉時對齊一次，用戶之後手動改選單不會被蓋回去。
   */
  useEffect(() => {
    if (連續文本當量結果 && 已對齊的結果.current !== 連續文本當量結果) {
      已對齊的結果.current = 連續文本當量結果
      設置窗口長度(連續文本當量結果.窗口長度)
      設置樣本數(連續文本當量結果.樣本數)
    }
  }, [連續文本當量結果])

  // 兩張圖共用 x 軸範圍，便於橫向比較全碼與簡碼的分佈位置
  const 全部統計 = 連續文本當量結果
    ? 連續文本當量口徑列表
        .map(口徑 => 連續文本當量結果.統計[口徑])
        .filter((項): 項 is NonNullable<typeof 項> => 項 !== undefined)
    : []
  // 選了「不顯示」就完全不查參考分佈，圖上只剩實測分佈
  const 當前參考方案 = 參考方案 === '不顯示' ? null : 參考方案
  const 取當前參考 = (口徑: 連續文本當量碼表口徑, 窗口: number) =>
    當前參考方案 ? 取參考分佈(當前參考方案, 口徑, 窗口) : undefined

  // x 軸範圍要同時容下實測分佈和參考曲線的 ±3σ，
  // 否則參考方案和當前方案差得遠時，曲線會整條落在畫面外
  const 參考端點: number[] = []
  if (連續文本當量結果) {
    for (const 口徑 of 連續文本當量口徑列表) {
      const 參考 = 取當前參考(口徑, 連續文本當量結果.窗口長度)
      if (參考) {
        參考端點.push(參考.平均數 - 3 * 參考.標準差, 參考.平均數 + 3 * 參考.標準差)
      }
    }
  }
  const 共用範圍 =
    全部統計.length > 0
      ? {
          最小值: Math.min(...全部統計.map(項 => 項.最小值), ...參考端點),
          最大值: Math.max(...全部統計.map(項 => 項.最大值), ...參考端點),
        }
      : undefined

  return (
    <div style={{ padding: 24 }}>
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        {/* 標題帶上方案名，截圖單獨發這一頁時也知道算的是哪個方案 */}
        <Divider titlePlacement="start" style={{ marginTop: 0 }}>
          連續文本當量
          {當前方案 && (
            <Text type="secondary" style={{ fontWeight: 'normal' }}>
              {' '}
              — {當前方案.元數據.方案名}
            </Text>
          )}
        </Divider>

        <div>
          <Paragraph type="secondary" style={{ marginBottom: 12 }}>
            速度當量按單字加權，衡量的是孤立單字的擊鍵成本。
            <strong>連續文本當量</strong>
            則衡量方案在成段文本下的表現：把語料只保留漢字與逗號句號，逐字映射爲按鍵串（逗號句號直接映射爲{' '}
            <code>,</code> <code>.</code>），再用蒙特卡洛在語料中隨機截取連續{窗口長度}
            字的窗口，計算窗口內相鄰碼對的平均當量，重複多次得到當量的分佈。不足一個窗口的尾部不參與計算。
          </Paragraph>

          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            <strong>90% VaR</strong> 是右側 90% 分位數：只有一成的文本比它更慢。
            <strong>90% CVaR</strong> 是這一成最慢文本的平均當量，圖中紅色區域即這批樣本。 VaR
            只給出門檻，CVaR 進一步告訴你「真碰上難打的段落時，平均有多慢」。
          </Paragraph>
        </div>

        <Space wrap>
          <Space size={4}>
            <Text type="secondary">窗口長度</Text>
            <Select
              value={窗口長度}
              onChange={設置窗口長度}
              style={{ width: 100 }}
              options={[10, 20, 50, 100, 200].map(值 => ({ value: 值, label: `${值} 字` }))}
            />
          </Space>
          <Space size={4}>
            <Text type="secondary">抽樣次數</Text>
            <Select
              value={樣本數}
              onChange={設置樣本數}
              style={{ width: 110 }}
              options={[5000, 20000, 50000, 100000].map(值 => ({
                value: 值,
                label: 值.toLocaleString(),
              }))}
            />
          </Space>
          <Space size={4}>
            <Text type="secondary">參考方案</Text>
            <Select
              value={參考方案}
              onChange={設置參考方案}
              style={{ width: 110 }}
              options={[
                ...參考方案列表.map(項 => ({ value: 項.鍵名, label: 項.方案名 })),
                { value: '不顯示' as const, label: '不顯示' },
              ]}
            />
          </Space>
          <Button
            type="primary"
            icon={<LineChartOutlined />}
            onClick={計算連續文本當量}
            loading={計算中}
            disabled={!處理後碼表}
          >
            計算連續文本當量
          </Button>
        </Space>

        {錯誤信息 && (
          <Alert title={錯誤信息} type="error" closable onClose={() => 設置錯誤信息(null)} />
        )}

        {計算中 && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Spin size="large" />
            <p style={{ marginTop: 16 }}>正在抽樣計算連續文本當量...</p>
          </div>
        )}

        {!計算中 && !連續文本當量結果 && !錯誤信息 && (
          <Alert
            title={
              處理後碼表
                ? '點擊「計算連續文本當量」查看方案在成段文本下的當量分佈'
                : '請先在「碼表解析」頁面上傳碼表'
            }
            type="info"
            showIcon
          />
        )}

        {!計算中 && 連續文本當量結果 && (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
                gap: 32,
              }}
            >
              {連續文本當量口徑列表.map(口徑 => {
                const 統計 = 連續文本當量結果.統計[口徑]
                if (!統計) return null
                return (
                  <ContinuousEquivalentChart
                    key={口徑}
                    統計={統計}
                    標題={口徑}
                    共用範圍={共用範圍}
                    參考分佈={取當前參考(口徑, 連續文本當量結果.窗口長度)}
                    參考方案名={當前參考方案 ? 取參考方案名(當前參考方案) : undefined}
                  />
                )
              })}
            </div>

            {全部統計[0] && (
              <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 16 }}>
                語料：
                <Link
                  href="https://github.com/forfudan/yuhao-assess-data/blob/main/texts/literature.txt"
                  target="_blank"
                >
                  literature.txt
                </Link>
                （經典文學作品節選），清洗後共 {全部統計[0].語料字數.toLocaleString()} 字。
                {全部統計[0].未編碼字數 > 0 && (
                  <>其中 {全部統計[0].未編碼字數.toLocaleString()} 字不在碼表内，已跳過。</>
                )}
                {全部統計.some(項 => 項.碼對覆蓋率 < 0.9999) && (
                  <>
                    {' '}
                    碼對覆蓋率{' '}
                    {全部統計.map(項 => (項.碼對覆蓋率 * 100).toFixed(2) + '%').join(' / ')}
                    ，未覆蓋的碼對（多爲選重鍵數字）不計入平均。
                  </>
                )}
              </Paragraph>
            )}
          </div>
        )}
      </Space>
    </div>
  )
}

export default ContinuousSpeedEquivalentPage
