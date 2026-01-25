"use client"

import { useState, useEffect } from "react"







import { Loader2, Lock, Plus, Info, X, ArrowRight, ArrowLeft, Check, Crown, Clock, Radio } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { ProductSubmissionData } from "@/types/product-submission"
import type { UnlockType } from "@/types/artwork-series"
import { CoverArtUpload } from "@/app/vendor/dashboard/series/components/CoverArtUpload"
import { CoverArtDesigner } from "@/app/vendor/dashboard/series/components/CoverArtDesigner"
import { UnlockTypeCards } from "@/app/vendor/dashboard/series/components/UnlockTypeCards"
import { StepProgress } from "@/app/vendor/dashboard/series/components/StepProgress"
import { UnlockGuide } from "@/app/vendor/dashboard/series/components/UnlockGuide"
import { TimeBasedUnlockConfig } from "@/app/vendor/dashboard/series/components/TimeBasedUnlockConfig"
import { VIPUnlockConfig } from "@/app/vendor/dashboard/series/components/VIPUnlockConfig"
import { BenefitsManagement } from "./benefits-management"

import { Label, Input, Textarea, Button, Card, CardContent, Switch, Alert, AlertDescription } from "@/components/ui"
interface SeriesStepProps {
  formData: ProductSubmissionData
  setFormData: (data: ProductSubmissionData) => void
}

type Step = "cover" | "name" | "description" | "unlock" | "config" | "time_config" | "vip_config"

export function SeriesStep({ formData, setFormData }: SeriesStepProps) {
  const [availableSeries, setAvailableSeries] = useState<Array<{ id: string; name: string; member_count: number; unlock_type?: string }>>([])
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
      const unlockConfig: any = { ...newSeriesUnlockConfig }
      if (newSeriesUnlockType === "threshold") {
        unlockConfig.required_count = newSeriesRequiredCount
        unlockConfig.unlocks = unlockConfig.unlocks || []
      } else if (newSeriesUnlockType === "sequential") {
        unlockConfig.order = unlockConfig.order || []
      } else if (newSeriesUnlockType === "time_based") {
        // Time-based config is already set via TimeBasedUnlockConfig component
        // Ensure it has either unlock_at or unlock_schedule
      } else if (newSeriesUnlockType === "vip") {
        // VIP config is already set via VIPUnlockConfig component
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
        unlock_order: undefined,
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
      } else if (newSeriesUnlockType === "time_based") {
        setCurrentStep("time_config")
      } else if (newSeriesUnlockType === "vip") {
        setCurrentStep("vip_config")
      } else {
        handleCreateSeries()
      }
    } else if (currentStep === "config" || currentStep === "time_config" || currentStep === "vip_config") {
      handleCreateSeries()
    }
  }

  const handleBack = () => {
    if (currentStep === "name") {
      setCurrentStep("cover")
    } else if (currentStep === "description") {
      setCurrentStep("name")
    } else if (currentStep === "unlock") {
      setCurrentStep("description")
    } else if (currentStep === "config" || currentStep === "time_config" || currentStep === "vip_config") {
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
    if (newSeriesUnlockType === "threshold" || newSeriesUnlockType === "time_based" || newSeriesUnlockType === "vip") {
      return 5
    }
    return 4
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

        {/* Benefits Management */}
        <Card>
          <CardContent className="pt-6">
            <BenefitsManagement
              benefits={formData.benefits || []}
              onBenefitsChange={(benefits) => setFormData({ ...formData, benefits })}
              seriesId={formData.series_id}
            />
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
      ) : (
        <Card>
          <CardContent className="pt-6">
            <StepProgress
              currentStep={getStepNumber()}
              totalSteps={getTotalSteps()}
              stepLabels={[
                "Cover Art",
                "Name",
                "Description",
                "Unlock Type",
                newSeriesUnlockType === "threshold"
                  ? "Config"
                  : newSeriesUnlockType === "time_based"
                    ? "Time Config"
                    : newSeriesUnlockType === "vip"
                      ? "VIP Config"
                      : undefined,
              ].filter(Boolean) as string[]}
              onStepClick={(step) => {
                const steps: Step[] = ["cover", "name", "description", "unlock", "config", "time_config", "vip_config"]
                const targetStep = steps[step - 1]
                if (targetStep) {
                  setCurrentStep(targetStep)
                }
              }}
            />

            {/* Show UnlockGuide on first unlock step */}
            {currentStep === "unlock" && <UnlockGuide />}

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
                    <Label className="text-base font-semibold mb-4 block">How do artworks unlock?</Label>
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

              {currentStep === "time_config" && (
                <motion.div
                  key="time_config"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <TimeBasedUnlockConfig
                    value={newSeriesUnlockConfig}
                    onChange={setNewSeriesUnlockConfig}
                  />
                </motion.div>
              )}

              {currentStep === "vip_config" && (
                <motion.div
                  key="vip_config"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <VIPUnlockConfig
                    value={newSeriesUnlockConfig}
                    onChange={setNewSeriesUnlockConfig}
                    seriesMembers={[]}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between mt-8 pt-6 border-t gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={currentStep === "cover" ? () => setShowCreateForm(false) : handleBack}
                disabled={creatingSeries}
                className="min-w-[120px]"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {currentStep === "cover" ? "Cancel" : "Back"}
              </Button>
              <Button
                type="button"
                onClick={
                  currentStep === "config" ||
                  currentStep === "time_config" ||
                  currentStep === "vip_config" ||
                  (currentStep === "unlock" &&
                    !["threshold", "time_based", "vip"].includes(newSeriesUnlockType))
                    ? handleCreateSeries
                    : handleNext
                }
                disabled={!canProceed() || creatingSeries}
                className="min-w-[140px] flex-1 max-w-[200px]"
                size="lg"
              >
                {creatingSeries ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : currentStep === "config" ||
                  currentStep === "time_config" ||
                  currentStep === "vip_config" ||
                  (currentStep === "unlock" &&
                    !["threshold", "time_based", "vip"].includes(newSeriesUnlockType)) ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Create Series
                  </>
                ) : (
                  <>
                    Continue
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
