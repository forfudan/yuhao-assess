import React, { useEffect, useId, useRef, useState } from 'react'
import { 分佈重新分箱 } from '../services/continuousEquivalentService'
import type { 連續文本當量統計介面 } from '../services/continuousEquivalentService'
import type { 參考分佈項介面 } from '../data/continuousEquivalentReference'

/**
 * 連續文本當量分佈圖
 *
 * 極簡風格的機率密度圖：直方表示樣本分佈，
 * 虛線標出平均數、中位數與右側 90% 分位數（VaR）。
 */

/** 圖表配色（與站點淺色主題一致） */
const 配色 = {
  柱體: '#2a78d6',
  /** 超過 90% VaR 的尾部：紅色，與 CVaR 標註同色 */
  尾部柱體: '#d03b3b',
  平均線: '#0b0b0b',
  中位線: '#52514e',
  分位線: '#d03b3b',
  網格: '#e1e0d9',
  基線: '#c3c2b7',
  次要字: '#52514e',
  弱化字: '#898781',
  背景: '#ffffff',
  /** 參考方案的常態分佈曲線：灰色低對比，永遠退在數據後面 */
  參考曲線: '#898781',
}

// 上邊距要放下四行錯開的標註文字，避免平均數與中位數靠近時標籤重疊
const 邊距 = { 上: 65, 右: 16, 下: 34, 左: 46 }
const 標註行高 = 13
const 繪圖高度 = 210
const 箱數 = 56

interface 屬性介面 {
  統計: 連續文本當量統計介面
  /** 圖表標題（如「全碼加選重」） */
  標題: string
  /** 多圖共用的 x 軸範圍，便於橫向比較 */
  共用範圍?: { 最小值: number; 最大值: number }
  /** 參考方案的常態分佈參數，疊在直方圖下作對照 */
  參考分佈?: 參考分佈項介面
  /** 參考方案名稱，用於圖例 */
  參考方案名?: string
}

/** 常態分佈機率密度 */
function 常態密度(x: number, 平均數: number, 標準差: number): number {
  if (標準差 <= 0) return 0
  const z = (x - 平均數) / 標準差
  return Math.exp(-0.5 * z * z) / (標準差 * Math.sqrt(2 * Math.PI))
}

interface 標註線介面 {
  標籤: string
  值: number
  顏色: string
  虛線: string
  層級: number
}

/**
 * 取不小於原值的「整齊」步長：1 / 2 / 5 的 10 的冪次倍
 */
function 取整齊步長(原始步長: number): number {
  if (!(原始步長 > 0)) return 1
  const 冪次 = Math.pow(10, Math.floor(Math.log10(原始步長)))
  const 倍數 = 原始步長 / 冪次
  const 整齊倍數 = 倍數 <= 1 ? 1 : 倍數 <= 2 ? 2 : 倍數 <= 5 ? 5 : 10
  return 整齊倍數 * 冪次
}

export const ContinuousEquivalentChart: React.FC<屬性介面> = ({
  統計,
  標題,
  共用範圍,
  參考分佈,
  參考方案名,
}) => {
  const 容器引用 = useRef<HTMLDivElement>(null)
  const [寬度, 設置寬度] = useState(760)
  const [懸停箱, 設置懸停箱] = useState<number | null>(null)
  // 同頁有多張圖，斜線填充的 pattern 需要各自唯一的 id
  const 斜線填充編號 = `參考斜線-${useId().replace(/:/g, '')}`

  // 跟隨容器寬度，避免 viewBox 縮放把字也放大
  useEffect(() => {
    const 節點 = 容器引用.current
    if (!節點) return
    const 觀察器 = new ResizeObserver(項目 => {
      const 新寬度 = 項目[0]?.contentRect.width
      if (新寬度 && 新寬度 > 0) 設置寬度(新寬度)
    })
    觀察器.observe(節點)
    return () => 觀察器.disconnect()
  }, [])

  const 範圍 = 共用範圍 ?? { 最小值: 統計.最小值, 最大值: 統計.最大值 }
  // 交給 React Compiler 自動記憶化，不手寫 useMemo
  const 分箱 = 分佈重新分箱(統計.分佈, 箱數, 範圍)

  const 繪圖寬度 = Math.max(280, 寬度 - 邊距.左 - 邊距.右)
  const 總高度 = 繪圖高度 + 邊距.上 + 邊距.下
  const 箱寬值 = (範圍.最大值 - 範圍.最小值) / 箱數

  // 曲線畫的是「每箱機率質量」，才能和直方圖的佔比同軸比較
  const 參考峰值 = 參考分佈
    ? 常態密度(參考分佈.平均數, 參考分佈.平均數, 參考分佈.標準差) * 箱寬值
    : 0
  const 最大佔比 = Math.max(...分箱.map(箱 => 箱.佔比), 參考峰值, 1e-9)

  // y 軸取整齊的刻度步長（1 / 2 / 5 × 10^n），頂端留出一格空隙
  const y步長 = 取整齊步長(最大佔比 / 4)
  const y上限 = Math.ceil(最大佔比 / y步長) * y步長
  const y刻度 = Array.from({ length: Math.round(y上限 / y步長) }, (_, i) => y步長 * (i + 1))
  const y刻度小數位 = Math.max(0, -Math.floor(Math.log10(y步長 * 100)))

  const x比例 = (值: number) =>
    邊距.左 + ((值 - 範圍.最小值) / (範圍.最大值 - 範圍.最小值 || 1)) * 繪圖寬度
  const y比例 = (佔比: number) => 邊距.上 + 繪圖高度 - (佔比 / y上限) * 繪圖高度

  const 箱寬 = 繪圖寬度 / 箱數
  const 柱寬 = Math.max(1, 箱寬 - 2) // 2px 表面間隙

  const 標註線: 標註線介面[] = [
    { 標籤: '平均數', 值: 統計.平均數, 顏色: 配色.平均線, 虛線: '5 3', 層級: 0 },
    { 標籤: '中位數', 值: 統計.中位數, 顏色: 配色.中位線, 虛線: '2 3', 層級: 1 },
    { 標籤: '90% VaR', 值: 統計.九零分位數, 顏色: 配色.分位線, 虛線: '7 4', 層級: 2 },
    { 標籤: '90% CVaR', 值: 統計.九零條件分位數, 顏色: 配色.分位線, 虛線: '2 2', 層級: 3 },
  ]

  // x 軸刻度：五等分
  const x刻度 = Array.from(
    { length: 5 },
    (_, i) => 範圍.最小值 + ((範圍.最大值 - 範圍.最小值) * i) / 4
  )

  const 懸停數據 = 懸停箱 !== null ? 分箱[懸停箱] : undefined

  return (
    <div ref={容器引用} style={{ width: '100%', position: 'relative' }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 配色.次要字,
          marginBottom: 2,
        }}
      >
        {標題}
      </div>
      <div style={{ fontSize: 12, color: 配色.弱化字, marginBottom: 6 }}>
        {統計.樣本數.toLocaleString()} 個樣本 · 每樣本 {統計.窗口長度} 字 · 標準差 σ={' '}
        {統計.標準差.toFixed(3)}
      </div>
      <div style={{ fontSize: 11, color: 配色.弱化字, marginBottom: 6 }}>
        <span style={{ color: 配色.尾部柱體 }}>■</span> 紅色爲當量超過 90%
        樣本的一成文本，其平均當量即 90% CVaR
      </div>
      {參考分佈 && (
        <div style={{ fontSize: 11, color: 配色.弱化字, marginBottom: 6 }}>
          {/* 圖例綫樣與圖中一致：虛線 + 斜線填充，而不是一塊實心色 */}
          <svg
            width={16}
            height={9}
            style={{ verticalAlign: 'middle', marginRight: 2 }}
            aria-hidden="true"
          >
            <line
              x1={0}
              y1={7}
              x2={16}
              y2={7}
              stroke={配色.參考曲線}
              strokeWidth={1}
              opacity={0.45}
            />
            <line
              x1={0}
              y1={3}
              x2={16}
              y2={3}
              stroke={配色.參考曲線}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              opacity={0.65}
            />
          </svg>{' '}
          灰色曲線爲{參考方案名 ?? '參考方案'}方案在同一設置下的正態化分佈（μ=
          {參考分佈.平均數.toFixed(3)} · σ={參考分佈.標準差.toFixed(3)}）
        </div>
      )}

      <svg
        width={寬度}
        height={總高度}
        viewBox={`0 0 ${寬度} ${總高度}`}
        role="img"
        aria-label={`${標題}連續文本當量分佈，平均數 ${統計.平均數.toFixed(3)}，中位數 ${統計.中位數.toFixed(3)}，90% VaR ${統計.九零分位數.toFixed(3)}，90% CVaR ${統計.九零條件分位數.toFixed(3)}`}
        onMouseLeave={() => 設置懸停箱(null)}
      >
        {/* 水平網格線 */}
        {y刻度.map(刻度值 => (
          <g key={`grid-${刻度值}`}>
            <line
              x1={邊距.左}
              x2={邊距.左 + 繪圖寬度}
              y1={y比例(刻度值)}
              y2={y比例(刻度值)}
              stroke={配色.網格}
              strokeWidth={1}
            />
            <text
              x={邊距.左 - 8}
              y={y比例(刻度值) + 3}
              textAnchor="end"
              fontSize={10}
              fill={配色.弱化字}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {(刻度值 * 100).toFixed(y刻度小數位)}%
            </text>
          </g>
        ))}

        {/* 參考方案的常態分佈曲線：畫在柱體之前，永遠退在數據後面 */}
        {參考分佈 &&
          (() => {
            const 取樣點 = 160
            const 點列表: Array<[number, number]> = []
            for (let i = 0; i <= 取樣點; i++) {
              const x = 範圍.最小值 + ((範圍.最大值 - 範圍.最小值) * i) / 取樣點
              const 佔比 = 常態密度(x, 參考分佈.平均數, 參考分佈.標準差) * 箱寬值
              點列表.push([x比例(x), y比例(佔比)])
            }
            const 折線 = 點列表.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
            const 基線y = 邊距.上 + 繪圖高度
            return (
              <g>
                {/* 稀疏斜線：1px 線寬、7px 間距，平均墨量比實心淡塗更低，
                    同時讓這片區域一眼看出是「參考」而不是實測數據 */}
                <defs>
                  <pattern
                    id={斜線填充編號}
                    width={7}
                    height={7}
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(45)"
                  >
                    <line
                      x1={0}
                      y1={0}
                      x2={0}
                      y2={7}
                      stroke={配色.參考曲線}
                      strokeWidth={1}
                      opacity={0.45}
                    />
                  </pattern>
                </defs>
                <polygon
                  points={`${邊距.左},${基線y} ${折線} ${邊距.左 + 繪圖寬度},${基線y}`}
                  fill={`url(#${斜線填充編號})`}
                />
                <polyline
                  points={折線}
                  fill="none"
                  stroke={配色.參考曲線}
                  strokeWidth={1.5}
                  strokeDasharray="6 4"
                  opacity={0.65}
                />
              </g>
            )
          })()}

        {/* 直方柱體 */}
        {分箱.map((箱, i) => {
          if (箱.個數 === 0) return null
          const y = y比例(箱.佔比)
          const 高 = 邊距.上 + 繪圖高度 - y
          // 箱中心超過 90% VaR 即屬尾部，塗紅；CVaR 就是這片紅色區域的平均值
          const 屬尾部 = 箱.中心 >= 統計.九零分位數
          return (
            <rect
              key={`bar-${i}`}
              x={x比例(箱.下界) + 1}
              y={y}
              width={柱寬}
              height={Math.max(高, 0.5)}
              rx={Math.min(2, 柱寬 / 2)}
              fill={屬尾部 ? 配色.尾部柱體 : 配色.柱體}
              opacity={懸停箱 === null || 懸停箱 === i ? 0.85 : 0.35}
            />
          )
        })}

        {/* 懸停熱區（比柱體寬，便於命中） */}
        {分箱.map((_, i) => (
          <rect
            key={`hit-${i}`}
            x={邊距.左 + i * 箱寬}
            y={邊距.上}
            width={箱寬}
            height={繪圖高度}
            fill="transparent"
            onMouseEnter={() => 設置懸停箱(i)}
          />
        ))}

        {/* 基線 */}
        <line
          x1={邊距.左}
          x2={邊距.左 + 繪圖寬度}
          y1={邊距.上 + 繪圖高度}
          y2={邊距.上 + 繪圖高度}
          stroke={配色.基線}
          strokeWidth={1}
        />

        {/* 標註線：平均數 / 中位數 / 90% VaR */}
        {標註線.map(線 => {
          const x = x比例(線.值)
          // 三條標註各佔一行，線從自己那行的高度垂下來，標籤永遠貼着自己的線
          const 標籤y = 8 + 線.層級 * 標註行高
          const 標籤靠右 = x > 邊距.左 + 繪圖寬度 * 0.72
          return (
            <g key={線.標籤}>
              <line
                x1={x}
                x2={x}
                y1={標籤y + 3}
                y2={邊距.上 + 繪圖高度}
                stroke={線.顏色}
                strokeWidth={1.5}
                strokeDasharray={線.虛線}
              />
              <text
                x={標籤靠右 ? x - 5 : x + 5}
                y={標籤y + 8}
                textAnchor={標籤靠右 ? 'end' : 'start'}
                fontSize={11}
                fill={線.顏色}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {線.標籤} {線.值.toFixed(3)}
              </text>
            </g>
          )
        })}

        {/* x 軸刻度 */}
        {x刻度.map((刻度值, i) => (
          <text
            key={`xtick-${i}`}
            x={x比例(刻度值)}
            y={邊距.上 + 繪圖高度 + 16}
            textAnchor={i === 0 ? 'start' : i === x刻度.length - 1 ? 'end' : 'middle'}
            fontSize={10}
            fill={配色.弱化字}
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {刻度值.toFixed(3)}
          </text>
        ))}
        <text
          x={邊距.左 + 繪圖寬度 / 2}
          y={總高度 - 2}
          textAnchor="middle"
          fontSize={10}
          fill={配色.弱化字}
        >
          速度當量
        </text>
      </svg>

      {/* 懸停提示 */}
      {懸停數據 && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(Math.max(x比例(懸停數據.中心) - 60, 0), Math.max(寬度 - 130, 0)),
            top: 邊距.上 + 40,
            pointerEvents: 'none',
            background: 配色.背景,
            border: `1px solid ${配色.網格}`,
            borderRadius: 4,
            padding: '4px 8px',
            fontSize: 11,
            lineHeight: 1.5,
            color: 配色.次要字,
            boxShadow: '0 2px 8px rgba(11,11,11,0.08)',
            whiteSpace: 'nowrap',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <div>
            當量 {懸停數據.下界.toFixed(3)} – {懸停數據.上界.toFixed(3)}
          </div>
          <div>
            {懸停數據.原始個數.toLocaleString()} 個樣本（
            {((懸停數據.原始個數 / 統計.樣本數) * 100).toFixed(2)}%）
          </div>
        </div>
      )}
    </div>
  )
}

export default ContinuousEquivalentChart
