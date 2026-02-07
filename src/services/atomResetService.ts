/**
 * Atom 重置服务
 * 提供清空所有原子状态的公共函数
 */

export interface AtomSetters {
  設置碼表數據: (value: any) => void
  設置原始碼表: (value: string) => void
  設置編碼預覽數據: (value: any[]) => void
  設置靜態重碼分析結果: (value: any) => void
  設置動態選重分析結果: (value: any) => void
  設置候選個數分析結果: (value: any) => void
  設置速度當量分析結果: (value: any) => void
  設置簡碼效率分析結果: (value: any) => void
}

/**
 * 清空所有原子状态
 */
export function 清空所有Atom(setters: AtomSetters) {
  setters.設置碼表數據(null)
  setters.設置原始碼表('')
  setters.設置編碼預覽數據([])
  setters.設置靜態重碼分析結果(null)
  setters.設置動態選重分析結果(null)
  setters.設置候選個數分析結果(null)
  setters.設置速度當量分析結果(null)
  setters.設置簡碼效率分析結果(null)
}
