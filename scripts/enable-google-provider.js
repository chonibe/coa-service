#!/usr/bin/env node

/**
 * Enable the Google OAuth provider for the configured Supabase project.
 *
 * Requires the following environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - SUPABASE_GOOGLE_CLIENT_ID
 * - SUPABASE_GOOGLE_CLIENT_SECRET
 *
 * Optionally, provide SUPABASE_AUTH_ADDITIONAL_REDIRECTS as a comma-separated list
 * to override default redirect URLs.
 */

const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_GOOGLE_CLIENT_ID",
  "SUPABASE_GOOGLE_CLIENT_SECRET",
]

const missing = requiredEnv.filter((key) => !process.env[key])
if (missing.length > 0) {
  console.error(
    `Missing required environment variables: ${missing.join(
      ", ",
    )}. Set them before running this script.`,
  )
  process.exit(1)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, "")
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const googleClientId = process.env.SUPABASE_GOOGLE_CLIENT_ID
const googleClientSecret = process.env.SUPABASE_GOOGLE_CLIENT_SECRET

const defaultRedirects = [
  "http://localhost:3000/auth/callback",
  "http://127.0.0.1:3000/auth/callback",
  "https://street-collector.vercel.app/auth/callback",
  "https://streetcollector.vercel.app/auth/callback",
]

const additionalRedirects = (process.env.SUPABASE_AUTH_ADDITIONAL_REDIRECTS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean)

const redirectUrls = Array.from(new Set([...defaultRedirects, ...additionalRedirects]))

async function enableGoogleProvider() {
  const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
    method: "PUT",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      external: {
        google: {
          enabled: true,
          client_id: googleClientId,
          secret: googleClientSecret,
        },
      },
      additional_redirect_urls: redirectUrls,
    }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Failed to enable Google provider: ${response.status} ${message}`)
  }

  const data = await response.json()
  console.log("Google provider enabled successfully.")
  console.log(
    "Configured redirect URLs:",
    Array.isArray(data.additional_redirect_urls) ? data.additional_redirect_urls.join(", ") : redirectUrls.join(", "),
  )
}

enableGoogleProvider().catch((error) => {
  console.error(error.message)
  process.exit(1)
})

