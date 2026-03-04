'use client'

/**
 * Hook to persist addresses to the user's account when added at any input level.
 * Fires POST /api/shop/account/addresses to ADD the address (supports multiple).
 * Use in checkout, modals, inline forms - anywhere an address is "saved".
 */

import { useCallback } from 'react'
import { useShopAuthContext } from './ShopAuthContext'
import type { CheckoutAddress } from './CheckoutContext'

export function useSaveAddressToAccount() {
  const { isAuthenticated } = useShopAuthContext()

  const addAddress = useCallback(
    async (address: CheckoutAddress | null) => {
      if (!isAuthenticated || !address) return
      try {
        await fetch('/api/shop/account/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ address }),
        })
      } catch {
        // Fire-and-forget; don't block UI
      }
    },
    [isAuthenticated]
  )

  const saveShippingAddress = useCallback(
    async (address: CheckoutAddress | null) => {
      await addAddress(address)
    },
    [addAddress]
  )

  const saveBillingAddress = useCallback(
    async (address: CheckoutAddress | null) => {
      await addAddress(address)
    },
    [addAddress]
  )

  return { saveShippingAddress, saveBillingAddress, addAddress }
}
