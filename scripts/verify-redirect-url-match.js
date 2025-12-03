#!/usr/bin/env node

/**
 * Verify the exact redirect URL format being sent matches what should be in Supabase
 */

const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
]

const missing = requiredEnv.filter((key) => !process.env[key])
if (missing.length > 0) {
  console.error(
    `Missing required environment variables: ${missing.join(", ")}. Set them before running this script.`,
  )
  process.exit(1)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, "")

// These are the exact URLs that should be in Supabase
const expectedUrls = {
  vendor: "https://dashboard.thestreetlamp.com/auth/callback",
  admin: "https://dashboard.thestreetlamp.com/auth/admin/callback",
}

// These are the URLs that the code sends (based on origin)
const productionOrigin = "https://dashboard.thestreetlamp.com"
const codeSends = {
  vendor: `${productionOrigin}/auth/callback`,
  admin: `${productionOrigin}/auth/admin/callback`,
}

console.log("=== Redirect URL Verification ===\n")

console.log("Expected URLs in Supabase:")
console.log(`  Vendor: "${expectedUrls.vendor}"`)
console.log(`  Admin:  "${expectedUrls.admin}"`)

console.log("\nURLs that code sends (based on origin):")
console.log(`  Vendor: "${codeSends.vendor}"`)
console.log(`  Admin:  "${codeSends.admin}"`)

console.log("\n=== Verification ===")
const vendorMatch = expectedUrls.vendor === codeSends.vendor
const adminMatch = expectedUrls.admin === codeSends.admin

console.log(`Vendor URL match: ${vendorMatch ? "✅" : "❌"}`)
console.log(`Admin URL match:  ${adminMatch ? "✅" : "❌"}`)

if (vendorMatch && adminMatch) {
  console.log("\n✅ URLs match! The issue might be:")
  console.log("   1. URL not saved in Supabase (check for typos)")
  console.log("   2. Extra spaces or characters in Supabase")
  console.log("   3. Trailing slash in Supabase")
  console.log("   4. Propagation delay (wait 2-3 minutes)")
  console.log("   5. Wrong Supabase project")
} else {
  console.log("\n❌ URL mismatch detected!")
  if (!vendorMatch) {
    console.log(`   Vendor: Expected "${expectedUrls.vendor}" but code sends "${codeSends.vendor}"`)
  }
  if (!adminMatch) {
    console.log(`   Admin:  Expected "${expectedUrls.admin}" but code sends "${codeSends.admin}"`)
  }
}

console.log("\n=== Common Issues to Check ===")
console.log("1. Trailing slash:")
console.log(`   ❌ "${expectedUrls.admin}/"`)
console.log(`   ✅ "${expectedUrls.admin}"`)

console.log("\n2. Extra spaces:")
console.log(`   ❌ " ${expectedUrls.admin} "`)
console.log(`   ✅ "${expectedUrls.admin}"`)

console.log("\n3. Wrong protocol:")
console.log(`   ❌ "http://dashboard.thestreetlamp.com/auth/admin/callback"`)
console.log(`   ✅ "https://dashboard.thestreetlamp.com/auth/admin/callback"`)

console.log("\n4. Missing https://:")
console.log(`   ❌ "dashboard.thestreetlamp.com/auth/admin/callback"`)
console.log(`   ✅ "https://dashboard.thestreetlamp.com/auth/admin/callback"`)

console.log("\n=== Next Steps ===")
console.log("1. Go to Supabase Dashboard → Authentication → URL Configuration")
console.log("2. Copy the EXACT text from the Redirect URLs field")
console.log("3. Verify it matches exactly (character by character):")
console.log(`   "${expectedUrls.admin}"`)
console.log("4. Check for any hidden characters, spaces, or formatting issues")
console.log("5. Save and wait 2-3 minutes")
console.log("6. Try admin login again")

