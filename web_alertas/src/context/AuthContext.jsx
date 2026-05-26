import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import {
  login as apiLogin,
  logout as apiLogout,
  fetchMe,
  getStoredUser,
  getStoredToken,
} from '../api/auth'
import { isAuthority } from '../config/roles'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken())
  const [user, setUser] = useState(() => getStoredUser())
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(!!getStoredToken())

  const role = user?.role ?? null
  const isAdmin = isAuthority(role)

  const refreshUser = useCallback(async () => {
    const me = await fetchMe()
    if (me) {
      setUser(me)
      setToken(getStoredToken())
    } else {
      setUser(null)
      setToken(null)
    }
    return me
  }, [])

  useEffect(() => {
    if (!getStoredToken()) {
      setBootstrapping(false)
      return
    }
    refreshUser().finally(() => setBootstrapping(false))
  }, [refreshUser])

  const login = useCallback(async (phone, password) => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiLogin(phone, password)
      setToken(data.access_token)
      setUser(data.user ?? (await fetchMe()))
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    apiLogout()
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role,
        isAuthenticated: !!token,
        isAdmin,
        login,
        logout,
        refreshUser,
        error,
        loading,
        bootstrapping,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
