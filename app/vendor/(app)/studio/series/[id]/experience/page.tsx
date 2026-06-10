"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Sparkles } from "lucide-react"
import { Button } from "@/components/ui"

/**
 * Series-level “unlock experience” editing was removed from Studio in favor of
 * per-artwork block editors (soundtrack, map, etc.) on each product.
 */
export default function SeriesExperienceDeprecatedPage() {
  const params = useParams()
  const seriesId = (params?.id as string) || ""

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Link
        href={seriesId ? `/vendor/studio/series/${seriesId}` : "/vendor/studio/series"}
        className="mb-6 inline-flex items-center gap-1.5 font-body text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back
      </Link>

      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Unlock experience
        </span>
      </div>

      <h1 className="font-heading text-2xl font-semibold tracking-tight">Edited per artwork now</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground font-body">
        Collector unlock pages (soundtrack, location, process gallery, preview, and other blocks) are built{" "}
        <strong className="text-foreground">for each artwork</strong>, not once for the whole series. Open{" "}
        <strong className="text-foreground">Studio → Artworks</strong>, choose a piece, then tap{" "}
        <strong className="text-foreground">Unlock</strong>.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild className="bg-[#1a1a1a] hover:bg-[#1a1a1a]/90">
          <Link href="/vendor/studio">Go to Artworks</Link>
        </Button>
        {seriesId ? (
          <Button variant="outline" asChild>
            <Link href={`/vendor/studio/series/${seriesId}`}>Series details</Link>
          </Button>
        ) : null}
      </div>
    </div>
  )
}
