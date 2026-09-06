import { useEffect, useState } from 'react'
import { ShieldCheck, Store } from 'lucide-react'
import api, { apiErrorMessage } from '../../lib/api'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  function fetchUsers() {
    return api
      .get('/admin/users')
      .then(({ data }) => setUsers(data.users || []))
      .finally(() => setLoading(false))
  }

  function reload() {
    setLoading(true)
    fetchUsers()
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  async function toggleBlock(user) {
    setError('')
    setBusyId(user.id)
    try {
      const action = user.is_blocked ? 'unblock' : 'block'
      await api.patch(`/admin/users/${user.id}/${action}`)
      reload()
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not update this user.'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-xl font-bold text-olive-950">Users</h2>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-olive-100">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-olive-100 text-xs uppercase tracking-wide text-olive-400">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Reservations</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-olive-50">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-olive-400">Loading...</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-olive-900">{u.name}</td>
                  <td className="px-4 py-3 text-olive-700">{u.email}</td>
                  <td className="px-4 py-3">
                    {u.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-olive-100 px-2.5 py-1 text-xs font-semibold text-olive-800">
                        <ShieldCheck size={12} /> Admin
                      </span>
                    ) : u.role === 'restaurant' ? (
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                          <Store size={12} /> Manager / Restaurant
                        </span>
                        <p className="text-xs text-olive-500">
                          {u.managed_restaurants?.length
                            ? u.managed_restaurants.map((r) => r.name).join(', ')
                            : 'No restaurant assigned'}
                        </p>
                      </div>
                    ) : (
                      <span className="rounded-full bg-olive-50 px-2.5 py-1 text-xs font-semibold text-olive-600">Customer</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-olive-700">{u.reservations_count ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${u.is_blocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {u.is_blocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.role !== 'admin' && (
                      <button
                        disabled={busyId === u.id}
                        onClick={() => toggleBlock(u)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold disabled:opacity-50 ${
                          u.is_blocked
                            ? 'border border-green-200 text-green-700 hover:bg-green-50'
                            : 'border border-red-200 text-red-600 hover:bg-red-50'
                        }`}
                      >
                        {u.is_blocked ? 'Unblock' : 'Block'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
