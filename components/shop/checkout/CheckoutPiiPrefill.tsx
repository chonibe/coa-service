'use client'

/**
 * CheckoutPiiPrefill
 *
 * Pre-fills checkout address with PII from ShopAuthContext (user) when address
 * is empty. Uses existing useShopAuth data—no separate API call.
 * Must be inside both ShopAuthProvider and CheckoutProvider.
 */

import { useEffect, useRef } from 'react'
import { useShopAuthContext } from '@/lib/shop/ShopAuthContext'
import { useCheckout, type CheckoutAddress } from '@/lib/shop/CheckoutContext'
import { PHONE_DIAL_OPTIONS } from '@/lib/data/countries'

function parsePhone(raw: string): { phoneCountryCode: string; phoneNumber: string } {
  const trimmed = raw?.trim() || ''
  if (!trimmed) return { phoneCountryCode: '+1', phoneNumber: '' }

  if (trimmed.startsWith('+')) {
    const sorted = [...PHONE_DIAL_OPTIONS].sort((a, b) => b.dial.length - a.dial.length)
    for (const { dial } of sorted) {
      if (trimmed.startsWith(dial)) {
        const rest = trimmed.slice(dial.length).replace(/^\s+/, '')
        return { phoneCountryCode: dial, phoneNumber: rest || trimmed }
      }
    }
  }

  return { phoneCountryCode: '+1', phoneNumber: trimmed }
}

export function CheckoutPiiPrefill() {
  const { user } = useShopAuthContext()
  const checkout = useCheckout()
  const hasPrefilledRef = useRef(false)

  useEffect(() => {
    if (!user || hasPrefilledRef.current) return
    if (checkout.address !== null) return
    if (!user.email?.trim()) return
    if (!user.firstName && !user.lastName) return

    hasPrefilledRef.current = true

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
    const { phoneCountryCode, phoneNumber } = parsePhone(user.phone || '')

    const partial: CheckoutAddress = {
      email: user.email.trim(),
      fullName: fullName || '',
      // Leave country empty so AddressModal's geo-detection fills it for
      // international users instead of always defaulting to US.
      country: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      phoneCountryCode,
      phoneNumber,
    }

    checkout.setAddress(partial)
  }, [user, checkout.address, checkout.setAddress])

  return null
}
