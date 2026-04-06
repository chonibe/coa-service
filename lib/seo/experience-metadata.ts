import type { Metadata } from 'next'
import { getCanonicalSiteOrigin } from '@/lib/seo/site-url'
import { buildArtistDescription, buildExperienceArtistTitles } from '@/lib/seo/artist-meta'
import { getCachedArtistProfile } from '@/lib/shop/cached-shop-data'

const DEFAULT_TITLE = 'Street Lamp builder | Street Collector'
const DEFAULT_DESCRIPTION =
  'Build your Street Lamp with artwork you love. Choose limited editions and customize your lamp.'

export type ExperiencePageSearchParams = {
  artist?: string
  vendor?: string
  unlisted?: string
}

/**
 * Shared metadata for `/shop/experience` and `/shop/experience-v2` so shared links show the artist
 * (not internal “Experience V2” copy) when `?artist=` / `?vendor=` is present.
 */
export async function buildShopExperienceMetadata(
  searchParams: Promise<ExperiencePageSearchParams>,
  path: '/shop/experience' | '/shop/experience-v2'
): Promise<Metadata> {
  const resolved = await searchParams
  const artistParam = resolved?.artist?.trim()
  const vendorParam = resolved?.vendor?.trim()
  const slug = artistParam || vendorParam || ''
  const vendorKey = artistParam && vendorParam ? vendorParam : ''
  const earlyAccess = resolved?.unlisted === '1'

  const base = getCanonicalSiteOrigin()

  if (!slug) {
    return {
      metadataBase: base,
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      openGraph: {
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        url: path,
        siteName: 'Street Collector',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
      },
      robots: { index: true, follow: true },
    }
  }

  const artist = await getCachedArtistProfile(slug, vendorKey)
  const displayName = artist?.name?.trim() || slug.replace(/-/g, ' ')
  const { title, openGraphTitle } = buildExperienceArtistTitles(displayName, { earlyAccess })
  const description = artist
    ? buildArtistDescription(artist)
    : `Customize your Street Lamp with ${displayName}'s art on Street Collector.`

  const query = new URLSearchParams()
  if (artistParam) query.set('artist', artistParam)
  else if (vendorParam) query.set('vendor', vendorParam)
  if (earlyAccess) query.set('unlisted', '1')
  const pathWithQuery = query.toString() ? `${path}?${query.toString()}` : path

  return {
    metadataBase: base,
    title,
    description,
    alternates: { canonical: pathWithQuery },
    openGraph: {
      title: openGraphTitle,
      description,
      url: pathWithQuery,
      siteName: 'Street Collector',
      type: 'website',
      images: artist?.image ? [{ url: artist.image, alt: displayName }] : undefined,
    },
    twitter: {
      card: artist?.image ? 'summary_large_image' : 'summary',
      title: openGraphTitle,
      description,
      images: artist?.image ? [artist.image] : undefined,
    },
    robots: { index: true, follow: true },
  }
}
