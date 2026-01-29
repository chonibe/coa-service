import type { ReactNode } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { isAdminEmail } from "@/lib/vendor-auth"
import { handleAuthError, isAuthError } from "@/lib/auth-error-handler"

/**
 * Root layout for slides - completely separate from vendor dashboard
 *
 * This provides authentication but NO dashboard UI elements.
 * Completely full-screen, isolated experience.
 */
export default async function SlidesRootLayout({
  children
}: {
  children: ReactNode
}) {
  try {
    const cookieStore = cookies()

    let vendorName = getVendorFromCookieStore(cookieStore)

    // If no vendor session cookie, redirect to login
    if (!vendorName) {
      console.log("[slides/layout] No vendor session cookie found, redirecting to login")
      redirect("/login")
    }

    console.log(`[slides/layout] Vendor session found: ${vendorName}`)

    // Skip vendor database checks for admin users - they have full access
    if (vendorName === "admin-access") {
      console.log("[slides/layout] Admin user with full access")
      return <>{children}</>
    }

    // Basic vendor validation (simplified)
    const supabase = createServiceClient()

    let { data: vendor, error } = await supabase
      .from("vendors")
      .select("vendor_name, status")
      .eq("vendor_name", vendorName)
      .maybeSingle()

    // Try case-insensitive search if not found
    if (!vendor && !error) {
      const { data: vendors } = await supabase
        .from("vendors")
        .select("vendor_name, status")
        .ilike("vendor_name", vendorName)

      if (vendors && vendors.length > 0) {
        vendor = vendors[0]
      }
    }

    if (error) {
      console.error(`[slides/layout] Database error:`, error)
      redirect("/login")
    }

    if (!vendor) {
      console.error(`[slides/layout] Vendor not found: ${vendorName}`)
      redirect("/login")
    }

    if (vendor.status === "pending" || vendor.status === "review") {
      console.log(`[slides/layout] Vendor status is ${vendor.status}, redirecting to pending`)
      redirect("/vendor/access-pending")
    }

    if (vendor.status === "disabled" || vendor.status === "suspended") {
      console.log(`[slides/layout] Vendor status is ${vendor.status}, redirecting to denied`)
      redirect("/vendor/access-denied")
    }

    console.log(`[slides/layout] All checks passed, rendering slides interface`)

    // Return completely clean, no dashboard UI
    return <>{children}</>

  } catch (error: any) {
    if (isAuthError(error)) {
      console.error('[slides/layout] Authentication error caught:', error)
      handleAuthError(error, { redirectTo: '/login' })
    }

    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error
    }

    console.error('[slides/layout] Unexpected error:', error)
    const errorMessage = encodeURIComponent('An error occurred. Please log in again.')
    redirect(`/login?error=${errorMessage}`)
  }
}