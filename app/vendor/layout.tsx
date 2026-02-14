import type { ReactNode } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { SidebarLayout } from "./components/sidebar-layout"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { REQUIRE_ACCOUNT_SELECTION_COOKIE } from "@/lib/vendor-auth"
import { handleAuthError, isAuthError } from "@/lib/auth-error-handler"

const PENDING_ACCESS_ROUTE = "/vendor/access-pending"
const ACCESS_DENIED_ROUTE = "/vendor/access-denied"

interface VendorLayoutProps {
  children: ReactNode
}

export default async function VendorLayout({ children }: VendorLayoutProps) {
  try {
    const cookieStore = cookies()
    
    // Check if account selection is required (user recently logged out)
    const requireAccountSelection = cookieStore.get(REQUIRE_ACCOUNT_SELECTION_COOKIE)?.value === "true"
    if (requireAccountSelection) {
      redirect("/login")
    }

    let vendorName = getVendorFromCookieStore(cookieStore)

  // If no vendor session cookie, redirect to login
  // Do NOT auto-login from Supabase session to prevent unwanted session restoration
  if (!vendorName) {
    redirect("/login")
  }

  // Skip vendor database checks for admin users - they have full access
  if (vendorName === "admin-access") {
    return <SidebarLayout>{children}</SidebarLayout>
  }

  // Use service role client to bypass RLS and ensure we can read vendors
  const supabase = createServiceClient()
  
  // First, try exact match
  let { data: vendor, error } = await supabase
    .from("vendors")
    .select("vendor_name,status,onboarding_completed")
    .eq("vendor_name", vendorName)
    .maybeSingle()

  // If not found, try case-insensitive search
  if (!vendor && !error) {
    const { data: vendors, error: searchError } = await supabase
      .from("vendors")
      .select("vendor_name,status,onboarding_completed")
      .ilike("vendor_name", vendorName)
    
    if (searchError) {
      console.error(`[vendor/layout] Case-insensitive search error:`, searchError)
    } else if (vendors && vendors.length > 0) {
      vendor = vendors[0]
    }
  }

  // If still not found, try to find by partial name match
  if (!vendor && !error) {
    const { data: allVendors, error: listError } = await supabase
      .from("vendors")
      .select("id, vendor_name, contact_email, status")
      .limit(50)
    
    if (!listError && allVendors) {
      const normalizedSearch = vendorName.toLowerCase().replace(/\s+/g, " ")
      const matchedVendor = allVendors.find(v => 
        v.vendor_name.toLowerCase().replace(/\s+/g, " ") === normalizedSearch ||
        v.vendor_name.toLowerCase().includes(normalizedSearch) ||
        normalizedSearch.includes(v.vendor_name.toLowerCase())
      )
      
      if (matchedVendor) {
        vendor = matchedVendor
      }
    } else if (listError) {
      console.error(`[vendor/layout] Error listing vendors:`, listError)
    }
  }

  if (error) {
    console.error(`[vendor/layout] Database error for vendor:`, error)
    redirect("/login")
  }

  if (!vendor) {
    console.error(`[vendor/layout] Vendor not found in database`)
    redirect("/login")
  }

  if (vendor.status === "pending" || vendor.status === "review") {
    redirect(PENDING_ACCESS_ROUTE)
  }

  if (vendor.status === "disabled" || vendor.status === "suspended") {
    redirect(ACCESS_DENIED_ROUTE)
  }

    return <SidebarLayout>{children}</SidebarLayout>
  } catch (error: any) {
    // Check if it's an auth error
    if (isAuthError(error)) {
      console.error('[vendor/layout] Authentication error caught:', error)
      handleAuthError(error, { redirectTo: '/login' })
    }
    
    // Check if it's a redirect (expected behavior)
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error
    }
    
    // For any other error, log and redirect to login with error message
    console.error('[vendor/layout] Unexpected error:', error)
    const errorMessage = encodeURIComponent('An error occurred. Please log in again.')
    redirect(`/login?error=${errorMessage}`)
  }
}
