/**
 * 側邊欄導航組件
 */

import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import {
  HomeOutlined,
  UploadOutlined,
  DashboardOutlined,
  NumberOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  FireOutlined,
  SwapOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  FundOutlined,
  RadarChartOutlined,
  DotChartOutlined,
  AreaChartOutlined,
  HeatMapOutlined,
  ClockCircleOutlined,
  FastForwardOutlined,
  BulbOutlined,
  ExperimentOutlined,
  FunnelPlotOutlined,
  StockOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons'
import styled from 'styled-components'

const { Sider } = Layout

const StyledSider = styled(Sider)`
  .ant-layout-sider-trigger {
    background: #001529;
  }
`

const LogoContainer = styled.div<{ $collapsed: boolean }>`
  padding: ${props => (props.$collapsed ? '16px 8px' : '20px 16px')};
  display: flex;
  align-items: center;
  justify-content: center;
  background: #001529;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #002140;
  }

  img {
    width: ${props => (props.$collapsed ? '32px' : '48px')};
    height: ${props => (props.$collapsed ? '32px' : '48px')};
    transition: all 0.2s;
  }
`

// const CollapseTrigger = styled.div`
//   padding: 16px;
//   cursor: pointer;
//   text-align: center;
//   color: rgba(255, 255, 255, 0.65);
//   background: #002140;
//   transition: all 0.2s;

//   &:hover {
//     color: #fff;
//     background: #003366;
//   }
// `

export interface SidebarProps {
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
}

export function Sidebar({ collapsed = false, onCollapse }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [内部折疊狀態, 設置内部折疊狀態] = useState(collapsed)

  const 折疊狀態 = onCollapse !== undefined ? collapsed : 内部折疊狀態

  const 切換折疊 = () => {
    const 新狀態 = !折疊狀態
    if (onCollapse) {
      onCollapse(新狀態)
    } else {
      設置内部折疊狀態(新狀態)
    }
  }

  const 菜單項 = [
    {
      key: '/',
      icon: <HomeOutlined />, // 首頁圖標
      label: '首頁',
    },
    {
      key: '/process',
      icon: <UploadOutlined />, // 上傳/處理圖標
      label: '碼表解析',
    },
    {
      key: '/static',
      icon: <BarChartOutlined />, // 柱狀圖圖標（可換成：LineChartOutlined, PieChartOutlined, FundOutlined）
      label: '靜態重碼',
    },
    {
      key: '/dynamic',
      icon: <LineChartOutlined />, // 折線圖圖標（可換成：AreaChartOutlined, DotChartOutlined, RadarChartOutlined）
      label: '動態選重',
    },
    {
      key: '/candidates',
      icon: <NumberOutlined />, // 數字圖標（可換成：FunnelPlotOutlined, StockOutlined）
      label: '候選個數',
    },
    {
      key: '/speed',
      icon: <DashboardOutlined />, // 儀表盤圖標（可換成：ThunderboltOutlined, FastForwardOutlined, ClockCircleOutlined）
      label: '速度當量',
    },
    {
      key: '/continuous',
      icon: <AreaChartOutlined />, // 面積圖圖標，呼應連續文本當量的分佈圖
      label: '連續當量', // 側邊欄只放得下四個字，正式名稱是「連續文本當量」
    },
    {
      key: '/efficiency',
      icon: <RocketOutlined />, // 火箭圖標（可換成：RiseOutlined, BulbOutlined, ExperimentOutlined）
      label: '簡碼效率',
    },
    {
      key: '/heatmap',
      icon: <FireOutlined />, // 火焰圖標（可換成：HeatMapOutlined, RadarChartOutlined）
      label: '鍵位熱力',
    },
    {
      key: '/comparison',
      icon: <SwapOutlined />, // 交換圖標（可換成：FundOutlined, PieChartOutlined）
      label: '方案對比',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />, // 設置圖標
      label: '設置',
    },
  ]

  const 當前路徑 = location.pathname

  /**
   * 朱按：摺疊功能暫時不考慮，故而把相關按鈕和狀態都註釋掉
   */
  return (
    <StyledSider collapsible collapsed={折疊狀態} trigger={null} width={150} theme="dark">
      <LogoContainer $collapsed={折疊狀態} onClick={切換折疊}>
        <img src="/logo_blue.png" alt="宇浩輸入法" />
      </LogoContainer>

      {/* <CollapseTrigger onClick={切換折疊}>
        {折疊狀態 ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      </CollapseTrigger> */}

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[當前路徑]}
        items={菜單項}
        onClick={({ key }) => navigate(key)}
      />
    </StyledSider>
  )
}
