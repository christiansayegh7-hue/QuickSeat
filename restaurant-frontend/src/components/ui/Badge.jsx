export default function Badge({ children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-olive-100 px-3 py-1 text-xs font-semibold text-olive-800 ${className}`}
    >
      {children}
    </span>
  )
}
