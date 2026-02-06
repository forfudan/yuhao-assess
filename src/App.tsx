import { useEffect } from 'react'
import { useRoutes } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import HomePage from './pages/HomePage'
import ProcessTablePage from './pages/ProcessTablePage'
import StaticDuplicateAnalysisPage from './pages/StaticDuplicateAnalysisPage'
import DynamicDuplicateAnalysisPage from './pages/DynamicDuplicateAnalysisPage'
import MaximumCandidatesPage from './pages/MaximumCandidatesPage'
import SpeedEquivalentPage from './pages/SpeedEquivalentPage'
import ShortCodeEfficiencyPage from './pages/ShortCodeEfficiencyPage'
import KeyboardHeatmapPage from './pages/KeyboardHeatmapPage'
import ComparisonPage from './pages/ComparisonPage'
import SettingsPage from './pages/SettingsPage'
import { ThemeProvider } from './components/ThemeProvider'
import { 數據預加載服務類别 } from './services/dataPreloadService'

const routes = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: '/process',
        element: <ProcessTablePage />,
      },
      {
        path: '/static',
        element: <StaticDuplicateAnalysisPage />,
      },
      {
        path: '/dynamic',
        element: <DynamicDuplicateAnalysisPage />,
      },
      {
        path: '/candidates',
        element: <MaximumCandidatesPage />,
      },
      {
        path: '/speed',
        element: <SpeedEquivalentPage />,
      },
      {
        path: '/efficiency',
        element: <ShortCodeEfficiencyPage />,
      },
      {
        path: '/heatmap',
        element: <KeyboardHeatmapPage />,
      },
      {
        path: '/comparison',
        element: <ComparisonPage />,
      },
      {
        path: '/settings',
        element: <SettingsPage />,
      },
    ],
  },
]

// 定義所有分析頁面路徑，用於編譯時檢查
const 分析頁面路徑 = [
  '/dynamic',
  '/static',
  '/candidates',
  '/speed',
  '/efficiency',
  '/heatmap',
] as const

export type 分析頁面路徑型别 = (typeof 分析頁面路徑)[number]

function App() {
  const element = useRoutes(routes)

  // 應用啓動時預加載數據
  useEffect(() => {
    數據預加載服務類别.啓動預加載()
  }, [])

  return <ThemeProvider>{element}</ThemeProvider>
}

export default App
