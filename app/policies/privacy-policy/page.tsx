import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for The Street Collector',
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold text-neutral-900">Privacy Policy</h1>
      <div className="mt-6 prose prose-neutral max-w-none">
        <p className="text-neutral-600">
          We respect your privacy. This policy describes how we collect, use, and
          protect your personal information when you use our website and services.
        </p>
        <p className="mt-4 text-neutral-600">
          We collect information you provide when you make a purchase, create an
          account, or contact us. We use this to fulfill orders, communicate with
          you, and improve our services.
        </p>
        <p className="mt-4 text-neutral-600">
          We do not sell your personal information. We may share data with service
          providers who assist with operations (e.g., payment and shipping).
        </p>
        <p className="mt-4 text-neutral-600">
          For questions, contact us at hello@thestreetcollector.com. This policy may
          be updated from time to time.
        </p>
      </div>
      <Link
        href="/shop"
        className="mt-10 inline-block text-sm font-medium text-neutral-600 hover:text-neutral-900"
      >
        ← Back to Shop
      </Link>
    </>
  )
}
