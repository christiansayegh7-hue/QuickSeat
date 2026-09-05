import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="font-serif text-6xl font-bold text-olive-800">404</p>
      <p className="mt-2 text-olive-600">The page you're looking for doesn't exist.</p>
      <Link to="/" className="mt-6 rounded-full bg-olive-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-olive-900">
        Back to Home
      </Link>
    </div>
  )
}
