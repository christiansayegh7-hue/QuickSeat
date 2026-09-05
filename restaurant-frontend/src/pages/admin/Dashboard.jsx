import { useEffect, useMemo, useState } from 'react'
import { CalendarCheck, DollarSign, TrendingUp, Users } from 'lucide-react'
import api from '../../lib/api'
import StatCard from '../../components/admin/StatCard'
import MiniLineChart from '../../components/admin/MiniLineChart'
import { formatCurrency, formatDate, formatTime, statusStyles } from '../../utils/format'

function reservationProfit(reservation) {
  return (reservation.items || []).reduce((sum, item) => sum + Number(item.subtotal || 0), 0)
}

export default function Dashboard() {
  const [reservations, setReservations] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/reservations'), api.get('/admin/users')])
      .then(([resReservations, resUsers]) => {
        setReservations(resReservations.data.reservations || [])
        setUsers(resUsers.data.users || [])
      })
      .finally(() => setLoading(false))
  }, [])

  const today = new Date().toISOString().slice(0, 10)

  const totalReservations = reservations.length
  const todaysBookings = reservations.filter((r) => r.reservation_date === today).length
  const totalUsers = users.length
  const totalProfit = reservations
    .filter((r) => r.status === 'confirmed')
    .reduce((sum, r) => sum + reservationProfit(r), 0)

  const monthlyData = useMemo(() => {
    const months = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('en-US', { month: 'short' }), value: 0 })
    }
    reservations
      .filter((r) => r.status === 'confirmed')
      .forEach((r) => {
        const d = new Date(r.reservation_date)
        const key = `${d.getFullYear()}-${d.getMonth()}`
        const bucket = months.find((m) => m.key === key)
        if (bucket) bucket.value += reservationProfit(r)
      })
    return months
  }, [reservations])

  const recent = [...reservations]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6)

  if (loading) {
    return <p className="text-olive-500">Loading dashboard...</p>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarCheck} label="Total Reservations" value={totalReservations} />
        <StatCard icon={TrendingUp} label="Today's Bookings" value={todaysBookings} />
        <StatCard icon={Users} label="Total Users" value={totalUsers} />
        <StatCard icon={DollarSign} label="Total Profit" value={formatCurrency(totalProfit)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-olive-100 lg:col-span-2">
          <h2 className="mb-4 font-serif text-lg font-bold text-olive-950">Recent Reservations</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-olive-400">
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Restaurant</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Time</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-olive-50">
                {recent.map((r) => {
                  const status = statusStyles(r.status)
                  return (
                    <tr key={r.id}>
                      <td className="py-2.5 font-medium text-olive-900">{r.user?.name}</td>
                      <td className="py-2.5 text-olive-700">{r.restaurant?.name}</td>
                      <td className="py-2.5 text-olive-700">{formatDate(r.reservation_date)}</td>
                      <td className="py-2.5 text-olive-700">{formatTime(r.start_time)}</td>
                      <td className="py-2.5">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {recent.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-olive-400">No reservations yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-olive-100">
          <h2 className="mb-1 font-serif text-lg font-bold text-olive-950">Monthly Profit</h2>
          <p className="mb-4 font-serif text-3xl font-bold text-olive-900">{formatCurrency(totalProfit)}</p>
          <MiniLineChart data={monthlyData} />
        </div>
      </div>
    </div>
  )
}
