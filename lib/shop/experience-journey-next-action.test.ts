import {
  resolveExperienceNextAction,
  type ExperienceJourneyNextActionInput,
} from './experience-journey-next-action'

function base(over: Partial<ExperienceJourneyNextActionInput> = {}): ExperienceJourneyNextActionInput {
  return {
    lampQuantity: 0,
    artworkCount: 0,
    pickerEngaged: false,
    orderDrawerOpen: false,
    hasAddress: false,
    hasPaymentSelection: false,
    paymentSectionExpanded: false,
    paymentStripeUnlocked: false,
    ...over,
  }
}

describe('resolveExperienceNextAction', () => {
  it('returns create_bundle when cart empty and picker not engaged', () => {
    expect(resolveExperienceNextAction(base())).toBe('create_bundle')
  })

  it('returns add_lamp when picker engaged and no lamp', () => {
    expect(resolveExperienceNextAction(base({ pickerEngaged: true }))).toBe('add_lamp')
  })

  it('returns choose_artworks when lamp in cart but no artworks', () => {
    expect(
      resolveExperienceNextAction(
        base({ pickerEngaged: true, lampQuantity: 1, artworkCount: 0 })
      )
    ).toBe('choose_artworks')
  })

  it('returns open_checkout when at least one artwork and drawer closed', () => {
    expect(
      resolveExperienceNextAction(
        base({
          pickerEngaged: true,
          lampQuantity: 1,
          artworkCount: 1,
          orderDrawerOpen: false,
        })
      )
    ).toBe('open_checkout')
  })

  it('returns place_order when drawer open with artworks and stripeHostedInDrawer (hosted Checkout)', () => {
    expect(
      resolveExperienceNextAction(
        base({
          pickerEngaged: true,
          lampQuantity: 1,
          artworkCount: 1,
          orderDrawerOpen: true,
          stripeHostedInDrawer: true,
        })
      )
    ).toBe('place_order')
  })

  it('returns add_address when drawer open without address', () => {
    expect(
      resolveExperienceNextAction(
        base({
          pickerEngaged: true,
          lampQuantity: 1,
          artworkCount: 1,
          orderDrawerOpen: true,
          hasAddress: false,
        })
      )
    ).toBe('add_address')
  })

  it('returns add_payment when address ok but no payment selection', () => {
    expect(
      resolveExperienceNextAction(
        base({
          pickerEngaged: true,
          lampQuantity: 1,
          artworkCount: 1,
          orderDrawerOpen: true,
          hasAddress: true,
          hasPaymentSelection: false,
        })
      )
    ).toBe('add_payment')
  })

  it('returns add_payment when payment section open but method not ready (OrderBar)', () => {
    expect(
      resolveExperienceNextAction(
        base({
          pickerEngaged: true,
          lampQuantity: 1,
          artworkCount: 1,
          orderDrawerOpen: true,
          hasAddress: true,
          hasPaymentSelection: true,
          paymentSectionExpanded: true,
          paymentStripeUnlocked: true,
          paymentMethodReady: false,
        })
      )
    ).toBe('add_payment')
  })

  it('returns place_order when stripe unlocked and payment section expanded (beats payment_done)', () => {
    expect(
      resolveExperienceNextAction(
        base({
          pickerEngaged: true,
          lampQuantity: 1,
          artworkCount: 1,
          orderDrawerOpen: true,
          hasAddress: true,
          hasPaymentSelection: true,
          paymentSectionExpanded: true,
          paymentStripeUnlocked: true,
          paymentMethodReady: true,
        })
      )
    ).toBe('place_order')
  })

  it('returns payment_done when expanded and payment selected but stripe not yet unlocked', () => {
    expect(
      resolveExperienceNextAction(
        base({
          pickerEngaged: true,
          lampQuantity: 1,
          artworkCount: 1,
          orderDrawerOpen: true,
          hasAddress: true,
          hasPaymentSelection: true,
          paymentSectionExpanded: true,
          paymentStripeUnlocked: false,
        })
      )
    ).toBe('payment_done')
  })

  it('returns null when drawer open, address ok, payment not expanded and selection satisfied', () => {
    expect(
      resolveExperienceNextAction(
        base({
          pickerEngaged: true,
          lampQuantity: 1,
          artworkCount: 1,
          orderDrawerOpen: true,
          hasAddress: true,
          hasPaymentSelection: true,
          paymentSectionExpanded: false,
          paymentStripeUnlocked: true,
        })
      )
    ).toBeNull()
  })
})
