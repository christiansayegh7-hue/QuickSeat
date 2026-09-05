import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Clock, MapPin, Phone } from 'lucide-react'
import api, { apiErrorMessage } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import StarRating from '../components/ui/StarRating'
import Badge from '../components/ui/Badge'
import { averageRating, formatCurrency, ratingBreakdown, restaurantImage } from '../utils/format'

const TABS = ['Overview', 'Menu', 'Reviews', 'Photos']

export default function RestaurantDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('Overview')
  const [reviewForm, setReviewForm] = useState({ rating_food: 5, rating_service: 5, rating_cleanliness: 5, comment: '' })
  const [reviewError, setReviewError] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [prevId, setPrevId] = useState(id)

  // Reset per-restaurant UI state during render when navigating between restaurants,
  // since the route element isn't remounted on param change.
  if (id !== prevId) {
    setPrevId(id)
    setTab('Overview')
    setLoading(true)
  }

  function refetch() {
    return api.get(`/restaurants/${id}`).then(({ data }) => setRestaurant(data.restaurant))
  }

  useEffect(() => {
    let active = true
    refetch().finally(() => active && setLoading(false))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-olive-500">Loading restaurant...</div>
  }

  if (!restaurant) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-olive-600">Restaurant not found.</p>
        <Link to="/restaurants" className="mt-4 inline-block font-semibold text-olive-800 underline">
          Back to Restaurants
        </Link>
      </div>
    )
  }

  const reviews = restaurant.reviews || [];
  const rating = averageRating(reviews)
  const breakdown = ratingBreakdown(reviews)
  const menuItems = (restaurant.categories || []).flatMap((c) => c.menuItems || [])
  const alreadyReviewed = user && reviews.some((r) => r.user_id === user.id)

  async function submitReview(e) {
    e.preventDefault()
    setReviewError('')
    setReviewSubmitting(true)
    try {
      await api.post('/reviews', {
        restaurant_id: restaurant.id,
        ...reviewForm,
      })
      setReviewForm({ rating_food: 5, rating_service: 5, rating_cleanliness: 5, comment: '' })
      refetch()
    } catch (error) {
      setReviewError(apiErrorMessage(error, 'Could not submit your review.'))
    } finally {
      setReviewSubmitting(false)
    }
  }

  function handleBookClick() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/restaurants/${id}/book` } })
      return
    }
    navigate(`/restaurants/${id}/book`)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/restaurants" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-olive-600 hover:text-olive-900">
        <ChevronLeft size={16} /> Back to Restaurants
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl">
            <img src={restaurantImage(restaurant.id, 0)} alt={restaurant.name} className="h-72 w-full object-cover sm:h-96" />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((v) => (
              <img
                key={v}
                src={restaurantImage(restaurant.id, v)}
                alt=""
                className="h-20 w-full rounded-xl object-cover"
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-olive-100">
          <div className="mb-3 flex items-start justify-between gap-2">
            <h1 className="font-serif text-2xl font-bold text-olive-950">{restaurant.name}</h1>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              {restaurant.is_full && (
                <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  Full
                </span>
              )}
              <Badge>{restaurant.restaurant_type || 'Restaurant'}</Badge>
            </div>
          </div>
          <StarRating rating={rating || 0} reviewsCount={reviews.length} />

          <div className="mt-4 space-y-2 text-sm text-olive-700">
            <p className="flex items-center gap-2"><MapPin size={16} className="text-olive-500" /> {restaurant.address}</p>
            <p className="flex items-center gap-2"><Clock size={16} className="text-olive-500" /> {restaurant.opening_hours || 'Hours unavailable'}</p>
            {restaurant.phone && (
              <p className="flex items-center gap-2"><Phone size={16} className="text-olive-500" /> {restaurant.phone}</p>
            )}
          </div>

          {restaurant.description && <p className="mt-4 text-sm text-olive-600">{restaurant.description}</p>}

          {restaurant.is_full && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              All tables are currently occupied. You can still book a table for a later date or time.
            </p>
          )}

          <button
            onClick={handleBookClick}
            className="mt-6 w-full rounded-full bg-olive-800 py-3 text-sm font-semibold text-white transition hover:bg-olive-900"
          >
            Book a Table
          </button>
        </div>
      </div>

      <div className="mt-10 flex gap-6 overflow-x-auto border-b border-olive-100">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-semibold transition ${
              tab === t ? 'border-olive-800 text-olive-900' : 'border-transparent text-olive-400 hover:text-olive-700'
            }`}
          >
            {t} {t === 'Reviews' ? `(${reviews.length})` : ''}
          </button>
        ))}
      </div>

      <div className="py-8">
        {tab === 'Overview' && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="mb-2 font-serif text-lg font-bold text-olive-950">About</h2>
              <p className="text-sm leading-relaxed text-olive-600">
                {restaurant.description || `${restaurant.name} welcomes you with great food and a warm atmosphere.`}
              </p>

              <h2 className="mb-3 mt-8 font-serif text-lg font-bold text-olive-950">Menu Highlights</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {menuItems.slice(0, 4).map((item) => (
                  <div key={item.id} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-olive-100">
                    <img src={item.image} alt={item.name} className="h-24 w-full object-cover" />
                    <div className="p-2">
                      <p className="truncate text-xs font-semibold text-olive-900">{item.name}</p>
                      <p className="text-xs text-olive-600">{formatCurrency(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-olive-100">
              <p className="text-sm font-semibold text-olive-500">Reviews Summary</p>
              <p className="mt-1 font-serif text-4xl font-bold text-olive-950">{rating ? rating.toFixed(1) : '—'}</p>
              <div className="mt-4 space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = breakdown[star] || 0
                  const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs text-olive-600">
                      <span className="w-3">{star}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-olive-100">
                        <div className="h-full rounded-full bg-gold-400" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-6 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
              <button onClick={() => setTab('Reviews')} className="mt-4 w-full rounded-full border border-olive-200 py-2 text-xs font-semibold text-olive-800 hover:bg-olive-50">
                Read All Reviews
              </button>
            </div>
          </div>
        )}

        {tab === 'Menu' && (
          <div className="space-y-10">
            {(restaurant.categories || []).map((category) => (
              <div key={category.id}>
                <h2 className="mb-4 font-serif text-lg font-bold text-olive-950">{category.name}</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(category.menuItems || []).map((item) => (
                    <div key={item.id} className="flex gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-olive-100">
                      <img src={item.image} alt={item.name} className="h-20 w-20 shrink-0 rounded-lg object-cover" />
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-olive-950">{item.name}</p>
                          <p className="whitespace-nowrap text-sm font-semibold text-olive-700">{formatCurrency(item.price)}</p>
                        </div>
                        <p className="mt-1 text-xs text-olive-600">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {menuItems.length === 0 && <p className="text-olive-500">No menu items published yet.</p>}
          </div>
        )}

        {tab === 'Reviews' && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {reviews.length === 0 && <p className="text-olive-500">No reviews yet. Be the first to review!</p>}
              {reviews.map((review) => {
                const avg = (review.rating_food + review.rating_service + review.rating_cleanliness) / 3
                return (
                  <div key={review.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-olive-100">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-olive-950">{review.user?.name || 'Guest'}</p>
                      <StarRating rating={avg} />
                    </div>
                    {review.comment && <p className="mt-2 text-sm text-olive-600">{review.comment}</p>}
                  </div>
                )
              })}
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-olive-100">
              <h3 className="mb-3 font-serif text-lg font-bold text-olive-950">Write a Review</h3>
              {!isAuthenticated ? (
                <p className="text-sm text-olive-600">
                  <Link to="/login" className="font-semibold underline">Log in</Link> to leave a review.
                </p>
              ) : alreadyReviewed ? (
                <p className="text-sm text-olive-600">You've already reviewed this restaurant. Thank you!</p>
              ) : (
                <form onSubmit={submitReview} className="space-y-3">
                  {['rating_food', 'rating_service', 'rating_cleanliness'].map((field) => (
                    <div key={field}>
                      <label className="mb-1 block text-xs font-medium capitalize text-olive-600">
                        {field.replace('rating_', '').replace('_', ' ')}
                      </label>
                      <select
                        value={reviewForm[field]}
                        onChange={(e) => setReviewForm((f) => ({ ...f, [field]: Number(e.target.value) }))}
                        className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm"
                      >
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                    placeholder="Share your experience..."
                    rows={3}
                    className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm"
                  />
                  {reviewError && <p className="text-xs text-red-600">{reviewError}</p>}
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="w-full rounded-full bg-olive-800 py-2 text-sm font-semibold text-white hover:bg-olive-900 disabled:opacity-60"
                  >
                    {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {tab === 'Photos' && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <img
                key={i}
                src={restaurantImage(restaurant.id, i)}
                alt=""
                className="h-40 w-full rounded-xl object-cover"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
