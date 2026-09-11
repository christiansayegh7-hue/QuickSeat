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

  async function login(email, password, loginAs = 'customer') {
    try {
      const { data } = await api.post('/login', { email, password, login_as: loginAs })
      persistSession(data)
      return { success: true, user: data.user }
    } catch (error) {
      return { success: false, message: apiErrorMessage(error, 'Invalid email or password.') }
    }
  }

  async function sendEmailOtp(email) {
    try {
      const { data } = await api.post('/email/otp/send', { email })
      return { success: true, message: data.message }
    } catch (error) {
      return { success: false, message: apiErrorMessage(error, 'Could not send the verification code.') }
    }
  }

  async function verifyEmailOtp(email, code) {
    try {
      const { data } = await api.post('/email/otp/verify', { email, code })
      return { success: true, message: data.message }
    } catch (error) {
      return { success: false, message: apiErrorMessage(error, 'Could not verify the code.') }
    }
  }

  async function register(payload) {
    try {
      const { data } = await api.post('/register', payload)
      persistSession(data)
      return { success: true, user: data.user, message: data.message, pending: payload.account_type === 'restaurant' }
    } catch (error) {
      return { success: false, message: apiErrorMessage(error, 'Could not create your account.'), errors: error?.response?.data?.errors }
    }
  }

  async function changePassword(currentPassword, newPassword) {
    try {
      const { data } = await api.patch('/profile/password', {
        current_password: currentPassword,
        new_password: newPassword,
      })
      return { success: true, message: data.message }
    } catch (error) {
      return { success: false, message: apiErrorMessage(error, 'Could not change your password.') }
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
    isManager: user?.role === 'restaurant',
    login,
    register,
    sendEmailOtp,
    verifyEmailOtp,
    changePassword,
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
