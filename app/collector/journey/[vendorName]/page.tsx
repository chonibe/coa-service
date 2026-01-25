"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"

import { Skeleton } from "@/components/ui/skeleton"


import { CheckCircle2, Lock, TrendingUp } from "lucide-react"
import type { ArtworkSeries, JourneyMapSettings } from "@/types/artwork-series"
import { JourneyMapCanvas } from "@/app/vendor/dashboard/journey/components/JourneyMapCanvas"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Alert, AlertDescription, Badge } from "@/components/ui"
export default function CollectorJourneyPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const vendorName = params?.vendorName as string
  const customerEmail = searchParams.get("email")

  const [series, setSeries] = useState<ArtworkSeries[]>([])
  const [mapSettings, setMapSettings] = useState<JourneyMapSettings | null>(null)
  const [vendor, setVendor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (vendorName) {
      fetchJourneyData()
    }
  }, [vendorName, customerEmail])

  const fetchJourneyData = async () => {
    try {
      setLoading(true)
      setError(null)
      const url = `/api/collector/journey/${encodeURIComponent(vendorName)}${customerEmail ? `?email=${encodeURIComponent(customerEmail)}` : ""}`
      const response = await fetch(url, {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setSeries(data.series || [])
        setMapSettings(data.mapSettings)
        setVendor(data.vendor)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to load journey")
      }
    } catch (err: any) {
      console.error("Error fetching journey data:", err)
      setError(err.message || "Failed to load journey")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const completedSeries = series.filter((s) => s.completed_at !== null)
  const collectorOwnedSeries = series.filter((s) => (s as any).collector_owned_count > 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{vendor?.vendor_name || vendorName}'s Journey</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Explore the artistic journey and your progress as a collector
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium text-muted-foreground">Total Series</span>
            </div>
            <p className="text-2xl font-bold">{series.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-muted-foreground">Completed</span>
            </div>
            <p className="text-2xl font-bold">{completedSeries.length}</p>
          </CardContent>
        </Card>

        {customerEmail && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium text-muted-foreground">Your Collection</span>
              </div>
              <p className="text-2xl font-bold">{collectorOwnedSeries.length}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Journey Map */}
      <Card>
        <CardHeader>
          <CardTitle>Journey Map</CardTitle>
          <CardDescription>
            {customerEmail
              ? "Your progress through the artist's journey is highlighted"
              : "View the artist's complete journey"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JourneyMapCanvas
            series={series}
            mapSettings={mapSettings}
            onSeriesClick={(seriesId) => {
              // Navigate to series detail or product page
              window.location.href = `/vendor/${vendorName}/series/${seriesId}`
            }}
            onPositionUpdate={async () => {
              // Read-only for collectors
            }}
          />
        </CardContent>
      </Card>

      {/* Series List */}
      <Card>
        <CardHeader>
          <CardTitle>All Series</CardTitle>
          <CardDescription>Browse all series in this journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {series.map((s) => {
              const collectorData = s as any
              const isOwned = collectorData.collector_owned_count > 0
              const isCompleted = s.completed_at !== null

              return (
                <Card
                  key={s.id}
                  className={`cursor-pointer hover:shadow-lg transition-shadow ${
                    isOwned ? "border-purple-500 bg-purple-50/50 dark:bg-purple-900/20" : ""
                  }`}
                  onClick={() => {
                    window.location.href = `/vendor/${vendorName}/series/${s.id}`
                  }}
                >
                  <CardContent className="pt-6">
                    {s.thumbnail_url && (
                      <img
                        src={s.thumbnail_url}
                        alt={s.name}
                        className="w-full h-32 object-cover rounded-lg mb-4"
                      />
                    )}
                    <h3 className="font-semibold mb-2">{s.name}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {isCompleted && (
                        <Badge className="bg-green-500 text-white">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                      {isOwned && (
                        <Badge className="bg-purple-500 text-white">
                          <Lock className="h-3 w-3 mr-1" />
                          Owned ({collectorData.collector_owned_count})
                        </Badge>
                      )}
                      {!isOwned && s.unlock_type !== "any_purchase" && (
                        <Badge variant="outline">
                          <Lock className="h-3 w-3 mr-1" />
                          Locked
                        </Badge>
                      )}
                    </div>
                    {s.completion_progress && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {s.completion_progress.sold_artworks} / {s.completion_progress.total_artworks} sold
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
