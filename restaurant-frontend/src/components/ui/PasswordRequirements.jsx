import { Check, X } from 'lucide-react'
import { PASSWORD_RULES } from '../../utils/password'

export default function PasswordRequirements({ value }) {
  return (
    <ul className="mt-2 space-y-1">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(value)
        return (
          <li key={rule.key} className={`flex items-center gap-1.5 text-xs ${met ? 'text-green-600' : 'text-olive-400'}`}>
            {met ? <Check size={12} /> : <X size={12} />}
            {rule.label}
          </li>
        )
      })}
    </ul>
  )
}
