import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Street Reserve | Street Collector',
  description:
    'Lock pricing and access reserved Street Collector tiers. Compare Street Reserve plans for collectors.',
  alternates: { canonical: '/shop/reserve' },
}

export default function ReserveLayout({ children }: { children: React.ReactNode }) {
  return children
}
