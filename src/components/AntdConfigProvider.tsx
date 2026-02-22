import React from 'react'
import { ConfigProvider, App as AntdApp } from 'antd'
import { useAtomValue } from 'jotai'
import zhTW from 'antd/locale/zh_TW'
import { 主题配置原子 } from '@/atoms/theme'

/**
 * Ant Design 配置提供者
 * 根据主题配置动态设置 Ant Design 的样式
 */
export const AntdConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const 主题配置 = useAtomValue(主题配置原子)

  return (
    <ConfigProvider
      locale={zhTW}
      theme={{
        token: {
          // 全局字體大小（影響所有文字和組件）
          fontSize: 主题配置.全局字体大小,
          // 全局行高（文字垂直間距）
          lineHeight: 主题配置.全局行高,
        },
        components: {
          Table: {
            // 表格字體大小（統一應用到所有表格單元格）
            fontSize: 主题配置.表格.字体大小,

            // 表格單元格 padding（上下、左右）
            cellPaddingBlock: 主题配置.表格.单元格垂直内边距,
            cellPaddingInline: 主题配置.表格.单元格水平内边距,

            // 表頭樣式
            headerBg: 主题配置.表格.表头背景色,
            headerColor: 主题配置.表格.表头文字颜色,
          },
        },
      }}
    >
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  )
}
