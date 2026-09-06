import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import api from '../lib/api'
import { useNotifications } from '../context/NotificationsContext'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const { refresh } = useNotifications()

  function fetchNotifications() {
    return api
      .get('/notifications')
      .then(({ data }) => setNotifications(data.notifications || []))
      .finally(() => setLoading(false))
  }

  function reload() {
    setLoading(true)
    fetchNotifications()
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  async function markRead(id) {
    setNotifications((list) => list.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    try {
      await api.patch(`/notifications/${id}/read`)
      refresh()
    } catch {
      reload()
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-serif text-3xl font-bold text-olive-950">Notifications</h1>
      <p className="mt-1 text-olive-600">Stay up to date with your reservations.</p>

      {loading ? (
        <div className="mt-8 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-olive-100" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="mt-10 rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-olive-100">
          <BellOff className="mx-auto mb-3 text-olive-300" size={36} />
          <p className="text-olive-600">You're all caught up. No notifications yet.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              className={`flex w-full items-start gap-3 rounded-xl p-4 text-left shadow-sm ring-1 transition ${
                n.is_read ? 'bg-white ring-olive-100' : 'bg-olive-50 ring-olive-200'
              }`}
            >
              <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${n.is_read ? 'bg-olive-100 text-olive-500' : 'bg-olive-800 text-white'}`}>
                <Bell size={14} />
              </span>
              <span>
                <span className="block text-sm text-olive-900">{n.message}</span>
                <span className="mt-1 block text-xs uppercase tracking-wide text-olive-400">{n.type}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
