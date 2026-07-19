/**
 * Concise inline explanations for Experience purchase UI
 * (scarcity, street ladder, edition hold). Paraphrased from FAQ /
 * street-collector pricing copy — keep short; do not duplicate full FAQ.
 */

export const EXPERIENCE_PURCHASE_HINTS = {
  /** Under “X of Y remaining” / scarcity bar */
  scarcity:
    'Fixed run — once these are gone, this design isn’t reprinted.',
  /** Under street ladder price / “N more · then $X” */
  ladder:
    'Price steps up as editions sell — earlier collectors pay less.',
  /** Under “Edition #N · … reserved” after add-to-cart */
  hold: 'Your number stays held while you finish checkout.',
} as const

/** Short trust claim for shipping (aligned with FAQ delivery window). */
export const EXPERIENCE_SHIPPING_TRUST_LABEL =
  'Free worldwide shipping · 9–15 business days' as const
