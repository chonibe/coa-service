"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * /vendor/dashboard/series/create — retired.
 * Redirects to the AppShell-native route /vendor/studio/series/new.
 */
export default function LegacyCreateSeriesRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/vendor/studio/series/new")
  }, [router])
  return (
    <div className="px-4 py-10 text-center text-sm text-gray-500 font-body">
      Opening the new series creator…
    </div>
  )
}
