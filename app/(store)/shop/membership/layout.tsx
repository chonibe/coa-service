import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Membership | Street Collector',
  description:
    'Compare Street Collector membership plans, included perks, and collector support.',
  alternates: { canonical: '/shop/membership' },
}

export default function MembershipLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
