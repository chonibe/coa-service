/**
 * Street Collector fixed ladder (S1: 90 / S2: 44) — USD tiers for buyer-facing badges.
 * Separate from percent-based `edition-stages.ts` used by watchlist keys.
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
    if (sold >= 75) return { stageKey: 'final', priceUsd: 75 }
    if (sold >= 55) return { stageKey: 'established', priceUsd: 62 }
    if (sold >= 25) return { stageKey: 'rising', priceUsd: 50 }
    return { stageKey: 'ground_floor', priceUsd: 40 }
  }
  if (sold >= 44) return { stageKey: 'archive', priceUsd: null }
  if (sold >= 40) return { stageKey: 'final', priceUsd: 85 }
  if (sold >= 30) return { stageKey: 'established', priceUsd: 62 }
  if (sold >= 15) return { stageKey: 'rising', priceUsd: 50 }
  return { stageKey: 'ground_floor', priceUsd: 40 }
}

function remainingAtThisPrice(season: 1 | 2, editionsSold: number): number {
  const sold = Math.max(0, Math.floor(editionsSold))
  if (season === 1) {
    if (sold < 25) return 25 - sold
    if (sold < 55) return 55 - sold
    if (sold < 75) return 75 - sold
    if (sold < 90) return 90 - sold
    return 0
  }
  if (sold < 15) return 15 - sold
  if (sold < 30) return 30 - sold
  if (sold < 40) return 40 - sold
  if (sold < 44) return 44 - sold
  return 0
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
  const { stageKey, priceUsd } = getStreetPricingStage(season, editionsSold)
  const label = LABELS[stageKey]

  if (stageKey === 'archive') {
    return { stageKey, label, priceUsd: null, subcopy: 'Join watchlist' }
  }

  const rem = remainingAtThisPrice(season, editionsSold)
  const overall = copiesLeftOverall(season, editionsSold)

  let subcopy = ''
  if (stageKey === 'ground_floor') {
    const cap = season === 1 ? 25 : 15
    subcopy = `${rem} of ${cap} left at this price`
  } else if (stageKey === 'rising') {
    subcopy = 'Started at $40'
  } else if (stageKey === 'established') {
    subcopy = `${overall} left in edition`
  } else {
    subcopy = `${rem} left. Ever.`
  }

  return { stageKey, label, priceUsd, subcopy }
}
