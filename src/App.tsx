import { useRoutes } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import HomePage from './pages/HomePage'
import ProcessTablePage from './pages/ProcessTablePage'
import DuplicateAnalysisPage from './pages/DuplicateAnalysisPage'

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
        path: '/process-table',
        element: <ProcessTablePage />,
      },
      {
        path: '/duplicate',
        element: <DuplicateAnalysisPage />,
      },
    ],
  },
]

function App() {
  const element = useRoutes(routes)
  return element
}

export default App
