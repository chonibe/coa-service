import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Art series | Street Collector',
  description:
    'Browse artwork series on Street Collector — track progress, discover collections, and shop limited editions.',
  alternates: { canonical: '/shop/series' },
}

export default function SeriesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
