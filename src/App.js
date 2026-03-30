import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, Spin } from 'antd'
import ptBR from 'antd/locale/pt_BR'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import PdvScreen from './pages/PdvScreen'
import './App.css'

const antTheme = {
  token: {
    colorPrimary: '#0d9488',
    colorSuccess: '#16a34a',
    colorWarning: '#d97706',
    colorError: '#dc2626',
    borderRadiusLG: 12,
    borderRadius: 10,
    fontFamily: "'Urbanist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  components: {
    Button: {
      controlHeightLG: 48,
      fontWeight: 600,
    },
    Card: {
      headerFontSize: 15,
    },
    Input: {
      activeBorderColor: '#0d9488',
      hoverBorderColor: '#14b8a6',
    },
    Select: {
      optionSelectedBg: 'rgba(13, 148, 136, 0.12)',
    },
  },
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

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
          background: '#f2f4f7',
        }}
      >
        <Spin size="large" />
        <span style={{ color: '#64748b', fontSize: 15 }}>Carregando…</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: { pathname: '/' } }} />
  }

  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
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
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  )
}
