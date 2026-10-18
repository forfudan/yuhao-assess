/**
 * 讓出主線程，等瀏覽器把已經排上的界面畫出來。
 *
 * 方案 JSON 的解析會占住主線程。遮罩若和請求擠在同一輪渲染裏，
 * 要等解析結束才出現，體感和沒有提示一樣。
 */
export function 等界面繪製(): Promise<void> {
  return new Promise(resolve => {
    setTimeout(() => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => resolve())
      })
    }, 0)
  })
}
