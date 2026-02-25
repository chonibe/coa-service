import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description: 'Shipping policy for The Street Collector',
}

export default function ShippingPolicyPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold text-neutral-900">Shipping Policy</h1>
      <div className="mt-6 prose prose-neutral max-w-none">
        <p className="text-neutral-600">
          We ship to addresses within the United States and select international
          destinations. Shipping costs and delivery times vary by location.
        </p>
        <p className="mt-4 text-neutral-600">
          Orders are typically processed within 1–3 business days. Once shipped, you
          will receive tracking information via email. Delivery usually takes 5–10
          business days for domestic orders.
        </p>
        <p className="mt-4 text-neutral-600">
          Artworks and limited editions are shipped with care. We use protective
          packaging to ensure your order arrives in excellent condition.
        </p>
        <p className="mt-4 text-neutral-600">
          For questions about shipping, contact us at hello@thestreetcollector.com.
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
