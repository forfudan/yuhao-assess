import { Card, Typography } from 'antd'

const { Title, Paragraph } = Typography

function HomePage() {
  return (
    <Card>
      <Title level={2}>歡迎使用宇浩輸入法評測系統</Title>
      <Paragraph>這是基於 React 重構的新版本，功能正在遷移中...</Paragraph>
    </Card>
  )
}

export default HomePage
