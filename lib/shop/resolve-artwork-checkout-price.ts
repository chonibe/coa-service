/**
 * Apply an active Reserve lock (USD) over the storefront variant price at checkout build time.
 */
export type ArtworkPriceLock = {
  lockedUsd: number
  expiresAtIso: string
}

export function resolveArtworkCheckoutPriceUsd(
  storefrontUsd: number,
  lock: ArtworkPriceLock | null | undefined
): number {
  if (!lock || !(lock.lockedUsd > 0) || !lock.expiresAtIso) return storefrontUsd
  const exp = new Date(lock.expiresAtIso).getTime()
  if (!Number.isFinite(exp) || exp <= Date.now()) return storefrontUsd
  return lock.lockedUsd
}
