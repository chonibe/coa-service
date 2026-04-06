/**
 * Single priority-ordered "next action" for the shop experience funnel (bundle → lamp → art → checkout).
 * Used to pulse/shine the correct CTA. First matching condition wins.
 */

export type ExperienceNextAction =
  | 'create_bundle'
  | 'add_lamp'
  | 'choose_artworks'
  | 'open_checkout'
  | 'add_address'
  | 'add_payment'
  /** OrderBar payment accordion "Done" — only when Place order is not the higher-priority pulse */
  | 'payment_done'
  | 'place_order'

export interface ExperienceJourneyNextActionInput {
  lampQuantity: number
  artworkCount: number
  /** True after user opens the artwork picker (sticky/carousel). Distinguishes create_bundle vs add_lamp when cart empty. */
  pickerEngaged: boolean
  orderDrawerOpen: boolean
  hasAddress: boolean
  /** `paymentSectionExpanded || !!paymentMethodDisplayType` (matches OrderBar) */
  hasPaymentSelection: boolean
  paymentSectionExpanded: boolean
  /** True after user commits via Place order with address (Stripe mounted) */
  paymentStripeUnlocked: boolean
  /**
   * When set (e.g. OrderBar), true only after wallet/card is actually usable — not merely payment section expanded.
   * Controls `add_payment` vs `place_order` when the section is open but no method is chosen yet.
   */
  paymentMethodReady?: boolean
}

/**
 * Tailwind/CSS utility classes: pulse + shine (see `app/globals.css`).
 * Compose on hosts that can use `relative overflow-hidden`.
 */
export const EXPERIENCE_JOURNEY_CTA_HIGHLIGHT_CLASS =
  'animate-experience-artwork-cta-pulse experience-journey-cta-shine'

/**
 * Payment row / Done: draw attention with typography and color only (no pulse or shine frame).
 */
export const EXPERIENCE_JOURNEY_PAYMENT_TEXT_HIGHLIGHT_CLASS =
  'font-semibold text-[#047AFF] dark:text-[#60A5FA]'

/**
 * Returns the highest-priority incomplete funnel step, or null if none apply (e.g. onboarding quiz).
 */
export function resolveExperienceNextAction(
  input: ExperienceJourneyNextActionInput
): ExperienceNextAction | null {
  const {
    lampQuantity,
    artworkCount,
    pickerEngaged,
    orderDrawerOpen,
    hasAddress,
    hasPaymentSelection,
    paymentSectionExpanded,
    paymentStripeUnlocked,
    paymentMethodReady,
  } = input

  const paymentReady =
    paymentMethodReady !== undefined ? paymentMethodReady : hasPaymentSelection

  if (!pickerEngaged && lampQuantity === 0 && artworkCount === 0) {
    return 'create_bundle'
  }
  if (pickerEngaged && lampQuantity === 0) {
    return 'add_lamp'
  }
  if (lampQuantity > 0 && artworkCount === 0) {
    return 'choose_artworks'
  }
  if (!orderDrawerOpen && artworkCount >= 1) {
    return 'open_checkout'
  }
  if (orderDrawerOpen && !hasAddress) {
    return 'add_address'
  }
  if (orderDrawerOpen && hasAddress && !paymentReady) {
    return 'add_payment'
  }
  // Prefer final submit over collapsing payment when both could show
  if (
    orderDrawerOpen &&
    hasAddress &&
    paymentReady &&
    paymentSectionExpanded &&
    paymentStripeUnlocked
  ) {
    return 'place_order'
  }
  if (
    orderDrawerOpen &&
    hasAddress &&
    hasPaymentSelection &&
    paymentSectionExpanded
  ) {
    return 'payment_done'
  }

  return null
}
