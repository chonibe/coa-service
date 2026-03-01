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
  onRemoveArtwork: (id: string) => void
  onSelectArtwork?: (product: ShopifyProduct) => void
  onViewLampDetail?: (product: ShopifyProduct) => void
  isGift: boolean
}

interface ExperienceOrderContextValue extends ExperienceOrderState {
  setOrderSummary: (state: ExperienceOrderState) => void
  openOrderBar: () => void
  /** Full OrderBar props – set by Configurator, or empty defaults when on quiz */
  orderBarProps: OrderBarContextProps | null
  setOrderBarProps: (props: OrderBarContextProps) => void
  /** Ref for OrderBar (e.g. testZeroOrder) – set when OrderBar mounts */
  orderBarRef: React.RefObject<OrderBarRefLike | null>
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
}

const ExperienceOrderContext = createContext<ExperienceOrderContextValue>(defaultValue)

export function ExperienceOrderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ExperienceOrderState>({ total: 0, itemCount: 0 })
  const [orderBarProps, setOrderBarPropsState] = useState<OrderBarContextProps | null>(null)
  const orderBarRef = useRef<OrderBarRefLike | null>(null)

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

  const value: ExperienceOrderContextValue = {
    ...state,
    setOrderSummary,
    openOrderBar,
    orderBarProps,
    setOrderBarProps,
    orderBarRef,
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
