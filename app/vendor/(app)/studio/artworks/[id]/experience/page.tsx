"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  Fingerprint,
  Loader2,
  PenTool,
} from "lucide-react"

/**
 * /vendor/studio/artworks/[id]/experience
 *
 * AppShell landing page for the NFC / unlock experience. It used to hard-
 * redirect into /artwork-editor/[id]; now it's a small hub with two clear
 * actions so artists understand what they're about to do and have a
 * preview path that doesn't force them to open the editor first.
 */
export default function ArtworkExperienceLanding() {
  const params = useParams()
  const router = useRouter()
  const productId = params?.id as string

  const [counts, setCounts] = useState<{ total: number; published: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`/api/vendor/artwork-pages/${productId}`, {
          credentials: "include",
        })
        if (!res.ok) throw new Error("fetch failed")
        const data = await res.json()
        if (cancelled) return
        const blocks: Array<{ is_published?: boolean }> = Array.isArray(data.contentBlocks)
          ? data.contentBlocks
          : []
        setCounts({
          total: blocks.length,
          published: blocks.filter((b) => b.is_published).length,
        })
      } catch {
        if (!cancelled) setCounts({ total: 0, published: 0 })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (productId) load()
    return () => {
      cancelled = true
    }
  }, [productId])

  const openEditor = () => router.push(`/artwork-editor/${productId}`)
  const openPreview = () =>
    window.open(`/preview/artwork/${productId}`, "_blank", "noopener")

  const status = (() => {
    if (!counts) return { label: "Loading…", tone: "text-gray-500" }
    if (counts.total === 0)
      return { label: "No blocks yet", tone: "text-gray-500" }
    if (counts.published === 0)
      return { label: `Draft · ${counts.total} block${counts.total === 1 ? "" : "s"}`, tone: "text-amber-700" }
    return {
      label: `Live · ${counts.published}/${counts.total} published`,
      tone: "text-emerald-700",
    }
  })()

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
        <p className="text-[10px] tracking-[0.2em] uppercase text-gray-500">
          Unlock experience
        </p>
        <h1 className="text-xl font-heading font-semibold text-gray-900 tracking-tight">
          NFC-gated content for this artwork
        </h1>
        <p className="text-sm text-gray-600 font-body">
          Add blocks that unlock for a collector after they tap the NFC tag on their
          piece — voice notes, process photos, soundtracks, and more.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <button
          type="button"
          onClick={openEditor}
          className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100"
        >
          <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center shrink-0">
            <PenTool className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 font-body">
              Open block editor
            </p>
            <p className="text-xs text-gray-500 font-body">
              Add, reorder, and publish blocks.{" "}
              <span className={status.tone}>
                {loading ? (
                  <Loader2 className="inline w-3 h-3 animate-spin" />
                ) : (
                  status.label
                )}
              </span>
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        </button>

        <button
          type="button"
          onClick={openPreview}
          className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Eye className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 font-body inline-flex items-center gap-1">
              Preview as collector
              <ExternalLink className="w-3 h-3 opacity-60" />
            </p>
            <p className="text-xs text-gray-500 font-body">
              Opens in a new tab. Try Not paired / Pre-scan / Paired to see each view.
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        </button>
      </div>

      <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
        <div className="flex items-start gap-2">
          <Fingerprint className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          <div className="text-xs text-gray-600 font-body space-y-1">
            <p>
              <span className="font-semibold text-gray-900">How collectors see this:</span>{" "}
              blocks stay hidden until you publish them. Each published block then
              appears for anyone who has the artwork paired to their account.
            </p>
            <p>
              You can publish the whole experience from the editor, or publish one
              block at a time &mdash; useful when you&apos;re drip-feeding new content.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
