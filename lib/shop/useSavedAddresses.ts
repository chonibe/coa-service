'use client'

/**
 * Fetches saved addresses from the user's account.
 * Supports multiple addresses. Use in AddressModal, checkout, account page.
 */

import { useState, useEffect, useCallback } from 'react'
import { useShopAuthContext } from './ShopAuthContext'
import type { CheckoutAddress } from './CheckoutContext'

export interface SavedAddress {
  id: string
  address: CheckoutAddress
  label: string | null
  createdAt: string
}

interface SavedAddressesResponse {
  addresses: SavedAddress[]
  shippingAddress: CheckoutAddress | null
  billingAddress: CheckoutAddress | null
}

export function useSavedAddresses() {
  const { isAuthenticated } = useShopAuthContext()
  const [data, setData] = useState<SavedAddressesResponse>({
    addresses: [],
    shippingAddress: null,
    billingAddress: null,
  })
  const [loading, setLoading] = useState(false)

  const fetchAddresses = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const res = await fetch('/api/shop/account/addresses', {
        credentials: 'include',
      })
      if (res.ok) {
        const json = await res.json()
        setData({
          addresses: json.addresses ?? [],
          shippingAddress: json.shippingAddress ?? null,
          billingAddress: json.billingAddress ?? null,
        })
      }
    } catch {
      setData({ addresses: [], shippingAddress: null, billingAddress: null })
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses()
    } else {
      setData({ addresses: [], shippingAddress: null, billingAddress: null })
    }
  }, [isAuthenticated, fetchAddresses])

  return { ...data, loading, refresh: fetchAddresses }
}
