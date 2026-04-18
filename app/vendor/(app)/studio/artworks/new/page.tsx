"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, Plus, Lock, ArrowRight, Crown, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import { ShopifyStyleArtworkForm } from "@/app/vendor/dashboard/products/create/components/shopify-style-form"

interface SeriesOption {
  id: string
  name: string
  thumbnailUrl: string | null
  unlockType: string
  memberCount: number
}

const unlockTypeConfig: Record<string, {
  label: string
  gradient: string
  icon: typeof Lock
  badgeClass: string
}> = {
  any_purchase: {
    label: 'Open Collection',
    gradient: 'from-blue-500/40 to-cyan-500/40',
    icon: Lock,
    badgeClass: 'bg-blue-100 text-blue-700',
  },
  sequential: {
    label: 'Finish the Set',
    gradient: 'from-purple-500/40 to-pink-500/40',
    icon: ArrowRight,
    badgeClass: 'bg-purple-100 text-purple-700',
  },
  vip: {
    label: 'VIP Unlocks',
    gradient: 'from-orange-500/40 to-red-500/40',
    icon: Crown,
    badgeClass: 'bg-orange-100 text-orange-700',
  },
}

const fallbackGradient = 'from-gray-500/20 to-slate-500/20'

export default function CreateArtworkPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedSeriesId = searchParams.get("series")

  const [step, setStep] = useState<"pick" | "form">(preselectedSeriesId ? "form" : "pick")
  const [seriesList, setSeriesList] = useState<SeriesOption[]>([])
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(preselectedSeriesId)
  const [selectedSeriesName, setSelectedSeriesName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSeries = async () => {
      let preselectedName: string | null = null
      try {
        const res = await fetch("/api/vendor/series?include_archived=true", { credentials: "include" })
        if (res.ok) {
          const json = await res.json()
          const active = (json.series || []).filter((s: any) => !s.archived_at && s.is_active !== false)
          const mapped = active.map((s: any) => ({
            id: s.id,
            name: s.name || s.title,
            thumbnailUrl: s.thumbnail_url || s.thumbnailUrl || s.cover_url || null,
            unlockType: s.unlock_type || s.unlockType || "any_purchase",
            memberCount: s.member_count || s.memberCount || 0,
          }))
          setSeriesList(mapped)
          if (preselectedSeriesId) {
            const match = mapped.find((s) => s.id === preselectedSeriesId)
            if (match) {
              preselectedName = match.name
            } else {
              const one = await fetch(`/api/vendor/series/${preselectedSeriesId}`, { credentials: "include" })
              if (one.ok) {
                const data = await one.json()
                preselectedName = (data.series?.name as string | undefined) || null
              }
            }
          }
        }
      } catch (err) {
        console.error("[SeriesPicker] Failed to fetch series:", err)
      } finally {
        if (preselectedSeriesId) {
          setSelectedSeriesName(preselectedName || "Series")
        }
        setLoading(false)
      }
    }
    void fetchSeries()
  }, [preselectedSeriesId])

  const handleSeriesSelect = (series: SeriesOption) => {
    setSelectedSeriesId(series.id)
    setSelectedSeriesName(series.name)
    setStep("form")
  }

  const handleCancel = () => {
    if (step === "form") {
      if (preselectedSeriesId) {
        router.push(`/vendor/studio/series/${preselectedSeriesId}`)
        return
      }
      setStep("pick")
      setSelectedSeriesId(null)
      setSelectedSeriesName(null)
    } else {
      router.push("/vendor/studio")
    }
  }

  const handleComplete = (result?: { submissionId: string; status: string; isDraft: boolean }) => {
    if (result?.submissionId) {
      router.push(`/vendor/studio?focus=${result.submissionId}`)
      return
    }
    router.push("/vendor/studio")
  }

  if (step === "form" && selectedSeriesId && selectedSeriesName) {
    return (
      <div className="p-4 md:p-6">
        <div className="max-w-7xl mx-auto mb-4">
          <Link
            href="/vendor/studio/series"
            className="inline-flex items-center gap-1.5 font-body text-xs tracking-wide text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Series
          </Link>
        </div>
        <ShopifyStyleArtworkForm
          onComplete={handleComplete}
          onCancel={handleCancel}
          initialData={{ series_id: selectedSeriesId, series_name: selectedSeriesName }}
          seriesRequired
        />
      </div>
    )
  }

  // Step 1 — visual series picker
  return (
    <div className="p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => router.push("/vendor/studio")}
            className="inline-flex items-center gap-1.5 font-body text-xs tracking-wide text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Studio
          </button>
        </div>

        <div className="mb-6">
          <h1 className="font-heading text-2xl font-semibold text-[#1a1a1a] tracking-[-0.01em] mb-1">
            Which series is this artwork for?
          </h1>
          <p className="text-sm text-[#1a1a1a]/60 font-body">
            Every artwork belongs to a series. Pick one below or create a new one first.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded-[10px] bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : seriesList.length === 0 ? (
          <div className="text-center py-16">
            <Layers className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="font-heading text-xl font-semibold text-[#1a1a1a] mb-3">
              No series yet
            </h3>
            <p className="text-sm text-[#1a1a1a]/60 font-body mb-6">
              Create your first series before adding artworks.
            </p>
            <Link
              href="/vendor/studio/series/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-impact-primary text-white text-sm font-bold font-body hover:opacity-85 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Create series
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
              {seriesList.map((series) => {
                const config = unlockTypeConfig[series.unlockType] || {
                  label: series.unlockType,
                  gradient: fallbackGradient,
                  icon: Lock,
                  badgeClass: 'bg-gray-100 text-gray-600',
                }
                const Icon = config.icon

                return (
                  <button
                    key={series.id}
                    type="button"
                    onClick={() => handleSeriesSelect(series)}
                    className="group relative aspect-[4/3] rounded-[10px] overflow-hidden bg-muted text-left"
                  >
                    {(series.thumbnailUrl) ? (
                      <Image
                        src={series.thumbnailUrl}
                        alt={series.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    ) : (
                      <div className={cn("absolute inset-0 bg-gradient-to-br", config.gradient)} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className={cn(
                      "absolute top-2.5 left-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-sm text-[9px] font-bold",
                      config.badgeClass
                    )}>
                      <Icon className="w-2.5 h-2.5" />
                      {config.label}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2.5">
                      <p className="font-semibold text-xs text-white drop-shadow-md line-clamp-2">{series.name}</p>
                      <p className="text-[10px] text-white/60 mt-0.5">
                        {series.memberCount} {series.memberCount === 1 ? 'artwork' : 'artworks'}
                      </p>
                    </div>
                  </button>
                )
              })}

              {/* "+ Create new series" card */}
              <Link
                href="/vendor/studio/series/new"
                className={cn(
                  "aspect-[4/3] rounded-[10px] border-2 border-dashed",
                  "border-[#1a1a1a]/20 hover:border-[#1a1a1a]/50",
                  "flex flex-col items-center justify-center gap-2",
                  "text-[#1a1a1a]/50 hover:text-[#1a1a1a]/80",
                  "transition-colors cursor-pointer"
                )}
              >
                <div className="h-9 w-9 rounded-full border-2 border-current flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold font-body">New series</p>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}