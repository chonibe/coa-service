// Shopify API credentials
export const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || ""
export const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || ""
export const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET || ""
export const CRON_SECRET = process.env.CRON_SECRET || ""
export const CERTIFICATE_METAFIELD_ID = process.env.CERTIFICATE_METAFIELD_ID || null

// Google Analytics credentials
export const GOOGLE_ANALYTICS_VIEW_ID = process.env.GOOGLE_ANALYTICS_VIEW_ID || ""
export const GOOGLE_ANALYTICS_PROPERTY_ID = process.env.GOOGLE_ANALYTICS_PROPERTY_ID || ""
export const GOOGLE_ANALYTICS_MEASUREMENT_ID = process.env.GOOGLE_ANALYTICS_MEASUREMENT_ID || "" // GA4 measurement ID (G-XXXXXXXX)
export const GOOGLE_ANALYTICS_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_ANALYTICS_SERVICE_ACCOUNT_EMAIL || ""
export const GOOGLE_ANALYTICS_PRIVATE_KEY = process.env.GOOGLE_ANALYTICS_PRIVATE_KEY?.replace(/\\n/g, "\n") || ""

// Admin password
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "changeme" // Default password, change in production

// Validate required environment variables
if (!SHOPIFY_SHOP || !SHOPIFY_ACCESS_TOKEN) {
  console.error("Missing required environment variables for Shopify API")
}
