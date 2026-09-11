import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Bell, Leaf, LogOut, Menu, User, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationsContext'

const links = [
  { to: '/', label: 'Home' },
  { to: '/restaurants', label: 'Restaurants' },
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const { isAuthenticated, isAdmin, isManager, user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-olive-100 bg-cream-50/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-olive-800 text-cream-50">
            <Leaf size={18} />
          </span>
          <span className="leading-tight">
            <span className="block font-serif text-lg font-bold text-olive-900">QuickSeat</span>
            <span className="-mt-1 block text-[10px] font-medium uppercase tracking-widest text-olive-500">
              Restaurant
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `text-sm font-medium transition hover:text-olive-900 ${
                  isActive ? 'text-olive-900' : 'text-olive-600'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated && (
            <Link
              to="/notifications"
              className="relative rounded-full p-2 text-olive-700 transition hover:bg-olive-100"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to={isAdmin ? '/admin' : isManager ? '/manager' : '/profile'}
                className="flex items-center gap-2 rounded-full border border-olive-200 py-1.5 pl-1.5 pr-3 text-sm font-medium text-olive-800 hover:bg-olive-50"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-olive-800 text-white">
                  <User size={14} />
                </span>
                {user?.name?.split(' ')[0]}
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-full p-2 text-olive-700 transition hover:bg-olive-100"
                aria-label="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full border border-olive-300 px-4 py-2 text-sm font-medium text-olive-800 transition hover:bg-olive-50"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-olive-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-olive-900"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-full p-2 text-olive-800 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-olive-100 bg-cream-50 px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium ${
                    isActive ? 'bg-olive-100 text-olive-900' : 'text-olive-700'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                <Link
                  to={isAdmin ? '/admin' : isManager ? '/manager' : '/profile'}
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-olive-200 px-3 py-2 text-center text-sm font-medium text-olive-800"
                >
                  My Account
                </Link>
                <button
                  onClick={() => {
                    setOpen(false)
                    handleLogout()
                  }}
                  className="rounded-lg bg-olive-800 px-3 py-2 text-sm font-medium text-white"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-olive-300 px-3 py-2 text-center text-sm font-medium text-olive-800"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-olive-800 px-3 py-2 text-center text-sm font-medium text-white"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
