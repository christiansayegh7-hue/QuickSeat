import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, DollarSign, UtensilsCrossed, Users } from 'lucide-react'
import api from '../../lib/api'
import StatCard from '../../components/admin/StatCard'
import { formatCurrency, restaurantCoverUrl } from '../../utils/format'

export default function ManagerDashboard() {
  const [restaurant, setRestaurant] = useState(null)
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/manager/restaurant'), api.get('/manager/reservations')])
      .then(([restaurantRes, reservationsRes]) => {
        setRestaurant(restaurantRes.data.restaurant)
        setReservations(reservationsRes.data.reservations || [])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-olive-500">Loading your dashboard...</p>

  const today = new Date().toISOString().slice(0, 10)
  const todaysReservations = reservations.filter((r) => r.reservation_date === today && r.status !== 'cancelled')
  const activeReservations = reservations.filter((r) => r.status !== 'cancelled')
  const totalRevenue = reservations
    .filter((r) => r.status === 'confirmed')
    .reduce((sum, r) => sum + (r.items || []).reduce((s, i) => s + Number(i.subtotal), 0), 0)
  const menuItemCount = (restaurant?.categories || []).reduce((n, c) => n + (c.menu_items?.length || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-olive-100">
        <img src={restaurantCoverUrl(restaurant)} alt={restaurant?.name} className="h-20 w-28 shrink-0 rounded-xl object-cover" />
        <div className="flex-1">
          <h2 className="font-serif text-xl font-bold text-olive-950">{restaurant?.name}</h2>
          <p className="text-sm text-olive-500">{restaurant?.address}</p>
          {restaurant?.description && <p className="mt-1 text-sm text-olive-600">{restaurant.description}</p>}
        </div>
        <Link
          to="/manager/restaurant"
          className="shrink-0 rounded-full border border-olive-300 px-4 py-2 text-xs font-semibold text-olive-800 hover:bg-olive-50"
        >
          Manage My Restaurant
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarCheck} label="Today's Reservations" value={todaysReservations.length} />
        <StatCard icon={Users} label="Total Reservations" value={activeReservations.length} />
        <StatCard icon={UtensilsCrossed} label="Menu Items" value={menuItemCount} />
        <StatCard icon={DollarSign} label="Total Revenue" value={formatCurrency(totalRevenue)} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/manager/reservations" className="rounded-full bg-olive-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-olive-900">
          View Reservations
        </Link>
        <Link to="/manager/menu-items" className="rounded-full border border-olive-300 px-5 py-2.5 text-sm font-semibold text-olive-800 hover:bg-olive-50">
          Manage Menu
        </Link>
      </div>
    </div>
  )
}
