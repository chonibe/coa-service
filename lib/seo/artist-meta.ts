import type { ArtistProfileApiResponse } from '@/lib/shop/artist-profile-api'

const BRAND = 'Street Collector'
const MAX_TITLE = 60
const MAX_DESC = 160

function truncate(s: string, max: number): string {
  const t = s.trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…'
}

/**
 * SEO title for artist collection pages (strategy template).
 */
export function buildArtistTitle(name: string): string {
  const base = `${name} | Limited Edition Prints | ${BRAND}`
  return truncate(base, MAX_TITLE)
}

/**
 * Meta description: artist name, limited edition, COA, worldwide (strategy template).
 */
export function buildArtistDescription(artist: Pick<ArtistProfileApiResponse, 'name' | 'stats'>): string {
  const name = artist.name
  const workCount = artist.stats?.editionCount ?? 0
  const parts = [
    `Collect ${name}'s street art prints on ${BRAND}.`,
    workCount > 0 ? `${workCount} limited edition artwork${workCount === 1 ? '' : 's'}.` : 'Limited edition artworks.',
    'Ships worldwide with Certificate of Authenticity.',
  ]
  return truncate(parts.join(' '), MAX_DESC)
}

export function buildArtistOgTitle(name: string): string {
  return `${name} — Limited edition prints | ${BRAND}`
}

/** Experience /shop/experience* pages with ?artist= — never use internal “Experience V2” labels in SERP/social. */
export function buildExperienceArtistTitles(
  name: string,
  opts?: { earlyAccess?: boolean }
): { title: string; openGraphTitle: string } {
  if (opts?.earlyAccess) {
    return {
      title: truncate(`Early access — ${name} | ${BRAND}`, MAX_TITLE),
      openGraphTitle: `Early access — ${name} — Limited edition prints | ${BRAND}`,
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
    ? `${name} is an urban and street art artist based in ${loc}.`
    : `${name} is an urban and street art artist on Street Collector.`
  const mid =
    n > 0
      ? ` Collect limited edition ${name} prints (${n} artwork${n === 1 ? '' : 's'} listed)—each run is finite, with Certificate of Authenticity.`
      : ` Collect limited edition ${name} prints on Street Collector with Certificate of Authenticity.`
  const close = ' Works ship worldwide; browse editions in the Works tab.'
  return (open + mid + close).replace(/\s+/g, ' ').trim()
}
