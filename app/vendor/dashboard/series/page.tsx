"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * /vendor/dashboard/series — retired.
 * Redirects to the AppShell-native Series list (/vendor/studio/series).
 */
export default function LegacySeriesRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/vendor/studio/series")
  }, [router])
  return (
    <div className="px-4 py-10 text-center text-sm text-gray-500 font-body">
      Redirecting to Series…
    </div>
  )
}
