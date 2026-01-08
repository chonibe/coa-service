/**
 * Application configuration
 */

// Base URL for API calls
export const API_BASE_URL = (() => {
  const url = process.env.NEXT_PUBLIC_APP_URL || ""
  // Ensure URL has https:// prefix
  if (url) {
    if (!url.startsWith("https://")) {
      return `https://${url.replace(/^http:\/\/|^https:\/\/|^ttps:\/\//, "")}`
    }
    return url
  }
  return "http://localhost:3000"
})()

// Default pagination limit
export const DEFAULT_PAGINATION_LIMIT = 5

// Feature flags
export const FEATURES = {
  ENABLE_EDITION_DISPLAY: true,
  ENABLE_INVENTORY_DISPLAY: true,
  ENABLE_RARITY_DISPLAY: true,
  USE_MOCK_DATA_FALLBACK: true, // Enable mock data when API is unavailable
}

// Development mode
export const IS_DEVELOPMENT = process.env.NODE_ENV === "development"
