import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Refund Policy',
  description: 'Refund policy for The Street Collector',
}

export default function RefundPolicyPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold text-neutral-900">Refund Policy</h1>
      <div className="mt-6 prose prose-neutral max-w-none">
        <p className="text-neutral-600">
          We want you to love your purchase. If you&apos;re not satisfied, please contact us
          within 30 days of delivery to discuss returns or refunds.
        </p>
        <p className="mt-4 text-neutral-600">
          Refunds are processed based on the condition of the item and circumstances.
          Contact us at hello@thestreetcollector.com to start a return or refund request.
        </p>
        <p className="mt-4 text-neutral-600">
          This policy may be updated. Please check back for the latest information.
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
