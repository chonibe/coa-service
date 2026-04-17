"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

/**
 * /vendor/studio/artworks/[id]/experience
 *
 * Canonical AppShell URL for editing an artwork's NFC / unlock experience.
 * Hands off to the full-screen artwork editor at /artwork-editor/[id] so
 * the editor keeps its dedicated chrome. Every outbound "Experience" link
 * inside the AppShell points here so we never route through /vendor/dashboard.
 */
export default function ArtworkExperienceRedirect() {
  const params = useParams()
  const router = useRouter()
  const productId = params?.id as string

  useEffect(() => {
    if (productId) {
      router.replace(`/artwork-editor/${productId}`)
    }
  }, [productId, router])

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground font-body text-sm">Opening experience editor…</p>
        </div>
      </div>
    </div>
  )
}
