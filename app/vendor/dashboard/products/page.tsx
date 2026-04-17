"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * /vendor/dashboard/products — retired.
 * Redirects to the AppShell-native Studio (/vendor/studio) which lists artworks.
 */
export default function LegacyProductsRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/vendor/studio")
  }, [router])
  return (
    <div className="px-4 py-10 text-center text-sm text-gray-500 font-body">
      Redirecting to Studio…
    </div>
  )
}
