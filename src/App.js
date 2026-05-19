import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ConfigProvider, Spin, App as AntdApp } from 'antd'
import ptBR from 'antd/locale/pt_BR'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import PublicRoute from './components/PublicRoute'
import Login from './pages/Login/Login'
import PdvScreen from './pages/PdvScreen/PdvScreen'
import './App.css'

const motionEase = 'cubic-bezier(0.33, 1, 0.68, 1)'

const antTheme = {
  token: {
    fontFamily: "'Sora', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontWeight: 300,
    fontWeightStrong: 700,
    colorPrimary: '#1a4a2f',
    colorSuccess: '#1a4a2f',
    colorSuccessBg: '#e6ede8',
    colorSuccessBorder: '#d1e0d6',
    colorWarning: '#d97706',
    colorError: '#dc2626',
    colorText: '#0f172a',
    colorTextSecondary: '#64748b',
    colorBorder: '#e2e8f0',
    colorBgContainer: '#ffffff',
    borderRadiusLG: 12,
    borderRadius: 10,
    motionDurationFast: '0.16s',
    motionDurationMid: '0.32s',
    motionDurationSlow: '0.42s',
    motionEaseInOut: motionEase,
    motionEaseOut: motionEase,
  },
  components: {
    Button: {
      primaryColor: '#ffffff',
      colorPrimary: '#1a4a2f',
      colorPrimaryHover: '#235a38',
      colorPrimaryActive: '#153f28',
      controlHeightLG: 48,
      fontWeight: 700,
    },
    Card: {
      headerFontSize: 15,
    },
    Input: {
      activeBorderColor: '#1a4a2f',
      hoverBorderColor: '#235a38',
    },
    Select: {
      optionSelectedBg: '#e6ede8',
      optionSelectedColor: '#0f172a',
      optionSelectedFontWeight: 700,
    },
  },
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 16,
          minHeight: '100vh',
          background: '#f4f1e8',
        }}
      >
        <Spin size="large" />
        <span style={{ color: '#667085', fontSize: 15 }}>Carregando…</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <PdvScreen />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ConfigProvider locale={ptBR} theme={antTheme}>
      <AntdApp>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  )
}
