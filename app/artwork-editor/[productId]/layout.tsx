import type { ReactNode } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { LightModeWrapper } from "./components/LightModeWrapper"

interface ArtworkEditorLayoutProps {
  children: ReactNode
}

/**
 * Standalone Artwork Editor Layout
 * 
 * Completely isolated full-screen experience with NO dashboard UI.
 * Requires vendor authentication but renders nothing except the editor.
 */
export default async function ArtworkEditorLayout({ children }: ArtworkEditorLayoutProps) {
  const cookieStore = cookies()
  const vendorName = getVendorFromCookieStore(cookieStore)

  // Require vendor authentication
  if (!vendorName) {
    redirect("/login")
  }

  // Force light mode by wrapping in a client component with global styles
  return <LightModeWrapper>{children}</LightModeWrapper>
}
