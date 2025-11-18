const isProduction = process.env.NODE_ENV === "production"

export const requireEnvVar = (key: string, guidance?: string) => {
  const value = process.env[key]

  if (!value) {
    const baseMessage = `${key} environment variable is required`
    const guidanceMessage = guidance ? ` ${guidance}` : ""

    if (!isProduction) {
      console.warn(`[config] ${baseMessage}.${guidanceMessage}`)
    }

    throw new Error(baseMessage)
  }

  return value
}

export const VENDOR_SESSION_SECRET = () =>
  requireEnvVar(
    "VENDOR_SESSION_SECRET",
    "Set VENDOR_SESSION_SECRET to a 32-byte random string (e.g., run `openssl rand -base64 32`).",
  )

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
