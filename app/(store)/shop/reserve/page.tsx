import type { Metadata } from 'next'
import { getCanonicalSiteOrigin } from '@/lib/seo/site-url'
import { ReservePageClient } from './ReservePageClient'

export const metadata: Metadata = {
  metadataBase: getCanonicalSiteOrigin(),
  title: 'The Reserve — never miss an artist you love | Street Collector',
  description:
    'The Reserve includes 48-hour early access, first handling on high-demand drops, monthly credit, and locked pricing on eligible editions.',
  alternates: { canonical: '/shop/reserve' },
  openGraph: {
    title: 'The Reserve | Street Collector',
    description: 'Early access, monthly credit, and locked pricing on eligible editions.',
    url: '/shop/reserve',
    siteName: 'Street Collector',
    type: 'website',
  },
}

export default function StreetReservePage() {
  return <ReservePageClient />
}
