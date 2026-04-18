"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ChevronRight, Loader2, Sparkles } from "lucide-react"

/**
 * /vendor/studio/artworks/[id]/experience
 *
 * NFC unlock blocks are edited per series (shared template), not per artwork.
 * This page explains that and routes artists to the series block editor when possible.
 */
export default function ArtworkExperienceLanding() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const submissionOrProductId = params?.id as string
  const seriesFromQuery = searchParams.get("series")

  const [seriesId, setSeriesId] = useState<string | null>(seriesFromQuery)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (seriesFromQuery) {
      setSeriesId(seriesFromQuery)
      setLoading(false)
      return
    }
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`/api/vendor/products/submissions/${submissionOrProductId}`, {
          credentials: "include",
        })
        if (!res.ok) throw new Error("not submission")
        const data = await res.json()
        const sid = data.submission?.series_id as string | undefined
        if (!cancelled && sid) setSeriesId(sid)
      } catch {
        // id may be a Shopify product id — no cheap series lookup here
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (submissionOrProductId) void load()
    else setLoading(false)
    return () => {
      cancelled = true
    }
  }, [submissionOrProductId, seriesFromQuery])

  const editorHref = seriesId
    ? `/vendor/studio/series/${seriesId}/experience/editor`
    : "/vendor/studio/series"

  return (
    <div className="px-4 pt-4 pb-10 max-w-xl mx-auto">
      <Link
        href="/vendor/studio"
        className="inline-flex items-center gap-1 text-xs text-gray-500 font-body hover:text-gray-900 transition-colors mb-3"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Studio
      </Link>

      <div className="space-y-1 mb-6">
        <p className="text-[10px] tracking-[0.2em] uppercase text-gray-500">Unlock experience</p>
        <h1 className="text-xl font-heading font-semibold text-gray-900 tracking-tight">
          Series-wide NFC unlock
        </h1>
        <p className="text-sm text-gray-600 font-body">
          Collectors see one unlock experience for the whole series. Add and publish blocks from the
          series editor — not per individual artwork.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <button
          type="button"
          onClick={() => router.push(editorHref)}
          disabled={loading}
          className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 disabled:opacity-60"
        >
          <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 font-body">Open series block editor</p>
            <p className="text-xs text-gray-500 font-body">
              {loading ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Looking up series…
                </span>
              ) : seriesId ? (
                "Edit blocks for this artwork’s series."
              ) : (
                "We could not detect a series from this link. Open Series to pick yours."
              )}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        </button>

        <Link
          href="/vendor/studio/series"
          className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 font-body">All series</p>
            <p className="text-xs text-gray-500 font-body">Choose a series, then Unlock experience.</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        </Link>
      </div>
    </div>
  )
}
