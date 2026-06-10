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
const RESEARCH_SLUG_ALIASES: Record<string, string[]> = {
  zivink: ['erezoo'],
  zivsameach: ['erezoo'],
}
const MOJIBAKE_MARKERS = /(?:Ã.|Â.|â.|ðŸ|�)/g
const INTERNAL_NOTE_PATTERNS = [
  /\bauto-extracted from primary source page\b/i,
  /\bverify before publishing\b/i,
  /\bweb research\b/i,
  /\bmanual web enrichment applied\b/i,
  /\benrichment pass\b/i,
  /\bbatch\s+\d+\b/i,
  /\bdo not conflate\b/i,
  /\breminder\s+\d{4}-\d{2}-\d{2}\b/i,
  /\bprior exhibitions cell\b/i,
  /\bindexed sources\b/i,
]
const SCRAPE_BOILERPLATE_PATTERNS = [
  /behance sign in explore jobs resources/i,
  /download on the app store/i,
  /cookie preferences/i,
  /do not sell or share my personal information/i,
  /navigate to adobe\.com/i,
  /\bhome products cart about the artist\b/i,
  /\bback to top\b/i,
  /\blog in about\b/i,
]
const DEDUPE_DASH = /\s*[-–—]\s*/g

function mojibakeScore(value: string): number {
  return value.match(MOJIBAKE_MARKERS)?.length ?? 0
}

function decodeLatin1AsUtf8(value: string): string {
  const bytes = Uint8Array.from(value, (char) => char.charCodeAt(0) & 0xff)
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
}

function fixLikelyMojibake(value: string): string {
  let current = value
  let currentScore = mojibakeScore(current)
  if (currentScore === 0) return current

  for (let i = 0; i < 2; i += 1) {
    const decoded = decodeLatin1AsUtf8(current)
    const decodedScore = mojibakeScore(decoded)
    if (decodedScore >= currentScore) break
    current = decoded
    currentScore = decodedScore
    if (currentScore === 0) break
  }

  return current
}

function normalizeWhitespace(value: string): string {
  return value
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function sanitizeInlineText(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined
  const cleaned = normalizeWhitespace(fixLikelyMojibake(value))
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned || undefined
}

function sanitizeStoryHook(value: string | undefined): string | undefined {
  const cleaned = sanitizeInlineText(value)
  if (!cleaned) return undefined
  return cleaned.replace(/\s*\(@[a-z0-9._]+\)\s*$/i, '').trim() || undefined
}

function sanitizeActiveSince(value: string | undefined): string | undefined {
  const cleaned = sanitizeInlineText(value)
  if (!cleaned) return undefined
  if (cleaned.length > 48) return undefined
  if (/[;|]/.test(cleaned)) return undefined
  if (/\b(linkedin|behance|adobe|per\b|interview|portfolio|blog)\b/i.test(cleaned)) return undefined
  if (/\b\d{4}\s*[–-]\s*\d{4}\b/.test(cleaned)) return undefined
  return cleaned
}

function looksLikeInternalOrScrapedParagraph(value: string): boolean {
  if (!value) return true
  if (INTERNAL_NOTE_PATTERNS.some((pattern) => pattern.test(value))) return true
  if (SCRAPE_BOILERPLATE_PATTERNS.some((pattern) => pattern.test(value))) return true
  return false
}

function sanitizeNarrativeText(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined

  const decoded = normalizeWhitespace(fixLikelyMojibake(value))
  const paragraphs = decoded
    .split(/\n\s*\n+/)
    .map((paragraph) =>
      paragraph
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter(Boolean)

  const deduped: string[] = []
  const seen = new Set<string>()
  for (const paragraph of paragraphs) {
    if (looksLikeInternalOrScrapedParagraph(paragraph)) continue
    const key = paragraph.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(paragraph)
  }

  const joined = deduped.join('\n\n').trim()
  return joined || undefined
}

export function lookupArtistResearch(slug: string): RawArtistResearchRow | undefined {
  if (bySlug[slug]) return bySlug[slug]
  const base = slug.replace(/-\d+$/, '')
  if (base !== slug && bySlug[base]) return bySlug[base]
  const aliases = RESEARCH_SLUG_ALIASES[slug] ?? RESEARCH_SLUG_ALIASES[base] ?? []
  for (const alias of aliases) {
    if (bySlug[alias]) return bySlug[alias]
  }
  return undefined
}

/** Skip Instagram post/reel URLs; not usable as <img src> without oEmbed. */
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

function sanitizeDashSeparatedText(value: string): string {
  return fixLikelyMojibake(value).replace(DEDUPE_DASH, ' — ').trim()
}

/** Turn CSV / research lines into demo-style type, title, venue, city when commas allow. */
function parseExhibitionRest(rest: string): Pick<ExhibitionRow, 'type' | 'title' | 'venue' | 'city'> {
  const full = sanitizeDashSeparatedText(rest)
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
  const cleaned = fixLikelyMojibake(text)
  for (const line of cleaned.split('\n').map((l) => l.trim()).filter(Boolean)) {
    const m = line.match(/^(\d{4})\s*[-–—]\s*(.+)$/)
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
  const cleaned = fixLikelyMojibake(text)
  for (const line of cleaned.split('\n').map((l) => l.trim()).filter(Boolean)) {
    const parts = line.split(/\s+[-–—]\s+/).map((p) => p.trim())
    if (parts.length < 2) continue
    const outlet = sanitizeInlineText(parts[0]) || parts[0]
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
    const quote = sanitizeInlineText(parts.slice(i, end).join(' — ')) || outlet
    cards.push({ outlet, year, quote, url })
  }
  return cards
}

function processGalleryFromRaw(raw: RawArtistResearchRow): ProcessGalleryItem[] {
  const items: ProcessGalleryItem[] = []
  const seen = new Set<string>()
  const pairs: [string, string][] = [
    [raw.processImage1Url, raw.processImage1Label],
    [raw.processImage2Url, raw.processImage2Label],
    [raw.processImage3Url, raw.processImage3Label],
    [raw.processImage4Url, raw.processImage4Label],
  ]
  for (const [url, label] of pairs) {
    const u = url?.trim()
    if (!u) continue
    if (!(isDirectImageUrl(u) || isInstagramPostOrReelUrl(u))) continue
    const k = processGalleryDedupeKey(u)
    if (seen.has(k)) continue
    seen.add(k)
    items.push({ url: u, label: sanitizeInlineText(label) })
  }
  return items
}

function instagramShowcaseFromRaw(raw: RawArtistResearchRow): InstagramShowcaseItem[] {
  const text = raw.instagramPostImageUrls?.trim()
  if (!text) return []
  const items: InstagramShowcaseItem[] = []
  const seen = new Set<string>()
  for (const line of text.split('\n').map((l) => l.trim()).filter(Boolean)) {
    if (isDirectImageUrl(line)) {
      const k = processGalleryDedupeKey(line)
      if (seen.has(k)) continue
      seen.add(k)
      items.push({ url: line, kind: 'Post' })
    } else if (isInstagramPostOrReelUrl(line)) {
      const k = processGalleryDedupeKey(line)
      if (seen.has(k)) continue
      seen.add(k)
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

/** Collapse same artwork at different WxH or query variants. */
function processGalleryDedupeKey(url: string): string {
  const raw = url.trim()
  try {
    const u = new URL(raw)
    let host = u.hostname.toLowerCase()
    if (host.startsWith('www.')) host = host.slice(4)
    let path = u.pathname.toLowerCase()
    path = path.replace(/-\d+x\d+(?=\.[a-z0-9]{2,5}$)/i, '')
    path = path.replace(/__\d+x\d+/gi, '')
    return `${host}${path}`
  } catch {
    return raw.toLowerCase()
  }
}

function mergeProcessGalleries(
  shopify: ProcessGalleryItem[] | undefined,
  research: ProcessGalleryItem[]
): ProcessGalleryItem[] | undefined {
  const fromShop = (shopify ?? []).filter((x) => x?.url?.trim())
  const keys = new Set(fromShop.map((x) => processGalleryDedupeKey(x.url)))
  const out = [...fromShop]
  for (const r of research) {
    const k = processGalleryDedupeKey(r.url)
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
  const keys = new Set(fromShop.map((x) => processGalleryDedupeKey(x.url)))
  const out = [...fromShop]
  for (const r of research) {
    const k = processGalleryDedupeKey(r.url)
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
  if (!raw) {
    return {
      ...shopify,
      location: sanitizeInlineText(shopify.location),
      alias: sanitizeInlineText(shopify.alias),
      storyHook: sanitizeStoryHook(shopify.storyHook),
      pullquote: sanitizeInlineText(shopify.pullquote),
      activeSince: sanitizeActiveSince(shopify.activeSince),
      impactCallout: sanitizeNarrativeText(shopify.impactCallout),
      exclusiveCallout: sanitizeNarrativeText(shopify.exclusiveCallout),
    }
  }

  const pressParsed = parsePress(raw.pressText || '')
  const exParsed = parseExhibitions(raw.exhibitionsText || '')
  const processGallery = processGalleryFromRaw(raw)
  const instagramShowcase = instagramShowcaseFromRaw(raw)

  return {
    location: sanitizeInlineText(shopify.location) || sanitizeInlineText(raw.location),
    alias: sanitizeInlineText(shopify.alias),
    storyHook: sanitizeStoryHook(shopify.storyHook) || sanitizeStoryHook(raw.heroHook),
    pullquote: sanitizeInlineText(shopify.pullquote) || sanitizeInlineText(raw.pullQuote),
    processGallery: mergeProcessGalleries(shopify.processGallery, processGallery),
    exhibitions: mergeExhibitionRows(shopify.exhibitions, exParsed),
    press: mergePressCards(shopify.press, pressParsed),
    instagramShowcase: mergeInstagramShowcaseItems(shopify.instagramShowcase, instagramShowcase),
    activeSince: sanitizeActiveSince(shopify.activeSince) || sanitizeActiveSince(raw.activeSince),
    impactCallout: sanitizeNarrativeText(shopify.impactCallout) || sanitizeNarrativeText(raw.impactCallout),
    exclusiveCallout: sanitizeNarrativeText(shopify.exclusiveCallout) || sanitizeNarrativeText(raw.exclusiveCallout),
  }
}

/** Collapse whitespace and strip HTML-ish noise for deduping collection vs research bios. */
function normalizeBioForDedup(s: string): string {
  const noTags = s.replace(/<[^>]*>/g, ' ')
  return noTags.replace(/\s+/g, ' ').trim().toLowerCase()
}

/**
 * When both Shopify collection description and research body exist, prefer one block if they
 * duplicate; otherwise place the edited narrative first and keep storefront copy after it.
 */
export function mergeShopifyCollectionBioWithResearch(
  collectionBio: string | undefined,
  researchStory: string | undefined,
  additionalHistory: string | undefined
): string | undefined {
  const collection = sanitizeNarrativeText(collectionBio) || ''
  const story = sanitizeNarrativeText(researchStory) || ''
  const history = sanitizeNarrativeText(additionalHistory) || ''
  const researchBlock = story || history

  if (!collection) return researchBlock || undefined
  if (!researchBlock) return collection || undefined

  const cN = normalizeBioForDedup(collection)
  const rN = normalizeBioForDedup(researchBlock)
  if (cN === rN) return researchBlock
  if (rN.includes(cN)) return researchBlock
  if (cN.includes(rN)) return collection.length >= researchBlock.length ? collection : researchBlock

  const prefixLen = Math.min(120, cN.length)
  if (prefixLen >= 40 && cN.slice(0, prefixLen).length > 0) {
    const prefix = cN.slice(0, prefixLen)
    if (rN.includes(prefix)) return researchBlock
  }

  return `${researchBlock}\n\n${collection}`
}

export function mergeResearchBio(slug: string, existingBio: string | undefined): string | undefined {
  const raw = lookupArtistResearch(slug)
  return mergeShopifyCollectionBioWithResearch(existingBio, raw?.storyFullText, undefined)
}

export function researchInstagramHandle(slug: string): string | undefined {
  const raw = lookupArtistResearch(slug)
  const h = sanitizeInlineText(raw?.instagramHandle)
  if (!h) return undefined
  return h.replace(/^@/, '').split('/')[0]?.split('?')[0]?.trim() || undefined
}
