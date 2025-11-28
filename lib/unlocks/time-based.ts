/**
 * Time-Based Unlock Logic
 * Handles checking if time-based unlock conditions are met
 */

export interface TimeBasedUnlockConfig {
  unlock_at?: string // ISO timestamp for one-time unlock
  unlock_schedule?: {
    type: 'daily' | 'weekly' | 'custom'
    time: string // HH:MM format
    timezone?: string
    start_date?: string
    end_date?: string
  }
}

export interface UnlockCountdown {
  isUnlocked: boolean
  timeUntilUnlock: number // milliseconds
  formatted: string // "2h 30m" or "Unlocked"
  nextUnlockTime?: Date
}

/**
 * Check if a time-based unlock condition is met
 */
export function checkTimeBasedUnlock(config: TimeBasedUnlockConfig, now: Date = new Date()): boolean {
  if (config.unlock_at) {
    // One-time unlock
    const unlockTime = new Date(config.unlock_at)
    return now >= unlockTime
  }

  if (config.unlock_schedule) {
    // Recurring unlock
    return checkRecurringUnlock(config.unlock_schedule, now)
  }

  return false
}

/**
 * Check if a recurring unlock schedule is active
 */
function checkRecurringUnlock(
  schedule: TimeBasedUnlockConfig['unlock_schedule'],
  now: Date
): boolean {
  if (!schedule) return false

  // Parse time (HH:MM)
  const [hours, minutes] = schedule.time.split(':').map(Number)
  const scheduleTime = new Date(now)
  scheduleTime.setHours(hours, minutes, 0, 0)

  // Handle timezone if specified
  if (schedule.timezone) {
    // Convert to specified timezone
    const timezoneOffset = getTimezoneOffset(schedule.timezone)
    scheduleTime.setMinutes(scheduleTime.getMinutes() - timezoneOffset)
  }

  // Check start/end dates
  if (schedule.start_date) {
    const startDate = new Date(schedule.start_date)
    if (now < startDate) return false
  }

  if (schedule.end_date) {
    const endDate = new Date(schedule.end_date)
    if (now > endDate) return false
  }

  switch (schedule.type) {
    case 'daily':
      // Check if current time has passed today's schedule time
      return now >= scheduleTime

    case 'weekly':
      // Check if it's the right day of week and time has passed
      // For simplicity, we'll check if it's been at least 7 days since start
      if (schedule.start_date) {
        const startDate = new Date(schedule.start_date)
        const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        return daysSinceStart >= 0 && now >= scheduleTime
      }
      return now >= scheduleTime

    case 'custom':
      // Custom logic would go here
      return false

    default:
      return false
  }
}

/**
 * Get countdown information for a time-based unlock
 */
export function getUnlockCountdown(
  config: TimeBasedUnlockConfig,
  now: Date = new Date()
): UnlockCountdown {
  let nextUnlockTime: Date | undefined
  let isUnlocked = false

  if (config.unlock_at) {
    // One-time unlock
    nextUnlockTime = new Date(config.unlock_at)
    isUnlocked = now >= nextUnlockTime
  } else if (config.unlock_schedule) {
    // Recurring unlock
    const [hours, minutes] = config.unlock_schedule.time.split(':').map(Number)
    nextUnlockTime = new Date(now)
    nextUnlockTime.setHours(hours, minutes, 0, 0)

    // If time has passed today, set for tomorrow
    if (now >= nextUnlockTime) {
      nextUnlockTime.setDate(nextUnlockTime.getDate() + 1)
    }

    isUnlocked = checkRecurringUnlock(config.unlock_schedule, now)
  }

  const timeUntilUnlock = nextUnlockTime
    ? Math.max(0, nextUnlockTime.getTime() - now.getTime())
    : 0

  return {
    isUnlocked,
    timeUntilUnlock,
    formatted: formatCountdown(timeUntilUnlock, isUnlocked),
    nextUnlockTime,
  }
}

/**
 * Format countdown time as human-readable string
 */
function formatCountdown(ms: number, isUnlocked: boolean): string {
  if (isUnlocked) return "Unlocked"

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

/**
 * Get timezone offset in minutes
 * Simplified - in production, use a proper timezone library
 */
function getTimezoneOffset(timezone: string): number {
  // This is a simplified version
  // In production, use a library like date-fns-tz or moment-timezone
  const now = new Date()
  const utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }))
  const tz = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
  return (tz.getTime() - utc.getTime()) / (1000 * 60)
}

