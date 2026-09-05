import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const redirectTo = location.state?.from || '/'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (result.success) {
      navigate(result.user.role === 'admin' ? '/admin' : redirectTo, { replace: true })
    } else {
      setError(result.message)
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="mb-8 flex flex-col items-center">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-olive-800 text-white">
          <Leaf size={22} />
        </span>
        <h1 className="font-serif text-2xl font-bold text-olive-950">Welcome Back</h1>
        <p className="text-sm text-olive-600">Log in to book your next table.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-olive-100">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <div>
          <label className="mb-1 block text-xs font-medium text-olive-600">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm outline-none focus:border-olive-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-olive-600">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm outline-none focus:border-olive-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-olive-800 py-2.5 text-sm font-semibold text-white hover:bg-olive-900 disabled:opacity-60"
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-olive-600">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-olive-900 underline">
          Sign Up
        </Link>
      </p>
    </div>
  )
}
