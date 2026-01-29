import type { ReactNode } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getVendorFromCookieStore } from "@/lib/vendor-session"

interface ArtworkPagesLayoutProps {
  children: ReactNode
}

/**
 * Artwork Pages Layout
 * 
 * Provides vendor authentication WITHOUT the dashboard sidebar.
 * This allows full-screen mobile editing experiences.
 */
export default async function ArtworkPagesLayout({ children }: ArtworkPagesLayoutProps) {
  const cookieStore = cookies()
  const vendorName = getVendorFromCookieStore(cookieStore)

  // Require vendor authentication
  if (!vendorName) {
    console.log("[artwork-pages/layout] No vendor session, redirecting to login")
    redirect("/login")
  }

  // Render children directly without any dashboard UI
  return <>{children}</>
}
