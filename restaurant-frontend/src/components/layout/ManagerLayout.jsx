import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { CalendarCheck, Compass, LayoutDashboard, LogOut, Menu, Store, User, UtensilsCrossed, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const links = [
  { to: '/manager', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/manager/restaurant', label: 'My Restaurant', icon: Store },
  { to: '/manager/reservations', label: 'Reservations', icon: CalendarCheck },
  { to: '/manager/menu-items', label: 'Menu Items', icon: UtensilsCrossed },
  { to: '/', label: 'Explore', icon: Compass, end: true },
]

function SidebarContent({ onNavigate }) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-6 py-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-olive-600 text-white">
          <Store size={18} />
        </span>
        <div className="leading-tight text-white">
          <span className="block font-serif text-lg font-bold">QuickSeat</span>
          <span className="-mt-1 block text-[10px] uppercase tracking-widest text-olive-300">Restaurant Manager</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-olive-700 text-white' : 'text-olive-200 hover:bg-olive-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-6">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-olive-200 transition hover:bg-olive-800 hover:text-white"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  )
}

export default function ManagerLayout() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-cream-100 md:flex">
      <aside className="hidden w-64 shrink-0 bg-olive-950 md:block">
        <SidebarContent />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-olive-950">
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-olive-100 bg-white px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button className="rounded-lg p-2 text-olive-800 md:hidden" onClick={() => setOpen(true)}>
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="text-lg font-semibold text-olive-950">Restaurant Dashboard</h1>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-olive-200 py-1.5 pl-1.5 pr-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-olive-800 text-white">
              <User size={14} />
            </span>
            <span className="text-sm font-medium text-olive-800">{user?.name || 'Manager'}</span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
