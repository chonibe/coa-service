"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"

/**
 * /vendor/studio/artworks/[id]/experience
 *
 * Opens the full block editor (soundtrack, location map, galleries, preview, etc.)
 * for this artwork’s Shopify product. `id` is the vendor submission UUID.
 */
export default function ArtworkExperienceEntryPage() {
  const params = useParams()
  const router = useRouter()
  const submissionId = params?.id as string

  const [phase, setPhase] = useState<"loading" | "needs_product" | "error">("loading")
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!submissionId) {
      setPhase("error")
      setMessage("Missing artwork id.")
      return
    }

    let cancelled = false

    const run = async () => {
      try {
        const res = await fetch(`/api/vendor/products/submissions/${submissionId}`, {
          credentials: "include",
        })
        if (!res.ok) {
          if (!cancelled) {
            setPhase("error")
            setMessage("We could not load this artwork. Return to Studio and try again.")
          }
          return
        }
        const data = await res.json()
        const pid = data.submission?.shopify_product_id as string | number | null | undefined
        if (pid !== null && pid !== undefined && String(pid).length > 0) {
          router.replace(`/artwork-editor/${String(pid)}`)
          return
        }
        if (!cancelled) {
          setPhase("needs_product")
        }
      } catch {
        if (!cancelled) {
          setPhase("error")
          setMessage("Something went wrong loading this artwork.")
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [submissionId, router])

  if (phase === "loading") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground font-body">Opening experience editor…</p>
      </div>
    )
  }

  if (phase === "needs_product") {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <Link
          href="/vendor/studio"
          className="mb-6 inline-flex items-center gap-1 text-xs text-muted-foreground font-body hover:text-foreground"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Studio
        </Link>
        <h1 className="font-heading text-xl font-semibold text-foreground">Publish first</h1>
        <p className="mt-2 text-sm text-muted-foreground font-body leading-relaxed">
          The unlock experience editor (blocks, soundtrack, map, preview) is available after this artwork is
          linked to a live product. Finish listing details and submit for review, then open{" "}
          <span className="font-medium text-foreground">Unlock</span> again from Studio.
        </p>
        <Link
          href={`/vendor/studio/artworks/${submissionId}/edit`}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-[#1a1a1a] px-5 py-2.5 text-sm font-semibold text-white font-body hover:opacity-90"
        >
          Continue to artwork details
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Link
        href="/vendor/studio"
        className="mb-6 inline-flex items-center gap-1 text-xs text-muted-foreground font-body hover:text-foreground"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Studio
      </Link>
      <p className="text-sm text-muted-foreground font-body">{message || "Something went wrong."}</p>
    </div>
  )
}
