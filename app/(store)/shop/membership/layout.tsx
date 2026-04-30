import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Membership | Street Collector',
  description:
    'Street Collector membership tiers, perks, and support for collectors. Compare plans and benefits.',
  alternates: { canonical: '/shop/membership' },
}

export default function MembershipLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
