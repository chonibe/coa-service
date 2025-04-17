// This engine determines what content to show based on behavioral science principles

export type RewardSchedule = "fixed" | "variable" | "diminishing" | "progressive"

export interface RewardStrategy {
  // How many days between content refreshes
  refreshInterval: number | [number, number] // Fixed number or [min, max] for variable
  // Whether content expires
  expiresAfter?: number | [number, number] // Hours until expiry, or [min, max]
  // Whether to use scarcity messaging
  useScarcity: boolean
  // Whether to show countdown timers
  showCountdown: boolean
  // Whether to notify about expiring content
  notifyBeforeExpiry: boolean
  // Whether to use streak mechanics
  useStreaks: boolean
}

// Different strategies for different collector segments
export const rewardStrategies: Record<string, RewardStrategy> = {
  newCollector: {
    refreshInterval: 2, // Every 2 days
    expiresAfter: [24, 48], // Expires after 24-48 hours
    useScarcity: true,
    showCountdown: true,
    notifyBeforeExpiry: true,
    useStreaks: false,
  },
  activeCollector: {
    refreshInterval: [3, 7], // Variable interval between 3-7 days
    expiresAfter: [48, 72], // Expires after 48-72 hours
    useScarcity: true,
    showCountdown: true,
    notifyBeforeExpiry: true,
    useStreaks: true,
  },
  whaleCollector: {
    refreshInterval: [1, 4], // More frequent for high-value collectors
    expiresAfter: [72, 96], // Longer viewing window
    useScarcity: true,
    showCountdown: false, // Less pressure for whales
    notifyBeforeExpiry: true,
    useStreaks: true,
  },
}

export function getCollectorSegment(collectorData: any): string {
  // In a real implementation, this would analyze purchase history, engagement, etc.
  const purchaseCount = collectorData?.purchases?.length || 0
  const totalSpent = collectorData?.totalSpent || 0

  if (totalSpent > 10000 || purchaseCount > 5) return "whaleCollector"
  if (purchaseCount > 0) return "activeCollector"
  return "newCollector"
}

export function shouldShowNewContent(lastVisit: Date, strategy: RewardStrategy): boolean {
  const now = new Date()
  const daysSinceLastVisit = Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))

  // If interval is a range, pick a random number in that range
  const interval = Array.isArray(strategy.refreshInterval)
    ? Math.floor(Math.random() * (strategy.refreshInterval[1] - strategy.refreshInterval[0] + 1)) +
      strategy.refreshInterval[0]
    : strategy.refreshInterval

  // Show new content if enough days have passed
  return daysSinceLastVisit >= interval
}

export function getExpiryTime(strategy: RewardStrategy): Date | null {
  if (!strategy.expiresAfter) return null

  const now = new Date()
  const hoursToAdd = Array.isArray(strategy.expiresAfter)
    ? Math.floor(Math.random() * (strategy.expiresAfter[1] - strategy.expiresAfter[0] + 1)) + strategy.expiresAfter[0]
    : strategy.expiresAfter

  now.setHours(now.getHours() + hoursToAdd)
  return now
}

// Randomly determine if we should show a "limited availability" message
export function shouldShowScarcityMessage(strategy: RewardStrategy): boolean {
  if (!strategy.useScarcity) return false

  // 70% chance of showing scarcity message if strategy uses scarcity
  return Math.random() < 0.7
}

// Calculate streak for a collector
export function calculateStreak(viewHistory: Date[]): number {
  if (!viewHistory || viewHistory.length === 0) return 0

  // Sort dates in ascending order
  const sortedDates = [...viewHistory].sort((a, b) => a.getTime() - b.getTime())

  let currentStreak = 1
  const oneDayMs = 24 * 60 * 60 * 1000
  const twoDaysMs = 2 * oneDayMs

  for (let i = 1; i < sortedDates.length; i++) {
    const timeDiff = sortedDates[i].getTime() - sortedDates[i - 1].getTime()

    // If viewed on consecutive days or within 2 days, continue streak
    if (timeDiff <= twoDaysMs) {
      currentStreak++
    } else {
      // Break in streak
      currentStreak = 1
    }
  }

  // Check if streak is still active (viewed within last 2 days)
  const now = new Date()
  const lastViewTime = sortedDates[sortedDates.length - 1].getTime()
  if (now.getTime() - lastViewTime > twoDaysMs) {
    return 0 // Streak expired
  }

  return currentStreak
}
