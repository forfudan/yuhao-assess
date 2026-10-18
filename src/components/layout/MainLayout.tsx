import { Outlet } from 'react-router-dom'
import { Layout, Spin } from 'antd'
import { useAtomValue } from 'jotai'
import styled from 'styled-components'
import { Sidebar } from './Sidebar'
import { AppHeader } from './AppHeader'
import { useLocalSchemeSyncMetrics } from '@/hooks/useLocalSchemeSyncMetrics'
import { 頂欄方案載入名原子狀態 } from '@/atoms/scheme'

const { Header, Content, Footer } = Layout

const StyledLayout = styled(Layout)`
  min-height: 100vh;
`

const StyledHeader = styled(Header)`
  background: #001529;
  color: white;
  padding: 0 24px;
  display: flex;
  align-items: center;
  height: 56px;
  line-height: 56px;
`

const StyledContent = styled(Content)`
  padding: 24px;
  background: #f0f2f5;
  overflow: auto;
`

const ContentInner = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
`

const StyledFooter = styled(Footer)`
  text-align: center;
  background: #f0f2f5;
  color: rgba(0, 0, 0, 0.45);
`

const MainColumn = styled(Layout)`
  position: relative;
`

/* 蓋住頂欄以下的主欄，側欄和頂欄留在外面。
   内層用 sticky 把轉圈釘在當前視口正中，長頁面滚下去也能看見。 */
const SchemeLoadingMask = styled.div`
  position: absolute;
  z-index: 20;
  top: 56px;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(255, 255, 255, 0.72);
`

const SchemeLoadingContent = styled.div`
  position: sticky;
  top: 56px;
  height: calc(100vh - 56px);
  max-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: rgba(0, 0, 0, 0.65);
`

function MainLayout() {
  useLocalSchemeSyncMetrics()
  const 頂欄方案載入名 = useAtomValue(頂欄方案載入名原子狀態)

  return (
    <StyledLayout>
      <Sidebar />
      <MainColumn>
        <StyledHeader>
          <AppHeader />
        </StyledHeader>
        <StyledContent>
          <ContentInner>
            <Outlet />
          </ContentInner>
        </StyledContent>
        <StyledFooter>宇浩漢字輸入法測評系統 © {new Date().getFullYear()}</StyledFooter>
        {頂欄方案載入名 && (
          <SchemeLoadingMask>
            <SchemeLoadingContent>
              <Spin size="large" />
              <div>正在載入方案「{頂欄方案載入名}」</div>
            </SchemeLoadingContent>
          </SchemeLoadingMask>
        )}
      </MainColumn>
    </StyledLayout>
  )
}

export default MainLayout
