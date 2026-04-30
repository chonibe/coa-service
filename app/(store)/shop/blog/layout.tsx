import type { Metadata } from 'next'
import { getCanonicalSiteOrigin } from '@/lib/seo/site-url'

export const metadata: Metadata = {
  metadataBase: getCanonicalSiteOrigin(),
  title: 'Street art, collecting, and artist stories | Blog | Street Collector',
  description:
    'Read Street Collector guides and artist stories about street art, limited edition prints, collecting, certificates of authenticity, and backlit art displays.',
  alternates: { canonical: '/shop/blog' },
}

export const dynamic = 'force-dynamic'

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
