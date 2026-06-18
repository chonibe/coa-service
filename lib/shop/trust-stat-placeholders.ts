/** Marketing floor values for public trust counters (never show 0 while loading). */
export const TRUST_STAT_PLACEHOLDERS = {
  collectors: 3000,
  artists: 100,
  countries: 40,
  ratingText: '★ 5.0',
} as const

/**
 * Use live count when present and > 0; otherwise fall back to the placeholder floor.
 */
export function resolveTrustStatCount(
  live: number | null | undefined,
  placeholder: number
): number {
  const n = typeof live === 'number' && Number.isFinite(live) ? live : 0
  return n > 0 ? n : placeholder
}

export function formatTrustStatCount(value: number): string {
  if (value >= 1000) {
    return `${Math.round(value / 1000)},000`
  }
  return String(value)
}

export function formatTrustStatWithSuffix(
  live: number | null | undefined,
  placeholder: number,
  suffix = '+'
): string {
  return `${formatTrustStatCount(resolveTrustStatCount(live, placeholder))}${suffix}`
}
