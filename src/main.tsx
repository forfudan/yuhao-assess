import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, App as AntdApp } from 'antd'
import zhTW from 'antd/locale/zh_TW'
import App from './App'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider
        locale={zhTW}
        theme={{
          token: {
            // 全局字體大小（影響所有文字和組件）
            fontSize: 14,
            // 全局行高（文字垂直間距）
            lineHeight: 1.4,
          },
          components: {
            Table: {
              // 表格字體大小（可單獨設置，留空則使用全局 fontSize）
              fontSize: 13,
              
              // 表格單元格 padding（上下、左右）
              cellPaddingBlock: 4,
              cellPaddingInline: 8,
              
              // 表頭樣式
              headerBg: '#f8f9fa',
              headerColor: '#212529',
            },
          },
        }}
      >
        <AntdApp>
          <App />
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
)
