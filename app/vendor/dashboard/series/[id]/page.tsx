"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

/**
 * /vendor/dashboard/series/[id] — retired.
 * Redirects to the AppShell-native route /vendor/studio/series/[id].
 */
export default function LegacySeriesDetailRedirect() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  useEffect(() => {
    if (id) {
      router.replace(`/vendor/studio/series/${id}`)
    } else {
      router.replace("/vendor/studio/series")
    }
  }, [id, router])

  return (
    <div className="px-4 py-10 text-center text-sm text-gray-500 font-body">
      Opening the series…
    </div>
  )
}
