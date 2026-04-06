'use client'

import { createContext, useContext, type ReactNode } from 'react'
import {
  DEFAULT_SHOP_DISCOUNT_SETTINGS,
  type ShopDiscountFlags,
  type ShopDiscountSettings,
} from '@/lib/shop/shop-discount-flags'

const ShopDiscountSettingsContext = createContext<ShopDiscountSettings | null>(null)

export function ShopDiscountFlagsProvider({
  value,
  children,
}: {
  value: ShopDiscountSettings
  children: ReactNode
}) {
  return (
    <ShopDiscountSettingsContext.Provider value={value}>
      {children}
    </ShopDiscountSettingsContext.Provider>
  )
}

/** Full settings (lamp flag + featured bundle pricing). */
export function useShopDiscountSettings(): ShopDiscountSettings {
  return useContext(ShopDiscountSettingsContext) ?? DEFAULT_SHOP_DISCOUNT_SETTINGS
}

/** Falls back to defaults when used outside a provider (e.g. onboarding OrderBar with qty 0). */
export function useShopDiscountFlags(): ShopDiscountFlags {
  return useShopDiscountSettings().flags
}
