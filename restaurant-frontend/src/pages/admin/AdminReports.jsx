import { useEffect, useMemo, useState } from 'react'
import { Activity, Award, CalendarDays, DollarSign, Send, Utensils } from 'lucide-react'
import api, { apiErrorMessage } from '../../lib/api'
import MiniLineChart from '../../components/admin/MiniLineChart'
import { formatCurrency, formatDate } from '../../utils/format'

const TABS = [
  { key: 'activity', label: 'Restaurant Activity', icon: Activity },
  { key: 'customers', label: 'Daily Customers', icon: CalendarDays },
  { key: 'revenue', label: 'Daily Revenue', icon: DollarSign },
  { key: 'top-customers', label: 'Top 10 Customers', icon: Award },
  { key: 'top-items', label: 'Top 10 Menu Items', icon: Utensils },
  { key: 'monthly', label: 'Monthly Report', icon: Send },
]

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function shortDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function AdminReports() {
  const [tab, setTab] = useState('activity')
  const [restaurants, setRestaurants] = useState([])

  useEffect(() => {
    api.get('/restaurants').then(({ data }) => setRestaurants(data.restaurants || []))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl font-bold text-olive-950">Reports & Statistics</h2>
        <p className="text-sm text-olive-500">Restaurant performance, customer activity and revenue insights.</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-olive-100 pb-3">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
              tab === key ? 'bg-olive-800 text-white' : 'bg-white text-olive-700 ring-1 ring-olive-200 hover:bg-olive-50'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === 'activity' && <ActivityReport />}
      {tab === 'customers' && <DailyCustomersReport restaurants={restaurants} />}
      {tab === 'revenue' && <DailyRevenueReport restaurants={restaurants} />}
      {tab === 'top-customers' && <TopCustomersReport />}
      {tab === 'top-items' && <TopMenuItemsReport restaurants={restaurants} />}
      {tab === 'monthly' && <MonthlyReport restaurants={restaurants} />}
    </div>
  )
}

function ActivityReport() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/admin/reports/restaurant-activity')
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-olive-500">Loading...</p>
  if (!data) return null

  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-olive-100">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-olive-100 text-xs uppercase tracking-wide text-olive-400">
            <th className="px-4 py-3">Restaurant</th>
            <th className="px-4 py-3">Reservations</th>
            <th className="px-4 py-3">Customers</th>
            <th className="px-4 py-3">Cancelled</th>
            <th className="px-4 py-3">No-shows</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-olive-50">
          {data.restaurants.map((r) => (
            <tr key={r.restaurant_id}>
              <td className="px-4 py-3 font-medium text-olive-900">{r.name}</td>
              <td className="px-4 py-3 text-olive-700">{r.reservations_count}</td>
              <td className="px-4 py-3 text-olive-700">{r.customers_count}</td>
              <td className="px-4 py-3 text-olive-700">{r.cancelled_count}</td>
              <td className="px-4 py-3 text-olive-700">{r.no_show_count}</td>
              <td className="px-4 py-3">
                {r.restaurant_id === data.most_active_restaurant_id && (
                  <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">Most Active</span>
                )}
                {r.restaurant_id === data.least_active_restaurant_id && r.restaurant_id !== data.most_active_restaurant_id && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Least Active</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RestaurantFilter({ restaurants, value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border border-olive-200 px-3 py-2 text-sm">
      <option value="">All Restaurants</option>
      {restaurants.map((r) => (
        <option key={r.id} value={r.id}>{r.name}</option>
      ))}
    </select>
  )
}

function DailyCustomersReport({ restaurants }) {
  const [from, setFrom] = useState(daysAgo(30))
  const [to, setTo] = useState(daysAgo(0))
  const [restaurantId, setRestaurantId] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function runQuery() {
    return api
      .get('/admin/reports/daily-customers', { params: { from, to, restaurant_id: restaurantId || undefined } })
      .then(({ data }) => setRows(data.rows || []))
      .catch((err) => setError(apiErrorMessage(err, 'Could not load this report.')))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    runQuery()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    runQuery()
  }

  const chartData = useMemo(() => {
    const byDate = new Map()
    rows.forEach((r) => byDate.set(r.date, (byDate.get(r.date) || 0) + r.customers_count))
    return [...byDate.entries()].sort(([a], [b]) => (a > b ? 1 : -1)).map(([date, value]) => ({ label: shortDate(date), value }))
  }, [rows])

  const totalCustomers = rows.reduce((sum, r) => sum + r.customers_count, 0)

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-olive-100">
        <Field label="From"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-olive-200 px-3 py-2 text-sm" /></Field>
        <Field label="To"><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-olive-200 px-3 py-2 text-sm" /></Field>
        <Field label="Restaurant"><RestaurantFilter restaurants={restaurants} value={restaurantId} onChange={setRestaurantId} /></Field>
        <button type="submit" className="rounded-full bg-olive-800 px-5 py-2 text-sm font-semibold text-white hover:bg-olive-900">Apply</button>
      </form>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-olive-500">Loading...</p>
      ) : (
        <>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-olive-100">
            <p className="text-sm text-olive-500">Total customers in range</p>
            <p className="mb-3 font-serif text-2xl font-bold text-olive-950">{totalCustomers}</p>
            {chartData.length > 0 && <MiniLineChart data={chartData} />}
          </div>

          <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-olive-100">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-olive-100 text-xs uppercase tracking-wide text-olive-400">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Restaurant</th>
                  <th className="px-4 py-3">Customers</th>
                  <th className="px-4 py-3">Reservations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-olive-50">
                {rows.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-olive-400">No data for this range.</td></tr>
                ) : (
                  rows.map((r, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 text-olive-700">{formatDate(r.date)}</td>
                      <td className="px-4 py-3 font-medium text-olive-900">{r.restaurant?.name}</td>
                      <td className="px-4 py-3 text-olive-700">{r.customers_count}</td>
                      <td className="px-4 py-3 text-olive-700">{r.reservations_count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function DailyRevenueReport({ restaurants }) {
  const [from, setFrom] = useState(daysAgo(30))
  const [to, setTo] = useState(daysAgo(0))
  const [restaurantId, setRestaurantId] = useState('')
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState('0.00')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function runQuery() {
    return api
      .get('/admin/reports/daily-revenue', { params: { from, to, restaurant_id: restaurantId || undefined } })
      .then(({ data }) => {
        setRows(data.rows || [])
        setTotal(data.total_revenue)
      })
      .catch((err) => setError(apiErrorMessage(err, 'Could not load this report.')))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    runQuery()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    runQuery()
  }

  const chartData = useMemo(() => {
    const byDate = new Map()
    rows.forEach((r) => byDate.set(r.date, (byDate.get(r.date) || 0) + Number(r.revenue)))
    return [...byDate.entries()].sort(([a], [b]) => (a > b ? 1 : -1)).map(([date, value]) => ({ label: shortDate(date), value }))
  }, [rows])

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-olive-100">
        <Field label="From"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-olive-200 px-3 py-2 text-sm" /></Field>
        <Field label="To"><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-olive-200 px-3 py-2 text-sm" /></Field>
        <Field label="Restaurant"><RestaurantFilter restaurants={restaurants} value={restaurantId} onChange={setRestaurantId} /></Field>
        <button type="submit" className="rounded-full bg-olive-800 px-5 py-2 text-sm font-semibold text-white hover:bg-olive-900">Apply</button>
      </form>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-olive-500">Loading...</p>
      ) : (
        <>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-olive-100">
            <p className="text-sm text-olive-500">Total revenue in range</p>
            <p className="mb-3 font-serif text-2xl font-bold text-olive-950">{formatCurrency(total)}</p>
            {chartData.length > 0 && <MiniLineChart data={chartData} />}
          </div>

          <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-olive-100">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-olive-100 text-xs uppercase tracking-wide text-olive-400">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Restaurant</th>
                  <th className="px-4 py-3">Revenue</th>
                  <th className="px-4 py-3">Reservations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-olive-50">
                {rows.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-olive-400">No data for this range.</td></tr>
                ) : (
                  rows.map((r, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 text-olive-700">{formatDate(r.date)}</td>
                      <td className="px-4 py-3 font-medium text-olive-900">{r.restaurant_name}</td>
                      <td className="px-4 py-3 text-olive-700">{formatCurrency(r.revenue)}</td>
                      <td className="px-4 py-3 text-olive-700">{r.reservations_count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function TopCustomersReport() {
  const [top, setTop] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/admin/reports/top-customers')
      .then(({ data }) => setTop(data.top_customers || []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-olive-500">Loading...</p>

  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-olive-100">
      <table className="w-full min-w-[500px] text-left text-sm">
        <thead>
          <tr className="border-b border-olive-100 text-xs uppercase tracking-wide text-olive-400">
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Reservations</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-olive-50">
          {top.length === 0 ? (
            <tr><td colSpan={4} className="px-4 py-8 text-center text-olive-400">No reservations yet.</td></tr>
          ) : (
            top.map((row, i) => (
              <tr key={row.user_id}>
                <td className="px-4 py-3 font-semibold text-olive-500">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-olive-900">{row.user?.name}</td>
                <td className="px-4 py-3 text-olive-600">{row.user?.email}</td>
                <td className="px-4 py-3 text-olive-700">{row.reservations_count}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function TopMenuItemsReport({ restaurants }) {
  const [restaurantId, setRestaurantId] = useState('')
  const [top, setTop] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/admin/reports/top-menu-items', { params: { restaurant_id: restaurantId || undefined } })
      .then(({ data }) => setTop(data.top_menu_items || []))
      .finally(() => setLoading(false))
  }, [restaurantId])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-olive-100">
        <Field label="Restaurant"><RestaurantFilter restaurants={restaurants} value={restaurantId} onChange={setRestaurantId} /></Field>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-olive-100">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-olive-100 text-xs uppercase tracking-wide text-olive-400">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Restaurant</th>
              <th className="px-4 py-3">Quantity Sold</th>
              <th className="px-4 py-3">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-olive-50">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-olive-400">Loading...</td></tr>
            ) : top.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-olive-400">No sales yet.</td></tr>
            ) : (
              top.map((row, i) => (
                <tr key={row.menu_item_id}>
                  <td className="px-4 py-3 font-semibold text-olive-500">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-olive-900">{row.menu_item?.name}</td>
                  <td className="px-4 py-3 text-olive-600">{row.menu_item?.category?.restaurant?.name}</td>
                  <td className="px-4 py-3 text-olive-700">{row.total_quantity}</td>
                  <td className="px-4 py-3 text-olive-700">{formatCurrency(row.total_revenue)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MonthlyReport() {
  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const [month, setMonth] = useState(String(lastMonth.getMonth() + 1))
  const [year, setYear] = useState(String(lastMonth.getFullYear()))
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function handleRun(e) {
    e.preventDefault()
    setRunning(true)
    setError('')
    setResult(null)
    try {
      const { data } = await api.post('/admin/reports/monthly/run', { month: Number(month), year: Number(year) })
      setResult(data.output)
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not run the monthly report.'))
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-olive-100">
        <h3 className="mb-1 font-serif text-lg font-bold text-olive-950">Monthly Automatic Report</h3>
        <p className="mb-4 text-sm text-olive-600">
          On the 1st of every month, the system automatically emails each restaurant's manager (and notifies them
          in-app) with last month's reservations, customers and revenue. Use this to trigger it manually for a
          specific month, e.g. for testing.
        </p>

        <form onSubmit={handleRun} className="flex flex-wrap items-end gap-3">
          <Field label="Month">
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-lg border border-olive-200 px-3 py-2 text-sm">
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i} value={i + 1}>{new Date(2000, i, 1).toLocaleDateString('en-US', { month: 'long' })}</option>
              ))}
            </select>
          </Field>
          <Field label="Year">
            <input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="w-24 rounded-lg border border-olive-200 px-3 py-2 text-sm" />
          </Field>
          <button type="submit" disabled={running} className="flex items-center gap-2 rounded-full bg-olive-800 px-5 py-2 text-sm font-semibold text-white hover:bg-olive-900 disabled:opacity-60">
            <Send size={14} /> {running ? 'Running...' : 'Run Now'}
          </button>
        </form>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {result && (
        <div className="rounded-2xl bg-olive-950 p-5 text-xs text-olive-100">
          <pre className="whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-olive-600">{label}</label>
      {children}
    </div>
  )
}
