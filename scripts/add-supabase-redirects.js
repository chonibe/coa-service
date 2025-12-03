#!/usr/bin/env node

/**
 * Add redirect URLs to Supabase configuration
 * 
 * Requires:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
]

const missing = requiredEnv.filter((key) => !process.env[key])
if (missing.length > 0) {
  console.error(
    `Missing required environment variables: ${missing.join(", ")}. Set them before running this script.`,
  )
  process.exit(1)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, "")
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Required redirect URLs
const requiredRedirects = [
  "https://dashboard.thestreetlamp.com/auth/admin/callback",
  "https://dashboard.thestreetlamp.com/auth/callback",
]

async function addRedirectUrls() {
  console.log("Fetching current Supabase auth settings...")
  console.log(`Supabase URL: ${supabaseUrl}\n`)

  try {
    // First, get current settings
    const getResponse = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      method: "GET",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!getResponse.ok) {
      const message = await getResponse.text()
      throw new Error(`Failed to fetch settings: ${getResponse.status} ${message}`)
    }

    const currentData = await getResponse.json()
    
    // Get existing redirect URLs
    const existingRedirects = currentData.additional_redirect_urls || []
    const siteUrl = currentData.site_url ? [currentData.site_url] : []
    
    // Combine and deduplicate
    const allRedirects = Array.from(new Set([
      ...siteUrl,
      ...existingRedirects,
      ...requiredRedirects,
    ])).filter(Boolean)
    
    console.log("Current redirect URLs:", existingRedirects.length > 0 ? existingRedirects.join(", ") : "None")
    console.log("\nAdding required redirect URLs...")
    
    // Update settings with new redirect URLs
    // Use the same structure as enable-google-provider.js
    const updateBody = {
      external: currentData.external || {},
      additional_redirect_urls: allRedirects,
    }
    
    // Preserve site_url if it exists
    if (currentData.site_url) {
      updateBody.site_url = currentData.site_url
    }
    
    const updateResponse = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      method: "PUT",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateBody),
    })

    if (!updateResponse.ok) {
      const message = await updateResponse.text()
      throw new Error(`Failed to update settings: ${updateResponse.status} ${message}`)
    }

    const updatedData = await updateResponse.json()
    
    console.log("\n✅ Successfully updated redirect URLs!\n")
    console.log("Configured Redirect URLs:")
    const finalRedirects = updatedData.additional_redirect_urls || []
    finalRedirects.forEach((url, index) => {
      const isAdminCallback = url.includes('/auth/admin/callback')
      const isVendorCallback = url.includes('/auth/callback') && !url.includes('/auth/admin/callback')
      const marker = isAdminCallback ? '✅ ADMIN' : isVendorCallback ? '✅ VENDOR' : '  '
      console.log(`  ${marker} ${index + 1}. ${url}`)
    })
    
    // Verify admin callback
    const hasAdminCallback = finalRedirects.some(url => url === requiredRedirects[0] || url.trim() === requiredRedirects[0])
    const hasVendorCallback = finalRedirects.some(url => url === requiredRedirects[1] || url.trim() === requiredRedirects[1])
    
    console.log("\n=== Verification ===")
    if (hasAdminCallback) {
      console.log(`✅ Admin callback URL configured: ${requiredRedirects[0]}`)
    } else {
      console.log(`❌ Admin callback URL missing: ${requiredRedirects[0]}`)
    }
    
    if (hasVendorCallback) {
      console.log(`✅ Vendor callback URL configured: ${requiredRedirects[1]}`)
    } else {
      console.log(`⚠️  Vendor callback URL missing: ${requiredRedirects[1]}`)
    }
    
    console.log("\n⚠️  Note: Changes may take 1-2 minutes to propagate.")
    console.log("   Try logging in again after waiting a moment.")
    
  } catch (error) {
    console.error("Error updating redirect URLs:", error.message)
    process.exit(1)
  }
}

addRedirectUrls()

