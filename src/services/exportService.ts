/* eslint-disable no-undef */
// Note: DOM types (HTMLElement, navigator, etc.) are available in browser environment
// TypeScript knows about them via lib.dom.d.ts included in tsconfig.json

export class ExportService {
  /**
   * 生成文件名
   * @param cardTitle 卡片標題
   * @param schemeName 方案名稱
   */
  static generateFileName(cardTitle: string, schemeName: string = '未命名方案'): string {
    const dateStr = new Date().toISOString().split('T')[0]
    const today = dateStr ? dateStr.replace(/-/g, '') : 'unknown'
    return `${schemeName}_${cardTitle}_宇浩測評網_ceping.shurufa.app_${today}.png`
  }

  /**
   * 動態添加水印文字到卡片底部
   * @param cardElement 卡片元素
   * @param watermarkText 水印文字
   * @returns 返回創建的水印元素，用於後續移除
   */
  static addTemporaryWatermark(
    cardElement: HTMLElement,
    watermarkText: string = '宇浩測評網 ceping.shurufa.app'
  ): HTMLElement {
    const watermarkDiv = document.createElement('div')
    watermarkDiv.className = 'export-watermark'
    watermarkDiv.style.cssText = `
      padding: 8px 12px;
      background: #f8fafc;
      border-radius: 6px;
      text-align: center;
      margin-top: 16px;
      font-size: 0.85rem;
      color: #667eea;
      font-weight: 500;
      border-top: 1px solid #e2e8f0;
    `
    watermarkDiv.textContent = watermarkText

    // 添加到卡片内容的最底部
    const cardContent = cardElement.querySelector('.card-content')
    if (cardContent) {
      cardContent.appendChild(watermarkDiv)
    } else {
      cardElement.appendChild(watermarkDiv)
    }

    return watermarkDiv
  }

  /**
   * 移除臨時水印
   * @param watermarkElement 水印元素
   */
  static removeTemporaryWatermark(watermarkElement: HTMLElement) {
    if (watermarkElement && watermarkElement.parentNode) {
      watermarkElement.parentNode.removeChild(watermarkElement)
    }
  }

  /**
   * 添加水印到canvas
   * @param canvas 原始canvas
   * @param watermarkText 水印文字
   */
  static addWatermark(
    canvas: HTMLCanvasElement,
    watermarkText: string = '宇浩測評網 ceping.shurufa.app'
  ): HTMLCanvasElement {
    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas

    // 设置水印样式
    const fontSize = Math.max(12, canvas.width * 0.015) // 根据canvas宽度自适应字体大小
    ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif`
    ctx.fillStyle = 'rgba(102, 126, 234, 0.6)' // 半透明蓝色
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'

    // 在底部中央添加水印
    const x = canvas.width / 2
    const y = canvas.height - 15 // 距离底部15px

    ctx.fillText(watermarkText, x, y)

    return canvas
  }

  /**
   * 將DOM元素導出爲PNG圖片
   * @param element 要導出的DOM元素
   * @param cardTitle 卡片标题，用于生成文件名
   * @param schemeName 方案名称，用于生成文件名
   * @param options 導出選項
   */
  static async exportElementToPNG(
    element: HTMLElement,
    cardTitle: string,
    schemeName: string = '未命名方案',
    options: {
      copyToClipboard?: boolean
      download?: boolean
      scale?: number
      backgroundColor?: string
      addWatermark?: boolean
    } = {}
  ) {
    const {
      copyToClipboard = true,
      download = true,
      scale = 2,
      backgroundColor = '#ffffff',
      addWatermark = true,
    } = options

    // 動態添加水印文字
    let watermarkElement: HTMLElement | null = null
    if (addWatermark) {
      watermarkElement = this.addTemporaryWatermark(element)
    }

    try {
      // 动态导入html2canvas
      const html2canvas = (await import('html2canvas')).default

      const canvas = await html2canvas(element, {
        backgroundColor,
        scale,
        useCORS: true,
        allowTaint: false,
        logging: false,
        ignoreElements: (element: any) => {
          // 忽略導出按鈕和折疊按鈕
          return (
            element.classList.contains('export-btn') ||
            element.classList.contains('collapse-button')
          )
        },
      })

      // 獲取圖片數據
      const dataUrl = canvas.toDataURL('image/png', 1.0)

      // 生成文件名
      const filename = this.generateFileName(cardTitle, schemeName)

      // 複製到剪貼板
      if (copyToClipboard) {
        try {
          // 將canvas轉換爲blob
          const blob = await new Promise<Blob>(resolve => {
            canvas.toBlob(
              blob => {
                if (blob) resolve(blob)
              },
              'image/png',
              1.0
            )
          })

          // 複製到剪貼板
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': blob,
            }),
          ])
        } catch (clipboardError) {
          console.warn('複製到剪貼板失敗，將進行下載:', clipboardError)
        }
      }

      // 下載文件
      if (download) {
        const link = document.createElement('a')
        link.download = filename
        link.href = dataUrl
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      return dataUrl
    } catch (error) {
      console.error('導出圖片失敗:', error)
      throw error
    } finally {
      // 移除臨時水印
      if (watermarkElement) {
        this.removeTemporaryWatermark(watermarkElement)
      }
    }
  }

  /**
   * 檢查瀏覽器是否支持剪貼板API
   */
  static isClipboardSupported(): boolean {
    return (
      typeof navigator !== 'undefined' && 'clipboard' in navigator && 'write' in navigator.clipboard
    )
  }

  /**
   * 導出包含全碼和簡碼兩種模式的合併圖片
   * @param element 要導出的DOM元素
   * @param cardTitle 卡片標題
   * @param schemeName 方案名稱
   * @param options 導出選項
   */
  static async exportDualModeCard(
    element: HTMLElement,
    cardTitle: string,
    schemeName: string = '未命名方案',
    options: {
      copyToClipboard?: boolean
      download?: boolean
      scale?: number
      backgroundColor?: string
      addWatermark?: boolean
      switchTabCallback?: (mode: 'full' | 'short') => Promise<void>
    } = {}
  ) {
    const {
      copyToClipboard = true,
      download = true,
      scale = 2,
      backgroundColor = '#ffffff',
      addWatermark = true,
      switchTabCallback,
    } = options

    if (!switchTabCallback) {
      throw new Error('switchTabCallback 是必需的參數')
    }

    try {
      // 動態導入html2canvas
      const html2canvas = (await import('html2canvas')).default

      // 捕獲全碼模式（包含完整標題欄）
      await switchTabCallback('full')

      const fullModeCanvas = await html2canvas(element, {
        backgroundColor,
        scale,
        useCORS: true,
        allowTaint: false,
        logging: false,
        ignoreElements: (element: any) => {
          return (
            element.classList.contains('export-btn') ||
            element.classList.contains('collapse-button')
          )
        },
      })

      // 捕獲簡碼模式（僅捕獲卡片内容，不包含標題欄）
      await switchTabCallback('short')

      // 查找卡片内容區域，跳過標題欄
      const cardContentElement = element.querySelector('.card-content')
      if (!cardContentElement) {
        throw new Error('找不到卡片内容區域')
      }

      const shortModeCanvas = await html2canvas(cardContentElement as HTMLElement, {
        backgroundColor,
        scale,
        useCORS: true,
        allowTaint: false,
        logging: false,
        ignoreElements: (element: any) => {
          return (
            element.classList.contains('export-btn') ||
            element.classList.contains('collapse-button')
          )
        },
      })

      // 創建合併的canvas
      const combinedCanvas = document.createElement('canvas')
      const ctx = combinedCanvas.getContext('2d')
      if (!ctx) {
        throw new Error('無法創建canvas上下文')
      }

      // 設置合併canvas的尺寸
      const spacing = 20 * scale // 兩個圖片之間的間距
      const separatorHeight = 2 * scale // 分隔線高度
      combinedCanvas.width = Math.max(fullModeCanvas.width, shortModeCanvas.width)
      combinedCanvas.height =
        fullModeCanvas.height + shortModeCanvas.height + spacing + separatorHeight

      // 填充背景色
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height)

      // 繪製全碼圖片（上方）
      const fullX = (combinedCanvas.width - fullModeCanvas.width) / 2
      ctx.drawImage(fullModeCanvas, fullX, 0)

      // 繪製分隔線
      const separatorY = fullModeCanvas.height + (spacing - separatorHeight) / 2
      ctx.fillStyle = '#e2e8f0' // 淺灰色分隔線
      ctx.fillRect(50 * scale, separatorY, combinedCanvas.width - 100 * scale, separatorHeight)

      // 繪製簡碼圖片（下方）
      const shortX = (combinedCanvas.width - shortModeCanvas.width) / 2
      const shortY = fullModeCanvas.height + spacing
      ctx.drawImage(shortModeCanvas, shortX, shortY)

      // 添加水印到合併圖片
      let finalCanvas = combinedCanvas
      if (addWatermark) {
        finalCanvas = this.addWatermark(combinedCanvas)
      }

      // 生成文件名
      const filename = this.generateFileName(`${cardTitle}`, schemeName)

      // 獲取圖片數據
      const dataUrl = finalCanvas.toDataURL('image/png', 1.0)

      // 複製到剪貼板
      if (copyToClipboard && this.isClipboardSupported()) {
        try {
          const blob = await new Promise<Blob>(resolve => {
            finalCanvas.toBlob(blob => resolve(blob!), 'image/png', 1.0)
          })

          await Promise.all([
            navigator.clipboard.write([
              new ClipboardItem({
                'image/png': blob,
              }),
            ]),
          ])
        } catch (clipboardError) {
          console.warn('複製到剪貼板失敗，將進行下載:', clipboardError)
        }
      }

      // 下載文件
      if (download) {
        const link = document.createElement('a')
        link.download = filename
        link.href = dataUrl
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      return dataUrl
    } catch (error) {
      console.error('導出合併圖片失敗:', error)
      throw error
    }
  }

  /**
   * 導出包含四種模式（全碼簡頻、出簡簡頻、全碼繁頻、出簡繁頻）的合併圖片
   * @param element 要導出的DOM元素
   * @param cardTitle 卡片標題
   * @param schemeName 方案名稱
   * @param options 導出選項
   */
  static async exportQuadModeCard(
    element: HTMLElement,
    cardTitle: string,
    schemeName: string = '未命名方案',
    options: {
      copyToClipboard?: boolean
      download?: boolean
      scale?: number
      backgroundColor?: string
      addWatermark?: boolean
      switchTabCallback?: (mode: 'full' | 'short' | 'fullTC' | 'shortTC') => Promise<void>
    } = {}
  ) {
    const {
      copyToClipboard = true,
      download = true,
      scale = 2,
      backgroundColor = '#ffffff',
      addWatermark = true,
      switchTabCallback,
    } = options

    if (!switchTabCallback) {
      throw new Error('switchTabCallback 是必需的參數')
    }

    try {
      // 動態導入html2canvas
      const html2canvas = (await import('html2canvas')).default

      // 查找卡片内容區域
      const cardContentElement = element.querySelector('.card-content')
      if (!cardContentElement) {
        throw new Error('找不到卡片内容區域')
      }

      // 捕獲全碼簡頻模式（包含完整標題欄）
      await switchTabCallback('full')
      const fullModeCanvas = await html2canvas(element, {
        backgroundColor,
        scale,
        useCORS: true,
        allowTaint: false,
        logging: false,
        ignoreElements: (element: any) => {
          return (
            element.classList.contains('export-btn') ||
            element.classList.contains('collapse-button')
          )
        },
      })

      // 捕獲出簡簡頻模式（僅捕獲卡片内容）
      await switchTabCallback('short')
      const shortModeCanvas = await html2canvas(cardContentElement as HTMLElement, {
        backgroundColor,
        scale,
        useCORS: true,
        allowTaint: false,
        logging: false,
        ignoreElements: (element: any) => {
          return (
            element.classList.contains('export-btn') ||
            element.classList.contains('collapse-button')
          )
        },
      })

      // 捕獲全碼繁頻模式（僅捕獲卡片内容）
      await switchTabCallback('fullTC')
      const fullTCModeCanvas = await html2canvas(cardContentElement as HTMLElement, {
        backgroundColor,
        scale,
        useCORS: true,
        allowTaint: false,
        logging: false,
        ignoreElements: (element: any) => {
          return (
            element.classList.contains('export-btn') ||
            element.classList.contains('collapse-button')
          )
        },
      })

      // 捕獲出簡繁頻模式（僅捕獲卡片内容）
      await switchTabCallback('shortTC')
      const shortTCModeCanvas = await html2canvas(cardContentElement as HTMLElement, {
        backgroundColor,
        scale,
        useCORS: true,
        allowTaint: false,
        logging: false,
        ignoreElements: (element: any) => {
          return (
            element.classList.contains('export-btn') ||
            element.classList.contains('collapse-button')
          )
        },
      })

      // 創建合併的canvas
      const combinedCanvas = document.createElement('canvas')
      const ctx = combinedCanvas.getContext('2d')
      if (!ctx) {
        throw new Error('無法創建canvas上下文')
      }

      // 設置合併canvas的尺寸
      const spacing = 20 * scale // 圖片之間的間距
      const separatorHeight = 2 * scale // 分隔線高度
      const maxWidth = Math.max(
        fullModeCanvas.width,
        shortModeCanvas.width,
        fullTCModeCanvas.width,
        shortTCModeCanvas.width
      )

      combinedCanvas.width = maxWidth
      combinedCanvas.height =
        fullModeCanvas.height +
        shortModeCanvas.height +
        fullTCModeCanvas.height +
        shortTCModeCanvas.height +
        spacing * 3 +
        separatorHeight * 3

      // 填充背景色
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height)

      let currentY = 0

      // 繪製全碼簡頻圖片（最上方，包含標題）
      const fullX = (combinedCanvas.width - fullModeCanvas.width) / 2
      ctx.drawImage(fullModeCanvas, fullX, currentY)
      currentY += fullModeCanvas.height

      // 繪製分隔線
      currentY += (spacing - separatorHeight) / 2
      ctx.fillStyle = '#e2e8f0'
      ctx.fillRect(50 * scale, currentY, combinedCanvas.width - 100 * scale, separatorHeight)
      currentY += separatorHeight + (spacing - separatorHeight) / 2

      // 繪製出簡簡頻圖片
      const shortX = (combinedCanvas.width - shortModeCanvas.width) / 2
      ctx.drawImage(shortModeCanvas, shortX, currentY)
      currentY += shortModeCanvas.height

      // 繪製分隔線
      currentY += (spacing - separatorHeight) / 2
      ctx.fillStyle = '#e2e8f0'
      ctx.fillRect(50 * scale, currentY, combinedCanvas.width - 100 * scale, separatorHeight)
      currentY += separatorHeight + (spacing - separatorHeight) / 2

      // 繪製全碼繁頻圖片
      const fullTCX = (combinedCanvas.width - fullTCModeCanvas.width) / 2
      ctx.drawImage(fullTCModeCanvas, fullTCX, currentY)
      currentY += fullTCModeCanvas.height

      // 繪製分隔線
      currentY += (spacing - separatorHeight) / 2
      ctx.fillStyle = '#e2e8f0'
      ctx.fillRect(50 * scale, currentY, combinedCanvas.width - 100 * scale, separatorHeight)
      currentY += separatorHeight + (spacing - separatorHeight) / 2

      // 繪製出簡繁頻圖片
      const shortTCX = (combinedCanvas.width - shortTCModeCanvas.width) / 2
      ctx.drawImage(shortTCModeCanvas, shortTCX, currentY)

      // 添加水印到合併圖片
      let finalCanvas = combinedCanvas
      if (addWatermark) {
        finalCanvas = this.addWatermark(combinedCanvas)
      }

      // 生成文件名
      const filename = this.generateFileName(`${cardTitle}`, schemeName)

      // 獲取圖片數據
      const dataUrl = finalCanvas.toDataURL('image/png', 1.0)

      // 複製到剪貼板
      if (copyToClipboard && this.isClipboardSupported()) {
        try {
          const blob = await new Promise<Blob>(resolve => {
            finalCanvas.toBlob(blob => resolve(blob!), 'image/png', 1.0)
          })

          await Promise.all([
            navigator.clipboard.write([
              new ClipboardItem({
                'image/png': blob,
              }),
            ]),
          ])
        } catch (clipboardError) {
          console.warn('複製到剪貼板失敗，將進行下載:', clipboardError)
        }
      }

      // 下載文件
      if (download) {
        const link = document.createElement('a')
        link.download = filename
        link.href = dataUrl
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      return dataUrl
    } catch (error) {
      console.error('導出合併圖片失敗:', error)
      throw error
    }
  }
}

// =============================================================================
// 方案配置JSON導出
// =============================================================================

import type { 方案配置介面 } from '@/types/scheme'
import type { 靜態重碼分析結果介面 } from '@/atoms/staticDuplicate'
import type { 動態選重分析結果介面 } from '@/atoms/dynamicDuplicate'
import type { 最大候選個數分析結果 } from '@/atoms/maximumCandidates'
import type { 速度當量分析結果介面 } from '@/atoms/speedEquivalent'
import type { 簡碼效率分析結果介面 } from '@/atoms/shortCodeEfficiency'

/**
 * 分析結果集合
 */
export interface 分析結果集 {
  靜態重碼分析結果: 靜態重碼分析結果介面 | null
  動態選重分析結果: 動態選重分析結果介面 | null
  候選個數分析結果: 最大候選個數分析結果 | null
  速度當量分析結果: 速度當量分析結果介面 | null
  簡碼效率分析結果: 簡碼效率分析結果介面 | null
}

/**
 * 導出方案配置爲JSON，自動下載
 * @param 當前方案 方案配置對象
 * @param 分析結果 包含各種分析結果的對象
 * @param 簡易文件名 是否使用簡易文件名（僅包含方案唯一識别符），默認爲false
 * @returns 返回導出結果對象，包含成功與否和提示訊息
 */
export function 導出方案配置JSON(
  當前方案: 方案配置介面,
  分析結果: 分析結果集,
  簡易文件名: boolean = true
): { success: boolean; message?: string } {
  try {
    // 構建導出數據
    const 導出數據: 方案配置介面 = {
      ...當前方案,
      測評結果: {
        靜態重碼分析: 分析結果.靜態重碼分析結果 ?? undefined,
        動態選重分析: 分析結果.動態選重分析結果 ?? undefined,
        候選個數分析: 分析結果.候選個數分析結果 ?? undefined,
        速度當量分析: 分析結果.速度當量分析結果 ?? undefined,
        簡碼效率分析: 分析結果.簡碼效率分析結果 ?? undefined,
      },
    }

    // 生成JSON並下載
    const json文本 = JSON.stringify(導出數據, null, 2)
    const blob = new Blob([json文本], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url

    // 文件名格式：標識符-方案名-作者-版本號.json
    const 標識符 = 當前方案.元數據.標識符
    const 方案名 = 當前方案.元數據.方案名
    const 作者 = 當前方案.元數據.作者 || 'unknown'
    const 版本 = 當前方案.元數據.版本 || '1.0.0'
    if (簡易文件名) {
      a.download = `${方案名}.json`
    } else {
      a.download = `${標識符}-${方案名}-${作者}-${版本}.json`
    }

    a.click()
    URL.revokeObjectURL(url)

    // 生成提示訊息
    const 結果列表 = [
      分析結果.靜態重碼分析結果 && '靜態重碼分析',
      分析結果.動態選重分析結果 && '動態選重分析',
      分析結果.候選個數分析結果 && '候選個數分析',
      分析結果.速度當量分析結果 && '速度當量分析',
      分析結果.簡碼效率分析結果 && '簡碼效率分析',
    ].filter(Boolean)
    const 提示 = 結果列表.length > 0 ? `（包含${結果列表.join('、')}結果）` : ''

    return {
      success: true,
      message: `方案配置已導出${提示}`,
    }
  } catch (錯誤) {
    console.error('[exportService] 導出配置失敗:', 錯誤)
    return {
      success: false,
      message: '導出配置失敗',
    }
  }
}
