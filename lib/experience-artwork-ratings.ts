/**
 * Experience artwork ratings — localStorage persistence
 * Used by WishlistSwiperSheet and star-rating filter.
 */

const RATINGS_STORAGE_KEY = 'experience-artwork-ratings'

export type RatingMap = Record<string, number>

function loadRatings(): RatingMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(RATINGS_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const map: RatingMap = {}
    for (const [k, v] of Object.entries(parsed)) {
      const n = typeof v === 'number' && v >= 1 && v <= 5 ? Math.round(v) : 0
      if (n > 0) map[k] = n
    }
    return map
  } catch {
    return {}
  }
}

let cached: RatingMap | null = null

function getRatings(): RatingMap {
  if (cached === null) cached = loadRatings()
  return cached
}

function saveRatings(map: RatingMap) {
  cached = map
  try {
    localStorage.setItem(RATINGS_STORAGE_KEY, JSON.stringify(map))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('experience-ratings-change', { detail: map }))
    }
  } catch { /* localStorage unavailable */ }
}

/** Get rating for product (1–5) or 0 if none */
export function getRating(productId: string): number {
  return getRatings()[productId] ?? 0
}

/** Set rating (1–5) for product */
export function setRating(productId: string, rating: number) {
  const r = Math.max(1, Math.min(5, Math.round(rating)))
  const map = { ...getRatings(), [productId]: r }
  saveRatings(map)
}

/** Set rating to 0 (effectively removing it) — used for undo */
export function clearRating(productId: string) {
  const map = { ...getRatings() }
  delete map[productId]
  saveRatings(map)
}

/** Expose the full rating map */
export function getAllRatings(): RatingMap {
  return { ...getRatings() }
}

/** Aggregate stats across all rated products */
export function getRatingStats(): {
  total: number
  average: number
  distribution: Record<1 | 2 | 3 | 4 | 5, number>
} {
  const map = getRatings()
  const entries = Object.values(map)
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>
  for (const v of entries) {
    if (v >= 1 && v <= 5) distribution[v as 1 | 2 | 3 | 4 | 5]++
  }
  const total = entries.length
  const average = total > 0 ? entries.reduce((a, b) => a + b, 0) / total : 0
  return { total, average, distribution }
}

/** Return product IDs from the given list that have no rating yet */
export function getUnratedProductIds(productIds: string[]): string[] {
  const map = getRatings()
  return productIds.filter((id) => !(id in map))
}

/** Return product IDs from the given list that already have a rating */
export function getRatedProductIds(productIds: string[]): string[] {
  const map = getRatings()
  return productIds.filter((id) => id in map)
}

/** Whether product meets min star threshold (e.g. 4+ = rating >= 4) */
export function meetsStarFilter(productId: string, minStars: number): boolean {
  return getRating(productId) >= minStars
}
