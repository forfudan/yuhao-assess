import { Outlet } from 'react-router-dom'
import { Layout } from 'antd'
import styled from 'styled-components'

const { Header, Content, Footer } = Layout

const StyledLayout = styled(Layout)`
  min-height: 100vh;
`

const StyledHeader = styled(Header)`
  background: #fff;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`

const StyledContent = styled(Content)`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
`

const StyledFooter = styled(Footer)`
  text-align: center;
`

function MainLayout() {
  return (
    <StyledLayout>
      <StyledHeader>
        <h1>輸入法測評系統</h1>
      </StyledHeader>
      <StyledContent>
        <Outlet />
      </StyledContent>
      <StyledFooter>輸入法測評系統 ©2024</StyledFooter>
    </StyledLayout>
  )
}

export default MainLayout
