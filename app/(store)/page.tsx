import type { Metadata } from 'next'
import { getCanonicalSiteOrigin } from '@/lib/seo/site-url'

/**
 * Root route (/) - Main landing page when you visit thestreetcollector.com (or www).
 * Renders the same content as the street-collector page so the URL stays / with no redirect.
 * Uses (store) layout so Footer, Cart, and ChatIcon are shown.
 */
export { default, revalidate } from './shop/street-collector/page'

export const metadata: Metadata = {
  metadataBase: getCanonicalSiteOrigin(),
  title: 'What is Street Collector? | Backlit lamp & limited edition street art prints',
  description:
    'Street Collector pairs a premium illuminated display with swappable limited-edition street art prints from independent artists. Editioned works, Certificate of Authenticity, worldwide shipping.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Street Collector - illuminated art & limited edition prints',
    description:
      'Collect limited edition street art prints and display them in a backlit Street Collector lamp. Small runs, COA, ships worldwide.',
    url: '/',
    siteName: 'Street Collector',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Street Collector - illuminated art & limited edition prints',
    description:
      'Collect limited edition street art prints and display them in a backlit Street Collector lamp. Small runs, COA, ships worldwide.',
  },
}
