import type { ShopifyProduct } from '@/lib/shopify/storefront-client'

/**
 * Stage tiers by **percent of the edition sold** (sold ÷ total × 100).
 * First ~25% uses several bands so copy can vary at the very start of a run.
 * 100% (or sold ≥ total) → sold out.
 */
export const editionStages = {
  justOpened: {
    percentRange: [0, 3] as const,
    badge: 'Ground floor',
    subline: "The run just opened — you're ahead of almost everyone on {artist}",
    cta: 'Claim a number at the very start of this run',
    emailSubject: "You're in before the crowd — {artist}",
    emailBody:
      "Edition {n} of {total}. Collectors who move first on a finite run don't forget it. You're one of them.",
  },
  fresh: {
    percentRange: [4, 6] as const,
    badge: 'Still wide open',
    subline: "Scarcity hasn't bit yet — most of the edition is still unclaimed",
    cta: 'Get in while the edition still feels wide open',
    emailSubject: 'Wide open edition — {artist}',
    emailBody:
      'Edition {n} of {total}. The count is still mostly yours for the taking. Early collectors shape the story.',
  },
  early: {
    percentRange: [7, 10] as const,
    badge: "You're early",
    subline: "Only {x} deep — you're still in the opening chapter on {artist}",
    cta: 'Join the {x} collectors already in this run',
    emailSubject: 'Opening chapter — {artist} edition',
    emailBody:
      "Edition {n} of {total}. You're collecting while the run is young. That's the whole point of editions.",
  },
  firstWave: {
    percentRange: [11, 15] as const,
    badge: 'First wave forming',
    subline: '{x} pieces spoken for — the first wave is claiming their numbers',
    cta: 'The first wave is forming — your number is still here',
    emailSubject: 'First wave is moving — {artist}',
    emailBody:
      "Edition {n} of {total}. When the first wave moves, the print run starts to feel real. You're in it.",
  },
  gathering: {
    percentRange: [16, 20] as const,
    badge: 'Momentum building',
    subline: '{x} collected — more collectors are circling the same finite run',
    cta: 'Add yours while the room still feels open',
    emailSubject: 'Momentum on this edition is building',
    emailBody:
      "Edition {n} of {total}. Scarcity is a slow burn — you're still early, but the room is filling.",
  },
  momentum: {
    percentRange: [21, 25] as const,
    badge: 'Run heating up',
    subline: '{x} gone — the edition is picking up real collector traction',
    cta: 'Get yours before the run finds its ceiling',
    emailSubject: 'This edition is heating up',
    emailBody:
      "Edition {n} of {total}. Momentum means other collectors are voting with their walls. You're not late — yet.",
  },
  breakthrough: {
    percentRange: [26, 50] as const,
    badge: 'Half the story told',
    subline: '{x} of {total} claimed — consensus is forming among collectors',
    cta: 'Still time to own a piece before the back half tightens',
    emailSubject: "Mid-run energy — don't sleep on it",
    emailBody:
      'Edition {n} of {total}. The middle of a run is when scarcity stops being theoretical. You feel it.',
  },
  scarce: {
    percentRange: [51, 75] as const,
    badge: 'Scarcity is real',
    subline: 'Only {remaining} left — the edition is past the halfway mark for good',
    cta: 'Lock a number while a few still remain',
    emailSubject: 'Real scarcity — {remaining} left',
    emailBody:
      "Edition {n} of {total}. After yours, only {remaining} remain in the wild. That's the whole game.",
  },
  final: {
    percentRange: [76, 90] as const,
    badge: 'Closing the run',
    subline: "{remaining} remain — we're in the final stretch of this edition",
    cta: 'One of the last meaningful chances to collect',
    emailSubject: 'Final stretch — edition closing',
    emailBody:
      'Edition {n} of {total}. The run is almost closed. Collectors who wait past this point rarely get a second shot.',
  },
  lastChance: {
    percentRange: [91, 99] as const,
    badge: 'Last seats',
    subline: "{remaining} left — after this, it's secondary market or regret",
    cta: "If you've been waiting, this is the signal",
    emailSubject: 'Last seats on this edition',
    emailBody:
      "Edition {n} of {total}. Only {remaining} left from this run — after that, it's whoever got a number on the wall.",
  },
  soldOut: {
    percentRange: [100, 100] as const,
    badge: 'Sold out',
    subline: 'Every number is claimed — this {artist} edition is closed',
    cta: 'Hunt the next drop before it tightens',
    emailSubject: 'This edition is fully collected',
    emailBody:
      "All {total} editions are with collectors now. If you missed it, watch for the next run — ground floor doesn't wait twice.",
  },
} as const

export type EditionStageKey = keyof typeof editionStages

export type EditionStageCopy = {
  badge: string
  subline: string
  cta: string
  emailSubject: string
  emailBody: string
}

/** Share of the edition already sold, 0–100. */
export function getEditionPercentSold(sold: number, totalEditions: number): number {
  if (totalEditions <= 0 || sold < 0) return 0
  return Math.min(100, Math.max(0, (sold / totalEditions) * 100))
}

/**
 * Maps cumulative sold count to a stage using **percentage sold**.
 * `editionNumber` = editions sold so far (total − remaining inventory).
 * When sold ≥ total, stage is **soldOut** (100%).
 */
export function getEditionStageKey(editionNumber: number, totalEditions: number): EditionStageKey | null {
  if (totalEditions < 1 || editionNumber < 0) return null
  if (editionNumber >= totalEditions) return 'soldOut'

  const pct = getEditionPercentSold(editionNumber, totalEditions)

  if (pct >= 91) return 'lastChance'
  if (pct >= 76) return 'final'
  if (pct >= 51) return 'scarce'
  if (pct >= 26) return 'breakthrough'
  // 0–25%: finer bands at the start of the run (upper-bound chain)
  if (pct <= 3) return 'justOpened'
  if (pct <= 6) return 'fresh'
  if (pct <= 10) return 'early'
  if (pct <= 15) return 'firstWave'
  if (pct <= 20) return 'gathering'
  return 'momentum'
}

export function interpolateEditionString(
  template: string,
  ctx: { artist: string; x: number; n: number; total: number; remaining: number }
): string {
  return template
    .replace(/\{artist\}/g, ctx.artist)
    .replace(/\{x\}/g, String(ctx.x))
    .replace(/\{n\}/g, String(ctx.n))
    .replace(/\{total\}/g, String(ctx.total))
    .replace(/\{remaining\}/g, String(ctx.remaining))
}

export function getEditionStageCopy(
  stage: EditionStageKey,
  ctx: { artist: string; x: number; n: number; total: number; remaining: number }
): EditionStageCopy {
  const s = editionStages[stage]
  const out: EditionStageCopy = {
    badge: interpolateEditionString(s.badge, ctx),
    subline: interpolateEditionString(s.subline, ctx),
    cta: interpolateEditionString(s.cta, ctx),
    emailSubject: interpolateEditionString(s.emailSubject, ctx),
    emailBody: interpolateEditionString(s.emailBody, ctx),
  }
  if (
    ctx.x === 0 &&
    (stage === 'justOpened' || stage === 'fresh' || stage === 'early' || stage === 'firstWave')
  ) {
    out.cta = 'Be first on the wall — claim before anyone else has a number'
  }
  return out
}

export function getProductEditionSize(product: ShopifyProduct): number | null {
  const m = product.metafields?.find((x) => x && x.namespace === 'custom' && x.key === 'edition_size')
  if (!m?.value) return null
  const n = parseInt(String(m.value), 10)
  return Number.isFinite(n) && n >= 1 ? n : null
}

export function buildEditionMetrics(
  totalEditions: number,
  quantityAvailable: number
): {
  totalEditions: number
  editionNumberSold: number
  remaining: number
} {
  const remaining = Math.max(0, quantityAvailable)
  const editionNumberSold = Math.min(totalEditions, Math.max(0, totalEditions - remaining))
  return { totalEditions, editionNumberSold, remaining }
}

/** Inventory-backed edition progress for badge UI. Returns null if edition size or stock is unknown. */
export function getProductEditionMetrics(product: ShopifyProduct): {
  totalEditions: number
  editionNumberSold: number
  remaining: number
} | null {
  const totalEditions = getProductEditionSize(product)
  if (totalEditions == null || totalEditions < 2) return null

  const qty = product.variants?.edges?.[0]?.node?.quantityAvailable
  if (typeof qty !== 'number') return null

  return buildEditionMetrics(totalEditions, qty)
}
