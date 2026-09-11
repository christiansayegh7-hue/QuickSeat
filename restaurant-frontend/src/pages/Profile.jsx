import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Calendar, KeyRound, LogOut, Shield, Store, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import PasswordRequirements from '../components/ui/PasswordRequirements'
import { isPasswordValid } from '../utils/password'

export default function Profile() {
  const { user, logout, changePassword } = useAuth()
  const navigate = useNavigate()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (!isPasswordValid(newPassword)) {
      setPasswordError('Please meet all password requirements below.')
      return
    }

    setChangingPassword(true)
    const result = await changePassword(currentPassword, newPassword)
    setChangingPassword(false)

    if (result.success) {
      setPasswordSuccess(result.message)
      setCurrentPassword('')
      setNewPassword('')
    } else {
      setPasswordError(result.message)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-olive-100">
        <span className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-olive-800 text-3xl font-semibold text-white">
          {user?.name?.[0]?.toUpperCase() || <User />}
        </span>
        <h1 className="font-serif text-2xl font-bold text-olive-950">{user?.name}</h1>
        <p className="text-olive-600">{user?.email}</p>
        {user?.role === 'admin' && (
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-olive-100 px-3 py-1 text-xs font-semibold text-olive-800">
            <Shield size={12} /> Administrator
          </span>
        )}
        {user?.role === 'restaurant' && (
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            <Store size={12} /> Restaurant Manager
          </span>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link to="/my-bookings" className="flex items-center gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-olive-100 hover:bg-olive-50">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-olive-100 text-olive-800"><Calendar size={18} /></span>
          <div>
            <p className="font-semibold text-olive-950">My Bookings</p>
            <p className="text-xs text-olive-500">View reservation history</p>
          </div>
        </Link>
        <Link to="/notifications" className="flex items-center gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-olive-100 hover:bg-olive-50">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-olive-100 text-olive-800"><Bell size={18} /></span>
          <div>
            <p className="font-semibold text-olive-950">Notifications</p>
            <p className="text-xs text-olive-500">Updates about your bookings</p>
          </div>
        </Link>
      </div>

      {user?.role === 'admin' && (
        <Link to="/admin" className="mt-4 block rounded-xl bg-olive-900 p-5 text-center font-semibold text-white shadow-sm hover:bg-olive-950">
          Go to Admin Dashboard
        </Link>
      )}
      {user?.role === 'restaurant' && (
        <Link to="/manager" className="mt-4 block rounded-xl bg-olive-900 p-5 text-center font-semibold text-white shadow-sm hover:bg-olive-950">
          Go to Restaurant Dashboard
        </Link>
      )}

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-olive-100">
        <h2 className="mb-4 flex items-center gap-2 font-serif text-lg font-bold text-olive-950">
          <KeyRound size={18} /> Change Password
        </h2>
        {passwordError && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{passwordError}</p>}
        {passwordSuccess && <p className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{passwordSuccess}</p>}
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-olive-600">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm outline-none focus:border-olive-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-olive-600">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm outline-none focus:border-olive-500"
            />
            <PasswordRequirements value={newPassword} />
          </div>
          <button
            type="submit"
            disabled={changingPassword}
            className="w-full rounded-full bg-olive-800 py-2.5 text-sm font-semibold text-white hover:bg-olive-900 disabled:opacity-60"
          >
            {changingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      <button
        onClick={handleLogout}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-red-200 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
      >
        <LogOut size={16} /> Logout
      </button>
    </div>
  )
}
