/**
 * Street Collector ladder (S1: 90 / S2: 44) — USD tiers for badges, Reserve locks, checkout display.
 * Same five buyer-facing stages as the product spec; **multiple price rungs per stage** so list price
 * steps in small increments as `editionsSold` increases (half-open intervals on sold count).
 * Separate from percent-based `edition-stages.ts` used for watchlist stage keys.
 */

export type StreetPricingStageKey =
  | 'ground_floor'
  | 'rising'
  | 'established'
  | 'final'
  | 'archive'

export type StreetStageDisplay = {
  stageKey: StreetPricingStageKey
  label: string
  priceUsd: number | null
  subcopy: string
}

type StreetBand = {
  /** First `editionsSold` value that is *past* this band (band is [prevCap, capExclusive)). */
  capExclusive: number
  priceUsd: number
  stageKey: StreetPricingStageKey
}

/**
 * Season 1 — 90 editions. Caps must be strictly increasing; last cap === 90.
 * Stages span the same ranges as the spec: GF 0–24, Rising 25–54, Est 55–74, Final 75–89.
 */
const S1_BANDS: StreetBand[] = [
  { capExclusive: 5, priceUsd: 40, stageKey: 'ground_floor' },
  { capExclusive: 10, priceUsd: 42, stageKey: 'ground_floor' },
  { capExclusive: 15, priceUsd: 44, stageKey: 'ground_floor' },
  { capExclusive: 20, priceUsd: 46, stageKey: 'ground_floor' },
  { capExclusive: 25, priceUsd: 48, stageKey: 'ground_floor' },
  { capExclusive: 30, priceUsd: 50, stageKey: 'rising' },
  { capExclusive: 35, priceUsd: 52, stageKey: 'rising' },
  { capExclusive: 40, priceUsd: 54, stageKey: 'rising' },
  { capExclusive: 45, priceUsd: 56, stageKey: 'rising' },
  { capExclusive: 50, priceUsd: 58, stageKey: 'rising' },
  { capExclusive: 55, priceUsd: 60, stageKey: 'rising' },
  { capExclusive: 60, priceUsd: 62, stageKey: 'established' },
  { capExclusive: 65, priceUsd: 64, stageKey: 'established' },
  { capExclusive: 70, priceUsd: 66, stageKey: 'established' },
  { capExclusive: 75, priceUsd: 68, stageKey: 'established' },
  { capExclusive: 80, priceUsd: 70, stageKey: 'final' },
  { capExclusive: 85, priceUsd: 72, stageKey: 'final' },
  { capExclusive: 90, priceUsd: 75, stageKey: 'final' },
]

/**
 * Season 2 — 44 editions. GF 0–14, Rising 15–29, Est 30–39, Final 40–43.
 */
const S2_BANDS: StreetBand[] = [
  { capExclusive: 5, priceUsd: 40, stageKey: 'ground_floor' },
  { capExclusive: 10, priceUsd: 42, stageKey: 'ground_floor' },
  { capExclusive: 15, priceUsd: 44, stageKey: 'ground_floor' },
  { capExclusive: 20, priceUsd: 45, stageKey: 'rising' },
  { capExclusive: 25, priceUsd: 47, stageKey: 'rising' },
  { capExclusive: 30, priceUsd: 50, stageKey: 'rising' },
  { capExclusive: 35, priceUsd: 54, stageKey: 'established' },
  { capExclusive: 40, priceUsd: 58, stageKey: 'established' },
  { capExclusive: 41, priceUsd: 65, stageKey: 'final' },
  { capExclusive: 42, priceUsd: 72, stageKey: 'final' },
  { capExclusive: 43, priceUsd: 78, stageKey: 'final' },
  { capExclusive: 44, priceUsd: 85, stageKey: 'final' },
]

function resolveBand(sold: number, bands: StreetBand[]): StreetBand & { bandStart: number } | null {
  let bandStart = 0
  for (const b of bands) {
    if (sold < b.capExclusive) {
      return { ...b, bandStart }
    }
    bandStart = b.capExclusive
  }
  return null
}

export function streetSeasonFromTotalEditions(totalEditions: number): 1 | 2 {
  if (totalEditions > 0 && totalEditions <= 44) return 2
  return 1
}

export function getStreetPricingStage(
  season: 1 | 2,
  editionsSold: number
): { stageKey: StreetPricingStageKey; priceUsd: number | null } {
  const sold = Math.max(0, Math.floor(editionsSold))
  if (season === 1) {
    if (sold >= 90) return { stageKey: 'archive', priceUsd: null }
    const hit = resolveBand(sold, S1_BANDS)
    if (!hit) return { stageKey: 'archive', priceUsd: null }
    return { stageKey: hit.stageKey, priceUsd: hit.priceUsd }
  }
  if (sold >= 44) return { stageKey: 'archive', priceUsd: null }
  const hit = resolveBand(sold, S2_BANDS)
  if (!hit) return { stageKey: 'archive', priceUsd: null }
  return { stageKey: hit.stageKey, priceUsd: hit.priceUsd }
}

function copiesLeftOverall(season: 1 | 2, editionsSold: number): number {
  const cap = season === 1 ? 90 : 44
  return Math.max(0, cap - Math.max(0, Math.floor(editionsSold)))
}

const LABELS: Record<StreetPricingStageKey, string> = {
  ground_floor: 'GROUND FLOOR',
  rising: 'RISING',
  established: 'ESTABLISHED',
  final: 'FINAL EDITION',
  archive: 'SOLD OUT',
}

export function getStreetPricingStageDisplay(
  season: 1 | 2,
  editionsSold: number
): StreetStageDisplay {
  const sold = Math.max(0, Math.floor(editionsSold))
  const bands = season === 1 ? S1_BANDS : S2_BANDS

  if (season === 1 && sold >= 90) {
    return {
      stageKey: 'archive',
      label: LABELS.archive,
      priceUsd: null,
      subcopy: 'Join watchlist',
    }
  }
  if (season === 2 && sold >= 44) {
    return {
      stageKey: 'archive',
      label: LABELS.archive,
      priceUsd: null,
      subcopy: 'Join watchlist',
    }
  }

  const hit = resolveBand(sold, bands)
  if (!hit) {
    return {
      stageKey: 'archive',
      label: LABELS.archive,
      priceUsd: null,
      subcopy: 'Join watchlist',
    }
  }

  const { stageKey, priceUsd, capExclusive, bandStart } = hit
  const label = LABELS[stageKey]
  const remInBand = capExclusive - sold
  const bandWidth = capExclusive - bandStart
  const overall = copiesLeftOverall(season, editionsSold)

  let subcopy = ''
  if (stageKey === 'ground_floor') {
    subcopy = `${remInBand} of ${bandWidth} left at this price`
  } else if (stageKey === 'rising') {
    subcopy = `${remInBand} sales until next step · Started at $40`
  } else if (stageKey === 'established') {
    subcopy = `${overall} left in edition`
  } else {
    subcopy = `${overall} left. Ever.`
  }

  return { stageKey, label, priceUsd, subcopy }
}
