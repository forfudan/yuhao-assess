import React, { useEffect } from 'react'
import { useAtomValue } from 'jotai'
import { 主题配置原子 } from '@/atoms/theme'

/**
 * 主题提供者组件
 * 将主题配置应用到 CSS 变量和 Ant Design ConfigProvider
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const 主题配置 = useAtomValue(主题配置原子)

  useEffect(() => {
    // 获取根元素
    const root = document.documentElement

    // 应用全局字体大小到 CSS 变量
    root.style.setProperty('--font-size-base', `${主题配置.全局字体大小}px`)
    root.style.setProperty('--line-height-base', `${主题配置.全局行高}`)

    // 应用表格相关样式到 CSS 变量
    root.style.setProperty('--table-font-size', `${主题配置.表格.字体大小}px`)
    root.style.setProperty('--table-cell-padding-block', `${主题配置.表格.单元格垂直内边距}px`)
    root.style.setProperty('--table-cell-padding-inline', `${主题配置.表格.单元格水平内边距}px`)
    root.style.setProperty('--table-header-bg', 主题配置.表格.表头背景色)
    root.style.setProperty('--table-header-color', 主题配置.表格.表头文字颜色)
  }, [主题配置])

  return <>{children}</>
}
