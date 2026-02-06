import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'jotai'
import { AntdConfigProvider } from './components/AntdConfigProvider'
import App from './App'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider>
      <BrowserRouter>
        <AntdConfigProvider>
          <App />
        </AntdConfigProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
)
