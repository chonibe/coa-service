import { Metadata } from 'next'
import { StreetCollectorFAQ } from '@/app/(store)/shop/street-collector/StreetCollectorFAQ'
import { getStorePageContent } from '@/lib/content/site-content'

const faqContent = getStorePageContent('faq')

export const metadata: Metadata = {
  title: 'Common Questions',
  description:
    'Answers about shipping, artworks, the Street Lamp, tracking, editions, and order details.',
  alternates: { canonical: '/shop/faq' },
}

export default function FAQPage() {
  return (
    <main className="dark min-h-screen w-full bg-[#0f0d0d] text-[#f0e8e8] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <StreetCollectorFAQ title="Common Questions" groups={faqContent} />
    </main>
  )
}
