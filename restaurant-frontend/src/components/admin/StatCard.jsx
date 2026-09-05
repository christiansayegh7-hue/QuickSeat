export default function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-olive-100">
      <div className="flex items-center justify-between">
        <p className="text-sm text-olive-500">{label}</p>
        {Icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-olive-100 text-olive-800">
            <Icon size={16} />
          </span>
        )}
      </div>
      <p className="mt-2 font-serif text-2xl font-bold text-olive-950">{value}</p>
      {hint && <p className="mt-1 text-xs font-medium text-olive-500">{hint}</p>}
    </div>
  )
}
