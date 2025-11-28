"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, ArrowRight, Check } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import type { UnlockType } from "@/types/artwork-series"
import { CoverArtDesigner } from "../components/CoverArtDesigner"
import { UnlockTypeCards } from "../components/UnlockTypeCards"
import { StepProgress } from "../components/StepProgress"
import { UnlockGuide } from "../components/UnlockGuide"
import { TimeBasedUnlockConfig } from "../components/TimeBasedUnlockConfig"
import { VIPUnlockConfig } from "../components/VIPUnlockConfig"

type Step = "basics" | "unlock" | "config"

export default function CreateSeriesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState<Step>("basics")
  const [creatingSeries, setCreatingSeries] = useState(false)

  // Form state
  const [coverArt, setCoverArt] = useState<string | null>(null)
  const [coverArtFile, setCoverArtFile] = useState<File | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [unlockType, setUnlockType] = useState<UnlockType>("any_purchase")
  const [unlockConfig, setUnlockConfig] = useState<any>({})
  const [requiredCount, setRequiredCount] = useState<number>(1)

  const needsConfigStep = ["threshold", "time_based", "vip"].includes(unlockType)

  const handleNext = () => {
    if (currentStep === "basics") {
      setCurrentStep("unlock")
    } else if (currentStep === "unlock") {
      // For threshold, config is shown inline, so we can create
      if (unlockType === "threshold") {
        handleCreateSeries()
      } else if (needsConfigStep) {
        setCurrentStep("config")
      } else {
        handleCreateSeries()
      }
    }
  }

  const handleBack = () => {
    if (currentStep === "unlock") {
      setCurrentStep("basics")
    } else if (currentStep === "config") {
      setCurrentStep("unlock")
    }
  }

  const canProceed = () => {
    if (currentStep === "basics") return name.trim().length > 0
    if (currentStep === "unlock") return true
    if (currentStep === "config") {
      if (unlockType === "threshold") return requiredCount > 0
      return true
    }
    return true
  }

  const handleCoverArtUpload = async (file: File): Promise<string> => {
    setCoverArtFile(file)
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
    if (!name.trim()) {
      return
    }

    setCreatingSeries(true)
    try {
      const config: any = { ...unlockConfig }
      if (unlockType === "threshold") {
        config.required_count = requiredCount
        config.unlocks = config.unlocks || []
      }

      const response = await fetch("/api/vendor/series", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          thumbnail_url: coverArt || undefined,
          unlock_type: unlockType,
          unlock_config: config,
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
        await uploadCoverArtAfterCreation(createdSeriesId, coverArtFile)
      }

      toast({
        title: "Success",
        description: "Series created successfully",
      })

      router.push(`/vendor/dashboard/series/${createdSeriesId}`)
    } catch (error: any) {
      console.error("Error creating series:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create series",
      })
    } finally {
      setCreatingSeries(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Series</h1>
          <p className="text-muted-foreground mt-1">
            Set up a new unlockable series for your artworks
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <StepProgress
            currentStep={currentStep === "basics" ? 1 : currentStep === "unlock" ? 2 : 3}
            totalSteps={needsConfigStep ? 3 : 2}
            stepLabels={[
              "Series Info",
              "Unlock Type",
              unlockType === "threshold"
                ? "VIP Settings"
                : unlockType === "time_based"
                  ? "Schedule"
                  : unlockType === "vip"
                    ? "VIP Settings"
                    : undefined,
            ].filter(Boolean) as string[]}
            onStepClick={(step) => {
              if (step === 1) setCurrentStep("basics")
              else if (step === 2) setCurrentStep("unlock")
              else if (step === 3 && needsConfigStep) setCurrentStep("config")
            }}
          />

          <AnimatePresence mode="wait">
            {currentStep === "basics" && (
              <motion.div
                key="basics"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <Label htmlFor="series-name" className="text-base font-semibold mb-2 block">
                    Series Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="series-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., 'Summer Collection 2024'"
                    className="text-lg h-12"
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {name.length}/100 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="series-description" className="text-base font-semibold mb-2 block">
                    Description <span className="text-muted-foreground text-sm font-normal">(Optional)</span>
                  </Label>
                  <Textarea
                    id="series-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What makes this series special?"
                    rows={4}
                    className="resize-none"
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {description.length}/1000 characters
                  </p>
                </div>

                <div>
                  <Label className="text-base font-semibold mb-2 block">
                    Cover Art <span className="text-muted-foreground text-sm font-normal">(Optional)</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    A square image that represents your series. You can add this later.
                  </p>
                  <CoverArtDesigner
                    value={coverArt}
                    onChange={setCoverArt}
                    onUpload={handleCoverArtUpload}
                    firstArtworkImage={null}
                  />
                </div>
              </motion.div>
            )}

            {currentStep === "unlock" && (
              <motion.div
                key="unlock"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <Label className="text-base font-semibold mb-4 block">How do artworks unlock?</Label>
                  <UnlockTypeCards value={unlockType} onChange={setUnlockType} />
                </div>

                {/* Inline config for threshold (simple case) */}
                {unlockType === "threshold" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-4 border-t space-y-4"
                  >
                    <Label htmlFor="required-count" className="text-base font-semibold mb-2 block">
                      How many purchases unlock exclusive pieces?
                    </Label>
                    <Input
                      id="required-count"
                      type="number"
                      min="1"
                      value={requiredCount}
                      onChange={(e) => {
                        const count = parseInt(e.target.value, 10) || 1
                        setRequiredCount(count)
                        setUnlockConfig({ required_count: count, unlocks: [] })
                      }}
                      className="text-lg h-12 max-w-[200px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Collectors need to purchase {requiredCount} {requiredCount === 1 ? "artwork" : "artworks"} to unlock exclusive pieces
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {currentStep === "config" && unlockType === "threshold" && (
              <motion.div
                key="config"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="required-count" className="text-base font-semibold mb-4 block">
                    Required Purchases <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="required-count"
                    type="number"
                    min="1"
                    value={requiredCount}
                    onChange={(e) => {
                      const count = parseInt(e.target.value, 10) || 1
                      setRequiredCount(count)
                      setUnlockConfig({ required_count: count, unlocks: [] })
                    }}
                    className="text-lg h-12"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Number of purchases required to unlock artworks in this series
                  </p>
                </div>
              </motion.div>
            )}

            {currentStep === "config" && unlockType === "time_based" && (
              <motion.div
                key="time_config"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <TimeBasedUnlockConfig
                  value={unlockConfig}
                  onChange={setUnlockConfig}
                />
              </motion.div>
            )}

            {currentStep === "config" && unlockType === "vip" && (
              <motion.div
                key="vip_config"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <VIPUnlockConfig
                  value={unlockConfig}
                  onChange={setUnlockConfig}
                  seriesMembers={[]}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8 pt-6 border-t gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === "basics" ? () => router.back() : handleBack}
              disabled={creatingSeries}
              className="min-w-[120px]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {currentStep === "basics" ? "Cancel" : "Back"}
            </Button>
            <Button
              type="button"
              onClick={
                currentStep === "config" ||
                (currentStep === "unlock" && (unlockType === "threshold" || !needsConfigStep))
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
                (currentStep === "unlock" && (unlockType === "threshold" || !needsConfigStep)) ? (
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
    </div>
  )
}

