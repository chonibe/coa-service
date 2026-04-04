import { Metadata } from 'next'
import { homeV2LandingContent } from '@/content/home-v2-landing'
import { getShopArtistsList } from '@/lib/shop/artists-list'
import { orderArtistsForExplore } from '@/lib/shop/explore-artists-order'
import { getCanonicalSiteOrigin } from '@/lib/seo/site-url'
import { landingFontVariables } from '../home-v2/landing-fonts'
import landingStyles from '../home-v2/landing.module.css'
import { ExploreArtistsClient } from './components/ExploreArtistsClient'
import { ExploreArtistsJsonLd } from '@/components/seo/ExploreArtistsJsonLd'

const TITLE = 'Artist directory — street art & limited edition prints | Street Collector'
const DESCRIPTION =
  'Browse every Street Collector artist in one place: independent street art and urban art voices, limited edition prints, and profiles linking to each collection. Find your next piece for the lamp or wall.'

export const metadata: Metadata = {
  metadataBase: getCanonicalSiteOrigin(),
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: '/shop/explore-artists',
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/shop/explore-artists',
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
      <ExploreArtistsJsonLd />
      <ExploreArtistsClient artists={artists} experienceUrl={homeV2LandingContent.urls.experience} />
    </div>
  )
}
