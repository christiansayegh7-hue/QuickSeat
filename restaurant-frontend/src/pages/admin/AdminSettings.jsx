import { useAuth } from '../../context/AuthContext'

export default function AdminSettings() {
  const { user } = useAuth()

  return (
    <div className="max-w-lg space-y-4">
      <h2 className="font-serif text-xl font-bold text-olive-950">Settings</h2>
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-olive-100">
        <p className="text-sm text-olive-500">Name</p>
        <p className="mb-3 font-medium text-olive-950">{user?.name}</p>
        <p className="text-sm text-olive-500">Email</p>
        <p className="mb-3 font-medium text-olive-950">{user?.email}</p>
        <p className="text-sm text-olive-500">Role</p>
        <p className="font-medium capitalize text-olive-950">{user?.role}</p>
      </div>
    </div>
  )
}
