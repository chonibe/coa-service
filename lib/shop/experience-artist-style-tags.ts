/**
 * Lightweight style / genre / location tags for experience artwork recommendations.
 * Derived from artist bio text and Shopify product tags (no LLM).
 */

const STYLE_KEYWORDS = [
  'abstract',
  'figurative',
  'portrait',
  'landscape',
  'surreal',
  'surrealism',
  'minimal',
  'minimalist',
  'pop art',
  'street art',
  'graffiti',
  'illustration',
  'typography',
  'collage',
  'photography',
  'digital',
  'sculpture',
  'ceramic',
  'watercolor',
  'oil painting',
  'ink',
  'line art',
  'geometric',
  'expressionist',
  'contemporary',
  'urban',
  'nature',
  'botanical',
  'music',
  'political',
  'social',
  'dream',
  'myth',
  'fantasy',
  'neon',
  'monochrome',
  'colorful',
] as const

const LOCATION_KEYWORDS = [
  'tel aviv',
  'jerusalem',
  'haifa',
  'israel',
  'palestine',
  'montreal',
  'toronto',
  'vancouver',
  'paris',
  'london',
  'berlin',
  'new york',
  'los angeles',
  'san francisco',
  'brooklyn',
  'miami',
  'tokyo',
  'amsterdam',
  'barcelona',
  'mexico city',
  'buenos aires',
  'sydney',
  'melbourne',
  'ukraine',
  'kyiv',
  'greece',
  'athens',
  'italy',
  'rome',
  'spain',
  'portugal',
  'lisbon',
] as const

function normalizeTag(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Pull style / genre / location hints from free-text bio. */
export function extractStyleTagsFromBio(bio: string | undefined | null): string[] {
  if (!bio?.trim()) return []
  const hay = bio.toLowerCase()
  const out = new Set<string>()
  for (const kw of STYLE_KEYWORDS) {
    if (hay.includes(kw)) out.add(kw)
  }
  for (const loc of LOCATION_KEYWORDS) {
    if (hay.includes(loc)) out.add(loc)
  }
  return [...out]
}

/** Union of normalized Shopify tags from a product list (drops empty / lamp-only noise). */
export function extractStyleTagsFromProductTags(
  products: ReadonlyArray<{ tags?: string[] | null }>
): string[] {
  const out = new Set<string>()
  for (const p of products) {
    for (const raw of p.tags ?? []) {
      const t = normalizeTag(raw)
      if (!t || t.length < 2) continue
      if (/^season/i.test(t) || t === 'street lamp') continue
      out.add(t)
    }
  }
  return [...out]
}

export function mergeArtistStyleTags(
  bio: string | undefined | null,
  products: ReadonlyArray<{ tags?: string[] | null }>
): string[] {
  const merged = new Set<string>([
    ...extractStyleTagsFromBio(bio),
    ...extractStyleTagsFromProductTags(products),
  ])
  return [...merged]
}
