import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Art series | Street Collector',
  description:
    'Browse Street Collector series and follow grouped releases across limited editions.',
  alternates: { canonical: '/shop/series' },
}

export default function SeriesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
