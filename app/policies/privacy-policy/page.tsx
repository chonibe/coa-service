import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for The Street Collector. How we collect, use, and protect your personal information.',
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold text-neutral-900">Privacy Policy</h1>
      <div className="mt-6 prose prose-neutral max-w-none">
        <p className="text-neutral-600">
          Street Collector respects your privacy. This policy describes how we collect, use, and protect your personal information when you use our website and services.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-2">Information We Collect</h2>
        <p className="text-neutral-600">
          We collect information you provide when you make a purchase, create an account, subscribe to our newsletter, submit artist applications, or contact us. This may include your name, email address, shipping address, payment information, and any messages you send us.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-2">How We Use Your Information</h2>
        <p className="text-neutral-600">
          We use your information to fulfill orders, communicate with you about your orders, send marketing communications (with your consent), improve our services, and respond to your inquiries. We may also use analytics to understand how visitors use our site.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-2">Sharing Your Information</h2>
        <p className="text-neutral-600">
          We do not sell your personal information. We may share data with service providers who assist with operations, including payment processors, shipping carriers, and email services. These providers are bound by confidentiality and use your data only to perform services for us.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-2">Cookies and Tracking</h2>
        <p className="text-neutral-600">
          We use cookies and similar technologies to improve your experience, remember your preferences, and understand site usage. You can manage cookie preferences through your browser settings.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-2">Your Rights</h2>
        <p className="text-neutral-600">
          Depending on where you live, you may have the right to access, correct, or delete your personal information, and to opt out of certain uses. To exercise these rights or for personal data requests, contact us at the email below. If you wish to contact our Data Protection Officer, please include &quot;DPO&quot; in the subject line.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-2">Data Security</h2>
        <p className="text-neutral-600">
          We take reasonable measures to protect your personal information from unauthorized access, loss, or misuse. Payment information is processed through secure, PCI-compliant providers.
        </p>

        <p className="mt-8 text-neutral-600">
          For questions about this policy, contact us at{' '}
          <a href="mailto:info@thestreetlamp.com" className="text-neutral-900 underline hover:no-underline">
            info@thestreetlamp.com
          </a>
          . This policy may be updated from time to time; the current version will always be available on this page.
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
