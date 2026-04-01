import { Metadata } from 'next'
import { homeV2LandingContent } from '@/content/home-v2-landing'
import { getShopArtistsList } from '@/lib/shop/artists-list'
import { orderArtistsForExplore } from '@/lib/shop/explore-artists-order'
import { landingFontVariables } from '../home-v2/landing-fonts'
import landingStyles from '../home-v2/landing.module.css'
import { ExploreArtistsClient } from './components/ExploreArtistsClient'

const TITLE = 'Explore the artists | Street Collector'
const DESCRIPTION =
  'Browse independent street artists behind Street Collector prints. Find a creator you love, open their profile, and build your lamp collection.'

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thestreetcollector.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: '/explore-artists',
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/explore-artists',
    siteName: 'Street Collector',
    type: 'website',
    images: [
      {
        url: homeV2LandingContent.urls.openGraphImageUrl,
        alt: 'Street Collector artists and art collection',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [homeV2LandingContent.urls.openGraphImageUrl],
  },
}

export const dynamic = 'force-dynamic'

export default async function ExploreArtistsPage() {
  const raw = await getShopArtistsList()
  const artists = orderArtistsForExplore(raw)

  return (
    <div className={`${landingFontVariables} ${landingStyles.page}`}>
      <ExploreArtistsClient artists={artists} experienceUrl={homeV2LandingContent.urls.experience} />
    </div>
  )
}
