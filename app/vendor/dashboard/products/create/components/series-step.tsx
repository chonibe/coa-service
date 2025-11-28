"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Lock, Plus, Info, X, ArrowRight, ArrowLeft, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { ProductSubmissionData } from "@/types/product-submission"
import type { UnlockType } from "@/types/artwork-series"
import { CoverArtUpload } from "@/app/vendor/dashboard/series/components/CoverArtUpload"
import { CoverArtDesigner } from "@/app/vendor/dashboard/series/components/CoverArtDesigner"
import { UnlockTypeCards } from "@/app/vendor/dashboard/series/components/UnlockTypeCards"
import { StepProgress } from "@/app/vendor/dashboard/series/components/StepProgress"

interface SeriesStepProps {
  formData: ProductSubmissionData
  setFormData: (data: ProductSubmissionData) => void
}

type Step = "cover" | "name" | "description" | "unlock" | "config"

export function SeriesStep({ formData, setFormData }: SeriesStepProps) {
  const [availableSeries, setAvailableSeries] = useState<Array<{ id: string; name: string; member_count: number }>>([])
  const [loadingSeries, setLoadingSeries] = useState(true)
  const [creatingSeries, setCreatingSeries] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [currentStep, setCurrentStep] = useState<Step>("cover")

  // Form state for creating new series
  const [newSeriesCoverArt, setNewSeriesCoverArt] = useState<string | null>(null)
  const [coverArtFile, setCoverArtFile] = useState<File | null>(null)
  const [newSeriesName, setNewSeriesName] = useState("")
  const [newSeriesDescription, setNewSeriesDescription] = useState("")
  const [newSeriesUnlockType, setNewSeriesUnlockType] = useState<UnlockType>("any_purchase")
  const [newSeriesUnlockConfig, setNewSeriesUnlockConfig] = useState<any>({})
  const [newSeriesRequiredCount, setNewSeriesRequiredCount] = useState<number>(1)
  const [isLocked, setIsLocked] = useState(false)
  const [unlockOrder, setUnlockOrder] = useState<number | null>(null)

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
      setCurrentStep("cover")
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

  const handleCoverArtUpload = async (file: File): Promise<string> => {
    // Store file for later upload after series creation
    setCoverArtFile(file)
    // Return data URL for immediate preview
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        resolve(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    })
  }

  const uploadCoverArtAfterCreation = async (seriesId: string, file: File): Promise<string | null> => {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`/api/vendor/series/${seriesId}/cover-art`, {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload cover art")
      }

      const data = await response.json()
      return data.url
    } catch (error) {
      console.error("Error uploading cover art:", error)
      return null
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
        unlockConfig.unlocks = []
      } else if (newSeriesUnlockType === "sequential") {
        unlockConfig.order = []
      } else if (newSeriesUnlockType === "custom") {
        unlockConfig.rules = []
      }

      const response = await fetch("/api/vendor/series", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: newSeriesName.trim(),
          description: newSeriesDescription.trim() || undefined,
          thumbnail_url: newSeriesCoverArt || undefined,
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
      const createdSeriesId = data.series.id
      
      // Upload cover art if file was selected
      if (coverArtFile) {
        const coverArtUrl = await uploadCoverArtAfterCreation(createdSeriesId, coverArtFile)
        if (coverArtUrl) {
          // Update series with cover art URL
          await fetch(`/api/vendor/series/${createdSeriesId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              thumbnail_url: coverArtUrl,
            }),
          })
        }
      }
      
      setFormData({
        ...formData,
        series_id: createdSeriesId,
        series_name: data.series.name,
        is_locked: isLocked,
        unlock_order: unlockOrder,
      })

      const seriesResponse = await fetch("/api/vendor/series/available", {
        credentials: "include",
      })
      if (seriesResponse.ok) {
        const seriesData = await seriesResponse.json()
        setAvailableSeries(seriesData.series || [])
      }

      // Reset form
      setNewSeriesCoverArt(null)
      setCoverArtFile(null)
      setNewSeriesName("")
      setNewSeriesDescription("")
      setNewSeriesUnlockType("any_purchase")
      setNewSeriesUnlockConfig({})
      setShowCreateForm(false)
      setCurrentStep("cover")
      setIsLocked(false)
      setUnlockOrder(null)
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
    setCurrentStep("cover")
  }

  const handleNext = () => {
    if (currentStep === "cover") {
      setCurrentStep("name")
    } else if (currentStep === "name") {
      setCurrentStep("description")
    } else if (currentStep === "description") {
      setCurrentStep("unlock")
    } else if (currentStep === "unlock") {
      if (newSeriesUnlockType === "threshold") {
        setCurrentStep("config")
      } else {
        handleCreateSeries()
      }
    }
  }

  const handleBack = () => {
    if (currentStep === "name") {
      setCurrentStep("cover")
    } else if (currentStep === "description") {
      setCurrentStep("name")
    } else if (currentStep === "unlock") {
      setCurrentStep("description")
    } else if (currentStep === "config") {
      setCurrentStep("unlock")
    }
  }

  const canProceed = () => {
    if (currentStep === "cover") return true // Optional
    if (currentStep === "name") return newSeriesName.trim().length > 0
    if (currentStep === "description") return true // Optional
    if (currentStep === "unlock") return true
    if (currentStep === "config") return newSeriesRequiredCount > 0
    return false
  }

  const getStepNumber = () => {
    const steps: Step[] = ["cover", "name", "description", "unlock", "config"]
    return steps.indexOf(currentStep) + 1
  }

  const getTotalSteps = () => {
    return newSeriesUnlockType === "threshold" ? 5 : 4
  }

  const selectedSeries = availableSeries.find((s) => s.id === formData.series_id)

  // If selecting existing series, show simple selection
  if (!showCreateForm && formData.series_id) {
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
              <AlertDescription>
                This artwork is part of the "{selectedSeries?.name || formData.series_name}" series.
              </AlertDescription>
            </Alert>

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
                onCheckedChange={(checked) => {
                  setFormData({ ...formData, is_locked: checked })
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unlock-order">Unlock Order (Optional)</Label>
              <Input
                id="unlock-order"
                type="number"
                min="1"
                value={formData.unlock_order || ""}
                onChange={(e) => {
                  const orderNum = e.target.value ? parseInt(e.target.value, 10) : null
                  setFormData({ ...formData, unlock_order: orderNum })
                }}
                placeholder="e.g., 1, 2, 3..."
              />
              <p className="text-xs text-muted-foreground">
                For sequential unlocks, specify the order in which this artwork should be unlocked.
              </p>
            </div>

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
      </div>
    )
  }

  // Series selection or creation
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Series & Unlocks</h3>
        <p className="text-sm text-muted-foreground">
          {showCreateForm
            ? "Create a new series for your artwork"
            : "Optionally assign this artwork to a series and configure unlock settings."}
        </p>
      </div>

      {!showCreateForm ? (
        <div className="space-y-4">
          <Label>Select Series</Label>
          {loadingSeries ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading series...
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {availableSeries.map((series) => (
                <Card
                  key={series.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleSeriesSelect(series.id)}
                >
                  <CardContent className="pt-6">
                    <h4 className="font-semibold">{series.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {series.member_count} {series.member_count === 1 ? "artwork" : "artworks"}
                    </p>
                  </CardContent>
                </Card>
              ))}
              <Card
                className="cursor-pointer hover:border-primary transition-colors border-dashed"
                onClick={() => handleSeriesSelect("create-new")}
              >
                <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[100px]">
                  <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Create New Series</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <StepProgress
              currentStep={getStepNumber()}
              totalSteps={getTotalSteps()}
              stepLabels={["Cover Art", "Name", "Description", "Unlock Type", newSeriesUnlockType === "threshold" ? "Config" : undefined].filter(Boolean) as string[]}
            />

            <AnimatePresence mode="wait">
              {currentStep === "cover" && (
                <motion.div
                  key="cover"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <Label className="text-base font-semibold mb-4 block">Cover Art</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose a square image that represents your series. Upload your own, choose a template, or auto-generate from your first artwork.
                    </p>
                    <CoverArtDesigner
                      value={newSeriesCoverArt}
                      onChange={setNewSeriesCoverArt}
                      onUpload={handleCoverArtUpload}
                      firstArtworkImage={formData.images?.[0]?.src || null}
                    />
                  </div>
                </motion.div>
              )}

              {currentStep === "name" && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="series-name" className="text-base font-semibold mb-4 block">
                      Series Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="series-name"
                      value={newSeriesName}
                      onChange={(e) => setNewSeriesName(e.target.value)}
                      placeholder="Enter series name"
                      className="text-lg h-12"
                      maxLength={100}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {newSeriesName.length}/100 characters
                    </p>
                  </div>
                </motion.div>
              )}

              {currentStep === "description" && (
                <motion.div
                  key="description"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="series-description" className="text-base font-semibold mb-4 block">
                      Description <span className="text-muted-foreground text-sm font-normal">(Optional)</span>
                    </Label>
                    <Textarea
                      id="series-description"
                      value={newSeriesDescription}
                      onChange={(e) => setNewSeriesDescription(e.target.value)}
                      placeholder="Tell collectors about this series..."
                      rows={6}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {newSeriesDescription.length}/500 characters
                    </p>
                  </div>
                </motion.div>
              )}

              {currentStep === "unlock" && (
                <motion.div
                  key="unlock"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <Label className="text-base font-semibold mb-4 block">Unlock Type</Label>
                    <p className="text-sm text-muted-foreground mb-6">
                      Choose how artworks in this series will be unlocked for collectors.
                    </p>
                    <UnlockTypeCards
                      value={newSeriesUnlockType}
                      onChange={setNewSeriesUnlockType}
                    />
                  </div>
                </motion.div>
              )}

              {currentStep === "config" && (
                <motion.div
                  key="config"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="required-count" className="text-base font-semibold mb-4 block">
                      Required Purchases
                    </Label>
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
                      className="text-lg h-12"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Number of artworks collectors must purchase to unlock exclusive pieces.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={currentStep === "cover" ? () => setShowCreateForm(false) : handleBack}
                disabled={creatingSeries}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {currentStep === "cover" ? "Cancel" : "Back"}
              </Button>
              <Button
                type="button"
                onClick={currentStep === "config" || (currentStep === "unlock" && newSeriesUnlockType !== "threshold") ? handleCreateSeries : handleNext}
                disabled={!canProceed() || creatingSeries}
              >
                {creatingSeries ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : currentStep === "config" || (currentStep === "unlock" && newSeriesUnlockType !== "threshold") ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Create Series
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
