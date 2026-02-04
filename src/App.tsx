import { useRoutes } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import HomePage from './pages/HomePage'
import ProcessTablePage from './pages/ProcessTablePage'
import DuplicateAnalysisPage from './pages/DuplicateAnalysisPage'
import MaximumCandidatesPage from './pages/MaximumCandidatesPage'
import SpeedEquivalentPage from './pages/SpeedEquivalentPage'

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
  return element
}

export default App
