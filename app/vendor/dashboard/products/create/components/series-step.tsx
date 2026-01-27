"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Loader2, Info, X, Crown, Clock, Radio, Lock, ArrowRight } from "lucide-react"
import type { ProductSubmissionData } from "@/types/product-submission"
// Removed: BenefitsManagement import - Hidden Treasures removed from flow
// import { BenefitsManagement } from "./benefits-management"
import { Label, Button, Card, CardContent, Alert, AlertDescription } from "@/components/ui"

interface SeriesStepProps {
  formData: ProductSubmissionData
  setFormData: (data: ProductSubmissionData) => void
}

export function SeriesStep({ formData, setFormData }: SeriesStepProps) {
  const [availableSeries, setAvailableSeries] = useState<Array<{ id: string; name: string; member_count: number; unlock_type?: string }>>([])
  const [loadingSeries, setLoadingSeries] = useState(true)

  // Fetch available series
  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setLoadingSeries(true)
        const response = await fetch("/api/vendor/series/available", {
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          const seriesList = data.series || []
          
          if (formData.series_id && !seriesList.find((s: any) => s.id === formData.series_id)) {
            try {
              const seriesResponse = await fetch(`/api/vendor/series/${formData.series_id}`, {
                credentials: "include",
              })
              if (seriesResponse.ok) {
                const seriesData = await seriesResponse.json()
                seriesList.unshift({
                  id: seriesData.series.id,
                  name: seriesData.series.name,
                  member_count: seriesData.series.member_count || 0,
                  unlock_type: seriesData.series.unlock_type,
                })
              }
            } catch (error) {
              console.error("Error fetching current series:", error)
            }
          }
          
          setAvailableSeries(seriesList)
        }
      } catch (error) {
        console.error("Error fetching series:", error)
      } finally {
        setLoadingSeries(false)
      }
    }

    fetchSeries()
  }, [formData.series_id])

  const handleSeriesSelect = (seriesId: string) => {
    const selectedSeries = availableSeries.find((s) => s.id === seriesId)
    setFormData({
      ...formData,
      series_id: seriesId,
      series_name: selectedSeries?.name || null,
    })
  }

  const handleRemoveSeries = () => {
    setFormData({
      ...formData,
      series_id: undefined,
      series_name: undefined,
      is_locked: undefined,
      unlock_order: undefined,
    })
  }

  const getUnlockTypeLabel = (type?: string) => {
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
      case "nfc":
        return "NFC Unlock"
      default:
        return type || "Unknown"
    }
  }

  const getUnlockTypeIcon = (type?: string) => {
    switch (type) {
      case "any_purchase":
        return <Lock className="h-3 w-3" />
      case "sequential":
        return <ArrowRight className="h-3 w-3" />
      case "threshold":
      case "vip":
        return <Crown className="h-3 w-3" />
      case "time_based":
        return <Clock className="h-3 w-3" />
      case "nfc":
        return <Radio className="h-3 w-3" />
      default:
        return null
    }
  }

  const getUnlockTypeColor = (type?: string) => {
    switch (type) {
      case "any_purchase":
        return "border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
      case "sequential":
        return "border-purple-400 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
      case "threshold":
      case "vip":
        return "border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300"
      case "time_based":
        return "border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
      case "nfc":
        return "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-200"
      default:
        return "border-gray-400 bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300"
    }
  }

  const selectedSeries = availableSeries.find((s) => s.id === formData.series_id)

  // If artwork is assigned to a series
  if (formData.series_id) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Series & Unlocks</h3>
          <p className="text-sm text-muted-foreground">
            This artwork is assigned to a series. Configure unlock settings below.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="space-y-2">
                <div>
                  This artwork is part of the <strong>"{selectedSeries?.name || formData.series_name}"</strong> series.
                </div>
                {selectedSeries?.unlock_type && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${getUnlockTypeColor(selectedSeries.unlock_type)}`}>
                      {getUnlockTypeIcon(selectedSeries.unlock_type)}
                      {getUnlockTypeLabel(selectedSeries.unlock_type)}
                    </div>
                  </div>
                )}
              </AlertDescription>
            </Alert>

            <Button
              variant="outline"
              onClick={handleRemoveSeries}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Remove from Series
            </Button>
          </CardContent>
        </Card>

        {/* Removed: Benefits Management / Hidden Treasures */}
        {/* <Card>
          <CardContent className="pt-6">
            <BenefitsManagement
              benefits={formData.benefits || []}
              onBenefitsChange={(benefits) => setFormData({ ...formData, benefits })}
              seriesId={formData.series_id}
            />
          </CardContent>
        </Card> */}
      </div>
    )
  }

  // Series selection view
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Series & Unlocks</h3>
        <p className="text-sm text-muted-foreground">
          Optionally assign this artwork to a series and configure unlock settings.
        </p>
      </div>

      {/* Info alert about creating series */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          To create a new series, visit the{" "}
          <Link href="/vendor/dashboard/series" className="underline font-medium hover:text-primary">
            Series Management page
          </Link>
          .
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <Label>Select Series</Label>
        {loadingSeries ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading series...
          </div>
        ) : availableSeries.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {availableSeries.map((series) => (
              <Card
                key={series.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleSeriesSelect(series.id)}
              >
                <CardContent className="pt-6 space-y-2">
                  <h4 className="font-semibold">{series.name}</h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm text-muted-foreground">
                      {series.member_count} {series.member_count === 1 ? "artwork" : "artworks"}
                    </p>
                    {series.unlock_type && (
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-medium ${getUnlockTypeColor(series.unlock_type)}`}>
                        {getUnlockTypeIcon(series.unlock_type)}
                        {getUnlockTypeLabel(series.unlock_type)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No series available yet.{" "}
              <Link href="/vendor/dashboard/series" className="underline font-medium hover:text-primary">
                Create your first series
              </Link>{" "}
              to get started.
            </AlertDescription>
          </Alert>
        )}

        {/* Benefits Management for standalone artwork */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <BenefitsManagement
              benefits={formData.benefits || []}
              onBenefitsChange={(benefits) => setFormData({ ...formData, benefits })}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
