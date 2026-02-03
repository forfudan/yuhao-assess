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
} from '@ant-design/icons'
import styled from 'styled-components'

const { Sider } = Layout

const StyledSider = styled(Sider)`
  .ant-layout-sider-trigger {
    background: #001529;
  }
`

const CollapseTrigger = styled.div`
  padding: 16px;
  cursor: pointer;
  text-align: center;
  color: rgba(255, 255, 255, 0.65);
  background: #002140;
  transition: all 0.2s;

  &:hover {
    color: #fff;
    background: #003366;
  }
`

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
      icon: <HomeOutlined />,
      label: '首頁',
    },
    {
      key: '/uploader',
      icon: <UploadOutlined />,
      label: '碼表上傳',
    },
    {
      key: '/duplicate',
      icon: <DashboardOutlined />,
      label: '重碼分析',
    },
    {
      key: '/candidates',
      icon: <NumberOutlined />,
      label: '候選個數',
    },
    {
      key: '/speed-equiv',
      icon: <ThunderboltOutlined />,
      label: '速度當量',
    },
    {
      key: '/efficiency',
      icon: <RocketOutlined />,
      label: '簡碼效率',
    },
    {
      key: '/heatmap',
      icon: <FireOutlined />,
      label: '鍵位熱力',
    },
    {
      key: '/comparison',
      icon: <SwapOutlined />,
      label: '方案對比',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '設置',
    },
  ]

  const 當前路徑 = location.pathname

  return (
    <StyledSider collapsible collapsed={折疊狀態} trigger={null} width={200} theme="dark">
      <CollapseTrigger onClick={切換折疊}>
        {折疊狀態 ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      </CollapseTrigger>

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
