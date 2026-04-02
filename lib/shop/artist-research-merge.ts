import type {
  ArtistProfileRich,
  ExhibitionRow,
  InstagramShowcaseItem,
  PressCard,
  ProcessGalleryItem,
} from '@/lib/shop/artist-profile-api'
import { isInstagramPostOrReelUrl } from '@/lib/shop/instagram-embed'
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

const EXH_TYPE_WORD = /^(solo|group|mural|residency|commission|duo|two-person)$/i

function capitalizeWord(w: string): string {
  if (!w) return w
  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
}

function normalizeExhibitionType(raw: string): string {
  const t = raw.toLowerCase().replace(/-/g, ' ').trim()
  if (t === 'two person' || t === 'duo') return 'Group'
  return capitalizeWord(t)
}

/** Turn CSV / research lines into demo-style type, title, venue, city when commas allow. */
function parseExhibitionRest(rest: string): Pick<ExhibitionRow, 'type' | 'title' | 'venue' | 'city'> {
  const full = rest.trim()
  const noParen = full.replace(/\s*\([^)]*\)\s*$/g, '').trim()
  const commas = noParen.split(',').map((x) => x.trim()).filter(Boolean)

  if (commas.length >= 4 && EXH_TYPE_WORD.test(commas[0])) {
    const type = normalizeExhibitionType(commas[0])
    const title = commas[1]
    if (commas.length === 4) {
      return { type, title, venue: commas[2], city: commas[3] }
    }
    const city = commas.slice(-2).join(', ')
    const venue = commas.slice(2, -2).join(', ')
    return { type, title, venue, city }
  }

  if (commas.length === 3) {
    return { type: 'Exhibition', title: commas[0], venue: commas[1], city: commas[2] }
  }
  if (commas.length === 2) {
    return { type: 'Exhibition', title: commas[0], venue: '', city: commas[1] }
  }

  return { type: 'Exhibition', title: noParen, venue: '', city: '' }
}

function parseExhibitions(text: string): ExhibitionRow[] {
  const rows: ExhibitionRow[] = []
  for (const line of text.split('\n').map((l) => l.trim()).filter(Boolean)) {
    const m = line.match(/^(\d{4})\s*[—–-]\s*(.+)$/)
    if (!m) continue
    const year = Number.parseInt(m[1], 10)
    if (!Number.isFinite(year)) continue
    const parsed = parseExhibitionRest(m[2])
    rows.push({ year, ...parsed })
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
    if (!u) continue
    if (isDirectImageUrl(u) || isInstagramPostOrReelUrl(u)) {
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
    } else if (isInstagramPostOrReelUrl(line)) {
      const kind = /\/reel\//i.test(line) ? 'Reel' : 'Post'
      items.push({ url: line, kind, link: line })
    }
  }
  return items.slice(0, 12)
}

function exhibitionKey(r: ExhibitionRow): string {
  return `${r.year}:${(r.title || '').trim().toLowerCase().slice(0, 160)}`
}

function mergeExhibitionRows(shopify: ExhibitionRow[] | undefined, research: ExhibitionRow[]): ExhibitionRow[] | undefined {
  const fromShop = (shopify ?? []).filter(
    (r) => r && Number.isFinite(r.year) && `${r.title || ''}${r.venue || ''}${r.city || ''}`.trim().length > 0
  )
  const keys = new Set(fromShop.map(exhibitionKey))
  const out = [...fromShop]
  for (const r of research) {
    if (!Number.isFinite(r.year)) continue
    const k = exhibitionKey(r)
    if (!keys.has(k)) {
      out.push(r)
      keys.add(k)
    }
  }
  return out.length > 0 ? out : undefined
}

function pressKey(c: PressCard): string {
  return `${(c.outlet || '').trim().toLowerCase()}:${(c.quote || '').trim().toLowerCase().slice(0, 120)}`
}

function mergePressCards(shopify: PressCard[] | undefined, research: PressCard[]): PressCard[] | undefined {
  const fromShop = (shopify ?? []).filter((c) => c && (c.outlet?.trim() || c.quote?.trim()))
  const keys = new Set(fromShop.map(pressKey))
  const out = [...fromShop]
  for (const c of research) {
    const k = pressKey(c)
    if (!keys.has(k)) {
      out.push(c)
      keys.add(k)
    }
  }
  return out.length > 0 ? out : undefined
}

function galleryUrlKey(url: string): string {
  return url.trim().toLowerCase()
}

function mergeProcessGalleries(
  shopify: ProcessGalleryItem[] | undefined,
  research: ProcessGalleryItem[]
): ProcessGalleryItem[] | undefined {
  const fromShop = (shopify ?? []).filter((x) => x?.url?.trim())
  const keys = new Set(fromShop.map((x) => galleryUrlKey(x.url)))
  const out = [...fromShop]
  for (const r of research) {
    const k = galleryUrlKey(r.url)
    if (!keys.has(k)) {
      out.push(r)
      keys.add(k)
    }
  }
  return out.length > 0 ? out : undefined
}

function mergeInstagramShowcaseItems(
  shopify: InstagramShowcaseItem[] | undefined,
  research: InstagramShowcaseItem[]
): InstagramShowcaseItem[] | undefined {
  const fromShop = (shopify ?? []).filter((x) => x?.url?.trim())
  const keys = new Set(fromShop.map((x) => galleryUrlKey(x.url)))
  const out = [...fromShop]
  for (const r of research) {
    const k = galleryUrlKey(r.url)
    if (!keys.has(k)) {
      out.push(r)
      keys.add(k)
    }
  }
  return out.length > 0 ? out.slice(0, 12) : undefined
}

/**
 * Fills Shopify metafield-backed profile fields from CSV research.
 * Scalar fields still prefer Shopify when set. List fields merge research in with deduping so
 * partial Shopify data does not hide research (exhibitions, press, process, Instagram showcase).
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
    processGallery: mergeProcessGalleries(shopify.processGallery, processGallery),
    exhibitions: mergeExhibitionRows(shopify.exhibitions, exParsed),
    press: mergePressCards(shopify.press, pressParsed),
    instagramShowcase: mergeInstagramShowcaseItems(shopify.instagramShowcase, instagramShowcase),
    activeSince: shopify.activeSince?.trim() || raw.activeSince?.trim() || undefined,
    impactCallout: shopify.impactCallout?.trim() || raw.impactCallout?.trim() || undefined,
    exclusiveCallout: shopify.exclusiveCallout?.trim() || raw.exclusiveCallout?.trim() || undefined,
  }
}

export function mergeResearchBio(slug: string, existingBio: string | undefined): string | undefined {
  if (existingBio?.trim()) return existingBio.trim()
  const raw = lookupArtistResearch(slug)
  if (!raw) return undefined
  const story = raw.storyFullText?.trim()
  const history = raw.additionalHistoryText?.trim()
  if (story && history) return `${story}\n\n${history}`
  return story || history || undefined
}

export function researchInstagramHandle(slug: string): string | undefined {
  const raw = lookupArtistResearch(slug)
  const h = raw?.instagramHandle?.trim()
  if (!h) return undefined
  return h.replace(/^@/, '').split('/')[0]?.split('?')[0]?.trim() || undefined
}
