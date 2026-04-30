import type { ArtistProfileApiResponse } from '@/lib/shop/artist-profile-api'

const BRAND = 'Street Collector'
const MAX_TITLE = 60
const MAX_DESC = 160

function truncate(s: string, max: number): string {
  const t = s.trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd() + '...'
}

/**
 * SEO title for artist collection pages (strategy template).
 */
export function buildArtistTitle(name: string): string {
  const base = `${name} limited edition prints | ${BRAND}`
  return truncate(base, MAX_TITLE)
}

/**
 * Meta description: artist name, finite editions, location where available.
 */
export function buildArtistDescription(
  artist: Pick<ArtistProfileApiResponse, 'name' | 'stats' | 'profile'>
): string {
  const name = artist.name
  const workCount = artist.stats?.editionCount ?? 0
  const loc = artist.profile?.location?.trim()
  const parts = [
    `Collect limited edition prints by ${name}${loc ? `, an artist based in ${loc}` : ''}.`,
    workCount > 0
      ? `${workCount} limited edition artwork${workCount === 1 ? '' : 's'}.`
      : 'Limited edition artworks.',
    'Artist context, finite releases, worldwide shipping.',
  ]
  return truncate(parts.join(' '), MAX_DESC)
}

export function buildArtistOgTitle(name: string): string {
  return `${name} - limited edition prints | ${BRAND}`
}

/** Experience /shop/experience* pages with ?artist= - never use internal labels in SERP/social. */
export function buildExperienceArtistTitles(
  name: string,
  opts?: { earlyAccess?: boolean }
): { title: string; openGraphTitle: string } {
  if (opts?.earlyAccess) {
    return {
      title: truncate(`Early access - ${name} | ${BRAND}`, MAX_TITLE),
      openGraphTitle: `Early access - ${name} - limited edition prints | ${BRAND}`,
    }
  }
  return {
    title: buildArtistTitle(name),
    openGraphTitle: buildArtistOgTitle(name),
  }
}

export function buildArtistH1(name: string): string {
  return name
}

/** Answer-first, citable lead (GEO): who they are + what you can buy here. */
export function buildArtistAnswerFirstLead(artist: ArtistProfileApiResponse): string {
  const name = artist.name
  const loc = artist.profile?.location?.trim()
  const n = artist.stats?.editionCount ?? artist.products.length
  const open = loc
    ? `${name} is an artist in the Street Collector roster based in ${loc}.`
    : `${name} is an artist in the Street Collector roster.`
  const collectorContext =
    n > 0
      ? ` Collect limited edition ${name} prints (${n} artwork${n === 1 ? '' : 's'} listed); each release is finite and documented for collectors.`
      : ` Collect limited edition ${name} prints on Street Collector, with finite releases documented for collectors.`
  const close = ' Works ship worldwide; browse editions in the Works tab.'
  return (open + collectorContext + close).replace(/\s+/g, ' ').trim()
}
