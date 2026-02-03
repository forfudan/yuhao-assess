import { Card, Typography, Spin, Alert, Space, Statistic, Row, Col } from 'antd'
import { useCharFrequency, useCharsets } from '@/hooks/useDataLoaders'

const { Title, Paragraph, Text } = Typography

function HomePage() {
  const {
    data: charFreqData,
    loading: charFreqLoading,
    error: charFreqError,
  } = useCharFrequency('charFrequencySC')

  const { data: charsetsData, loading: charsetsLoading, error: charsetsError } = useCharsets()

  const isLoading = charFreqLoading || charsetsLoading
  const hasError = charFreqError || charsetsError

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Title level={2}>歡迎使用輸入法測評系統</Title>
        <Paragraph>這是基於 React 重構的新版本。本頁面展示數據加載功能。</Paragraph>
      </Card>

      {hasError && (
        <Alert
          message="數據加載錯誤"
          description={charFreqError || charsetsError}
          type="error"
          showIcon
        />
      )}

      {isLoading && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <Paragraph style={{ marginTop: 16 }}>正在加載數據...</Paragraph>
          </div>
        </Card>
      )}

      {!isLoading && !hasError && (
        <>
          {charFreqData && (
            <Card title="📊 字符頻率數據（簡體中文）">
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title="總字符數"
                    value={Object.keys(charFreqData).length}
                    suffix="個"
                  />
                </Col>
                <Col span={6}>
                  <Statistic title="「的」的頻率" value={charFreqData['的']} precision={2} />
                </Col>
                <Col span={6}>
                  <Statistic title="「一」的頻率" value={charFreqData['一']} precision={2} />
                </Col>
                <Col span={6}>
                  <Statistic title="「是」的頻率" value={charFreqData['是']} precision={2} />
                </Col>
              </Row>
              <Paragraph style={{ marginTop: 16 }}>
                <Text type="secondary">
                  數據來源：
                  {import.meta.env.DEV ? '本地 public/data/' : 'GitHub Pages CDN'}
                </Text>
              </Paragraph>
            </Card>
          )}

          {charsetsData && (
            <Card title="📚 字符集數據">
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title="可用字符集"
                    value={Object.keys(charsetsData).length}
                    suffix="個"
                  />
                </Col>
                {charsetsData['GB2312'] && (
                  <Col span={6}>
                    <Statistic
                      title="GB2312"
                      value={charsetsData['GB2312'].chars.length}
                      suffix="字"
                    />
                  </Col>
                )}
                {charsetsData['GBK'] && (
                  <Col span={6}>
                    <Statistic title="GBK" value={charsetsData['GBK'].chars.length} suffix="字" />
                  </Col>
                )}
                {charsetsData['通用規範漢字表'] && (
                  <Col span={6}>
                    <Statistic
                      title="通用規範漢字表"
                      value={charsetsData['通用規範漢字表'].chars.length}
                      suffix="字"
                    />
                  </Col>
                )}
              </Row>
            </Card>
          )}
        </>
      )}
    </Space>
  )
}

export default HomePage
