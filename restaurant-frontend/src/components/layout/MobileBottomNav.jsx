import { NavLink } from 'react-router-dom'
import { Bell, Calendar, Home, User, UtensilsCrossed } from 'lucide-react'
import { useNotifications } from '../../context/NotificationsContext'

const items = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/restaurants', label: 'Restaurants', icon: UtensilsCrossed },
  { to: '/my-bookings', label: 'Bookings', icon: Calendar },
  { to: '/notifications', label: 'Alerts', icon: Bell, badge: true },
  { to: '/profile', label: 'Profile', icon: User },
]

export default function MobileBottomNav() {
  const { unreadCount } = useNotifications()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-olive-100 bg-white/95 backdrop-blur md:hidden">
      {items.map(({ to, label, icon: Icon, end, badge }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
              isActive ? 'text-olive-800' : 'text-olive-400'
            }`
          }
        >
          <span className="relative">
            <Icon size={20} />
            {badge && unreadCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-[8px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </span>
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
