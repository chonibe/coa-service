"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"

/**
 * /vendor/studio/artworks/[id]/experience
 *
 * Opens the full block editor (soundtrack, location map, galleries, preview, etc.).
 * `id` is the vendor submission UUID. If `shopify_product_id` is set, the editor uses
 * that product id; otherwise the submission UUID is used so unlock blocks can be
 * edited while still in draft (stored in `product_data.benefits`).
 */
export default function ArtworkExperienceEntryPage() {
  const params = useParams()
  const router = useRouter()
  const submissionId = params?.id as string

  const [phase, setPhase] = useState<"loading" | "error">("loading")
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
        const submission = data.submission
        if (!submission) {
          if (!cancelled) {
            setPhase("error")
            setMessage("Submission data not found.")
          }
          return
        }
        // If the submission is closed, we cannot edit it.
        if (submission.status === "closed") {
          if (!cancelled) {
            setPhase("error")
            setMessage("This artwork is closed and cannot be edited.")
          }
          return
        }
        const pid = submission.shopify_product_id as string | number | null | undefined
        // Linked to a live Shopify product: edit persisted blocks on the product.
        if (pid !== null && pid !== undefined && String(pid).length > 0) {
          router.replace(`/artwork-editor/${String(pid)}`)
          return
        }
        // Draft / pre-publish: blocks live in submission `product_data` and are edited by submission UUID.
        router.replace(`/artwork-editor/${submissionId}`)
        return
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
