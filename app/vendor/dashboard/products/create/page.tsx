"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * /vendor/dashboard/products/create — retired.
 * Redirects to the AppShell-native route /vendor/studio/artworks/new.
 * See docs/COMMIT_LOGS/v1-retirement-*.
 */
export default function LegacyCreateProductRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/vendor/studio/artworks/new")
  }, [router])
  return (
    <div className="px-4 py-10 text-center text-sm text-gray-500 font-body">
      Opening the new artwork creator…
    </div>
  )
}
