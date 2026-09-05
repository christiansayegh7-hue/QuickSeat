import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CalendarDays, ChevronRight, Search, Table2, UtensilsCrossed } from 'lucide-react'
import api from '../lib/api'
import RestaurantCard from '../components/ui/RestaurantCard'
import { averageRating } from '../utils/format'

const steps = [
  { icon: Search, title: 'Choose Restaurant', text: 'Find the perfect restaurant for you.' },
  { icon: CalendarDays, title: 'Select Date & Time', text: 'Pick your preferred date and time.' },
  { icon: Table2, title: 'Choose Your Table', text: "We'll show you the best available tables." },
  { icon: Bell, title: 'Enjoy Your Meal', text: 'Sit back, relax and enjoy a great experience.' },
]

export default function Home() {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    api
      .get('/restaurants')
      .then(({ data }) => {
        if (!active) return
        const sorted = [...(data.restaurants || [])].sort(
          (a, b) => (averageRating(b.reviews) || 0) - (averageRating(a.reviews) || 0)
        )
        setRestaurants(sorted.slice(0, 4))
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/olive-hero/1600/900')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-olive-950/90 via-olive-950/70 to-olive-950/30" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-36">
          <h1 className="max-w-xl font-serif text-4xl font-bold leading-tight text-white sm:text-5xl">
            Good Food, Great Moments
          </h1>
          <p className="mt-4 max-w-md text-olive-100">
            Discover the best restaurants, book your table, and enjoy unforgettable experiences.
          </p>
          <Link
            to="/restaurants"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-olive-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-olive-500"
          >
            Explore Restaurants <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-olive-500">— ❧ —</span>
            <h2 className="mt-2 font-serif text-2xl font-bold text-olive-950">Popular Restaurants</h2>
          </div>
          <Link to="/restaurants" className="text-sm font-semibold text-olive-700 hover:text-olive-900">
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-olive-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {restaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-olive-900 px-6 py-8 text-white sm:flex-row sm:px-10">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-olive-700">
              <CalendarDays size={22} />
            </span>
            <div>
              <h3 className="font-serif text-xl font-bold">Easy Reservations</h3>
              <p className="text-sm text-olive-200">Book your table in just a few clicks, anytime, anywhere.</p>
            </div>
          </div>
          <Link
            to="/restaurants"
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-olive-600 px-6 py-3 text-sm font-semibold hover:bg-olive-500"
          >
            Book a Table Now <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="font-serif text-2xl font-bold text-olive-950">How It Works</h2>
          <span className="mt-1 block text-xs font-semibold uppercase tracking-widest text-olive-400">— ❧ —</span>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex flex-col items-center text-center">
              <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-olive-100 text-olive-800">
                <Icon size={26} />
              </span>
              <h3 className="font-semibold text-olive-950">{title}</h3>
              <p className="mt-1 text-sm text-olive-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-16 text-center sm:px-6 lg:px-8">
        <UtensilsCrossed className="mx-auto mb-3 text-olive-500" size={28} />
        <p className="text-olive-600">
          Ready to find your next favorite spot?{' '}
          <Link to="/restaurants" className="font-semibold text-olive-800 underline underline-offset-4">
            Browse all restaurants
          </Link>
        </p>
      </section>
    </div>
  )
}
