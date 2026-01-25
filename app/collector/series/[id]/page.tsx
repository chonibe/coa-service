"use client"

import { notFound } from "next/navigation"
import { useEffect, useState } from "react"
import { ChevronLeft, MoreVertical } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CollectorSeries, SeriesApiResponse } from "@/types/collector"
import { ProgressBar } from "./components/ProgressBar"
import { CollectionGrid } from "./components/CollectionGrid"
import { NextUnlock } from "./components/NextUnlock"
import { MilestoneRewards } from "./components/MilestoneRewards"

export default function SeriesDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [series, setSeries] = useState<CollectorSeries | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/collector/series/${id}`)
        if (!res.ok) {
          const e = await res.json().catch(() => ({}))
          throw new Error(e.message || "Failed to load series")
        }
        const data: SeriesApiResponse = await res.json()
        setSeries(data.series)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [id])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Sticky header skeleton */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border pt-safe">
          <div className="flex items-center justify-between px-4 h-14">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-32 h-6" />
            <Skeleton className="w-8 h-8 rounded-full" />
          </div>
        </div>

        {/* Content skeleton */}
        <div className="px-4 py-6 space-y-6">
          <Skeleton className="w-full h-32 rounded-2xl" />
          <Skeleton className="w-full h-64 rounded-2xl" />
          <Skeleton className="w-full h-40 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-destructive font-medium mb-4">Error: {error}</p>
          <Button variant="outline" asChild>
            <Link href="/collector/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!series) {
    notFound()
  }

  const totalArtworks = series.artworks.length
  const ownedArtworks = series.artworks.filter((a) => a.isOwned).length

  // Find next artwork to unlock (first locked artwork the user doesn't own)
  const nextArtwork = series.artworks.find((a) => a.isLocked && !a.isOwned) || null

  // Mock milestone rewards (in production, this would come from the API based on series benefits)
  const milestones = [
    {
      threshold: Math.ceil(totalArtworks * 0.3),
      type: 'text',
      title: 'Exclusive Text Block',
      isUnlocked: ownedArtworks >= Math.ceil(totalArtworks * 0.3)
    },
    {
      threshold: Math.ceil(totalArtworks * 0.6),
      type: 'image',
      title: 'Behind-the-Scenes Photos',
      isUnlocked: ownedArtworks >= Math.ceil(totalArtworks * 0.6)
    },
    {
      threshold: totalArtworks,
      type: 'video',
      title: 'Exclusive Artist Video',
      isUnlocked: ownedArtworks >= totalArtworks
    }
  ]

  return (
    <div className="min-h-screen bg-background pb-safe">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border pt-safe">
        <div className="flex items-center justify-between px-4 h-14">
          <Button variant="ghost" size="icon" className="min-h-11 min-w-11" asChild>
            <Link href="/collector/dashboard">
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          
          <div className="text-center flex-1 min-w-0 px-2">
            <h1 className="text-base font-semibold truncate">{series.name}</h1>
            <Link 
              href={`/collector/artists/${series.vendor.name}`}
              className="text-xs text-muted-foreground hover:underline"
            >
              by {series.vendor.name}
            </Link>
          </div>

          <Button variant="ghost" size="icon" className="min-h-11 min-w-11">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6">
        {/* Progress Section */}
        <ProgressBar
          current={ownedArtworks}
          total={totalArtworks}
          unlockType={series.unlockType}
        />

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Collection Grid */}
        <CollectionGrid
          artworks={series.artworks}
          unlockType={series.unlockType}
        />

        {/* Next Unlock CTA */}
        <NextUnlock
          nextArtwork={nextArtwork}
          unlockType={series.unlockType}
        />

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Milestone Rewards */}
        <MilestoneRewards
          milestones={milestones}
          currentCount={ownedArtworks}
        />

        {/* Description (if exists) */}
        {series.description && (
          <div className="px-4 py-6 bg-muted/30 rounded-2xl">
            <h3 className="text-sm font-semibold mb-2">About This Series</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {series.description}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}


