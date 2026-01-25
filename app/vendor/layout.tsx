import type { ReactNode } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { SidebarLayout } from "./components/sidebar-layout"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { buildVendorSessionCookie } from "@/lib/vendor-session"
import { linkSupabaseUserToVendor, isAdminEmail } from "@/lib/vendor-auth"
import { handleAuthError, isAuthError } from "@/lib/auth-error-handler"

const PENDING_ACCESS_ROUTE = "/vendor/access-pending"
const ACCESS_DENIED_ROUTE = "/vendor/access-denied"

interface VendorLayoutProps {
  children: ReactNode
}

export default async function VendorLayout({ children }: VendorLayoutProps) {
  try {
    const cookieStore = cookies()
    
    // Debug: Log all cookies to see what's available
    const allCookies = cookieStore.getAll()
    console.log(`[vendor/layout] All cookies:`, allCookies.map(c => c.name).join(", "))
    
    let vendorName = getVendorFromCookieStore(cookieStore)

  // If no vendor session cookie, try to get vendor from Supabase session
  if (!vendorName) {
    console.log("[vendor/layout] No vendor session cookie found, checking Supabase session")
    
    try {
      const supabase = createRouteClient(cookieStore)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error("[vendor/layout] Error getting Supabase session:", sessionError)
        redirect("/login")
      }
      
      if (session?.user) {
        const email = session.user.email?.toLowerCase()
        
        // Only redirect admin to admin dashboard if they DON'T have a vendor session
        // This allows admins who switched to vendor role to stay
        // If admin has vendor session cookie (set via role switching), allow access
        if (email && isAdminEmail(email)) {
          console.log("[vendor/layout] Admin without vendor session, redirecting to admin dashboard")
          redirect("/admin/dashboard")
        }
        
        // Try to link vendor from Supabase user
        const vendor = await linkSupabaseUserToVendor(session.user, { allowCreate: false })
        
        if (vendor) {
          console.log(`[vendor/layout] Linked vendor from Supabase session: ${vendor.vendor_name}`)
          vendorName = vendor.vendor_name
          
          // Create vendor session cookie for future requests
          // Note: We can't set cookies in a layout, so we'll need to handle this differently
          // For now, we'll allow the request to proceed and the cookie will be set on next interaction
        } else {
          console.log("[vendor/layout] No vendor linked for Supabase user, redirecting to login")
          redirect("/login")
        }
      } else {
        console.log("[vendor/layout] No Supabase session found, redirecting to login")
        redirect("/login")
      }
    } catch (error: any) {
      // NEXT_REDIRECT is expected behavior when redirect() is called
      // Don't log it as an error
      if (error?.digest?.startsWith('NEXT_REDIRECT')) {
        // Re-throw to allow Next.js to handle the redirect
        throw error
      }
      console.error("[vendor/layout] Error checking Supabase session:", error)
      redirect("/login")
    }
  }

  if (!vendorName) {
    console.log("[vendor/layout] No vendor name found after all checks, redirecting to login")
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
