"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Skeleton, Card, CardContent, Badge, Alert, AlertDescription, Button } from "@/components/ui"
import { Eye, Lock, ArrowRight, Crown, Pencil, Sparkles, Image as ImageIcon, Plus } from "lucide-react"
import { AlertCircle, ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { ArtworkSeries } from "@/types/artwork-series"
import { ShopifyStyleSeriesForm } from "@/app/vendor/dashboard/series/components/ShopifyStyleSeriesForm"
import { UnlockTypeTooltip } from "@/app/vendor/dashboard/series/components/UnlockTypeTooltip"

/**
 * /vendor/studio/series/[id] — AppShell-native series detail.
 * Replaces /vendor/dashboard/series/[id] (now a redirect shim).
 */
export default function SeriesDetailPage() {
  const router = useRouter()
  const params = useParams()
  const seriesId = params?.id as string

  const [series, setSeries] = useState<ArtworkSeries | null>(null)
  const [members, setMembers] = useState<ArtworkSeries["members"]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (seriesId) {
      void fetchSeriesDetails()
    }
  }, [seriesId])

  const fetchSeriesDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/vendor/series/${seriesId}`, { credentials: "include" })
      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || "Failed to load series")
        return
      }
      const data = await response.json()
      setSeries(data.series)
      setMembers(data.members || [])
    } catch (err: any) {
      console.error("Error fetching series:", err)
      setError(err.message || "Failed to load series")
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    await fetchSeriesDetails()
    setIsEditing(false)
  }

  const handleCancel = () => setIsEditing(false)

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-[600px]" />
      </div>
    )
  }

  if (error || !series) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Button variant="outline" onClick={() => router.push("/vendor/studio/series")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Series
        </Button>
        <Alert variant="destructive" className="border shadow-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Series not found"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const getUnlockTypeLabel = (type: string) => {
    switch (type) {
      case "any_purchase": return "Open Collection"
      case "sequential": return "Finish the Set"
      case "vip": return "VIP Unlocks"
      default: return type
    }
  }

  const unlockTypeConfig: Record<string, { gradient: string; borderColor: string; icon: typeof Lock; badgeColor: string; badgeBg: string }> = {
    any_purchase: { gradient: "from-blue-500/30 to-cyan-500/30", borderColor: "border-blue-400/50", icon: Lock, badgeColor: "text-blue-600", badgeBg: "bg-blue-100" },
    sequential: { gradient: "from-purple-500/30 to-pink-500/30", borderColor: "border-purple-400/50", icon: ArrowRight, badgeColor: "text-purple-600", badgeBg: "bg-purple-100" },
    vip: { gradient: "from-orange-500/30 to-red-500/30", borderColor: "border-orange-400/50", icon: Crown, badgeColor: "text-orange-600", badgeBg: "bg-orange-100" },
  }

  const config = unlockTypeConfig[series.unlock_type] || {
    gradient: "from-gray-500/20 to-slate-500/20",
    borderColor: "border-gray-400/50",
    icon: Lock,
    badgeColor: "text-gray-600",
    badgeBg: "bg-gray-100",
  }
  const Icon = config.icon
  const totalCount = series.member_count || 0

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => router.push("/vendor/studio/series")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Series
        </Button>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {!isEditing && (
            <>
              <Link href={`/vendor/studio/series/${seriesId}/experience`} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-[#1a1a1a] text-white text-xs font-semibold font-body hover:opacity-85 transition-opacity">
                <Sparkles className="h-3.5 w-3.5" />
                Edit unlock experience
              </Link>
              <Button onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Series
              </Button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <ShopifyStyleSeriesForm
          initialData={series}
          seriesId={seriesId}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      ) : (
        <Card className={cn("overflow-hidden relative", `bg-gradient-to-br ${config.gradient}`, `border-2 ${config.borderColor}`)}>
          <div className="aspect-video relative overflow-hidden bg-muted lg:aspect-[3/1]">
            {series.thumbnail_url ? (
              <img src={series.thumbnail_url} alt={series.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-muted/50 border-2 border-dashed border-muted-foreground/20">
                <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground/40 font-medium">No cover image</p>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className={cn("absolute top-4 left-4 z-10 p-2 rounded-full backdrop-blur-sm", config.badgeBg, config.badgeColor)}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6 z-0">
              <h1 className="font-bold text-white text-3xl truncate mb-2">{series.name}</h1>
              {series.description && (
                <p className="text-white/80 text-sm mb-4 line-clamp-2">{series.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-sm">
                  {totalCount} {totalCount === 1 ? "artwork" : "artworks"}
                </Badge>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className={cn("text-sm border-2", config.borderColor, config.badgeBg, config.badgeColor)}>
                    <Icon className="h-4 w-4 mr-1" />
                    {getUnlockTypeLabel(series.unlock_type)}
                  </Badge>
                  <UnlockTypeTooltip unlockType={series.unlock_type} />
                </div>
              </div>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Artworks in Series</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/vendor/studio/artworks/new?series=${seriesId}`)}
              >
                + Add artworks
              </Button>
            </div>

            {members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-muted rounded-xl">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  No artworks in this series yet.
                </p>
                <Button
                  size="sm"
                  onClick={() => router.push(`/vendor/studio/artworks/new?series=${seriesId}`)}
                >
                  + Add your first artwork
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {members.map((member) => (
                  <div key={member.id} className="group relative rounded-[10px] overflow-hidden bg-muted aspect-[4/3]">
                    {/* Cover image */}
                    {member.artwork_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.artwork_image}
                        alt={member.artwork_title || "Artwork"}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#390000]/10 to-[#390000]/5">
                        <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    {/* Locked/Unlocked badge — top left */}
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <span className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-sm text-[9px] font-bold",
                        member.is_locked
                          ? "bg-amber-100/90 text-amber-700"
                          : "bg-green-100/90 text-green-700"
                      )}>
                        {member.is_locked ? (
                          <><Lock className="w-2.5 h-2.5" /> Locked</>
                        ) : (
                          <><Eye className="w-2.5 h-2.5" /> Unlocked</>
                        )}
                      </span>
                    </div>

                    {/* Artwork title — bottom left */}
                    <div className="absolute bottom-0 left-0 right-0 p-2.5">
                      <p className="font-semibold text-xs text-white drop-shadow-md line-clamp-2">
                        {member.artwork_title || "Untitled artwork"}
                      </p>
                    </div>

                    {/* Edit link — bottom right */}
                    {member.submission_id && (
                      <Link
                        href={`/vendor/studio/artworks/${member.submission_id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                          "absolute bottom-2.5 right-2.5 z-10",
                          "flex items-center gap-1 px-2.5 py-1 rounded-full",
                          "bg-impact-primary text-white text-[10px] font-bold",
                          "hover:opacity-85 transition-opacity",
                          "opacity-0 group-hover:opacity-100"
                        )}
                      >
                        <Pencil className="w-2.5 h-2.5" /> Edit
                      </Link>
                    )}
                  </div>
                ))}

                {/* "+ Add artwork" card — end of grid */}
                <button
                  type="button"
                  onClick={() => router.push(`/vendor/studio/artworks/new?series=${seriesId}`)}
                  className={cn(
                    "aspect-[4/3] rounded-[10px] border-2 border-dashed",
                    "border-[#1a1a1a]/20 hover:border-[#1a1a1a]/50",
                    "flex flex-col items-center justify-center gap-2",
                    "text-[#1a1a1a]/40 hover:text-[#1a1a1a]/70",
                    "transition-colors cursor-pointer"
                  )}
                >
                  <div className="h-9 w-9 rounded-full border-2 border-current flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold font-body">Add artwork</p>
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
