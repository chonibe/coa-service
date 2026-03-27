'use client'

import React, { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'

export interface OrderBarRefLike {
  testZeroOrder: () => Promise<void>
}

const EXPERIENCE_OPEN_ORDER = 'experience-open-order'

export interface ExperienceOrderState {
  total: number
  itemCount: number
}

/** Props passed to OrderBar from Configurator (or empty defaults when on quiz) */
export interface OrderBarContextProps {
  lamp: ShopifyProduct
  selectedArtworks: ShopifyProduct[]
  lampQuantity: number
  onLampQuantityChange: (qty: number) => void
  onAdjustArtworkQuantity: (runStartIndex: number, delta: 1 | -1) => void
  onSelectArtwork?: (product: ShopifyProduct) => void
  onViewLampDetail?: (product: ShopifyProduct) => void
  isGift: boolean
  /** For header lamp bar: price, total, discount label, artwork count */
  lampPrice?: number
  lampTotal?: number
  discountBarLabel?: string
  artworkCount?: number
  lampSavings?: number
  lampProgressPercent?: number
  /** True when user has passed the lamp paywall (added lamp, skipped, or owns one) */
  pastLampPaywall?: boolean
  /** Set of product IDs user already owns (for "Collected" badge in order items) */
  collectedProductIds?: Set<string>
  /** Reserve / locked USD prices keyed by numeric Shopify product id */
  lockedArtworkPrices?: Record<string, number>
  /** Street ladder list USD from edition-states (numeric Shopify product id → dollars) */
  streetLadderPrices?: Record<string, number>
  /** Wizard: which step is highlighted (0=Eye, 1=Info, 2=Add, 3=Lamp, 4=Filter, 5=Chevron) */
  wizardHighlightStep?: number
  /** Wizard: whether highlight animation is active */
  wizardHighlightActive?: boolean
}

interface ExperienceOrderContextValue extends ExperienceOrderState {
  setOrderSummary: (state: ExperienceOrderState) => void
  openOrderBar: () => void
  /** Full OrderBar props – set by Configurator, or empty defaults when on quiz */
  orderBarProps: OrderBarContextProps | null
  setOrderBarProps: (props: OrderBarContextProps) => void
  /** Ref for OrderBar (e.g. testZeroOrder) – set when OrderBar mounts */
  orderBarRef: React.RefObject<OrderBarRefLike | null>
  /** Shared promo state for OrderBar and menu PromoCodeModal */
  promoCode: string
  promoDiscount: number
  setPromoCode: (code: string) => void
  setPromoDiscount: (amount: number) => void
  /** Discount celebration: amount when adding first artwork (pops from under cart) */
  discountCelebrationAmount: number | null
  setDiscountCelebrationAmount: (amount: number | null) => void
  /** Increment to trigger cart price bump animation (e.g. when selector closes after adding items) */
  priceBumpTrigger: number
  triggerPriceBump: () => void
  /** Optional content to render in the header center (e.g. 1|2 artwork switcher) */
  headerCenterContent: ReactNode | null
  setHeaderCenterContent: (content: ReactNode | null) => void
  /** Optional content before cart chip (e.g. edition watchlist toggle) */
  headerTrailingContent: ReactNode | null
  setHeaderTrailingContent: (content: ReactNode | null) => void
}

const defaultValue: ExperienceOrderContextValue = {
  total: 0,
  itemCount: 0,
  setOrderSummary: () => {},
  openOrderBar: () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EXPERIENCE_OPEN_ORDER))
    }
  },
  orderBarProps: null,
  setOrderBarProps: () => {},
  orderBarRef: { current: null } as React.RefObject<OrderBarRefLike | null>,
  promoCode: '',
  promoDiscount: 0,
  setPromoCode: () => {},
  setPromoDiscount: () => {},
  discountCelebrationAmount: null,
  setDiscountCelebrationAmount: () => {},
  priceBumpTrigger: 0,
  triggerPriceBump: () => {},
  headerCenterContent: null,
  setHeaderCenterContent: () => {},
  headerTrailingContent: null,
  setHeaderTrailingContent: () => {},
}

const ExperienceOrderContext = createContext<ExperienceOrderContextValue>(defaultValue)

export function ExperienceOrderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ExperienceOrderState>({ total: 0, itemCount: 0 })
  const [orderBarProps, setOrderBarPropsState] = useState<OrderBarContextProps | null>(null)
  const [promoCode, setPromoCodeState] = useState('')
  const [promoDiscount, setPromoDiscountState] = useState(0)
  const [discountCelebrationAmount, setDiscountCelebrationAmountState] = useState<number | null>(null)
  const [priceBumpTrigger, setPriceBumpTriggerState] = useState(0)
  const [headerCenterContent, setHeaderCenterContentState] = useState<ReactNode | null>(null)
  const [headerTrailingContent, setHeaderTrailingContentState] = useState<ReactNode | null>(null)
  const orderBarRef = useRef<OrderBarRefLike | null>(null)

  const setHeaderCenterContent = useCallback((content: ReactNode | null) => {
    setHeaderCenterContentState(content)
  }, [])

  const setHeaderTrailingContent = useCallback((content: ReactNode | null) => {
    setHeaderTrailingContentState(content)
  }, [])

  const triggerPriceBump = useCallback(() => {
    setPriceBumpTriggerState((n) => n + 1)
  }, [])

  const setOrderSummary = useCallback((s: ExperienceOrderState) => {
    setState(s)
  }, [])
  const openOrderBar = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EXPERIENCE_OPEN_ORDER))
    }
  }, [])
  const setOrderBarProps = useCallback((props: OrderBarContextProps) => {
    setOrderBarPropsState(props)
  }, [])
  const setPromoCode = useCallback((code: string) => setPromoCodeState(code), [])
  const setPromoDiscount = useCallback((amount: number) => setPromoDiscountState(amount), [])
  const setDiscountCelebrationAmount = useCallback((amount: number | null) => setDiscountCelebrationAmountState(amount), [])

  const value: ExperienceOrderContextValue = {
    ...state,
    setOrderSummary,
    openOrderBar,
    orderBarProps,
    setOrderBarProps,
    orderBarRef,
    promoCode,
    promoDiscount,
    setPromoCode,
    setPromoDiscount,
    discountCelebrationAmount,
    setDiscountCelebrationAmount,
    priceBumpTrigger,
    triggerPriceBump,
    headerCenterContent,
    setHeaderCenterContent,
    headerTrailingContent,
    setHeaderTrailingContent,
  }

  return (
    <ExperienceOrderContext.Provider value={value}>
      {children}
    </ExperienceOrderContext.Provider>
  )
}

export function useExperienceOrder() {
  return useContext(ExperienceOrderContext)
}

export function useExperienceOpenOrder(callback: () => void) {
  React.useEffect(() => {
    const handler = () => callback()
    window.addEventListener(EXPERIENCE_OPEN_ORDER, handler)
    return () => window.removeEventListener(EXPERIENCE_OPEN_ORDER, handler)
  }, [callback])
}
