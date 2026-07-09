import type { Metadata } from 'next'
import { getStorePageContent } from '@/lib/content/site-content'
import { getCanonicalSiteOrigin } from '@/lib/seo/site-url'

export const dynamic = 'force-dynamic'

const TITLE = 'Blog — street art stories, drops & Street Collector updates'
const DESCRIPTION =
  'Street art stories, artist notes, drop updates, and collector guidance from Street Collector.'
const homeV2LandingContent = getStorePageContent('homeV2')

export const metadata: Metadata = {
  metadataBase: getCanonicalSiteOrigin(),
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: '/shop/blog',
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/shop/blog',
    siteName: 'Street Collector',
    type: 'website',
    images: [
      {
        url: homeV2LandingContent.urls.openGraphImageUrl,
        alt: 'Street Collector blog',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [homeV2LandingContent.urls.openGraphImageUrl],
  },
  robots: { index: true, follow: true },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
