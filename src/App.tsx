import { useEffect } from 'react'
import { useRoutes } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import HomePage from './pages/HomePage'
import ProcessTablePage from './pages/ProcessTablePage'
import DuplicateAnalysisPage from './pages/DuplicateAnalysisPage'
import MaximumCandidatesPage from './pages/MaximumCandidatesPage'
import SpeedEquivalentPage from './pages/SpeedEquivalentPage'
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
        path: '/duplicate',
        element: <DuplicateAnalysisPage />,
      },
      {
        path: '/candidates',
        element: <MaximumCandidatesPage />,
      },
      {
        path: '/speed',
        element: <SpeedEquivalentPage />,
      },
    ],
  },
]

function App() {
  const element = useRoutes(routes)

  // 應用啓動時預加載數據
  useEffect(() => {
    數據預加載服務類别.啓動預加載()
  }, [])

  return element
}

export default App
