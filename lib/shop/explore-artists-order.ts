import { streetCollectorContent } from '@/content/street-collector'
import type { ShopArtist } from '@/lib/shop/artists-list'

/** Artist row for explore page: live API data plus optional location from featured seed (see docs/features/street-collector/artists.md lineage). */
export type ExploreArtistRow = ShopArtist & {
  location?: string
}

/**
 * Featured artists first (seed order from `streetCollectorContent.featuredArtists.collections`),
 * then remaining artists alphabetically by name.
 */
export function orderArtistsForExplore(artists: ShopArtist[]): ExploreArtistRow[] {
  const featured = streetCollectorContent.featuredArtists.collections
  const bySlug = new Map<string, ShopArtist>()
  for (const a of artists) {
    bySlug.set(a.slug.toLowerCase(), a)
  }
  const used = new Set<string>()
  const ordered: ExploreArtistRow[] = []

  for (const f of featured) {
    const key = f.handle.toLowerCase()
    const a = bySlug.get(key)
    if (a) {
      const location = 'location' in f ? f.location : undefined
      ordered.push({
        ...a,
        location,
      })
      used.add(key)
    }
  }

  const rest = artists
    .filter((a) => !used.has(a.slug.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((a) => ({ ...a }))

  return [...ordered, ...rest]
}
