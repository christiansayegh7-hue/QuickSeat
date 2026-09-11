import { Link } from 'react-router-dom'
import { Leaf, Mail, MapPin, Phone } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-olive-100 bg-olive-950 pb-24 text-cream-100 md:pb-10">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-olive-700">
              <Leaf size={18} />
            </span>
            <span className="font-serif text-lg font-bold">QuickSeat</span>
          </div>
          <p className="mt-3 text-sm text-olive-300">
            Good food, great moments. Discover the best restaurants and book your table in seconds.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-olive-200">Explore</h4>
          <ul className="space-y-2 text-sm text-olive-300">
            <li><Link to="/" className="hover:text-white">Home</Link></li>
            <li><Link to="/restaurants" className="hover:text-white">Restaurants</Link></li>
            <li><Link to="/about" className="hover:text-white">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-olive-200">Account</h4>
          <ul className="space-y-2 text-sm text-olive-300">
            <li><Link to="/my-bookings" className="hover:text-white">My Bookings</Link></li>
            <li><Link to="/notifications" className="hover:text-white">Notifications</Link></li>
            <li><Link to="/profile" className="hover:text-white">Profile</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-olive-200">Contact</h4>
          <ul className="space-y-2 text-sm text-olive-300">
            <li className="flex items-center gap-2"><MapPin size={14} /> Downtown, Main Street</li>
            <li className="flex items-center gap-2"><Phone size={14} /> +962 79 000 0000</li>
            <li className="flex items-center gap-2"><Mail size={14} /> hello@quickseat.example</li>
          </ul>
        </div>
      </div>
      <p className="border-t border-olive-800 pt-6 text-center text-xs text-olive-400">
        © {new Date().getFullYear()} QuickSeat. All rights reserved.
      </p>
    </footer>
  )
}
