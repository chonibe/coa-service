import type {
  ArtistProfileRich,
  ExhibitionRow,
  InstagramShowcaseItem,
  PressCard,
  ProcessGalleryItem,
} from '@/lib/shop/artist-profile-api'
import researchData from '@/content/artist-research-data.json'

export type RawArtistResearchRow = Record<string, string>

const bySlug = researchData as Record<string, RawArtistResearchRow>

export function lookupArtistResearch(slug: string): RawArtistResearchRow | undefined {
  if (bySlug[slug]) return bySlug[slug]
  const base = slug.replace(/-\d+$/, '')
  if (base !== slug && bySlug[base]) return bySlug[base]
  return undefined
}

/** Skip Instagram post/reel URLs — not usable as <img src> without oEmbed. */
export function isDirectImageUrl(url: string): boolean {
  const t = url.trim()
  if (!t) return false
  if (/instagram\.com\/(p|reel|stories|tv)\//i.test(t)) return false
  return (
    /\.(jpe?g|png|webp|gif)(\?|$)/i.test(t) ||
    /shopifycdn|cdn\.shopify|cloudinary|imgur\.com\/(i\/)?/i.test(t)
  )
}

function parseExhibitions(text: string): ExhibitionRow[] {
  const rows: ExhibitionRow[] = []
  for (const line of text.split('\n').map((l) => l.trim()).filter(Boolean)) {
    const m = line.match(/^(\d{4})\s*[—–-]\s*(.+)$/)
    if (m) {
      rows.push({
        year: Number.parseInt(m[1], 10),
        type: 'Exhibition',
        title: m[2].trim(),
        venue: '',
        city: '',
      })
    }
  }
  return rows
}

function parsePress(text: string): PressCard[] {
  const cards: PressCard[] = []
  for (const line of text.split('\n').map((l) => l.trim()).filter(Boolean)) {
    const parts = line.split(/\s+[—–-]\s+/).map((p) => p.trim())
    if (parts.length < 2) continue
    const outlet = parts[0]
    let year: string | undefined
    let i = 1
    if (/^\d{4}$/.test(parts[1])) {
      year = parts[1]
      i = 2
    }
    let url: string | undefined
    let end = parts.length
    const last = parts[parts.length - 1]
    if (last?.startsWith('http')) {
      url = last
      end = parts.length - 1
    }
    const quote = parts.slice(i, end).join(' — ') || outlet
    cards.push({ outlet, year, quote, url })
  }
  return cards
}

function processGalleryFromRaw(raw: RawArtistResearchRow): ProcessGalleryItem[] {
  const items: ProcessGalleryItem[] = []
  const pairs: [string, string][] = [
    [raw.processImage1Url, raw.processImage1Label],
    [raw.processImage2Url, raw.processImage2Label],
    [raw.processImage3Url, raw.processImage3Label],
    [raw.processImage4Url, raw.processImage4Label],
  ]
  for (const [url, label] of pairs) {
    const u = url?.trim()
    if (u && isDirectImageUrl(u)) {
      items.push({ url: u, label: label?.trim() || undefined })
    }
  }
  return items
}

function instagramShowcaseFromRaw(raw: RawArtistResearchRow): InstagramShowcaseItem[] {
  const text = raw.instagramPostImageUrls?.trim()
  if (!text) return []
  const items: InstagramShowcaseItem[] = []
  for (const line of text.split('\n').map((l) => l.trim()).filter(Boolean)) {
    if (isDirectImageUrl(line)) {
      items.push({ url: line, kind: 'Post' })
    }
  }
  return items.slice(0, 12)
}

/**
 * Fills empty Shopify metafield-backed profile fields from CSV research.
 * Arrays (process, exhibitions, press, showcase) only apply when Shopify sent none.
 */
export function mergeResearchIntoProfile(shopify: ArtistProfileRich, slug: string): ArtistProfileRich {
  const raw = lookupArtistResearch(slug)
  if (!raw) return shopify

  const pressParsed = parsePress(raw.pressText || '')
  const exParsed = parseExhibitions(raw.exhibitionsText || '')
  const processGallery = processGalleryFromRaw(raw)
  const instagramShowcase = instagramShowcaseFromRaw(raw)

  return {
    location: shopify.location?.trim() || raw.location?.trim() || undefined,
    alias: shopify.alias?.trim() || undefined,
    storyHook: shopify.storyHook?.trim() || raw.heroHook?.trim() || undefined,
    pullquote: shopify.pullquote?.trim() || raw.pullQuote?.trim() || undefined,
    processGallery:
      shopify.processGallery && shopify.processGallery.length > 0
        ? shopify.processGallery
        : processGallery.length > 0
          ? processGallery
          : undefined,
    exhibitions:
      shopify.exhibitions && shopify.exhibitions.length > 0 ? shopify.exhibitions : exParsed.length > 0 ? exParsed : undefined,
    press: shopify.press && shopify.press.length > 0 ? shopify.press : pressParsed.length > 0 ? pressParsed : undefined,
    instagramShowcase:
      shopify.instagramShowcase && shopify.instagramShowcase.length > 0
        ? shopify.instagramShowcase
        : instagramShowcase.length > 0
          ? instagramShowcase
          : undefined,
    activeSince: shopify.activeSince?.trim() || raw.activeSince?.trim() || undefined,
    impactCallout: shopify.impactCallout?.trim() || raw.impactCallout?.trim() || undefined,
    exclusiveCallout: shopify.exclusiveCallout?.trim() || raw.exclusiveCallout?.trim() || undefined,
  }
}

export function mergeResearchBio(slug: string, existingBio: string | undefined): string | undefined {
  if (existingBio?.trim()) return existingBio.trim()
  const raw = lookupArtistResearch(slug)
  return raw?.storyFullText?.trim() || undefined
}

export function researchInstagramHandle(slug: string): string | undefined {
  const raw = lookupArtistResearch(slug)
  const h = raw?.instagramHandle?.trim()
  if (!h) return undefined
  return h.replace(/^@/, '').split('/')[0]?.split('?')[0]?.trim() || undefined
}
