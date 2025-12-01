"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { ArtworkSeries } from "@/types/artwork-series"
import { JourneyMapCanvas } from "./components/JourneyMapCanvas"

export default function JourneyMapPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [series, setSeries] = useState<ArtworkSeries[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchJourneyData()
  }, [])

  const fetchJourneyData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/vendor/series/journey", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setSeries(data.series || [])
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to load journey map")
      }
    } catch (err: any) {
      console.error("Error fetching journey data:", err)
      setError(err.message || "Failed to load journey map")
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
        <Button variant="outline" onClick={() => router.push("/vendor/dashboard/series")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Series
        </Button>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push("/vendor/dashboard/series")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Series
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Journey Map</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Arrange your series on the grid to create a visual journey for your collectors
          </p>
        </div>
      </div>

      {/* Journey Map Canvas */}
      <Card>
        <CardHeader>
          <CardTitle>Tree Creator</CardTitle>
        </CardHeader>
        <CardContent>
          <JourneyMapCanvas
            series={series}
            onSeriesClick={(seriesId) => {
              router.push(`/vendor/dashboard/series/${seriesId}`)
            }}
            onPositionUpdate={async (seriesId, position) => {
              // Optimistically update local state immediately
              setSeries((prevSeries) =>
                prevSeries.map((s) =>
                  s.id === seriesId
                    ? { ...s, journey_position: position }
                    : s
                )
              )

              // Update API in background
              try {
                const response = await fetch(`/api/vendor/series/${seriesId}/journey-position`, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  credentials: "include",
                  body: JSON.stringify({ journey_position: position }),
                })

                if (!response.ok) {
                  throw new Error("Failed to update position")
                }

                // Update with server response to ensure consistency
                const data = await response.json()
                if (data.series) {
                  setSeries((prevSeries) =>
                    prevSeries.map((s) =>
                      s.id === seriesId ? { ...s, ...data.series } : s
                    )
                  )
                }
              } catch (err: any) {
                console.error("Error updating position:", err)
                // Revert on error
                fetchJourneyData()
                toast({
                  title: "Error",
                  description: err.message || "Failed to update series position",
                  variant: "destructive",
                })
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
