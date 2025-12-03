/**
 * Default Value Processor
 * Handles processing of static and dynamic default values for custom fields
 */

export interface DefaultValueConfig {
  type: "static" | "dynamic"
  value: any
}

export interface ProcessedDefaultValue {
  value: any
  isDynamic?: boolean
}

/**
 * Process a default value configuration
 * @param defaultValue - The default value JSONB from database
 * @param fieldType - The type of the custom field
 * @param userId - Current user ID (for "current-user" dynamic defaults)
 * @returns Processed value ready to be inserted
 */
export function processDefaultValue(
  defaultValue: DefaultValueConfig | null,
  fieldType: string,
  userId?: string | null
): any {
  if (!defaultValue) {
    return null
  }

  // Handle static defaults
  if (defaultValue.type === "static") {
    return defaultValue.value
  }

  // Handle dynamic defaults
  if (defaultValue.type === "dynamic") {
    const dynamicValue = defaultValue.value

    // Handle "current-user" for actor-reference attributes
    if (dynamicValue === "current-user" && userId) {
      return {
        id: userId,
        type: "user",
      }
    }

    // Handle ISO 8601 Duration for date/timestamp attributes
    if (
      (fieldType === "date" || fieldType === "timestamp") &&
      typeof dynamicValue === "string" &&
      dynamicValue.startsWith("P")
    ) {
      // Parse ISO 8601 duration (e.g., "P1M" = 1 month from now)
      return calculateDateFromDuration(dynamicValue)
    }

    // Return dynamic value as-is for other cases
    return dynamicValue
  }

  // Fallback: treat as static value
  return defaultValue.value
}

/**
 * Calculate a date from an ISO 8601 duration string
 * Supports: PnYnMnDTnHnMnS (e.g., P1M = 1 month, P1D = 1 day)
 * @param duration - ISO 8601 duration string
 * @returns Date string in ISO format
 */
function calculateDateFromDuration(duration: string): string {
  const now = new Date()
  let result = new Date(now)

  // Parse ISO 8601 duration
  // Format: P[nY][nM][nD][T[nH][nM][nS]]
  const durationRegex = /P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?/
  const match = duration.match(durationRegex)

  if (!match) {
    // Invalid duration, return current date
    return now.toISOString()
  }

  const years = parseInt(match[1] || "0", 10)
  const months = parseInt(match[2] || "0", 10)
  const days = parseInt(match[3] || "0", 10)
  const hours = parseInt(match[4] || "0", 10)
  const minutes = parseInt(match[5] || "0", 10)
  const seconds = parseInt(match[6] || "0", 10)

  // Apply duration components
  if (years > 0) {
    result.setFullYear(result.getFullYear() + years)
  }
  if (months > 0) {
    result.setMonth(result.getMonth() + months)
  }
  if (days > 0) {
    result.setDate(result.getDate() + days)
  }
  if (hours > 0) {
    result.setHours(result.getHours() + hours)
  }
  if (minutes > 0) {
    result.setMinutes(result.getMinutes() + minutes)
  }
  if (seconds > 0) {
    result.setSeconds(result.getSeconds() + seconds)
  }

  return result.toISOString()
}

/**
 * Format a default value for storage in the database
 * @param value - The value to store
 * @param isDynamic - Whether this is a dynamic default
 * @returns Formatted default value config
 */
export function formatDefaultValueForStorage(
  value: any,
  isDynamic: boolean = false
): DefaultValueConfig {
  return {
    type: isDynamic ? "dynamic" : "static",
    value: value,
  }
}

/**
 * Validate a default value configuration
 * @param defaultValue - The default value config to validate
 * @param fieldType - The type of the custom field
 * @returns Validation result with error message if invalid
 */
export function validateDefaultValue(
  defaultValue: DefaultValueConfig,
  fieldType: string
): { valid: boolean; error?: string } {
  if (!defaultValue || !defaultValue.type) {
    return { valid: false, error: "Default value must have a type" }
  }

  if (defaultValue.type === "dynamic") {
    const dynamicValue = defaultValue.value

    // Validate "current-user" is only used with appropriate field types
    if (dynamicValue === "current-user") {
      // This should be used with actor-reference or user fields
      // For now, we allow it for any field type
    }

    // Validate ISO 8601 duration is only used with date/timestamp fields
    if (
      typeof dynamicValue === "string" &&
      dynamicValue.startsWith("P") &&
      fieldType !== "date" &&
      fieldType !== "timestamp"
    ) {
      return {
        valid: false,
        error: "ISO 8601 duration can only be used with date or timestamp fields",
      }
    }
  }

  return { valid: true }
}


