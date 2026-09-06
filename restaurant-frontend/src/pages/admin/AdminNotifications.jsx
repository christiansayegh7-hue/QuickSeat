import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import api from '../../lib/api'
import { useNotifications } from '../../context/NotificationsContext'

export default function AdminNotifications() {
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
    <div className="space-y-4">
      <h2 className="font-serif text-xl font-bold text-olive-950">Notifications</h2>

      {loading ? (
        <p className="text-olive-500">Loading...</p>
      ) : notifications.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-olive-500 ring-1 ring-olive-100">No notifications.</p>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              className={`flex w-full items-start gap-3 rounded-xl p-4 text-left shadow-sm ring-1 ${
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
