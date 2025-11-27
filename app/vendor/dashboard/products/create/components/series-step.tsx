"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Lock, Plus, Info, X } from "lucide-react"
import type { ProductSubmissionData } from "@/types/product-submission"
import type { ArtworkSeries, UnlockType } from "@/types/artwork-series"

interface SeriesStepProps {
  formData: ProductSubmissionData
  setFormData: (data: ProductSubmissionData) => void
}

export function SeriesStep({ formData, setFormData }: SeriesStepProps) {
  const [availableSeries, setAvailableSeries] = useState<Array<{ id: string; name: string; member_count: number }>>([])
  const [loadingSeries, setLoadingSeries] = useState(true)
  const [creatingSeries, setCreatingSeries] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Form state for creating new series
  const [newSeriesName, setNewSeriesName] = useState("")
  const [newSeriesDescription, setNewSeriesDescription] = useState("")
  const [newSeriesUnlockType, setNewSeriesUnlockType] = useState<UnlockType>("any_purchase")
  const [newSeriesUnlockConfig, setNewSeriesUnlockConfig] = useState<any>({})
  const [newSeriesRequiredCount, setNewSeriesRequiredCount] = useState<number>(1)

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
          
          // If editing and current series_id exists but not in list, fetch it
          if (formData.series_id && !seriesList.find((s: any) => s.id === formData.series_id)) {
            try {
              const seriesResponse = await fetch(`/api/vendor/series/${formData.series_id}`, {
                credentials: "include",
              })
              if (seriesResponse.ok) {
                const seriesData = await seriesResponse.json()
                // Add current series to list even if inactive
                seriesList.unshift({
                  id: seriesData.series.id,
                  name: seriesData.series.name,
                  member_count: seriesData.series.member_count || 0,
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
    if (seriesId === "create-new") {
      setShowCreateForm(true)
      setFormData({ ...formData, series_id: undefined })
    } else {
      setShowCreateForm(false)
      const selectedSeries = availableSeries.find((s) => s.id === seriesId)
      setFormData({
        ...formData,
        series_id: seriesId,
        series_name: selectedSeries?.name || null,
      })
    }
  }

  const handleCreateSeries = async () => {
    if (!newSeriesName.trim()) {
      return
    }

    setCreatingSeries(true)
    try {
      const unlockConfig: any = {}
      if (newSeriesUnlockType === "threshold") {
        unlockConfig.required_count = newSeriesRequiredCount
        unlockConfig.unlocks = [] // Will be populated when artworks are added
      } else if (newSeriesUnlockType === "sequential") {
        unlockConfig.order = [] // Will be populated when artworks are added
      } else if (newSeriesUnlockType === "custom") {
        unlockConfig.rules = []
      }
      // For "any_purchase", empty config is fine

      const response = await fetch("/api/vendor/series", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: newSeriesName.trim(),
          description: newSeriesDescription.trim() || undefined,
          unlock_type: newSeriesUnlockType,
          unlock_config: unlockConfig,
          display_order: 0,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create series")
      }

      const data = await response.json()
      
      // Update form data with new series
      setFormData({
        ...formData,
        series_id: data.series.id,
        series_name: data.series.name,
      })

      // Refresh available series list
      const seriesResponse = await fetch("/api/vendor/series/available", {
        credentials: "include",
      })
      if (seriesResponse.ok) {
        const seriesData = await seriesResponse.json()
        setAvailableSeries(seriesData.series || [])
      }

      // Reset create form
      setNewSeriesName("")
      setNewSeriesDescription("")
      setNewSeriesUnlockType("any_purchase")
      setNewSeriesUnlockConfig({})
      setShowCreateForm(false)
    } catch (error: any) {
      console.error("Error creating series:", error)
      alert(error.message || "Failed to create series")
    } finally {
      setCreatingSeries(false)
    }
  }

  const handleRemoveSeries = () => {
    setFormData({
      ...formData,
      series_id: undefined,
      series_name: undefined,
      is_locked: undefined,
      unlock_order: undefined,
    })
    setShowCreateForm(false)
  }

  const handleLockToggle = (isLocked: boolean) => {
    setFormData({
      ...formData,
      is_locked: isLocked,
    })
  }

  const handleUnlockOrderChange = (order: string) => {
    const orderNum = order ? parseInt(order, 10) : null
    if (isNaN(orderNum as number) && orderNum !== null) {
      return
    }
    setFormData({
      ...formData,
      unlock_order: orderNum,
    })
  }

  const selectedSeries = availableSeries.find((s) => s.id === formData.series_id)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Series & Unlocks</h3>
        <p className="text-sm text-muted-foreground">
          Optionally assign this artwork to a series and configure unlock settings.
        </p>
      </div>

      {/* Series Selection */}
      <div className="space-y-2">
        <Label htmlFor="series">Artwork Series</Label>
        {loadingSeries ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading series...
          </div>
        ) : (
          <Select
            value={formData.series_id || "none"}
            onValueChange={(value) => {
              if (value === "none") {
                handleRemoveSeries()
              } else {
                handleSeriesSelect(value)
              }
            }}
          >
            <SelectTrigger id="series">
              <SelectValue placeholder="Select a series (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Series</SelectItem>
              {availableSeries.map((series) => (
                <SelectItem key={series.id} value={series.id}>
                  {series.name} ({series.member_count} {series.member_count === 1 ? "artwork" : "artworks"})
                </SelectItem>
              ))}
              <SelectItem value="create-new">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Series
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        )}
        <p className="text-xs text-muted-foreground">
          Assign this artwork to a series to enable unlock mechanics for collectors.
        </p>
      </div>

      {/* Create New Series Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create New Series</CardTitle>
            <CardDescription>Create a new series on-the-fly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-series-name">
                Series Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="new-series-name"
                value={newSeriesName}
                onChange={(e) => setNewSeriesName(e.target.value)}
                placeholder="Enter series name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-series-description">Description (Optional)</Label>
              <Textarea
                id="new-series-description"
                value={newSeriesDescription}
                onChange={(e) => setNewSeriesDescription(e.target.value)}
                placeholder="Describe this series"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-series-unlock-type">Unlock Type</Label>
              <Select
                value={newSeriesUnlockType}
                onValueChange={(value: UnlockType) => {
                  setNewSeriesUnlockType(value)
                  if (value === "threshold") {
                    setNewSeriesUnlockConfig({ required_count: newSeriesRequiredCount, unlocks: [] })
                  } else if (value === "sequential") {
                    setNewSeriesUnlockConfig({ order: [] })
                  } else if (value === "custom") {
                    setNewSeriesUnlockConfig({ rules: [] })
                  } else {
                    setNewSeriesUnlockConfig({}) // any_purchase
                  }
                }}
              >
                <SelectTrigger id="new-series-unlock-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any_purchase">Any Purchase - Unlock all when any artwork is purchased</SelectItem>
                  <SelectItem value="sequential">Sequential - Unlock artworks in order</SelectItem>
                  <SelectItem value="threshold">Threshold - Unlock after purchasing N artworks</SelectItem>
                  <SelectItem value="custom">Custom - Define custom unlock rules</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose how artworks in this series will be unlocked for collectors.
              </p>
            </div>

            {newSeriesUnlockType === "threshold" && (
              <div className="space-y-2">
                <Label htmlFor="required-count">Required Purchases</Label>
                <Input
                  id="required-count"
                  type="number"
                  min="1"
                  value={newSeriesRequiredCount}
                  onChange={(e) => {
                    const count = parseInt(e.target.value, 10) || 1
                    setNewSeriesRequiredCount(count)
                    setNewSeriesUnlockConfig({ required_count: count, unlocks: [] })
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Number of artworks collectors must purchase to unlock exclusive pieces.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleCreateSeries}
                disabled={!newSeriesName.trim() || creatingSeries}
              >
                {creatingSeries ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Series
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false)
                  setNewSeriesName("")
                  setNewSeriesDescription("")
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Series Configuration */}
      {formData.series_id && !showCreateForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Series Configuration</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveSeries}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              Configure unlock settings for this artwork in "{selectedSeries?.name || formData.series_name}"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedSeries && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This artwork will be part of the "{selectedSeries.name}" series with {selectedSeries.member_count} existing {selectedSeries.member_count === 1 ? "artwork" : "artworks"}.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is-locked" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Locked Status
                </Label>
                <p className="text-xs text-muted-foreground">
                  Mark this artwork as locked (not purchasable until unlocked)
                </p>
              </div>
              <Switch
                id="is-locked"
                checked={formData.is_locked || false}
                onCheckedChange={handleLockToggle}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unlock-order">Unlock Order (Optional)</Label>
              <Input
                id="unlock-order"
                type="number"
                min="1"
                value={formData.unlock_order || ""}
                onChange={(e) => handleUnlockOrderChange(e.target.value)}
                placeholder="e.g., 1, 2, 3..."
              />
              <p className="text-xs text-muted-foreground">
                For sequential unlocks, specify the order in which this artwork should be unlocked.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

