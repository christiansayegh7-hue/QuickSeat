import { Leaf } from 'lucide-react'

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-olive-800 text-white">
        <Leaf size={26} />
      </span>
      <h1 className="text-center font-serif text-3xl font-bold text-olive-950">About Olive</h1>
      <p className="mx-auto mt-4 max-w-xl text-center text-olive-600">
        Olive connects food lovers with the best restaurants in town. From cozy neighborhood spots to
        fine dining experiences, we make discovering and booking a table effortless — anytime, anywhere.
      </p>
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {[
          { title: 'Curated Restaurants', text: 'A handpicked selection of quality restaurants.' },
          { title: 'Instant Booking', text: 'Reserve your table in a few clicks, no waiting.' },
          { title: 'Real Reviews', text: 'Honest feedback from real diners.' },
        ].map((item) => (
          <div key={item.title} className="rounded-xl bg-white p-6 text-center shadow-sm ring-1 ring-olive-100">
            <h3 className="font-semibold text-olive-950">{item.title}</h3>
            <p className="mt-2 text-sm text-olive-600">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
