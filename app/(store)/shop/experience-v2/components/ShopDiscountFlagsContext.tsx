'use client'

import { createContext, useContext, type ReactNode } from 'react'
import {
  DEFAULT_SHOP_DISCOUNT_FLAGS,
  type ShopDiscountFlags,
} from '@/lib/shop/shop-discount-flags'

const ShopDiscountFlagsContext = createContext<ShopDiscountFlags | null>(null)

export function ShopDiscountFlagsProvider({
  value,
  children,
}: {
  value: ShopDiscountFlags
  children: ReactNode
}) {
  return (
    <ShopDiscountFlagsContext.Provider value={value}>{children}</ShopDiscountFlagsContext.Provider>
  )
}

/** Falls back to defaults when used outside a provider (e.g. onboarding OrderBar with qty 0). */
export function useShopDiscountFlags(): ShopDiscountFlags {
  return useContext(ShopDiscountFlagsContext) ?? DEFAULT_SHOP_DISCOUNT_FLAGS
}
