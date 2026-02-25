import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of service for The Street Collector',
}

export default function TermsOfServicePage() {
  return (
    <>
      <h1 className="text-3xl font-semibold text-neutral-900">Terms of Service</h1>
      <div className="mt-6 prose prose-neutral max-w-none">
        <p className="text-neutral-600">
          By using The Street Collector website and services, you agree to these
          terms. Please read them carefully.
        </p>
        <p className="mt-4 text-neutral-600">
          Our products are offered subject to availability. We reserve the right to
          limit quantities and refuse orders. All purchases are subject to our
          Refund and Shipping policies.
        </p>
        <p className="mt-4 text-neutral-600">
          You agree not to misuse our site, infringe on intellectual property, or
          engage in fraudulent activity. We may update these terms; continued use
          constitutes acceptance.
        </p>
        <p className="mt-4 text-neutral-600">
          For questions, contact us at hello@thestreetcollector.com.
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
