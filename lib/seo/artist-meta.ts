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
 * SEO title for artist collection pages.
 */
export function buildArtistTitle(name: string): string {
  const base = `${name} limited edition prints | ${BRAND}`
  return truncate(base, MAX_TITLE)
}

/**
 * Meta description for artist collection pages.
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
    'Artist details, finite releases, worldwide shipping.',
  ]
  return truncate(parts.join(' '), MAX_DESC)
}

export function buildArtistOgTitle(name: string): string {
  return `${name} - limited edition prints | ${BRAND}`
}

/** Experience /shop/experience* pages with ?artist= never use internal "Experience V2" labels in SERP/social. */
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

/** Short editorial lead for artist profile pages. */
export function buildArtistAnswerFirstLead(artist: ArtistProfileApiResponse): string {
  const name = artist.name
  const loc = artist.profile?.location?.trim()
  const alias = artist.profile?.alias?.trim()
  const activeSince = artist.profile?.activeSince?.trim()
  const base = loc ? `${name} is an artist based in ${loc}.` : `${name} is an artist.`
  const details = [alias, activeSince ? `Active since ${activeSince}.` : null]
    .filter(Boolean)
    .join(' ')
  return [base, details].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}
