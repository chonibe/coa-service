#!/usr/bin/env node

/**
 * Check Supabase redirect URLs configuration
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

async function checkRedirectUrls() {
  console.log("Fetching Supabase auth settings...")
  console.log(`Supabase URL: ${supabaseUrl}\n`)

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      method: "GET",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const message = await response.text()
      throw new Error(`Failed to fetch settings: ${response.status} ${message}`)
    }

    const data = await response.json()
    
    console.log("=== Supabase Auth Configuration ===\n")
    
    // Check redirect URLs
    const redirectUrls = data.site_url ? [data.site_url, ...(data.additional_redirect_urls || [])] : (data.additional_redirect_urls || [])
    
    console.log("Configured Redirect URLs:")
    if (redirectUrls.length === 0) {
      console.log("  ⚠️  No redirect URLs configured!")
    } else {
      redirectUrls.forEach((url, index) => {
        const isAdminCallback = url.includes('/auth/admin/callback')
        const isVendorCallback = url.includes('/auth/callback') && !url.includes('/auth/admin/callback')
        const marker = isAdminCallback ? '✅ ADMIN' : isVendorCallback ? '✅ VENDOR' : '  '
        console.log(`  ${marker} ${index + 1}. ${url}`)
      })
    }
    
    // Check for admin callback
    const adminCallback = 'https://app.thestreetcollector.com/auth/admin/callback'
    const hasAdminCallback = redirectUrls.some(url => url === adminCallback || url.trim() === adminCallback)
    
    console.log("\n=== Admin Callback Check ===")
    if (hasAdminCallback) {
      console.log(`✅ Admin callback URL is configured: ${adminCallback}`)
    } else {
      console.log(`❌ Admin callback URL is MISSING: ${adminCallback}`)
      console.log("\nTo fix, add this URL to Supabase Dashboard:")
      console.log("  Authentication → URL Configuration → Redirect URLs")
    }
    
    // Check vendor callback
    const vendorCallback = 'https://app.thestreetcollector.com/auth/callback'
    const hasVendorCallback = redirectUrls.some(url => url === vendorCallback || url.trim() === vendorCallback)
    
    console.log("\n=== Vendor Callback Check ===")
    if (hasVendorCallback) {
      console.log(`✅ Vendor callback URL is configured: ${vendorCallback}`)
    } else {
      console.log(`⚠️  Vendor callback URL not found: ${vendorCallback}`)
    }
    
    // Check Google provider
    console.log("\n=== Google Provider Configuration ===")
    if (data.external?.google) {
      console.log(`✅ Google provider is enabled`)
      console.log(`   Client ID: ${data.external.google.client_id || 'Not set'}`)
    } else {
      console.log(`❌ Google provider is not configured`)
    }
    
    // Show all redirect URLs for manual verification
    console.log("\n=== All Redirect URLs (for manual verification) ===")
    redirectUrls.forEach((url, index) => {
      console.log(`${index + 1}. "${url}"`)
    })
    
  } catch (error) {
    console.error("Error checking redirect URLs:", error.message)
    process.exit(1)
  }
}

checkRedirectUrls()

