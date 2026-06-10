"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

/**
 * Legacy route: series-wide block editor. Studio now uses per-artwork editors only.
 */
export default function StudioSeriesExperienceEditorRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const seriesId = (params?.id as string) || ""

  useEffect(() => {
    if (seriesId) {
      router.replace(`/vendor/studio/series/${seriesId}/experience`)
    } else {
      router.replace("/vendor/studio/series")
    }
  }, [seriesId, router])

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
    </div>
  )
}
