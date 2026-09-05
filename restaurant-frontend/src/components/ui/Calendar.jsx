import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function toKey(date) {
  return date.toISOString().slice(0, 10)
}

export default function Calendar({ selected, onSelect }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const startOffset = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-olive-100">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="rounded-full p-1 text-olive-600 hover:bg-olive-100"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm font-semibold text-olive-900">{monthLabel}</p>
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="rounded-full p-1 text-olive-600 hover:bg-olive-100"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-olive-400">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <span key={i} />
          const disabled = date < today
          const isSelected = selected && toKey(date) === selected
          return (
            <button
              type="button"
              key={i}
              disabled={disabled}
              onClick={() => onSelect(toKey(date))}
              className={`aspect-square rounded-lg text-sm transition ${
                isSelected
                  ? 'bg-olive-800 font-semibold text-white'
                  : disabled
                  ? 'cursor-not-allowed text-olive-200'
                  : 'text-olive-700 hover:bg-olive-100'
              }`}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
