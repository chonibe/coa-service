/**
 * Pricing and Edition Size Unlock System
 * Uses bell curve logic based on vendor sales performance
 */

export const EDITION_SIZES = [8, 24, 44, 78, 90] as const
export type EditionSize = typeof EDITION_SIZES[number]

export interface EditionSizeTier {
  size: EditionSize
  minSales: number
  maxPrice: number
  minPrice: number
  recommendedPrice: number
}

export interface UnlockStatus {
  editionSizes: {
    size: EditionSize
    unlocked: boolean
    minSales: number
  }[]
  pricingTier: {
    level: number
    maxPrice: number
    minPrice: number
  }
  totalSales: number
}

/**
 * Bell curve tiers based on sales performance
 * Higher sales = smaller editions + higher prices unlocked
 */
const UNLOCK_TIERS: EditionSizeTier[] = [
  {
    size: 90, // Starting tier
    minSales: 0,
    minPrice: 40,
    maxPrice: 60,
    recommendedPrice: 50,
  },
  {
    size: 78,
    minSales: 5,
    minPrice: 45,
    maxPrice: 70,
    recommendedPrice: 58,
  },
  {
    size: 44,
    minSales: 15,
    minPrice: 50,
    maxPrice: 85,
    recommendedPrice: 68,
  },
  {
    size: 24,
    minSales: 30,
    minPrice: 60,
    maxPrice: 100,
    recommendedPrice: 80,
  },
  {
    size: 8, // Premium tier
    minSales: 50,
    minPrice: 75,
    maxPrice: 150,
    recommendedPrice: 112,
  },
]

/**
 * Calculate unlock status based on total sales
 */
export function calculateUnlockStatus(totalSales: number): UnlockStatus {
  const editionSizes = EDITION_SIZES.map((size) => {
    const tier = UNLOCK_TIERS.find((t) => t.size === size)
    const unlocked = tier ? totalSales >= tier.minSales : false
    
    return {
      size,
      unlocked,
      minSales: tier?.minSales ?? 999,
    }
  })

  // Calculate pricing tier (highest unlocked tier)
  const unlockedTiers = UNLOCK_TIERS.filter((tier) => totalSales >= tier.minSales)
  const highestTier = unlockedTiers.length > 0 
    ? unlockedTiers[unlockedTiers.length - 1]
    : UNLOCK_TIERS[0]

  return {
    editionSizes,
    pricingTier: {
      level: unlockedTiers.length,
      maxPrice: highestTier.maxPrice,
      minPrice: highestTier.minPrice,
    },
    totalSales,
  }
}

/**
 * Get recommended price for a given edition size
 */
export function getRecommendedPrice(editionSize: EditionSize, totalSales: number): number {
  const tier = UNLOCK_TIERS.find((t) => t.size === editionSize)
  if (!tier) {
    return 50 // Default
  }

  // Check if unlocked
  if (totalSales < tier.minSales) {
    return tier.recommendedPrice // Show recommendation even if locked
  }

  return tier.recommendedPrice
}

/**
 * Check if edition size is unlocked
 */
export function isEditionSizeUnlocked(editionSize: EditionSize, totalSales: number): boolean {
  const tier = UNLOCK_TIERS.find((t) => t.size === editionSize)
  if (!tier) return false
  return totalSales >= tier.minSales
}

/**
 * Get price range for a given edition size
 */
export function getPriceRange(editionSize: EditionSize): { min: number; max: number } {
  const tier = UNLOCK_TIERS.find((t) => t.size === editionSize)
  if (!tier) {
    return { min: 40, max: 60 }
  }
  return { min: tier.minPrice, max: tier.maxPrice }
}

/**
 * Validate price for edition size and sales performance
 */
export function validatePrice(
  price: number,
  editionSize: EditionSize,
  totalSales: number,
): { valid: boolean; message?: string } {
  const tier = UNLOCK_TIERS.find((t) => t.size === editionSize)
  if (!tier) {
    return { valid: false, message: "Invalid edition size" }
  }

  // Check if unlocked
  if (totalSales < tier.minSales) {
    return {
      valid: false,
      message: `Unlock ${editionSize} edition size by reaching ${tier.minSales} total sales (currently ${totalSales})`,
    }
  }

  // Check price range
  if (price < tier.minPrice) {
    return {
      valid: false,
      message: `Price must be at least $${tier.minPrice} for ${editionSize} edition size`,
    }
  }

  if (price > tier.maxPrice) {
    return {
      valid: false,
      message: `Price cannot exceed $${tier.maxPrice} for ${editionSize} edition size`,
    }
  }

  return { valid: true }
}

