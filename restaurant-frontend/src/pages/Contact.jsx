import { useState } from 'react'
import { Mail, MapPin, Phone } from 'lucide-react'

export default function Contact() {
  const [sent, setSent] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-center font-serif text-3xl font-bold text-olive-950">Contact Us</h1>
      <p className="mx-auto mt-2 max-w-md text-center text-olive-600">Have a question or feedback? We'd love to hear from you.</p>

      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-olive-100">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-olive-100 text-olive-800"><MapPin size={18} /></span>
            <p className="text-sm text-olive-700">Downtown, Main Street, 123</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-olive-100">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-olive-100 text-olive-800"><Phone size={18} /></span>
            <p className="text-sm text-olive-700">+962 79 123 4567</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-olive-100">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-olive-100 text-olive-800"><Mail size={18} /></span>
            <p className="text-sm text-olive-700">hello@quickseat.example</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-olive-100">
          {sent && <p className="rounded-lg bg-olive-50 px-3 py-2 text-sm text-olive-800">Thanks! We'll get back to you soon.</p>}
          <input required placeholder="Your Name" className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm" />
          <input required type="email" placeholder="Your Email" className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm" />
          <textarea required placeholder="Your Message" rows={4} className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm" />
          <button type="submit" className="w-full rounded-full bg-olive-800 py-2.5 text-sm font-semibold text-white hover:bg-olive-900">
            Send Message
          </button>
        </form>
      </div>
    </div>
  )
}
