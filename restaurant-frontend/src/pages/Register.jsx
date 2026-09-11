import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Leaf, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import PasswordRequirements from '../components/ui/PasswordRequirements'
import { isPasswordValid } from '../utils/password'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Register() {
  const { register, sendEmailOtp, verifyEmailOtp } = useAuth()
  const navigate = useNavigate()
  const [accountType, setAccountType] = useState('customer')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(null)

  // Email OTP verification state - the email field is locked once a code has
  // been sent/verified for it; editing it resets verification since the code
  // is tied to that exact address.
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [emailVerified, setEmailVerified] = useState(false)
  const [otpMessage, setOtpMessage] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)

  function handleEmailChange(value) {
    setEmail(value)
    setEmailVerified(false)
    setOtpSent(false)
    setOtpCode('')
    setOtpMessage('')
    setOtpError('')
  }

  async function handleSendOtp() {
    setOtpError('')
    setOtpMessage('')

    if (!EMAIL_RE.test(email)) {
      setOtpError('Please enter a valid email first.')
      return
    }

    setOtpLoading(true)
    const result = await sendEmailOtp(email)
    setOtpLoading(false)

    if (result.success) {
      setOtpSent(true)
      setOtpMessage('A 6-digit code was sent to your email.')
    } else {
      setOtpError(result.message)
    }
  }

  async function handleVerifyOtp() {
    setOtpError('')
    setOtpMessage('')

    if (otpCode.length !== 6) {
      setOtpError('Enter the 6-digit code.')
      return
    }

    setOtpLoading(true)
    const result = await verifyEmailOtp(email, otpCode)
    setOtpLoading(false)

    if (result.success) {
      setEmailVerified(true)
      setOtpMessage('Email verified.')
    } else {
      setOtpError(result.message)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!emailVerified) {
      setError('Please verify your email address first.')
      return
    }

    if (!isPasswordValid(password)) {
      setError('Please meet all password requirements below.')
      return
    }

    setLoading(true)
    const result = await register({
      name,
      email,
      password,
      account_type: accountType,
      restaurant_name: accountType === 'restaurant' ? restaurantName : undefined,
      phone: accountType === 'restaurant' ? phone || undefined : undefined,
    })
    setLoading(false)

    if (result.success) {
      if (result.pending) {
        setSubmitted(result.message)
      } else {
        navigate('/', { replace: true })
      }
    } else {
      setError(result.message)
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-16 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-olive-800 text-white">
          <Leaf size={22} />
        </span>
        <h1 className="font-serif text-2xl font-bold text-olive-950">Request Submitted</h1>
        <p className="mt-3 text-sm text-olive-600">{submitted}</p>
        <Link to="/" className="mt-6 rounded-full bg-olive-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-olive-900">
          Continue to QuickSeat
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="mb-8 flex flex-col items-center">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-olive-800 text-white">
          <Leaf size={22} />
        </span>
        <h1 className="font-serif text-2xl font-bold text-olive-950">Create Your Account</h1>
        <p className="text-sm text-olive-600">Join QuickSeat to discover and book great restaurants.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-olive-100">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div>
          <label className="mb-1 block text-xs font-medium text-olive-600">Account Type</label>
          <div className="flex rounded-full bg-olive-50 p-1">
            {[
              { key: 'customer', label: 'Customer' },
              { key: 'restaurant', label: 'Restaurant' },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setAccountType(opt.key)}
                className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                  accountType === opt.key ? 'bg-olive-800 text-white' : 'text-olive-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {accountType === 'restaurant' && (
            <p className="mt-2 text-xs text-olive-500">
              Restaurant accounts are reviewed by our team before they go live. You'll be notified once approved.
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-olive-600">Full Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm outline-none focus:border-olive-500"
          />
        </div>

        {accountType === 'restaurant' && (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-olive-600">Restaurant Name</label>
              <input
                required
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm outline-none focus:border-olive-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-olive-600">Phone (Optional)</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm outline-none focus:border-olive-500"
              />
            </div>
          </>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-olive-600">Email</label>
          <div className="flex gap-2">
            <input
              type="email"
              required
              disabled={emailVerified}
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm outline-none focus:border-olive-500 disabled:bg-olive-50 disabled:text-olive-500"
            />
            {emailVerified ? (
              <span className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg bg-green-50 px-3 text-xs font-semibold text-green-700">
                <CheckCircle2 size={14} /> Verified
              </span>
            ) : (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={otpLoading}
                className="shrink-0 whitespace-nowrap rounded-lg bg-olive-100 px-3 py-2 text-xs font-semibold text-olive-800 hover:bg-olive-200 disabled:opacity-60"
              >
                {otpLoading && !otpSent ? 'Sending...' : otpSent ? 'Resend Code' : 'Send Code'}
              </button>
            )}
          </div>

          {otpSent && !emailVerified && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm tracking-widest outline-none focus:border-olive-500"
              />
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={otpLoading}
                className="shrink-0 whitespace-nowrap rounded-lg bg-olive-800 px-3 py-2 text-xs font-semibold text-white hover:bg-olive-900 disabled:opacity-60"
              >
                {otpLoading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          )}

          {otpMessage && !otpError && <p className="mt-1 text-xs text-olive-500">{otpMessage}</p>}
          {otpError && <p className="mt-1 text-xs text-red-600">{otpError}</p>}
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
          <PasswordRequirements value={password} />
        </div>
        <button
          type="submit"
          disabled={loading || !emailVerified}
          className="w-full rounded-full bg-olive-800 py-2.5 text-sm font-semibold text-white hover:bg-olive-900 disabled:opacity-60"
        >
          {loading ? 'Creating account...' : !emailVerified ? 'Verify Your Email First' : accountType === 'restaurant' ? 'Submit Request' : 'Sign Up'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-olive-600">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-olive-900 underline">
          Log In
        </Link>
      </p>
    </div>
  )
}
