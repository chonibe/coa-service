/**
 * Membership Tiers Configuration
 * 
 * Central configuration for all membership tier pricing, credits, and benefits.
 * @module lib/membership/tiers
 */

export type MembershipTierId = 'collector' | 'curator' | 'founding'

export interface MembershipTier {
  id: MembershipTierId
  name: string
  description: string
  priceMonthly: number // USD
  monthlyCredits: number
  creditValueUsd: number // What the credits are worth in USD
  appreciationMultiplier: number // Credit appreciation rate per month (e.g., 1.05 = 5%)
  stripePriceId: string
  features: string[]
  highlighted?: boolean // For marketing page
  badge?: string // Badge text
  color?: string // Brand color for tier
}

export interface AppreciationSchedule {
  months: number
  multiplier: number
}

/**
 * Credit appreciation schedule
 * Credits gain value the longer they're held (subscription credits only)
 */
export const APPRECIATION_SCHEDULE: AppreciationSchedule[] = [
  { months: 1, multiplier: 1.0 },   // Fresh credits
  { months: 3, multiplier: 1.05 },  // 3 months: 5% bonus
  { months: 6, multiplier: 1.10 },  // 6 months: 10% bonus
  { months: 12, multiplier: 1.15 }, // 12 months: 15% bonus
  { months: 24, multiplier: 1.20 }, // 24 months: 20% bonus (max)
]

/**
 * Get appreciation multiplier for credits of a given age
 */
export function getAppreciationMultiplier(monthsHeld: number): number {
  // Find the highest applicable multiplier
  let multiplier = 1.0
  for (const schedule of APPRECIATION_SCHEDULE) {
    if (monthsHeld >= schedule.months) {
      multiplier = schedule.multiplier
    }
  }
  return multiplier
}

/**
 * Membership tier definitions
 */
export const MEMBERSHIP_TIERS: Record<MembershipTierId, MembershipTier> = {
  collector: {
    id: 'collector',
    name: 'Collector',
    description: 'Start your collecting journey with monthly credits',
    priceMonthly: 10,
    monthlyCredits: 100,
    creditValueUsd: 10, // $0.10 per credit
    appreciationMultiplier: 1.05,
    stripePriceId: process.env.STRIPE_PRICE_COLLECTOR || '',
    color: '#6366f1', // Indigo
    features: [
      '100 credits/month ($10 value)',
      'Credits appreciate over time',
      'Early access to new drops',
      'Member-only pricing',
      'Digital collector badge',
    ],
  },
  curator: {
    id: 'curator',
    name: 'Curator',
    description: 'Enhanced membership with bonus credits and perks',
    priceMonthly: 22,
    monthlyCredits: 280,
    creditValueUsd: 28, // ~27% bonus value
    appreciationMultiplier: 1.05,
    stripePriceId: process.env.STRIPE_PRICE_CURATOR || '',
    highlighted: true,
    badge: 'Most Popular',
    color: '#8b5cf6', // Violet
    features: [
      '280 credits/month ($28 value)',
      '27% bonus credits vs Collector',
      'Priority access to limited editions',
      'Exclusive curator events',
      'Free shipping on all orders',
      'Curator badge + profile flair',
    ],
  },
  founding: {
    id: 'founding',
    name: 'Founding Member',
    description: 'Premium tier with maximum benefits and recognition',
    priceMonthly: 50,
    monthlyCredits: 750,
    creditValueUsd: 75, // 50% bonus value
    appreciationMultiplier: 1.05,
    stripePriceId: process.env.STRIPE_PRICE_FOUNDING || '',
    badge: 'Founding',
    color: '#f59e0b', // Amber/Gold
    features: [
      '750 credits/month ($75 value)',
      '50% bonus credits',
      'First access to all drops',
      'Private founding member events',
      'Free express shipping',
      'Founding member badge (permanent)',
      'Direct artist connection',
      'Exclusive founding editions',
    ],
  },
}

/**
 * Get tier by Stripe price ID
 */
export function getTierByPriceId(priceId: string): MembershipTier | undefined {
  return Object.values(MEMBERSHIP_TIERS).find(
    tier => tier.stripePriceId === priceId
  )
}

/**
 * Get tier by ID
 */
export function getTierById(tierId: MembershipTierId): MembershipTier {
  return MEMBERSHIP_TIERS[tierId]
}

/**
 * Get all tiers as array (for rendering)
 */
export function getAllTiers(): MembershipTier[] {
  return Object.values(MEMBERSHIP_TIERS)
}

/**
 * Calculate credits value in USD
 * Accounts for appreciation if credits have been held
 */
export function calculateCreditsValue(
  credits: number,
  monthsHeld: number = 0
): number {
  const multiplier = getAppreciationMultiplier(monthsHeld)
  // Base rate: $0.10 per credit
  const baseValue = credits * 0.10
  return baseValue * multiplier
}

/**
 * Calculate how many credits needed for a purchase
 * Returns the credit amount required (may be less due to appreciation)
 */
export function creditsRequiredForPurchase(
  amountUsd: number,
  monthsHeld: number = 0
): number {
  const multiplier = getAppreciationMultiplier(monthsHeld)
  // Base rate: 10 credits = $1
  const baseCredits = amountUsd * 10
  // Apply appreciation discount
  return Math.ceil(baseCredits / multiplier)
}

/**
 * Upgrade/downgrade tier comparison
 */
export function compareTiers(
  currentTierId: MembershipTierId,
  newTierId: MembershipTierId
): 'upgrade' | 'downgrade' | 'same' {
  const tierOrder: MembershipTierId[] = ['collector', 'curator', 'founding']
  const currentIndex = tierOrder.indexOf(currentTierId)
  const newIndex = tierOrder.indexOf(newTierId)
  
  if (newIndex > currentIndex) return 'upgrade'
  if (newIndex < currentIndex) return 'downgrade'
  return 'same'
}

/**
 * Calculate proration for tier change
 */
export function calculateProration(
  currentTier: MembershipTier,
  newTier: MembershipTier,
  daysRemainingInPeriod: number,
  totalDaysInPeriod: number
): {
  creditAmount: number // Positive = charge, negative = credit
  description: string
} {
  const dailyRateCurrent = currentTier.priceMonthly / totalDaysInPeriod
  const dailyRateNew = newTier.priceMonthly / totalDaysInPeriod
  
  const unusedValue = dailyRateCurrent * daysRemainingInPeriod
  const newCost = dailyRateNew * daysRemainingInPeriod
  
  const creditAmount = Math.round((newCost - unusedValue) * 100) / 100
  
  const direction = compareTiers(currentTier.id, newTier.id)
  const description = direction === 'upgrade'
    ? `Upgrade from ${currentTier.name} to ${newTier.name}`
    : `Downgrade from ${currentTier.name} to ${newTier.name}`
  
  return { creditAmount, description }
}

export default {
  MEMBERSHIP_TIERS,
  APPRECIATION_SCHEDULE,
  getTierById,
  getTierByPriceId,
  getAllTiers,
  getAppreciationMultiplier,
  calculateCreditsValue,
  creditsRequiredForPurchase,
  compareTiers,
  calculateProration,
}
