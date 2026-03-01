import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Refund Policy',
  description: 'Refund and return policy for The Street Collector. We want you to love your purchase.',
}

export default function RefundPolicyPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold text-neutral-900">Refund Policy</h1>
      <div className="mt-6 prose prose-neutral max-w-none">
        <p className="text-neutral-600">
          We want you to love your purchase from Street Collector. If you&apos;re not satisfied, we&apos;re here to help.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-2">Returns & Refunds</h2>
        <p className="text-neutral-600">
          If you need to return an item or request a refund, please contact us within 30 days of delivery. Refunds are processed based on the condition of the item and circumstances. Each case is reviewed individually to ensure a fair outcome.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-2">How to Start a Return</h2>
        <p className="text-neutral-600">
          Email us at{' '}
          <a href="mailto:info@thestreetlamp.com" className="text-neutral-900 underline hover:no-underline">
            info@thestreetlamp.com
          </a>
          {' '}with your order number and reason for the return. Our team will provide instructions for returning the item and processing your refund.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-2">Refund Processing</h2>
        <p className="text-neutral-600">
          Once we receive and inspect your return, we will notify you of the approval or rejection of your refund. If approved, your refund will be processed to your original method of payment. Refunds typically appear within 5–10 business days depending on your financial institution.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-2">Damaged or Defective Items</h2>
        <p className="text-neutral-600">
          If you receive a damaged or defective item, please contact us immediately with photos. We will arrange a replacement or full refund as appropriate.
        </p>

        <p className="mt-8 text-neutral-600">
          This policy may be updated from time to time. Please check back for the latest information. For questions, contact us at{' '}
          <a href="mailto:info@thestreetlamp.com" className="text-neutral-900 underline hover:no-underline">
            info@thestreetlamp.com
          </a>
          .
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
