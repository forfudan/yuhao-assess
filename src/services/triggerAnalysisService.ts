/**
 * 觸發分析服務
 * 通過導航到各個頁面來觸發分析計算
 */

import type { NavigateFunction } from 'react-router-dom'
import type { 分析頁面路徑型别 } from '@/App'

/**
 * 觸發所有分析頁面的計算
 * @param navigate React Router的導航函數
 * @param returnPath 計算完成後返回的路徑（默認爲首頁）
 * @returns Promise，在所有頁面導航完成後resolve
 */
export function 觸發所有分析計算(
  navigate: NavigateFunction,
  returnPath: string = '/'
): Promise<void> {
  return new Promise(resolve => {
    const pages: 分析頁面路徑型别[] = [
      '/dynamic',
      '/static',
      '/candidates',
      '/speed',
      '/efficiency',
      '/heatmap',
    ]
    let currentIndex = 0

    const navigateNext = () => {
      if (currentIndex < pages.length) {
        const page = pages[currentIndex]
        if (page) {
          navigate(page)
        }
        currentIndex++
        setTimeout(navigateNext, 500) // 每個頁面停留500ms觸發計算
      } else {
        // 所有頁面都已訪問，返回指定路徑
        setTimeout(() => {
          navigate(returnPath)
          resolve()
        }, 500)
      }
    }

    // 延遲100ms開始導航
    setTimeout(navigateNext, 100)
  })
}
