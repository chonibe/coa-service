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
          Welcome to Street Collector. By using our website and services, you agree to these terms. Please read them carefully.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-2">Use of Our Site</h2>
        <p className="text-neutral-600">
          You agree to use our website and services only for lawful purposes. You must not misuse our site, attempt to gain unauthorized access, infringe on intellectual property rights, or engage in fraudulent activity. We reserve the right to suspend or terminate access for any violation of these terms.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-2">Products and Orders</h2>
        <p className="text-neutral-600">
          Our products are offered subject to availability. We reserve the right to limit quantities, refuse orders, and discontinue products at any time. All purchases are subject to our Refund Policy and Shipping Policy. Prices are in USD unless otherwise indicated and do not include VAT, sales tax, or import duties where applicable.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-2">Intellectual Property</h2>
        <p className="text-neutral-600">
          All content on this site—including text, images, logos, and designs—is the property of Street Collector or our licensors. You may not reproduce, distribute, or use our content without prior written permission.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-2">Updates</h2>
        <p className="text-neutral-600">
          We may update these terms from time to time. The current version will always be available on this page. Continued use of our services after changes constitutes acceptance of the updated terms.
        </p>

        <p className="mt-8 text-neutral-600">
          For questions about these terms, contact us at{' '}
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
