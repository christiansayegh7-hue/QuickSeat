import { createContext, useContext, useState } from 'react'
import api, { apiErrorMessage } from '../lib/api'

const AuthContext = createContext(null)

function readStoredUser() {
  const storedUser = localStorage.getItem('auth_user')
  const storedToken = localStorage.getItem('auth_token')
  if (!storedUser || !storedToken) return null
  try {
    return JSON.parse(storedUser)
  } catch {
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_token')
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)
  const loading = false

  function persistSession(data) {
    localStorage.setItem('auth_token', data.token)
    localStorage.setItem('auth_user', JSON.stringify(data.user))
    setUser(data.user)
  }

  async function login(email, password) {
    try {
      const { data } = await api.post('/login', { email, password })
      persistSession(data)
      return { success: true, user: data.user }
    } catch (error) {
      return { success: false, message: apiErrorMessage(error, 'Invalid email or password.') }
    }
  }

  async function register(name, email, password) {
    try {
      const { data } = await api.post('/register', { name, email, password })
      persistSession(data)
      return { success: true, user: data.user }
    } catch (error) {
      return { success: false, message: apiErrorMessage(error, 'Could not create your account.') }
    }
  }

  async function logout() {
    try {
      await api.post('/logout')
    } catch {
      // ignore network errors on logout
    }
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setUser(null)
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
