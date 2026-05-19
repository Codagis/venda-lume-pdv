import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { login as apiLogin, fetchMe, logoutApi } from '../services/api'
import { hasStoredSession, getAccessToken } from '../auth/authStorage'
import { setSessionExpiredHandler } from '../auth/authSession'
import { userCanAccessPdvSync, userHasSalesModule } from '../auth/pdvAccess'
import { listModules } from '../services/moduleService'

const AuthContext = createContext(null)

const PDV_ACCESS_DENIED_MESSAGE =
  'Seu usuário não tem permissão para o PDV. É necessário perfil Operador/Caixa ou permissão de registrar vendas.'

async function resolvePdvAccess(user) {
  if (userCanAccessPdvSync(user)) return true
  try {
    const modules = await listModules()
    return userHasSalesModule(modules)
  } catch {
    return false
  }
}

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const sessionEpochRef = useRef(0)

  const clearAuthState = useCallback(() => {
    setUser(null)
    setIsAuthenticated(false)
  }, [])

  const applySession = useCallback(
    async (me, epoch) => {
      if (epoch !== sessionEpochRef.current) return false
      const allowed = await resolvePdvAccess(me)
      if (epoch !== sessionEpochRef.current) return false
      if (!allowed) {
        try {
          await logoutApi()
        } catch (_) {}
        clearAuthState()
        return false
      }
      setUser(me)
      setIsAuthenticated(true)
      return true
    },
    [clearAuthState],
  )

  const loadSession = useCallback(async () => {
    const epoch = ++sessionEpochRef.current
    if (!hasStoredSession()) {
      clearAuthState()
      setLoading(false)
      return
    }
    try {
      const me = await fetchMe()
      if (epoch !== sessionEpochRef.current) return
      if (!me) {
        clearAuthState()
        return
      }
      await applySession(me, epoch)
    } catch {
      if (epoch === sessionEpochRef.current) {
        clearAuthState()
      }
    } finally {
      if (epoch === sessionEpochRef.current) {
        setLoading(false)
      }
    }
  }, [applySession, clearAuthState])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  useEffect(() => {
    setSessionExpiredHandler(() => {
      sessionEpochRef.current += 1
      clearAuthState()
      navigate('/login', { replace: true })
    })
    return () => setSessionExpiredHandler(null)
  }, [clearAuthState, navigate])

  const login = useCallback(
    async (credentials) => {
      const { username, password } = credentials
      if (!username?.trim() || !password?.trim()) {
        throw new Error('Usuário e senha são obrigatórios.')
      }

      const epoch = ++sessionEpochRef.current

      const response = await apiLogin(username.trim(), password)
      if (!getAccessToken()) {
        try {
          await logoutApi()
        } catch (_) {}
        throw new Error('Falha ao iniciar sessão. Tente novamente.')
      }

      const me = response?.user || (await fetchMe())
      if (!me) {
        try {
          await logoutApi()
        } catch (_) {}
        throw new Error('Usuário ou senha inválidos.')
      }

      const allowed = await resolvePdvAccess(me)
      if (epoch !== sessionEpochRef.current) return

      if (!allowed) {
        try {
          await logoutApi()
        } catch (_) {}
        clearAuthState()
        throw new Error(PDV_ACCESS_DENIED_MESSAGE)
      }

      setUser(me)
      setIsAuthenticated(true)
    },
    [clearAuthState],
  )

  const logout = useCallback(async () => {
    sessionEpochRef.current += 1
    clearAuthState()
    try {
      await logoutApi()
    } catch (_) {}
  }, [clearAuthState])

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading,
    refreshUser: loadSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
