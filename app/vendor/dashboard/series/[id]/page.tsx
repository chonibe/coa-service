"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Skeleton, Card, CardContent, Badge } from "@/components/ui"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, Copy, Trash2, Lock, ArrowRight, Crown, Clock, MoreVertical, Pencil } from "lucide-react"
import { UnlockTypeTooltip } from "../components/UnlockTypeTooltip"
import { cn } from "@/lib/utils"

import { AlertCircle, ArrowLeft } from "lucide-react"

import type { ArtworkSeries } from "@/types/artwork-series"
import { ShopifyStyleSeriesForm } from "../components/ShopifyStyleSeriesForm"

import { Alert, AlertDescription, Button } from "@/components/ui"
export default function SeriesDetailPage() {
  const router = useRouter()
  const params = useParams()
  const seriesId = params?.id as string

  const [series, setSeries] = useState<ArtworkSeries | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (seriesId) {
      fetchSeriesDetails()
    }
  }, [seriesId])

  const fetchSeriesDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/vendor/series/${seriesId}`, {
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || "Failed to load series")
        return
      }

      const data = await response.json()
      setSeries(data.series)
    } catch (err: any) {
      console.error("Error fetching series:", err)
      setError(err.message || "Failed to load series")
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    await fetchSeriesDetails() // Re-fetch series details after save
    setIsEditing(false) // Exit edit mode
    // No router.push, stay on the same series detail page
  }

  const handleCancel = () => {
    setIsEditing(false) // Exit edit mode
    // No router.push, stay on the same series detail page
  }

  if (loading) {
    return (
      <div className="p-4">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-[600px]" />
      </div>
    )
  }

  if (error || !series) {
    return (
      <div className="p-4 space-y-4">
        <Button variant="outline" onClick={() => router.push("/vendor/dashboard/products")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Artworks
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
      case "any_purchase":
        return "Open Collection"
      case "sequential":
        return "Finish the Set"
      case "threshold":
        return "VIP Unlocks"
      case "time_based":
        return "Time-Based"
      case "vip":
        return "VIP"
      default:
        return type
    }
  }

  const unlockTypeConfig: Record<string, {
    gradient: string
    borderColor: string
    icon: typeof Lock
    badgeColor: string
    badgeBg: string
  }> = {
    any_purchase: {
      gradient: "from-blue-500/30 to-cyan-500/30",
      borderColor: "border-blue-400/50",
      icon: Lock,
      badgeColor: "text-blue-600 dark:text-blue-400",
      badgeBg: "bg-blue-100 dark:bg-blue-900/30",
    },
    sequential: {
      gradient: "from-purple-500/30 to-pink-500/30",
      borderColor: "border-purple-400/50",
      icon: ArrowRight,
      badgeColor: "text-purple-600 dark:text-purple-400",
      badgeBg: "bg-purple-100 dark:bg-purple-900/30",
    },
    threshold: {
      gradient: "from-orange-500/30 to-red-500/30",
      borderColor: "border-orange-400/50",
      icon: Crown,
      badgeColor: "text-orange-600 dark:text-orange-400",
      badgeBg: "bg-orange-100 dark:bg-orange-900/30",
    },
    time_based: {
      gradient: "from-green-500/30 to-emerald-500/30",
      borderColor: "border-green-400/50",
      icon: Clock,
      badgeColor: "text-green-600 dark:text-green-400",
      badgeBg: "bg-green-100 dark:bg-green-900/30",
    },
    vip: {
      gradient: "from-orange-500/30 to-red-500/30",
      borderColor: "border-orange-400/50",
      icon: Crown,
      badgeColor: "text-orange-600 dark:text-orange-400",
      badgeBg: "bg-orange-100 dark:bg-orange-900/30",
    },
  }

  const config = unlockTypeConfig[series.unlock_type] || {
    gradient: "from-gray-500/20 to-slate-500/20",
    borderColor: "border-gray-400/50",
    icon: Lock,
    badgeColor: "text-gray-600 dark:text-gray-400",
    badgeBg: "bg-gray-100 dark:bg-gray-900/30",
  }
  const Icon = config.icon
  const totalCount = series.member_count || 0

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => router.push("/vendor/dashboard/products")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Artworks
        </Button>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Series
          </Button>
        )}
      </div>

      {isEditing ? (
        <ShopifyStyleSeriesForm
          initialData={series}
          seriesId={seriesId}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      ) : (
        <Card
          className={cn(
            "overflow-hidden relative",
            `bg-gradient-to-br ${config.gradient}`,
            `border-2 ${config.borderColor}`
          )}
        >
          <div className="aspect-video relative overflow-hidden bg-muted lg:aspect-[3/1]">
            {series.thumbnail_url ? (
              <img
                src={series.thumbnail_url}
                alt={series.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="h-24 w-24 text-muted-foreground/50" />
              </div>
            )}

            <div className={cn(
              "absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
            )} />
            
            <div className={cn(
              "absolute top-4 left-4 z-10 p-2 rounded-full backdrop-blur-sm",
              config.badgeBg,
              config.badgeColor
            )}>
              <Icon className="h-5 w-5" />
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6 z-0">
              <h1 className="font-bold text-white text-3xl truncate mb-2">{series.name}</h1>
              {series.description && (
                <p className="text-white/80 text-sm mb-4 line-clamp-2">
                  {series.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-sm">
                  {totalCount} {totalCount === 1 ? "artwork" : "artworks"}
                </Badge>
                <div className="flex items-center gap-1">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-sm border-2",
                      config.borderColor,
                      config.badgeBg,
                      config.badgeColor
                    )}
                  >
                    <Icon className="h-4 w-4 mr-1" />
                    {getUnlockTypeLabel(series.unlock_type)}
                  </Badge>
                  <UnlockTypeTooltip unlockType={series.unlock_type} />
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional details can go here if needed */}
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-3">Artworks in Series</h2>
            {totalCount === 0 ? (
              <p className="text-muted-foreground">No artworks in this series yet.</p>
            ) : (
              <>
                <p className="text-muted-foreground">Display artworks here (e.g., a carousel or grid)</p>
                {/* TODO: Integrate ArtworkCarousel or ArtworkListView here */}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
}
