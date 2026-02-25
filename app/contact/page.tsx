import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with The Street Collector',
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold text-neutral-900">Contact Us</h1>
        <p className="mt-4 text-neutral-600">
          Have questions or feedback? We&apos;d love to hear from you.
        </p>
        <div className="mt-8 space-y-6">
          <div>
            <h2 className="text-lg font-medium text-neutral-900">Email</h2>
            <a
              href="mailto:hello@thestreetcollector.com"
              className="mt-1 block text-neutral-600 hover:text-neutral-900"
            >
              hello@thestreetcollector.com
            </a>
          </div>
          <div>
            <h2 className="text-lg font-medium text-neutral-900">Response Time</h2>
            <p className="mt-1 text-neutral-600">
              We aim to respond within 24–48 business hours.
            </p>
          </div>
        </div>
        <Link
          href="/shop"
          className="mt-10 inline-block text-sm font-medium text-neutral-600 hover:text-neutral-900"
        >
          ← Back to Shop
        </Link>
      </div>
    </main>
  )
}
