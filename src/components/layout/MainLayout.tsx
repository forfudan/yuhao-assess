import { Outlet } from 'react-router-dom'
import { Layout } from 'antd'
import styled from 'styled-components'
import { Sidebar } from './Sidebar'

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

  h1 {
    margin: 0;
    color: white;
    font-size: 20px;
    font-weight: 500;
  }
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

function MainLayout() {
  return (
    <StyledLayout>
      <Sidebar />
      <Layout>
        <StyledHeader>
          <h1>輸入法測評系統</h1>
        </StyledHeader>
        <StyledContent>
          <ContentInner>
            <Outlet />
          </ContentInner>
        </StyledContent>
        <StyledFooter>輸入法測評系統 © {new Date().getFullYear()}</StyledFooter>
      </Layout>
    </StyledLayout>
  )
}

export default MainLayout
