"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

/**
 * /vendor/dashboard/products/edit/[id] — retired.
 * Redirects to the AppShell-native route /vendor/studio/artworks/[id]/edit.
 */
export default function LegacyEditProductRedirect() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  useEffect(() => {
    if (id) {
      router.replace(`/vendor/studio/artworks/${id}/edit`)
    } else {
      router.replace("/vendor/studio")
    }
  }, [id, router])

  return (
    <div className="px-4 py-10 text-center text-sm text-gray-500 font-body">
      Opening the artwork editor…
    </div>
  )
}
