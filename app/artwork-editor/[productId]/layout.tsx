import type { ReactNode } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getVendorFromCookieStore } from "@/lib/vendor-session"

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

  // Force light mode by wrapping in a light class
  return (
    <div className="light bg-white">
      <style jsx global>{`
        html, body {
          background: white !important;
          color: rgb(17, 24, 39) !important;
        }
        * {
          color-scheme: light !important;
        }
      `}</style>
      {children}
    </div>
  )
}
