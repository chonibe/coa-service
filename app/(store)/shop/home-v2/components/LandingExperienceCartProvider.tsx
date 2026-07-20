'use client'

import type { ReactNode } from 'react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import type { ShopDiscountSettings } from '@/lib/shop/shop-discount-flags'
import { ExperienceOrderProvider } from '@/app/(store)/shop/experience-v2/ExperienceOrderContext'
import { ShopDiscountFlagsProvider } from '@/app/(store)/shop/experience-v2/components/ShopDiscountFlagsContext'
import { LandingExperienceCartShell } from './LandingExperienceCartShell'

interface LandingExperienceCartProviderProps {
  lamp: ShopifyProduct | null
  shopDiscountSettings: ShopDiscountSettings
  children: ReactNode
}

/**
 * Wraps home-v2 landing with Experience order context + in-place OrderBar drawer.
 * Cart chip in `LandingNav` opens the slide-over without navigating to `/shop/experience`.
 */
export function LandingExperienceCartProvider({
  lamp,
  shopDiscountSettings,
  children,
}: LandingExperienceCartProviderProps) {
  return (
    <ExperienceOrderProvider>
      <ShopDiscountFlagsProvider value={shopDiscountSettings}>
        {children}
        {lamp ? <LandingExperienceCartShell lamp={lamp} /> : null}
      </ShopDiscountFlagsProvider>
    </ExperienceOrderProvider>
  )
}
