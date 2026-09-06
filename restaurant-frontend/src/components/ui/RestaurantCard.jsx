import { Link } from 'react-router-dom'
import { averageRating, restaurantCoverUrl } from '../../utils/format'
import StarRating from './StarRating'

export default function RestaurantCard({ restaurant }) {
  const rating = averageRating(restaurant.reviews)

  return (
    <Link
      to={`/restaurants/${restaurant.id}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-olive-100 transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative h-40 w-full overflow-hidden">
        <img
          src={restaurantCoverUrl(restaurant)}
          alt={restaurant.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {restaurant.is_full && (
          <span className="absolute right-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow">
            Full
          </span>
        )}
      </div>
      <div className="space-y-1 p-4">
        <h3 className="font-semibold text-olive-950">{restaurant.name}</h3>
        <p className="text-sm text-olive-600">
          {restaurant.restaurant_type || 'Restaurant'}
          {restaurant.address ? ` • ${restaurant.address.split(',')[0]}` : ''}
        </p>
        <StarRating rating={rating || 0} />
      </div>
    </Link>
  )
}
