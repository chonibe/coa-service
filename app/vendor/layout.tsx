import type { ReactNode } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { SidebarLayout } from "./components/sidebar-layout"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore } from "@/lib/vendor-session"

const PENDING_ACCESS_ROUTE = "/vendor/access-pending"
const ACCESS_DENIED_ROUTE = "/vendor/access-denied"

interface VendorLayoutProps {
  children: ReactNode
}

export default async function VendorLayout({ children }: VendorLayoutProps) {
  const cookieStore = cookies()
  
  // Debug: Log all cookies to see what's available
  const allCookies = cookieStore.getAll()
  console.log(`[vendor/layout] All cookies:`, allCookies.map(c => c.name).join(", "))
  
  const vendorName = getVendorFromCookieStore(cookieStore)

  if (!vendorName) {
    console.log("[vendor/layout] No vendor session cookie found, redirecting to login")
    // Don't redirect immediately - check if we're coming from auth callback
    // This prevents redirect loops
    redirect("/login")
  }

  console.log(`[vendor/layout] Vendor session found: ${vendorName}`)

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
    console.log(`[vendor/layout] Exact match not found for "${vendorName}", trying case-insensitive search`)
    const { data: vendors, error: searchError } = await supabase
      .from("vendors")
      .select("vendor_name,status,onboarding_completed")
      .ilike("vendor_name", vendorName)
    
    if (searchError) {
      console.error(`[vendor/layout] Case-insensitive search error:`, searchError)
    } else {
      console.log(`[vendor/layout] Case-insensitive search found ${vendors?.length || 0} vendors`)
      if (vendors && vendors.length > 0) {
        vendor = vendors[0]
        console.log(`[vendor/layout] Using vendor: ${vendor.vendor_name}`)
      }
    }
  }

  // If still not found, list all vendors for debugging and try to find by partial match
  if (!vendor && !error) {
    const { data: allVendors, error: listError } = await supabase
      .from("vendors")
      .select("id, vendor_name, contact_email, status")
      .limit(50)
    
    if (!listError && allVendors) {
      console.log(`[vendor/layout] Available vendors in database (${allVendors.length}):`, allVendors.map(v => `${v.vendor_name} (id: ${v.id})`))
      
      // Try to find vendor by partial name match (case-insensitive)
      const normalizedSearch = vendorName.toLowerCase().replace(/\s+/g, " ")
      const matchedVendor = allVendors.find(v => 
        v.vendor_name.toLowerCase().replace(/\s+/g, " ") === normalizedSearch ||
        v.vendor_name.toLowerCase().includes(normalizedSearch) ||
        normalizedSearch.includes(v.vendor_name.toLowerCase())
      )
      
      if (matchedVendor) {
        console.log(`[vendor/layout] Found vendor by partial match: "${matchedVendor.vendor_name}" (searching for "${vendorName}")`)
        vendor = matchedVendor
      }
    } else if (listError) {
      console.error(`[vendor/layout] Error listing vendors:`, listError)
    }
  }

  if (error) {
    console.error(`[vendor/layout] Database error for vendor ${vendorName}:`, error)
    redirect("/login")
  }

  if (!vendor) {
    console.error(`[vendor/layout] Vendor not found in database: ${vendorName}`)
    redirect("/login")
  }

  console.log(`[vendor/layout] Vendor found: ${vendor.vendor_name}, status: ${vendor.status}, onboarding_completed: ${vendor.onboarding_completed}`)

  if (vendor.status === "pending" || vendor.status === "review") {
    console.log(`[vendor/layout] Vendor status is ${vendor.status}, redirecting to pending`)
    redirect(PENDING_ACCESS_ROUTE)
  }

  if (vendor.status === "disabled" || vendor.status === "suspended") {
    console.log(`[vendor/layout] Vendor status is ${vendor.status}, redirecting to denied`)
    redirect(ACCESS_DENIED_ROUTE)
  }

  // Note: We don't redirect for incomplete onboarding here to avoid loops
  // The onboarding page is also wrapped by this layout, so redirecting would cause infinite loops
  // Instead, individual pages (like dashboard) should check onboarding status and redirect if needed
  if (!vendor.onboarding_completed) {
    console.log(`[vendor/layout] Vendor onboarding not completed (${vendor.onboarding_completed}), but allowing page to render`)
  }

  console.log(`[vendor/layout] All checks passed, rendering content`)

  return <SidebarLayout>{children}</SidebarLayout>
}
