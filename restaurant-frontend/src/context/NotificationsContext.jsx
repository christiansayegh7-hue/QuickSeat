import { createContext, useContext, useEffect, useState } from 'react'
import api from '../lib/api'
import { useAuth } from './AuthContext'

const NotificationsContext = createContext(null)

const POLL_INTERVAL_MS = 30000

export function NotificationsProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  function refresh() {
    if (!isAuthenticated) return Promise.resolve()
    return api
      .get('/notifications/unread-count')
      .then(({ data }) => setUnreadCount(data.unread_count || 0))
      .catch(() => {})
  }

  useEffect(() => {
    if (!isAuthenticated) return

    refresh()
    const interval = setInterval(refresh, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  // Derived rather than reset via an effect: once signed out, the badge is
  // always 0 regardless of whatever was last fetched while signed in.
  const value = { unreadCount: isAuthenticated ? unreadCount : 0, refresh }

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used within a NotificationsProvider')
  return ctx
}
