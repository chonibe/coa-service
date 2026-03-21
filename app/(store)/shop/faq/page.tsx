import { Metadata } from 'next'
import { StreetCollectorFAQ } from '@/app/(store)/shop/street-collector/StreetCollectorFAQ'
import { shopFaqGroups } from '@/content/shop-faq'

export const metadata: Metadata = {
  title: 'Questions?',
  description:
    'Frequently asked questions about shipping, artworks, and The Street Lamp. Production time, delivery, tracking, limited editions, authenticity, and more.',
}

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-white">
      <StreetCollectorFAQ title="Questions?" groups={shopFaqGroups} />
    </main>
  )
}
