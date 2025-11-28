/**
 * VIP/Loyalty Unlock Logic
 * Handles checking if VIP unlock conditions are met based on collector ownership
 */

export interface VIPUnlockConfig {
  requires_ownership?: string[] // Artwork IDs that must be owned
  vip_tier?: number // Minimum tier level required
  loyalty_points_required?: number
}

export interface CollectorOwnership {
  ownedArtworkIds: string[]
  loyaltyPoints: number
  vipTier: number
  purchaseCount: number
  firstPurchaseDate?: Date
}

/**
 * Check if a collector meets VIP unlock requirements
 */
export function checkVIPUnlock(
  config: VIPUnlockConfig,
  collectorOwnership: CollectorOwnership
): boolean {
  // Check ownership requirements
  if (config.requires_ownership && config.requires_ownership.length > 0) {
    const hasAllRequired = config.requires_ownership.every((artworkId) =>
      collectorOwnership.ownedArtworkIds.includes(artworkId)
    )
    if (!hasAllRequired) return false
  }

  // Check VIP tier requirement
  if (config.vip_tier !== undefined) {
    if (collectorOwnership.vipTier < config.vip_tier) return false
  }

  // Check loyalty points requirement
  if (config.loyalty_points_required !== undefined) {
    if (collectorOwnership.loyaltyPoints < config.loyalty_points_required) return false
  }

  return true
}

/**
 * Calculate loyalty points based on purchase history
 */
export function calculateLoyaltyPoints(
  purchaseCount: number,
  firstPurchaseDate?: Date,
  now: Date = new Date()
): number {
  let points = purchaseCount * 10 // Base points per purchase

  // Bonus for early adopters
  if (firstPurchaseDate) {
    const daysSinceFirstPurchase = Math.floor(
      (now.getTime() - firstPurchaseDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSinceFirstPurchase > 365) {
      points += 50 // Long-term collector bonus
    } else if (daysSinceFirstPurchase > 180) {
      points += 25 // Medium-term collector bonus
    }
  }

  return points
}

/**
 * Calculate VIP tier based on loyalty points
 */
export function calculateVIPTier(loyaltyPoints: number): number {
  if (loyaltyPoints >= 500) return 5 // Highest tier
  if (loyaltyPoints >= 300) return 4
  if (loyaltyPoints >= 200) return 3
  if (loyaltyPoints >= 100) return 2
  if (loyaltyPoints >= 50) return 1
  return 0 // No tier
}

/**
 * Get collector ownership data (to be called from API)
 */
export async function getCollectorOwnership(
  collectorId: string,
  seriesId?: string
): Promise<CollectorOwnership> {
  // This would typically fetch from database
  // For now, return mock structure
  return {
    ownedArtworkIds: [],
    loyaltyPoints: 0,
    vipTier: 0,
    purchaseCount: 0,
  }
}

