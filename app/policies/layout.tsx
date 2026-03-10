'use client'

import { useCallback } from 'react'
import { BackBar } from '@/components/shop/navigation'
import { Footer } from '@/components/impact'

const policyLinks = [
  { label: 'Terms of Service', href: '/policies/terms-of-service' },
  { label: 'Shipping Policy', href: '/policies/shipping-policy' },
  { label: 'Refund Policy', href: '/policies/refund-policy' },
  { label: 'Privacy Policy', href: '/policies/privacy-policy' },
  { label: 'Contact', href: '/shop/contact' },
]

const footerSections = [
  {
    title: 'RESOURCES',
    links: [
      { label: 'FAQ', href: '/shop/faq' },
      { label: 'Affiliate program', href: '/shop/collab' },
      { label: 'Artist Submissions', href: '/shop/artist-submissions' },
    ],
  },
  {
    title: 'TERMS & CONDITIONS',
    links: policyLinks,
  },
]

export default function PoliciesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const handleNewsletterSubmit = useCallback(async (email: string) => {
    const res = await fetch('/api/shop/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error || 'Signup failed')
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <BackBar href="/" label="Back to home" />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <Footer
        sections={footerSections}
        socialLinks={[
          { platform: 'facebook', href: 'https://facebook.com/streetcollector' },
          { platform: 'instagram', href: 'https://instagram.com/thestreetcollector' },
        ]}
        newsletterEnabled={true}
        newsletterTitle="Sign up for new stories and personal offers"
        newsletterDescription=""
        onNewsletterSubmit={handleNewsletterSubmit}
        tagline=""
        legalLinks={[]}
        showPaymentIcons={true}
      />
    </div>
  )
}
