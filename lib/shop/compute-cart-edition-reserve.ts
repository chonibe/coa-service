import { CART_EDITION_HOLD_TTL_MS } from '@/lib/shop/cart-edition-hold-config'
import type { CartEditionHold } from '@/lib/shop/cart-edition-hold-types'

/**
 * Next edition number to display for a new cart hold.
 * Accounts for sold count plus other active holds on the same product.
 */
export function computeReservedEditionNumber(
  editionsSold: number,
  otherActiveHoldCount: number,
  options?: { firstEditionReserved?: boolean }
): number {
  const sold = Math.max(0, Math.floor(editionsSold))
  const queue = Math.max(0, Math.floor(otherActiveHoldCount))
  const base = options?.firstEditionReserved && sold === 0 ? 2 : sold + 1
  return base + queue
}

export function cartEditionHoldExpiresAt(fromMs: number = Date.now()): string {
  return new Date(fromMs + CART_EDITION_HOLD_TTL_MS).toISOString()
}

export function isCartEditionHoldActive(expiresAt: string, nowMs: number = Date.now()): boolean {
  const t = Date.parse(expiresAt)
  return Number.isFinite(t) && t > nowMs
}

/** Keep existing expiry when hold is still active; otherwise start a fresh 24h window. */
export function resolveCartEditionHoldExpiresAt(
  existingExpiresAt: string | null | undefined,
  nowMs: number = Date.now()
): string {
  if (existingExpiresAt && isCartEditionHoldActive(existingExpiresAt, nowMs)) {
    return existingExpiresAt
  }
  return cartEditionHoldExpiresAt(nowMs)
}

/** Keep assigned edition number on active resync; recompute after expiry or first add. */
export function resolveCartEditionHoldEditionNumber(
  existingEditionNumber: number | null | undefined,
  computedEditionNumber: number,
  existingExpiresAt: string | null | undefined,
  nowMs: number = Date.now()
): number | null {
  if (
    existingExpiresAt &&
    isCartEditionHoldActive(existingExpiresAt, nowMs) &&
    existingEditionNumber != null
  ) {
    return existingEditionNumber
  }
  return computedEditionNumber
}

/** Edition number to show in hold UI — hold assignment first, then optional client fallback. */
export function resolveCartEditionHoldDisplayNumber(
  hold: Pick<CartEditionHold, 'editionNumber'>,
  fallbackEditionNumber?: number | null
): number | null {
  if (hold.editionNumber != null && Number.isFinite(hold.editionNumber)) {
    return Math.floor(hold.editionNumber)
  }
  if (fallbackEditionNumber != null && Number.isFinite(fallbackEditionNumber)) {
    return Math.floor(fallbackEditionNumber)
  }
  return null
}

export function formatCartEditionHoldEditionLabel(displayNumber: number | null): string {
  return displayNumber != null ? `Edition #${displayNumber}` : 'Edition'
}
