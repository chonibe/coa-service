"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, Settings, Filter, MapPin } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { ArtworkSeries, JourneyMapSettings } from "@/types/artwork-series"
import { JourneyMapCanvas } from "./components/JourneyMapCanvas"
import { JourneySettingsPanel } from "./components/JourneySettingsPanel"

export default function JourneyMapPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [series, setSeries] = useState<ArtworkSeries[]>([])
  const [mapSettings, setMapSettings] = useState<JourneyMapSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [filter, setFilter] = useState<"all" | "milestones" | "completed" | "in_progress">("all")

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
        setMapSettings(data.mapSettings)
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

  const filteredSeries = series.filter((s) => {
    switch (filter) {
      case "milestones":
        return s.is_milestone === true
      case "completed":
        return s.completed_at !== null
      case "in_progress":
        return (
          s.completed_at === null &&
          (s.completion_progress?.percentage_complete || 0) > 0 &&
          (s.completion_progress?.percentage_complete || 0) < 100
        )
      default:
        return true
    }
  })

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/vendor/dashboard/series")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Series
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Journey Map</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Visualize your series as milestones in your artistic journey
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter:</span>
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All Series
            </Button>
            <Button
              variant={filter === "milestones" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("milestones")}
            >
              Milestones Only
            </Button>
            <Button
              variant={filter === "completed" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("completed")}
            >
              Completed
            </Button>
            <Button
              variant={filter === "in_progress" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("in_progress")}
            >
              In Progress
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Journey Map Canvas */}
      <Card>
        <CardHeader>
          <CardTitle>Your Artistic Journey</CardTitle>
          <CardDescription>
            {filteredSeries.length} {filteredSeries.length === 1 ? "series" : "series"} displayed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JourneyMapCanvas
            series={filteredSeries}
            mapSettings={mapSettings}
            onSeriesClick={(seriesId) => {
              router.push(`/vendor/dashboard/series/${seriesId}`)
            }}
            onPositionUpdate={async (seriesId, position) => {
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

                // Refresh data
                fetchJourneyData()
              } catch (err: any) {
                console.error("Error updating position:", err)
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

      {/* Settings Panel */}
      <JourneySettingsPanel
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        mapSettings={mapSettings}
        onSettingsUpdate={fetchJourneyData}
      />
    </div>
  )
}
