"use client"

import { useParams } from "next/navigation"
import SeriesTemplateEditor from "@/app/vendor/dashboard/artwork-pages/series/[seriesId]/page"

/**
 * /vendor/studio/series/[id]/experience
 *
 * AppShell-native series NFC / unlock template editor.
 * Replaces /vendor/dashboard/artwork-pages/series/[seriesId] (now a redirect shim).
 */
export default function SeriesExperiencePage() {
  const params = useParams()
  const seriesId = (params?.id as string) || ""
  return <SeriesTemplateEditor seriesId={seriesId} />
}
