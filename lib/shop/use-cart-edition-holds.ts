'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { normalizeShopifyProductId } from '@/lib/shop/shopify-product-id'
import type { StreetEditionStatesRow } from '@/lib/shop/street-edition-states'
import {
  CART_EDITION_HOLD_LOCAL_STORAGE_KEY,
  CART_EDITION_HOLD_SESSION_STORAGE_KEY,
  CART_EDITION_HOLD_TTL_MS,
} from '@/lib/shop/cart-edition-hold-config'
import type { CartEditionHold } from '@/lib/shop/cart-edition-hold-types'
import {
  cartEditionHoldExpiresAt,
  computeReservedEditionNumber,
  isCartEditionHoldActive,
} from '@/lib/shop/compute-cart-edition-reserve'

function holdsRecordFromList(holds: CartEditionHold[]): Record<string, CartEditionHold> {
  const out: Record<string, CartEditionHold> = {}
  for (const h of holds) {
    if (isCartEditionHoldActive(h.expiresAt)) {
      out[h.shopifyProductId] = h
    }
  }
  return out
}

function readSessionHolds(): Record<string, CartEditionHold> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = sessionStorage.getItem(CART_EDITION_HOLD_SESSION_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as CartEditionHold[]
      if (Array.isArray(parsed)) return holdsRecordFromList(parsed)
    }
    // One-time migration from legacy localStorage key.
    const legacy = localStorage.getItem(CART_EDITION_HOLD_LOCAL_STORAGE_KEY)
    if (legacy) {
      const parsed = JSON.parse(legacy) as CartEditionHold[]
      if (Array.isArray(parsed)) {
        const record = holdsRecordFromList(parsed)
        writeSessionHolds(record)
        localStorage.removeItem(CART_EDITION_HOLD_LOCAL_STORAGE_KEY)
        return record
      }
    }
    return {}
  } catch {
    return {}
  }
}

function writeSessionHolds(holds: Record<string, CartEditionHold>) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(
      CART_EDITION_HOLD_SESSION_STORAGE_KEY,
      JSON.stringify(Object.values(holds))
    )
  } catch {
    // ignore quota errors
  }
}

function buildLocalHold(
  productId: string,
  streetRow?: StreetEditionStatesRow | null
): CartEditionHold {
  const priceUsd = streetRow?.priceUsd ?? null
  const editionsSold =
    streetRow?.editionsSold != null && Number.isFinite(streetRow.editionsSold)
      ? Math.max(0, Math.floor(streetRow.editionsSold))
      : null
  const editionNumber =
    editionsSold != null ? computeReservedEditionNumber(editionsSold, 0) : null
  return {
    shopifyProductId: productId,
    editionNumber,
    lockedPriceUsd: priceUsd,
    expiresAt: cartEditionHoldExpiresAt(),
  }
}

function mergeSessionHoldsForCart(
  existing: Record<string, CartEditionHold>,
  cartNumericIds: string[],
  streetEditionByProductId: Record<string, StreetEditionStatesRow>
): Record<string, CartEditionHold> {
  const next = { ...existing }
  for (const id of cartNumericIds) {
    const current = next[id]
    if (!current || !isCartEditionHoldActive(current.expiresAt)) {
      next[id] = buildLocalHold(id, streetEditionByProductId[id])
    }
  }
  return holdsRecordFromList(Object.values(next))
}

export function formatCartEditionHoldRemaining(expiresAt: string, nowMs: number = Date.now()): string {
  const ms = Date.parse(expiresAt) - nowMs
  if (!Number.isFinite(ms) || ms <= 0) return 'Expired'
  const totalMinutes = Math.ceil(ms / 60000)
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }
  return `${totalMinutes}m`
}

export function useCartEditionHolds(options: {
  cartProductGids: string[]
  streetEditionByProductId: Record<string, StreetEditionStatesRow>
  enabled?: boolean
}) {
  const { cartProductGids, streetEditionByProductId, enabled = true } = options
  const [sessionHoldsByProductId, setSessionHoldsByProductId] = useState<
    Record<string, CartEditionHold>
  >({})
  const [localFallback, setLocalFallback] = useState(false)
  const [tick, setTick] = useState(0)
  const syncInFlight = useRef(false)
  const lastSyncedKey = useRef('')

  const cartNumericIds = useMemo(() => {
    const ids = cartProductGids
      .map((gid) => normalizeShopifyProductId(gid))
      .filter((x): x is string => !!x)
    return Array.from(new Set(ids)).sort()
  }, [cartProductGids])

  const cartSyncKey = cartNumericIds.join(',')

  const refreshFromServer = useCallback(async () => {
    try {
      const r = await fetch('/api/shop/cart/edition-holds', { credentials: 'include' })
      const j = (await r.json()) as { holds?: CartEditionHold[] }
      if (!r.ok) return false
      setSessionHoldsByProductId(holdsRecordFromList(j.holds || []))
      return true
    } catch {
      return false
    }
  }, [])

  const syncWithCart = useCallback(async () => {
    if (!enabled || syncInFlight.current) return
    syncInFlight.current = true
    try {
      if (localFallback) {
        const next = mergeSessionHoldsForCart(
          readSessionHolds(),
          cartNumericIds,
          streetEditionByProductId
        )
        writeSessionHolds(next)
        setSessionHoldsByProductId(next)
        return
      }

      if (cartNumericIds.length > 0) {
        const r = await fetch('/api/shop/cart/edition-holds', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shopifyProductIds: cartNumericIds }),
        })

        if (r.status === 503) {
          setLocalFallback(true)
          const next = mergeSessionHoldsForCart(
            readSessionHolds(),
            cartNumericIds,
            streetEditionByProductId
          )
          writeSessionHolds(next)
          setSessionHoldsByProductId(next)
          return
        }
      }

      await refreshFromServer()
      setLocalFallback(false)
    } finally {
      syncInFlight.current = false
    }
  }, [cartNumericIds, enabled, localFallback, refreshFromServer, streetEditionByProductId])

  useEffect(() => {
    if (!enabled) {
      setSessionHoldsByProductId({})
      return
    }
    if (localFallback) {
      setSessionHoldsByProductId(readSessionHolds())
      return
    }
    void refreshFromServer()
  }, [enabled, localFallback, refreshFromServer])

  useEffect(() => {
    if (!enabled) return
    if (cartSyncKey === lastSyncedKey.current) return
    lastSyncedKey.current = cartSyncKey
    void syncWithCart()
  }, [cartSyncKey, enabled, syncWithCart])

  useEffect(() => {
    if (!enabled) return
    const id = window.setInterval(() => setTick((n) => n + 1), 60_000)
    return () => clearInterval(id)
  }, [enabled])

  const activeSessionHolds = useMemo(() => {
    void tick
    return holdsRecordFromList(Object.values(sessionHoldsByProductId))
  }, [sessionHoldsByProductId, tick])

  const cartHoldsByProductId = useMemo(() => {
    void tick
    const out: Record<string, CartEditionHold> = {}
    for (const id of cartNumericIds) {
      const h = activeSessionHolds[id]
      if (h) out[id] = h
    }
    return out
  }, [activeSessionHolds, cartNumericIds, tick])

  const sessionSoonestExpiry = useMemo(() => {
    const times = Object.values(activeSessionHolds)
      .map((h) => Date.parse(h.expiresAt))
      .filter(Number.isFinite)
    if (times.length === 0) return null
    return new Date(Math.min(...times)).toISOString()
  }, [activeSessionHolds])

  const cartSoonestExpiry = useMemo(() => {
    const times = Object.values(cartHoldsByProductId)
      .map((h) => Date.parse(h.expiresAt))
      .filter(Number.isFinite)
    if (times.length === 0) return null
    return new Date(Math.min(...times)).toISOString()
  }, [cartHoldsByProductId])

  return {
    /** All active session holds (including items removed from cart). */
    holdsByProductId: activeSessionHolds,
    /** @alias holdsByProductId — all session holds from GET / sessionStorage. */
    activeHolds: activeSessionHolds,
    /** Active holds for products currently in the cart. */
    cartHoldsByProductId,
    localFallback,
    soonestExpiry: cartSoonestExpiry,
    sessionSoonestExpiry,
    formatRemaining: formatCartEditionHoldRemaining,
    ttlHours: CART_EDITION_HOLD_TTL_MS / 3600000,
  }
}
