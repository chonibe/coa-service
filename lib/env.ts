// Shopify API credentials
export const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || ""
export const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || ""
export const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET || ""
export const CRON_SECRET = process.env.CRON_SECRET || ""
export const CERTIFICATE_METAFIELD_ID = process.env.CERTIFICATE_METAFIELD_ID || null

// Admin password
export const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "changeme" // Default password, change in production

// Validate required environment variables
if (!SHOPIFY_SHOP || !SHOPIFY_ACCESS_TOKEN) {
  console.error("Missing required environment variables for Shopify API")
}
