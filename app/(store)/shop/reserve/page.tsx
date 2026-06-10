import type { Metadata } from 'next'
import { getCanonicalSiteOrigin } from '@/lib/seo/site-url'
import { ReservePageClient } from './ReservePageClient'

export const metadata: Metadata = {
  metadataBase: getCanonicalSiteOrigin(),
  title: 'The Reserve — never miss an artist you love | Street Collector',
  description:
    'The Reserve: 48-hour early access to drops, priority allocation, $20/month drop credit, and ground-floor price locks. Limited edition street art.',
  alternates: { canonical: '/shop/reserve' },
  openGraph: {
    title: 'The Reserve | Street Collector',
    description: 'Membership for collectors: early access, credit, and price locks on limited edition drops.',
    url: '/shop/reserve',
    siteName: 'Street Collector',
    type: 'website',
  },
}

export default function StreetReservePage() {
  return <ReservePageClient />
}
