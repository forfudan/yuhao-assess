import { useLocation } from 'react-router-dom'
import { Button, Space, Upload, message } from 'antd'
import { DownloadOutlined, UploadOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useAtom, useSetAtom, useAtomValue } from 'jotai'
import styled from 'styled-components'
import { 當前方案原子狀態 } from '@/atoms/scheme'
import { 重碼分析原子狀態 } from '@/atoms/duplicate'
import { 候選個數分析原子狀態 } from '@/atoms/maximumCandidates'
import { 速度當量分析原子狀態 } from '@/atoms/speedEquivalent'
import { 簡碼效率分析原子狀態 } from '@/atoms/shortCodeEfficiency'
import { 從JSON導入, 創建空白方案 } from '@/services/schemeService'
import type { RcFile } from 'antd/es/upload'

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`

const PageTitle = styled.h1`
  margin: 0;
  color: white;
  font-size: 18px;
  font-weight: 500;
`

const 頁面標題映射: Record<string, string> = {
  '/': '首頁',
  '/process': '碼表解析',
  '/duplicate': '重碼分析',
  '/candidates': '候選個數',
  '/speed': '速度當量',
  '/efficiency': '簡碼效率',
  '/heatmap': '鍵位熱力',
  '/comparison': '方案對比',
  '/settings': '設置',
}

export function AppHeader() {
  const location = useLocation()
  const [當前方案, 設置當前方案] = useAtom(當前方案原子狀態)
  const 設置重碼分析結果 = useSetAtom(重碼分析原子狀態)
  const 設置候選個數分析結果 = useSetAtom(候選個數分析原子狀態)
  const 設置速度當量分析結果 = useSetAtom(速度當量分析原子狀態)
  const 設置簡碼效率分析結果 = useSetAtom(簡碼效率分析原子狀態)

  // 讀取分析結果用於導出
  const 重碼分析結果 = useAtomValue(重碼分析原子狀態)
  const 候選個數分析結果 = useAtomValue(候選個數分析原子狀態)
  const 速度當量分析結果 = useAtomValue(速度當量分析原子狀態)
  const 簡碼效率分析結果 = useAtomValue(簡碼效率分析原子狀態)

  const 顯示標題 = 當前方案 ? 當前方案.元數據.方案名 : '未選擇方案'

  // 導入配置
  const 處理導入JSON = (file: RcFile): boolean => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const 導入數據 = JSON.parse(e.target?.result as string)
        console.log('[AppHeader] 從文件導入的原始數據:', 導入數據)

        // 分離方案配置和分析結果
        const {
          重碼分析結果: 數據中的重碼結果,
          候選個數分析結果: 數據中的候選個數結果,
          速度當量分析結果: 數據中的速度當量結果,
          簡碼效率分析結果: 數據中的簡碼效率結果,
          ...方案配置
        } = 導入數據

        // 驗證方案配置
        const 方案 = 從JSON導入(JSON.stringify(方案配置))
        設置當前方案(方案)

        // 如果有分析結果，寫入 atom
        if (數據中的重碼結果) {
          設置重碼分析結果(數據中的重碼結果)
        } else {
          設置重碼分析結果(null)
        }

        if (數據中的候選個數結果) {
          設置候選個數分析結果(數據中的候選個數結果)
        } else {
          設置候選個數分析結果(null)
        }

        if (數據中的速度當量結果) {
          設置速度當量分析結果(數據中的速度當量結果)
        } else {
          設置速度當量分析結果(null)
        }

        if (數據中的簡碼效率結果) {
          設置簡碼效率分析結果(數據中的簡碼效率結果)
        } else {
          設置簡碼效率分析結果(null)
        }

        const 結果提示 = [
          數據中的重碼結果 && '重碼分析',
          數據中的候選個數結果 && '候選個數分析',
          數據中的速度當量結果 && '速度當量分析',
          數據中的簡碼效率結果 && '簡碼效率分析',
        ]
          .filter(Boolean)
          .join('、')
        const 完整提示 = 結果提示 ? `（包含${結果提示}結果）` : ''
        message.success(`已導入配置「${方案.元數據.方案名}」${完整提示}`)
      } catch (錯誤) {
        console.error('[AppHeader] 導入配置失敗:', 錯誤)
        message.error('導入配置失敗：文件格式不正確')
      }
    }
    reader.readAsText(file)
    return false // 阻止自動上傳
  }

  // 導出配置
  const 處理導出JSON = () => {
    if (!當前方案) {
      message.warning('請先選擇或創建方案')
      return
    }

    try {
      // 直接導出，將 atom 的分析結果附加到方案配置
      const 導出數據 = {
        ...當前方案,
        重碼分析結果: 重碼分析結果, // 直接使用 atom 的結構
        候選個數分析結果: 候選個數分析結果,
        速度當量分析結果: 速度當量分析結果,
        簡碼效率分析結果: 簡碼效率分析結果,
      }

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
      a.download = `${標識符}-${方案名}-${作者}-${版本}.json`

      a.click()
      URL.revokeObjectURL(url)

      const 結果列表 = [
        重碼分析結果 && '重碼分析',
        候選個數分析結果 && '候選個數分析',
        速度當量分析結果 && '速度當量分析',
        簡碼效率分析結果 && '簡碼效率分析',
      ].filter(Boolean)
      const 提示 = 結果列表.length > 0 ? `（包含${結果列表.join('、')}結果）` : ''
      message.success(`方案配置已導出${提示}`)
    } catch (錯誤) {
      console.error('[AppHeader] 導出配置失敗:', 錯誤)
      message.error('導出配置失敗')
    }
  }

  // 創建方案
  const 處理創建新方案 = () => {
    const 新方案 = 創建空白方案()
    設置當前方案(新方案)
    設置重碼分析結果(null)
    設置候選個數分析結果(null)
    設置速度當量分析結果(null)
    message.success('已創建新方案')
  }

  // 清除所有
  const 處理清除所有 = () => {
    設置當前方案(null)
    設置重碼分析結果(null)
    設置候選個數分析結果(null)
    設置速度當量分析結果(null)
    message.success('已清除所有數據')
  }

  return (
    <HeaderContainer>
      <PageTitle>{顯示標題}</PageTitle>
      <Space>
        <Upload beforeUpload={處理導入JSON} showUploadList={false} accept="application/json">
          <Button icon={<UploadOutlined />} size="small">
            導入
          </Button>
        </Upload>
        <Button
          icon={<DownloadOutlined />}
          onClick={處理導出JSON}
          disabled={!當前方案}
          size="small"
        >
          導出
        </Button>
        <Button icon={<PlusOutlined />} onClick={處理創建新方案} size="small">
          創建
        </Button>
        <Button icon={<DeleteOutlined />} onClick={處理清除所有} danger size="small">
          清除
        </Button>
      </Space>
    </HeaderContainer>
  )
}
