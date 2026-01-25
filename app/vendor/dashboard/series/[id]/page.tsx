"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ArtworkSeries } from "@/types/artwork-series"
import { ShopifyStyleSeriesForm } from "../components/ShopifyStyleSeriesForm"

export default function SeriesDetailPage() {
  const router = useRouter()
  const params = useParams()
  const seriesId = params?.id as string

  const [series, setSeries] = useState<ArtworkSeries | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const handleComplete = () => {
    router.push("/vendor/dashboard/products")
  }

  const handleCancel = () => {
    router.push("/vendor/dashboard/products")
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

  return (
    <div className="p-4">
      <ShopifyStyleSeriesForm
        initialData={series}
        seriesId={seriesId}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </div>
  )
}
