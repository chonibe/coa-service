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
/** Research-sheet / AI summary lines that must never appear on the shop profile. */
const SYSTEM_RESEARCH_PATTERNS = [
  /\breferenced in\b/i,
  /\b(?:commissions|features|following)\s+(?:from|by)\b.*\bmentioned\b/i,
  /\bmentioned\.?\s*$/i,
  /\bconfirm availability on\b/i,
  /\barticle notes\b/i,
  /\bno museum survey cited\b/i,
  /\bretail stockist context\b/i,
  /\bsee source article\b/i,
  /\bpost embedded in\b/i,
  /\binstagram permalink\b/i,
  /\bpermalink to @\b/i,
  /\bprofile; .* listings describe\b/i,
  /\blistings describe .* presence\b/i,
  /\bverify auto-extracted\b/i,
  /\bartist page — —\b/i,
  /\bfeel-good feature on\b/i,
]
const GENERIC_PROCESS_LABELS = /^(portfolio|process|studio|work in progress|wip)$/i
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
  return (
    cleaned
      .replace(/\s*\(@[a-z0-9._]+\)\s*$/i, '')
      .replace(/\s*\([a-z0-9._]{3,}\)\s*$/i, '')
      .trim() || undefined
  )
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

function looksLikeSystemResearchNote(value: string): boolean {
  if (!value?.trim()) return true
  return SYSTEM_RESEARCH_PATTERNS.some((pattern) => pattern.test(value))
}

function looksLikeInternalOrScrapedParagraph(value: string): boolean {
  if (!value) return true
  if (looksLikeSystemResearchNote(value)) return true
  if (INTERNAL_NOTE_PATTERNS.some((pattern) => pattern.test(value))) return true
  if (SCRAPE_BOILERPLATE_PATTERNS.some((pattern) => pattern.test(value))) return true
  return false
}

function sanitizeLocation(value: string | undefined): string | undefined {
  const cleaned = sanitizeInlineText(value)
  if (!cleaned) return undefined
  const withoutParens = cleaned.replace(/\s*\([^)]*(?:profile|listings|article|observer|interview|source|verify|cited)[^)]*\)\s*/gi, ' ')
  const compact = withoutParens.replace(/\s+/g, ' ').trim()
  return compact || undefined
}

function sanitizeProcessLabel(value: string | undefined): string | undefined {
  const cleaned = sanitizeInlineText(value)
  if (!cleaned) return undefined
  if (looksLikeSystemResearchNote(cleaned)) return undefined
  if (GENERIC_PROCESS_LABELS.test(cleaned)) return undefined
  return cleaned
}

function sanitizeCalloutText(value: string | undefined): string | undefined {
  const cleaned = sanitizeNarrativeText(value)
  if (!cleaned) return undefined
  if (looksLikeSystemResearchNote(cleaned)) return undefined
  return cleaned
}

function sanitizeExhibitionRow(row: ExhibitionRow): ExhibitionRow | undefined {
  const title = sanitizeInlineText(
    (row.title || '')
      .replace(/\s*\([^)]*retail stockist context[^)]*\)/gi, '')
      .replace(/\s*\([^)]*stockist context[^)]*\)/gi, '')
  )
  const venue = sanitizeInlineText(row.venue)
  const city = sanitizeInlineText(row.city)
  const type = sanitizeInlineText(row.type) || 'Exhibition'
  if (!Number.isFinite(row.year)) return undefined
  const combined = `${title || ''}${venue || ''}${city || ''}`.trim()
  if (!combined || looksLikeSystemResearchNote(combined)) return undefined
  return { year: row.year, type, title: title || combined, venue: venue || '', city: city || '' }
}

function isUsablePressCard(card: PressCard): boolean {
  const outlet = card.outlet?.trim()
  const quote = card.quote?.trim()
  if (!outlet && !quote) return false
  if (quote && looksLikeSystemResearchNote(quote)) return false
  if (quote && /^see source article$/i.test(quote)) return false
  if (quote && quote.length < 12 && !card.url) return false
  if (outlet && looksLikeSystemResearchNote(outlet)) return false
  return Boolean(outlet || (quote && quote.length >= 12))
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

const DE_AI_BIO_DROP_PATTERNS = [
  /^the common thread is\b/i,
  /^the materials change; the voice stays consistent\.?$/i,
  /^the result is\b/i,
  /^the transparency is part of the appeal\b/i,
  /^the invitation is always the same:\b/i,
  /^graphic, but never cold\.?$/i,
  /^popular art in the best sense\b/i,
  /^coastal confidence is built into everything\b/i,
  /^people describe it like music you can see\.?$/i,
  /^the work is genuinely\b/i,
]

function deAiNarrativeBio(value: string | undefined): string | undefined {
  const cleaned = sanitizeNarrativeText(value)
  if (!cleaned) return undefined

  const paragraphs = cleaned
    .split(/\n\s*\n+/)
    .map((paragraph) => {
      const sentences = paragraph
        .split(/(?<=[.!?])\s+/)
        .map((sentence) => sentence.trim())
        .filter(Boolean)
        .filter((sentence) => !DE_AI_BIO_DROP_PATTERNS.some((pattern) => pattern.test(sentence)))

      return sentences.join(' ').trim()
    })
    .filter(Boolean)

  return paragraphs.join('\n\n').trim() || cleaned
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

  if (commas.length >= 4) {
    const title = commas[0]
    const city = commas.slice(-2).join(', ')
    const venue = commas.slice(1, -2).join(', ')
    return { type: 'Exhibition', title, venue, city }
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
    const withoutUrl = line.replace(/\s*[-–—]\s*https?:\/\/\S+\s*$/i, '').trim()
    const m = withoutUrl.match(/^(\d{4})\s*[-–—]\s*(.+)$/)
    if (!m) {
      if (looksLikeSystemResearchNote(line)) continue
      continue
    }
    const year = Number.parseInt(m[1], 10)
    if (!Number.isFinite(year)) continue
    const parsed = parseExhibitionRest(m[2])
    const row = sanitizeExhibitionRow({ year, ...parsed })
    if (row) rows.push(row)
  }
  return rows
}

function parsePress(text: string): PressCard[] {
  const cards: PressCard[] = []
  const cleaned = fixLikelyMojibake(text)
  for (const line of cleaned.split('\n').map((l) => l.trim()).filter(Boolean)) {
    if (looksLikeSystemResearchNote(line)) continue
    const parts = line.split(/\s+[-–—]\s+/).map((p) => p.trim()).filter(Boolean)
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
    const quoteRaw = sanitizeInlineText(parts.slice(i, end).join(' — ')) || outlet
    const quote = quoteRaw?.replace(/^[-–—]\s+/, '').trim() || outlet
    const card: PressCard = { outlet, year, quote, url }
    if (isUsablePressCard(card)) cards.push(card)
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
    items.push({ url: u, label: sanitizeProcessLabel(label) })
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
  const fromShop = (shopify ?? [])
    .map((r) => sanitizeExhibitionRow(r))
    .filter((r): r is ExhibitionRow => Boolean(r))
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
  const fromShop = (shopify ?? []).filter((c) => c && isUsablePressCard(c))
  const keys = new Set(fromShop.map(pressKey))
  const out = [...fromShop]
  for (const c of research) {
    if (!isUsablePressCard(c)) continue
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
  const fromShop = (shopify ?? [])
    .filter((x) => x?.url?.trim())
    .map((x) => ({ ...x, label: sanitizeProcessLabel(x.label) }))
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
      location: sanitizeLocation(shopify.location),
      alias: sanitizeInlineText(shopify.alias),
      storyHook: sanitizeStoryHook(shopify.storyHook),
      pullquote: sanitizeInlineText(shopify.pullquote),
      activeSince: sanitizeActiveSince(shopify.activeSince),
      impactCallout: sanitizeCalloutText(shopify.impactCallout),
      exclusiveCallout: sanitizeCalloutText(shopify.exclusiveCallout),
      processGallery: mergeProcessGalleries(shopify.processGallery, []),
      exhibitions: mergeExhibitionRows(shopify.exhibitions, []),
      press: mergePressCards(shopify.press, []),
    }
  }

  const pressParsed = parsePress(raw.pressText || '')
  const exParsed = parseExhibitions(raw.exhibitionsText || '')
  const processGallery = processGalleryFromRaw(raw)
  const instagramShowcase = instagramShowcaseFromRaw(raw)

  return {
    location: sanitizeLocation(shopify.location) || sanitizeLocation(raw.location),
    alias: sanitizeInlineText(shopify.alias),
    storyHook: sanitizeStoryHook(shopify.storyHook) || sanitizeStoryHook(raw.heroHook),
    pullquote: sanitizeInlineText(shopify.pullquote) || sanitizeInlineText(raw.pullQuote),
    processGallery: mergeProcessGalleries(shopify.processGallery, processGallery),
    exhibitions: mergeExhibitionRows(shopify.exhibitions, exParsed),
    press: mergePressCards(shopify.press, pressParsed),
    instagramShowcase: mergeInstagramShowcaseItems(shopify.instagramShowcase, instagramShowcase),
    activeSince: sanitizeActiveSince(shopify.activeSince) || sanitizeActiveSince(raw.activeSince),
    impactCallout: sanitizeCalloutText(shopify.impactCallout) || sanitizeCalloutText(raw.impactCallout),
    exclusiveCallout: sanitizeCalloutText(shopify.exclusiveCallout) || sanitizeCalloutText(raw.exclusiveCallout),
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

  if (!collection) return deAiNarrativeBio(researchBlock)
  if (!researchBlock) return deAiNarrativeBio(collection)

  const cN = normalizeBioForDedup(collection)
  const rN = normalizeBioForDedup(researchBlock)
  if (cN === rN) return deAiNarrativeBio(researchBlock)
  if (rN.includes(cN)) return deAiNarrativeBio(researchBlock)
  if (cN.includes(rN)) return deAiNarrativeBio(collection.length >= researchBlock.length ? collection : researchBlock)

  const prefixLen = Math.min(120, cN.length)
  if (prefixLen >= 40 && cN.slice(0, prefixLen).length > 0) {
    const prefix = cN.slice(0, prefixLen)
    if (rN.includes(prefix)) return deAiNarrativeBio(researchBlock)
  }

  return deAiNarrativeBio(`${researchBlock}\n\n${collection}`)
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
