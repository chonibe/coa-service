"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Sparkles, ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui"

interface SeriesExperienceLandingProps {
  seriesId: string
}

export default function SeriesExperiencePage() {
  const params = useParams()
  const seriesId = (params?.id as string) || ""
  return <SeriesExperienceLanding seriesId={seriesId} />
}

function SeriesExperienceLanding({ seriesId }: SeriesExperienceLandingProps) {
  const [loading, setLoading] = useState(true)
  const [seriesName, setSeriesName] = useState("")

  useEffect(() => {
    if (!seriesId) return

    const fetchSeries = async () => {
      try {
        const res = await fetch(`/api/vendor/series/${seriesId}`, { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          setSeriesName(data.series?.name || "Untitled series")
        }
      } catch {
        setSeriesName("Series")
      } finally {
        setLoading(false)
      }
    }

    fetchSeries()
  }, [seriesId])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-10 max-w-xl mx-auto">
      {/* Back */}
      <div className="mb-6">
        <Link
          href={`/vendor/studio/series/${seriesId}`}
          className="inline-flex items-center gap-1.5 font-body text-xs tracking-wide text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to {seriesName}
        </Link>
      </div>

      {/* Title */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Unlock Experience
          </span>
        </div>
        <h1 className="text-2xl font-bold">{seriesName}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Build the collector-facing unlock experience for this series.
        </p>
      </div>

      {/* Actions */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
        {/* Open block editor */}
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-base mb-1">Open block editor</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Add and arrange the content blocks collectors unlock when they complete the series.
              </p>
              <Link href={`/vendor/studio/series/${seriesId}/experience/editor`}>
                <Button size="sm" className="bg-[#1a1a1a] hover:bg-[#1a1a1a]/90">
                  Open block editor
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Series info */}
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-base mb-1">Series unlock experience</h2>
              <p className="text-sm text-muted-foreground">
                This experience activates when a collector completes the series requirements.
                Use the block editor to set up the content they&apos;ll unlock.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info note */}
      <p className="text-xs text-muted-foreground mt-5 text-center">
        Changes you make here are saved automatically and published immediately.
      </p>
    </div>
  )
}
