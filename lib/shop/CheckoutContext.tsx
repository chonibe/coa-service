'use client'

/**
 * Checkout Context
 *
 * Shared state for checkout flow: address, payment method, promo code.
 * Validation helpers and modal-open logic for incomplete sections.
 */

import React, {
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'

// ============================================
// Types
// ============================================

export interface CheckoutAddress {
  email: string
  fullName: string
  country: string
  addressLine1: string
  addressLine2?: string
  city: string
  state?: string
  postalCode: string
  phoneCountryCode: string
  phoneNumber: string
}

export type PaymentMethodType = 'link' | 'paypal' | 'card'

export type OpenSection = 'address' | 'payment' | 'promo' | null

/** Step-based checkout flow for the experience drawer */
export type CheckoutStep = 'cart' | 'shipping' | 'payment'

/** Saved card info from Stripe Payment Element (brand + last4) */
export interface SavedCardInfo {
  paymentMethodId: string
  brand: string
  last4: string
}

/** Display-friendly payment method from Stripe (google_pay, paypal, link, card) */
export type PaymentMethodDisplayType = 'google_pay' | 'paypal' | 'link' | 'card'

export interface CheckoutState {
  address: CheckoutAddress | null
  billingAddress: CheckoutAddress | null
  sameAsShipping: boolean
  paymentMethod: PaymentMethodType
  /** Stripe-specific type for display (Google Pay, PayPal, Link, Card) */
  paymentMethodDisplayType: PaymentMethodDisplayType | null
  /** Saved card when user enters card/Link in payment modal */
  savedCard: SavedCardInfo | null
  promoCode: string
  promoDiscount: number
  shippingCost: number
  openSection: OpenSection
  /** Multi-step checkout flow state (experience drawer) */
  step: CheckoutStep
  /** PaymentIntent client secret for Stripe Elements (experience drawer) */
  paymentIntentClientSecret: string | null
}

interface CheckoutContextValue extends CheckoutState {
  setAddress: (address: CheckoutAddress | null) => void
  setBillingAddress: (address: CheckoutAddress | null) => void
  setSameAsShipping: (v: boolean) => void
  setPaymentMethod: (method: PaymentMethodType) => void
  setPaymentMethodDisplayType: (type: PaymentMethodDisplayType | null) => void
  setSavedCard: (card: SavedCardInfo | null) => void
  setPromoCode: (code: string) => void
  setPromoDiscount: (amount: number) => void
  setShippingCost: (cost: number) => void
  setOpenSection: (section: OpenSection) => void
  setStep: (step: CheckoutStep) => void
  setPaymentIntentClientSecret: (secret: string | null) => void
  goToCart: () => void
  goToShipping: () => void
  goToPayment: () => void
  openAddressModal: () => void
  openPaymentModal: () => void
  openPromoModal: () => void
  closeModals: () => void
  isAddressComplete: () => boolean
  isPaymentSelected: () => boolean
  getIncompleteSections: () => OpenSection[]
  validateAndOpenFirstIncomplete: () => boolean
}

// ============================================
// Validation
// ============================================

function isAddressComplete(addr: CheckoutAddress | null): boolean {
  if (!addr) return false
  const hasFullName = addr.fullName?.trim().length >= 2
  const nameParts = addr.fullName?.trim().split(/\s+/)
  const hasFirstAndLast = (nameParts?.length ?? 0) >= 2
  return !!(
    addr.email?.trim() &&
    hasFullName &&
    hasFirstAndLast &&
    addr.country?.trim() &&
    addr.addressLine1?.trim() &&
    addr.city?.trim() &&
    addr.postalCode?.trim() &&
    addr.phoneNumber?.trim()
  )
}

// ============================================
// Context
// ============================================

const CheckoutContext = React.createContext<CheckoutContextValue | null>(null)

const initialState: CheckoutState = {
  address: null,
  billingAddress: null,
  sameAsShipping: true,
  paymentMethod: 'link',
  paymentMethodDisplayType: null,
  savedCard: null,
  promoCode: '',
  promoDiscount: 0,
  shippingCost: 0,
  openSection: null,
  step: 'cart',
  paymentIntentClientSecret: null,
}

const PERSISTED_PAYMENT_DISPLAY_TYPES = ['google_pay', 'paypal', 'link', 'card'] as const

function loadPersistedCheckout(key: string): Partial<CheckoutState> | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const p = JSON.parse(raw) as Record<string, unknown>
    const out: Partial<CheckoutState> = {}
    if (p.address && typeof p.address === 'object' && typeof (p.address as Record<string, unknown>).addressLine1 === 'string') {
      out.address = p.address as CheckoutAddress
    }
    if (p.billingAddress && typeof p.billingAddress === 'object' && typeof (p.billingAddress as Record<string, unknown>).addressLine1 === 'string') {
      out.billingAddress = p.billingAddress as CheckoutAddress
    }
    if (typeof p.sameAsShipping === 'boolean') out.sameAsShipping = p.sameAsShipping
    if (p.paymentMethod && ['link', 'paypal', 'card'].includes(p.paymentMethod as string)) {
      out.paymentMethod = p.paymentMethod as PaymentMethodType
    }
    if (p.paymentMethodDisplayType && PERSISTED_PAYMENT_DISPLAY_TYPES.includes(p.paymentMethodDisplayType as PaymentMethodDisplayType)) {
      out.paymentMethodDisplayType = p.paymentMethodDisplayType as PaymentMethodDisplayType
    }
    if (p.savedCard && typeof p.savedCard === 'object') {
      const sc = p.savedCard as Record<string, unknown>
      if (typeof sc.brand === 'string' && typeof sc.last4 === 'string') {
        out.savedCard = {
          paymentMethodId: (sc.paymentMethodId as string) || '',
          brand: sc.brand,
          last4: sc.last4,
        }
      }
    }
    return Object.keys(out).length ? out : null
  } catch {
    return null
  }
}

export function CheckoutProvider({
  children,
  /** When set, address/billingAddress/sameAsShipping are persisted to localStorage */
  storageKey,
}: {
  children: ReactNode
  storageKey?: string
}) {
  const [state, setState] = useState<CheckoutState>(() => {
    const base = { ...initialState }
    if (storageKey) {
      const loaded = loadPersistedCheckout(storageKey)
      if (loaded) {
        if (loaded.address) base.address = loaded.address
        if (loaded.billingAddress) base.billingAddress = loaded.billingAddress
        if (loaded.sameAsShipping !== undefined) base.sameAsShipping = loaded.sameAsShipping
        if (loaded.paymentMethod) base.paymentMethod = loaded.paymentMethod
        if (loaded.paymentMethodDisplayType) base.paymentMethodDisplayType = loaded.paymentMethodDisplayType
        if (loaded.savedCard) base.savedCard = loaded.savedCard
      }
    }
    return base
  })

  // Persist address + payment when storageKey is set
  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return
    try {
      const toSave: Record<string, unknown> = {}
      if (state.address) toSave.address = state.address
      if (state.billingAddress) toSave.billingAddress = state.billingAddress
      toSave.sameAsShipping = state.sameAsShipping
      if (state.paymentMethod) toSave.paymentMethod = state.paymentMethod
      if (state.paymentMethodDisplayType) toSave.paymentMethodDisplayType = state.paymentMethodDisplayType
      if (state.savedCard) toSave.savedCard = state.savedCard
      localStorage.setItem(storageKey, JSON.stringify(toSave))
    } catch {
      // Ignore quota errors
    }
  }, [storageKey, state.address, state.billingAddress, state.sameAsShipping, state.paymentMethod, state.paymentMethodDisplayType, state.savedCard])

  const setAddress = useCallback((address: CheckoutAddress | null) => {
    setState((s) => ({ ...s, address }))
  }, [])

  const setBillingAddress = useCallback((billingAddress: CheckoutAddress | null) => {
    setState((s) => ({ ...s, billingAddress }))
  }, [])

  const setSameAsShipping = useCallback((sameAsShipping: boolean) => {
    setState((s) => ({ ...s, sameAsShipping }))
  }, [])

  const setPaymentMethod = useCallback((paymentMethod: PaymentMethodType) => {
    setState((s) => ({ ...s, paymentMethod }))
  }, [])

  const setPaymentMethodDisplayType = useCallback((paymentMethodDisplayType: PaymentMethodDisplayType | null) => {
    setState((s) => ({ ...s, paymentMethodDisplayType }))
  }, [])

  const setSavedCard = useCallback((savedCard: SavedCardInfo | null) => {
    setState((s) => ({ ...s, savedCard }))
  }, [])

  const setPromoCode = useCallback((promoCode: string) => {
    setState((s) => ({ ...s, promoCode }))
  }, [])

  const setPromoDiscount = useCallback((promoDiscount: number) => {
    setState((s) => ({ ...s, promoDiscount }))
  }, [])

  const setShippingCost = useCallback((shippingCost: number) => {
    setState((s) => ({ ...s, shippingCost }))
  }, [])

  const setOpenSection = useCallback((openSection: OpenSection) => {
    setState((s) => ({ ...s, openSection }))
  }, [])

  const setStep = useCallback((step: CheckoutStep) => {
    setState((s) => ({ ...s, step }))
  }, [])

  const setPaymentIntentClientSecret = useCallback(
    (paymentIntentClientSecret: string | null) => {
      setState((s) => ({ ...s, paymentIntentClientSecret }))
    },
    []
  )

  const goToCart = useCallback(() => setStep('cart'), [setStep])
  const goToShipping = useCallback(() => setStep('shipping'), [setStep])
  const goToPayment = useCallback(() => setStep('payment'), [setStep])

  const openAddressModal = useCallback(() => setOpenSection('address'), [setOpenSection])
  const openPaymentModal = useCallback(() => setOpenSection('payment'), [setOpenSection])
  const openPromoModal = useCallback(() => setOpenSection('promo'), [setOpenSection])
  const closeModals = useCallback(() => setOpenSection(null), [setOpenSection])

  const isAddressCompleteFn = useCallback(
    () => isAddressComplete(state.address),
    [state.address]
  )

  const isPaymentSelectedFn = useCallback(() => !!state.paymentMethod, [state.paymentMethod])

  const getIncompleteSections = useCallback((): OpenSection[] => {
    const sections: OpenSection[] = []
    if (!isAddressComplete(state.address)) sections.push('address')
    if (!state.paymentMethod) sections.push('payment')
    if ((state.paymentMethod === 'card' || state.paymentMethod === 'link') && !state.savedCard) sections.push('payment')
    return sections
  }, [state.address, state.paymentMethod, state.savedCard])

  const validateAndOpenFirstIncomplete = useCallback((): boolean => {
    const incomplete = getIncompleteSections()
    if (incomplete.length === 0) return true
    setOpenSection(incomplete[0])
    return false
  }, [getIncompleteSections, setOpenSection])

  const value = useMemo<CheckoutContextValue>(
    () => ({
      ...state,
      setAddress,
      setBillingAddress,
      setSameAsShipping,
      setPaymentMethod,
      setPaymentMethodDisplayType,
      setSavedCard,
      setPromoCode,
      setPromoDiscount,
      setShippingCost,
      setOpenSection,
      setStep,
      setPaymentIntentClientSecret,
      goToCart,
      goToShipping,
      goToPayment,
      openAddressModal,
      openPaymentModal,
      openPromoModal,
      closeModals,
      isAddressComplete: isAddressCompleteFn,
      isPaymentSelected: isPaymentSelectedFn,
      getIncompleteSections,
      validateAndOpenFirstIncomplete,
    }),
    [
      state,
      setAddress,
      setBillingAddress,
      setSameAsShipping,
      setPaymentMethod,
      setPaymentMethodDisplayType,
      setSavedCard,
      setPromoCode,
      setPromoDiscount,
      setShippingCost,
      setOpenSection,
      setStep,
      setPaymentIntentClientSecret,
      goToCart,
      goToShipping,
      goToPayment,
      openAddressModal,
      openPaymentModal,
      openPromoModal,
      closeModals,
      isAddressCompleteFn,
      isPaymentSelectedFn,
      getIncompleteSections,
      validateAndOpenFirstIncomplete,
    ]
  )

  return (
    <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>
  )
}

export function useCheckout() {
  const ctx = useContext(CheckoutContext)
  if (!ctx) {
    throw new Error('useCheckout must be used within CheckoutProvider')
  }
  return ctx
}

export function useCheckoutOptional() {
  return useContext(CheckoutContext)
}
