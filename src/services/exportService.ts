import html2canvas from 'html2canvas'

export class ExportService {
  /**
   * 生成文件名
   * @param cardTitle 卡片标题
   * @param schemeName 方案名称
   */
  static generateFileName(cardTitle: string, schemeName: string = '未命名方案'): string {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
    return `${schemeName}-${cardTitle}-宇浩測評網-ceping.shurufa.app-${today}.png`
  }

  /**
   * 動態添加水印文字到卡片底部
   * @param cardElement 卡片元素
   * @param watermarkText 水印文字
   * @returns 返回創建的水印元素，用於後續移除
   */
  static addTemporaryWatermark(cardElement: HTMLElement, watermarkText: string = '宇浩測評網 ceping.shurufa.app'): HTMLElement {
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
  static addWatermark(canvas: HTMLCanvasElement, watermarkText: string = '宇浩測評網 ceping.shurufa.app'): HTMLCanvasElement {
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
      addWatermark = true
    } = options

    // 動態添加水印文字
    let watermarkElement: HTMLElement | null = null
    if (addWatermark) {
      watermarkElement = this.addTemporaryWatermark(element)
    }

    try {
      const canvas = await html2canvas(element, {
        backgroundColor,
        scale,
        useCORS: true,
        allowTaint: false,
        logging: false,
        ignoreElements: (element) => {
          // 忽略導出按鈕和折疊按鈕
          return element.classList.contains('export-btn') || 
                 element.classList.contains('collapse-button')
        }
      })

      // 獲取圖片數據
      const dataUrl = canvas.toDataURL('image/png', 1.0)

      // 生成文件名
      const filename = this.generateFileName(cardTitle, schemeName)

      // 複製到剪貼板
      if (copyToClipboard) {
        try {
          // 將canvas轉換爲blob
          const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => {
              if (blob) resolve(blob)
            }, 'image/png', 1.0)
          })

          // 複製到剪貼板
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': blob
            })
          ])
          
          console.log('卡片生成的圖片已複製到剪貼板')
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
        console.log('圖片已下載:', filename)
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
      typeof navigator !== 'undefined' &&
      'clipboard' in navigator &&
      'write' in navigator.clipboard
    )
  }
}