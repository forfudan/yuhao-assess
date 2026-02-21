/* eslint-env browser */
import {
  Typography,
  Button,
  Space,
  Select,
  Input,
  InputNumber,
  Checkbox,
  message,
  Upload,
  Tag,
  Alert,
} from 'antd'
import {
  DownloadOutlined,
  UploadOutlined,
  PlusOutlined,
  ReloadOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons'
import { useAtom, useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { 當前方案原子狀態, 方案列表原子狀態 } from '@/atoms/scheme'
import { 動態選重分析原子狀態 } from '@/atoms/dynamicDuplicate'
import { 靜態重碼分析原子狀態 } from '@/atoms/staticDuplicate'
import { 候選個數分析原子狀態 } from '@/atoms/maximumCandidates'
import { 速度當量分析原子狀態 } from '@/atoms/speedEquivalent'
import { 簡碼效率分析原子狀態 } from '@/atoms/shortCodeEfficiency'
import { 鍵位熱力分析原子狀態 } from '@/atoms/keyboardHeatmap'
import { 碼表原子狀態, 原始碼表原子狀態, 編碼預覽數據原子狀態 } from '@/atoms/codeTable'
import { 加載方案, 列出可用方案, 從JSON導入, 創建空白方案 } from '@/services/schemeService'
import { 清空所有Atom, type AtomSetters } from '@/services/atomResetService'
import { useDataPreload } from '@/hooks/useDataPreload'
import type { 方案配置介面 } from '@/types/scheme'
import type { UploadFile } from 'antd'

const { Paragraph, Text } = Typography
const { Option } = Select
const { TextArea } = Input

function HomePage() {
  const [當前方案, 設置當前方案] = useAtom(當前方案原子狀態)
  const [方案列表, 設置方案列表] = useAtom(方案列表原子狀態)
  const [動態選重分析結果, 設置動態選重分析結果] = useAtom(動態選重分析原子狀態)
  const [靜態重碼分析結果, 設置靜態重碼分析結果] = useAtom(靜態重碼分析原子狀態)
  const [候選個數分析結果, 設置候選個數分析結果] = useAtom(候選個數分析原子狀態)
  const [速度當量分析結果, 設置速度當量分析結果] = useAtom(速度當量分析原子狀態)
  const [簡碼效率分析結果, 設置簡碼效率分析結果] = useAtom(簡碼效率分析原子狀態)
  const [鍵位熱力分析結果, 設置鍵位熱力分析結果] = useAtom(鍵位熱力分析原子狀態)
  const 設置碼表數據 = useSetAtom(碼表原子狀態)
  const 設置原始碼表 = useSetAtom(原始碼表原子狀態)
  const 設置編碼預覽數據 = useSetAtom(編碼預覽數據原子狀態)
  const [加載中, 設置加載中] = useState(false)

  // 清空所有 atom 狀態（統一函數）
  const 清空所有原子狀態 = () => {
    清空所有Atom({
      設置碼表數據,
      設置原始碼表,
      設置編碼預覽數據,
      設置靜態重碼分析結果,
      設置動態選重分析結果,
      設置候選個數分析結果,
      設置速度當量分析結果,
      設置簡碼效率分析結果,
      設置鍵位熱力分析結果,
    })
  }

  // 使用數據預加載狀態
  const {
    isLoading: 數據加載中,
    isReady: 核心數據已加載,
    allLoaded: 所有數據已加載,
  } = useDataPreload()

  // 共用：處理方案數據（從JSON導入或加載預設方案）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const 處理方案數據 = (導入數據: any, 來源: string) => {
    // 先清空所有 atom
    清空所有原子狀態()

    // 分離方案配置和測評結果
    const { 測評結果, ...方案配置 } = 導入數據

    // 從測評結果中讀取分析數據
    const 數據中的動態選重結果 = 測評結果?.動態選重分析
    const 數據中的靜態重碼結果 = 測評結果?.靜態重碼分析
    const 數據中的候選個數結果 = 測評結果?.候選個數分析
    const 數據中的速度當量結果 = 測評結果?.速度當量分析
    const 數據中的簡碼效率結果 = 測評結果?.簡碼效率分析
    const 數據中的鍵位熱力結果 = 測評結果?.鍵位熱力

    // 驗證方案配置
    const 方案 = 從JSON導入(JSON.stringify(方案配置))
    設置當前方案(方案)

    // 如果有分析結果，寫入 atom
    const 有動態選重結果 = !!數據中的動態選重結果
    const 有靜態重碼結果 = !!數據中的靜態重碼結果
    const 有候選個數結果 = !!數據中的候選個數結果
    const 有速度當量結果 = !!數據中的速度當量結果
    const 有簡碼效率結果 = !!數據中的簡碼效率結果
    const 有鍵位熱力結果 = !!數據中的鍵位熱力結果

    if (有動態選重結果) {
      設置動態選重分析結果(數據中的動態選重結果)
    } else {
      設置動態選重分析結果(null)
    }

    if (有靜態重碼結果) {
      設置靜態重碼分析結果(數據中的靜態重碼結果)
    } else {
      設置靜態重碼分析結果(null)
    }

    if (有候選個數結果) {
      設置候選個數分析結果(數據中的候選個數結果)
    } else {
      設置候選個數分析結果(null)
    }

    if (有速度當量結果) {
      設置速度當量分析結果(數據中的速度當量結果)
    } else {
      設置速度當量分析結果(null)
    }

    if (有簡碼效率結果) {
      設置簡碼效率分析結果(數據中的簡碼效率結果)
    } else {
      設置簡碼效率分析結果(null)
    }

    if (有鍵位熱力結果) {
      設置鍵位熱力分析結果(數據中的鍵位熱力結果)
    } else {
      設置鍵位熱力分析結果(null)
    }

    const 結果提示 = [
      有動態選重結果 && '動態選重分析',
      有靜態重碼結果 && '靜態重碼分析',
      有候選個數結果 && '候選個數分析',
      有速度當量結果 && '速度當量分析',
      有簡碼效率結果 && '簡碼效率分析',
      有鍵位熱力結果 && '鍵位熱力分析',
    ]
      .filter(Boolean)
      .join('、')
    const 完整提示 = 結果提示 ? `（包含${結果提示}結果）` : ''
    message.success(`已加載方案「${方案.元數據.方案名}」${完整提示}`)
  }

  // 初始化：加載可用方案列表
  useEffect(() => {
    async function 初始化方案列表() {
      try {
        const 方案鍵名列表 = await 列出可用方案()
        const 加載的方案列表 = await Promise.all(
          方案鍵名列表.map(async 鍵名 => {
            try {
              const 方案 = await 加載方案(鍵名)
              return 方案
            } catch (錯誤) {
              console.error(`❌ [HomePage] 方案 ${鍵名} 加載失敗:`, 錯誤)
              return null
            }
          })
        )
        const 過濾後的方案列表 = 加載的方案列表.filter(
          (方案): 方案 is 方案配置介面 => 方案 !== null
        )
        設置方案列表(過濾後的方案列表)
      } catch (錯誤) {
        console.error('❌ [HomePage] 加載方案列表失敗:', 錯誤)
        message.error('加載方案列表失敗')
      }
    }
    初始化方案列表()
  }, [設置方案列表])

  // 加載預設方案
  const 處理選擇方案 = async (方案鍵名: string) => {
    設置加載中(true)
    try {
      const 加載的數據 = await 加載方案(方案鍵名)
      處理方案數據(加載的數據, 'schemes')
    } catch (錯誤) {
      console.error('[HomePage] 加載方案失敗:', 錯誤)
      message.error(錯誤 instanceof Error ? 錯誤.message : '加載方案失敗')
    } finally {
      設置加載中(false)
    }
  }

  // 更新元數據字段
  const 更新元數據 = (字段名: keyof 方案配置介面['元數據'], 值: string) => {
    if (!當前方案) return
    設置當前方案({
      ...當前方案,
      元數據: {
        ...當前方案.元數據,
        [字段名]: 值,
        更新時間: new Date().toISOString(),
      },
    })
  }

  // 更新方案參數字段
  const 更新方案參數 = <K extends keyof 方案配置介面['方案參數']>(
    字段名: K,
    值: 方案配置介面['方案參數'][K]
  ) => {
    if (!當前方案) return
    設置當前方案({
      ...當前方案,
      方案參數: {
        ...當前方案.方案參數,
        [字段名]: 值,
      },
      元數據: {
        ...當前方案.元數據,
        更新時間: new Date().toISOString(),
      },
    })
  }

  // 添加標籤
  const 添加標籤 = (標籤: string) => {
    if (!當前方案 || !標籤.trim()) return
    const 當前標籤 = 當前方案.元數據.標籤 || []
    if (當前標籤.includes(標籤.trim())) {
      message.warning('標籤已存在')
      return
    }
    更新元數據('標籤', [...當前標籤, 標籤.trim()] as never)
  }

  // 删除標籤
  const 删除標籤 = (索引: number) => {
    if (!當前方案) return
    const 新標籤 = [...(當前方案.元數據.標籤 || [])]
    新標籤.splice(索引, 1)
    更新元數據('標籤', 新標籤 as never)
  }

  // 添加相關資源鏈接
  const 添加相關資源鏈接 = (鏈接: string) => {
    if (!當前方案 || !鏈接.trim()) return
    const 當前鏈接列表 = 當前方案.元數據.相關資源鏈接 || []
    if (當前鏈接列表.includes(鏈接.trim())) {
      message.warning('鏈接已存在')
      return
    }
    更新元數據('相關資源鏈接', [...當前鏈接列表, 鏈接.trim()] as never)
  }

  // 删除相關資源鏈接
  const 删除相關資源鏈接 = (索引: number) => {
    if (!當前方案) return
    const 新鏈接列表 = [...(當前方案.元數據.相關資源鏈接 || [])]
    新鏈接列表.splice(索引, 1)
    更新元數據('相關資源鏈接', 新鏈接列表 as never)
  }

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%', padding: '24px' }}>
      {/* 方案選擇 */}
      <div>
        <Text type="secondary" style={{ marginRight: 12 }}>
          選擇預設方案：
        </Text>
        <Select
          style={{ width: 300 }}
          placeholder="選擇預設方案"
          loading={加載中}
          onChange={處理選擇方案}
          value={當前方案?.元數據.標識符}
        >
          {方案列表.map(方案 => (
            <Option key={方案.元數據.標識符} value={方案.元數據.標識符}>
              {方案.元數據.方案名}
            </Option>
          ))}
        </Select>
      </div>

      {/* 當前方案配置（可編輯） */}
      {當前方案 && (
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          {/* 元數據 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div>
              <Text type="secondary">方案名</Text>
              <Input
                value={當前方案.元數據.方案名}
                onBlur={e => 更新元數據('方案名', e.target.value)}
                onChange={e =>
                  設置當前方案({
                    ...當前方案,
                    元數據: { ...當前方案.元數據, 方案名: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Text type="secondary">標識符</Text>
              <Input
                value={當前方案.元數據.標識符}
                onBlur={e => 更新元數據('標識符', e.target.value)}
                onChange={e =>
                  設置當前方案({
                    ...當前方案,
                    元數據: { ...當前方案.元數據, 標識符: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Text type="secondary">作者</Text>
              <Input
                value={當前方案.元數據.作者 || ''}
                placeholder="可選"
                onBlur={e => 更新元數據('作者', e.target.value)}
                onChange={e =>
                  設置當前方案({
                    ...當前方案,
                    元數據: { ...當前方案.元數據, 作者: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Text type="secondary">版本</Text>
              <Input
                value={當前方案.元數據.版本}
                onBlur={e => 更新元數據('版本', e.target.value)}
                onChange={e =>
                  設置當前方案({
                    ...當前方案,
                    元數據: { ...當前方案.元數據, 版本: e.target.value },
                  })
                }
              />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <Text type="secondary">官網</Text>
              <Input
                value={當前方案.元數據.官網 || ''}
                placeholder="可選"
                onBlur={e => 更新元數據('官網', e.target.value)}
                onChange={e =>
                  設置當前方案({
                    ...當前方案,
                    元數據: { ...當前方案.元數據, 官網: e.target.value },
                  })
                }
              />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <Text type="secondary">相關資源鏈接</Text>
              <div style={{ marginTop: '8px' }}>
                {(當前方案.元數據.相關資源鏈接 || []).map((鏈接, index) => (
                  <div key={index} style={{ display: 'flex', marginBottom: '8px', gap: '8px' }}>
                    <Input
                      value={鏈接}
                      onChange={e => {
                        const 新鏈接列表 = [...(當前方案.元數據.相關資源鏈接 || [])]
                        新鏈接列表[index] = e.target.value
                        設置當前方案({
                          ...當前方案,
                          元數據: { ...當前方案.元數據, 相關資源鏈接: 新鏈接列表 },
                        })
                      }}
                      onBlur={e => {
                        const 新鏈接列表 = [...(當前方案.元數據.相關資源鏈接 || [])]
                        新鏈接列表[index] = e.target.value
                        更新元數據('相關資源鏈接', 新鏈接列表 as never)
                      }}
                    />
                    <Button danger onClick={() => 删除相關資源鏈接(index)}>
                      删除
                    </Button>
                  </div>
                ))}
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    const 鏈接 = prompt('輸入資源鏈接：')
                    if (鏈接) 添加相關資源鏈接(鏈接)
                  }}
                  style={{ width: '100%' }}
                >
                  添加鏈接
                </Button>
              </div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <Text type="secondary">碼表下載鏈接</Text>
              <Input
                value={當前方案.元數據.碼表下載鏈接 || ''}
                placeholder="可選"
                onBlur={e => 更新元數據('碼表下載鏈接', e.target.value)}
                onChange={e =>
                  設置當前方案({
                    ...當前方案,
                    元數據: { ...當前方案.元數據, 碼表下載鏈接: e.target.value },
                  })
                }
              />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <Text type="secondary">描述</Text>
              <TextArea
                value={當前方案.元數據.描述 || ''}
                placeholder="可選"
                rows={2}
                onBlur={e => 更新元數據('描述', e.target.value)}
                onChange={e =>
                  設置當前方案({
                    ...當前方案,
                    元數據: { ...當前方案.元數據, 描述: e.target.value },
                  })
                }
              />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <Text type="secondary">標籤</Text>
              <Space wrap style={{ marginTop: '8px' }}>
                {(當前方案.元數據.標籤 || []).map((標籤, index) => (
                  <Tag
                    key={index}
                    closable
                    onClose={() => 删除標籤(index)}
                    style={{ marginBottom: '4px' }}
                  >
                    {標籤}
                  </Tag>
                ))}
                <Tag
                  icon={<PlusCircleOutlined />}
                  style={{ cursor: 'pointer', marginBottom: '4px' }}
                  onClick={() => {
                    const 標籤 = prompt('輸入新標籤：')
                    if (標籤) 添加標籤(標籤)
                  }}
                >
                  添加標籤
                </Tag>
              </Space>
            </div>
          </div>

          {/* 方案參數 */}
          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <Text type="secondary">編碼終止指示符（直接連寫，可選）</Text>
                <Input
                  value={(當前方案.方案參數.編碼終止指示符列表 || []).join('')}
                  placeholder="例如：aoeiu_"
                  onBlur={e => {
                    const 指示符 = e.target.value.trim().split('')
                    更新方案參數('編碼終止指示符列表', 指示符.length > 0 ? 指示符 : undefined)
                  }}
                  onChange={e =>
                    設置當前方案({
                      ...當前方案,
                      方案參數: {
                        ...當前方案.方案參數,
                        編碼終止指示符列表: e.target.value.trim().split(''),
                      },
                    })
                  }
                />
              </div>
              <div>
                <Text type="secondary">最大碼長</Text>
                <InputNumber
                  value={當前方案.方案參數.最大碼長}
                  min={1}
                  max={10}
                  style={{ width: '100%' }}
                  onBlur={() => {}}
                  onChange={值 => 更新方案參數('最大碼長', 值 as number)}
                />
              </div>
            </div>
          </div>

          {/* 碼表元數據 */}
          {當前方案.碼表元數據 && (
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {當前方案.碼表元數據.總字符數 && (
                  <div>
                    <Text type="secondary">總字符數（已解析）</Text>
                    <Input value={當前方案.碼表元數據.總字符數.toLocaleString()} disabled />
                  </div>
                )}
                {當前方案.碼表元數據.哈希值 && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <Text type="secondary">哈希值（SHA-256）</Text>
                    <Input value={當前方案.碼表元數據.哈希值} disabled />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 時間戳（只讀） */}
          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
            <Space>
              <Text type="secondary">
                創建時間：{new Date(當前方案.元數據.創建時間).toLocaleString('zh-CN')}
              </Text>
              <Text type="secondary">
                更新時間：{new Date(當前方案.元數據.更新時間).toLocaleString('zh-CN')}
              </Text>
            </Space>
          </div>
        </Space>
      )}

      {/* 提示信息 */}
      {!當前方案 && <Paragraph type="secondary">請選擇或創建方案以開始測評</Paragraph>}

      {/* 數據加載狀態提示 */}
      {數據加載中 && (
        <Alert
          title="正在加載字頻數據..."
          description="首次訪問需要從CDN下載數據文件，請稍候。後續訪問會使用瀏覽器緩存，速度更快。"
          type="info"
          showIcon
        />
      )}
      {核心數據已加載 && !所有數據已加載 && (
        <Alert
          title="正在後台加載擴展數據..."
          description="核心功能已可用，擴展數據（字頻）正在後台加載。"
          type="info"
          showIcon
          closable
        />
      )}
      {所有數據已加載 && (
        <Alert
          title="✅ 所有輔助數據加載完畢！"
          description="系統已就緒，所有字頻數據和字符集已成功加載。您可以開始使用所有功能。"
          type="success"
          showIcon
          closable
        />
      )}
    </Space>
  )
}

export default HomePage
