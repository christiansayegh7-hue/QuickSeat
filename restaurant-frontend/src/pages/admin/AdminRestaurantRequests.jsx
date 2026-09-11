import { useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../../lib/api'
import { formatDate } from '../../utils/format'

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function AdminRestaurantRequests() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  function fetchApplications() {
    return api
      .get('/admin/restaurant-applications')
      .then(({ data }) => setApplications(data.restaurant_applications || []))
      .catch((err) => setError(apiErrorMessage(err, 'Could not load restaurant requests.')))
      .finally(() => setLoading(false))
  }

  function reload() {
    setLoading(true)
    fetchApplications()
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  async function decide(app, action) {
    setError('')
    setBusyId(app.id)
    try {
      await api.patch(`/admin/restaurant-applications/${app.id}/${action}`)
      reload()
    } catch (err) {
      setError(apiErrorMessage(err, `Could not ${action} this request.`))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-xl font-bold text-olive-950">Restaurant Requests</h2>
        <p className="text-sm text-olive-500">Review and approve or reject new restaurant registration requests.</p>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-olive-100">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-olive-100 text-xs uppercase tracking-wide text-olive-400">
              <th className="px-4 py-3">Restaurant Name</th>
              <th className="px-4 py-3">Applicant</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Requested</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-olive-50">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-olive-400">Loading...</td></tr>
            ) : applications.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-olive-400">No restaurant requests yet.</td></tr>
            ) : (
              applications.map((app) => (
                <tr key={app.id}>
                  <td className="px-4 py-3 font-medium text-olive-900">{app.restaurant_name}</td>
                  <td className="px-4 py-3 text-olive-700">{app.user?.name}</td>
                  <td className="px-4 py-3 text-olive-700">{app.user?.email}</td>
                  <td className="px-4 py-3 text-olive-700">{formatDate(app.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[app.status]}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {app.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          disabled={busyId === app.id}
                          onClick={() => decide(app, 'approve')}
                          className="rounded-full border border-green-200 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          disabled={busyId === app.id}
                          onClick={() => decide(app, 'reject')}
                          className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
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
