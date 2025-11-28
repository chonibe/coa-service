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

type Step = "cover" | "name" | "description" | "unlock" | "config" | "time_config" | "vip_config"

export default function CreateSeriesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState<Step>("cover")
  const [creatingSeries, setCreatingSeries] = useState(false)

  // Form state
  const [coverArt, setCoverArt] = useState<string | null>(null)
  const [coverArtFile, setCoverArtFile] = useState<File | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [unlockType, setUnlockType] = useState<UnlockType>("any_purchase")
  const [unlockConfig, setUnlockConfig] = useState<any>({})
  const [requiredCount, setRequiredCount] = useState<number>(1)

  const getStepNumber = () => {
    const steps: Step[] = ["cover", "name", "description", "unlock", "config", "time_config", "vip_config"]
    return steps.indexOf(currentStep) + 1
  }

  const getTotalSteps = () => {
    if (["threshold", "time_based", "vip"].includes(unlockType)) {
      return 5
    }
    return 4
  }

  const handleNext = () => {
    if (currentStep === "cover") {
      setCurrentStep("name")
    } else if (currentStep === "name") {
      setCurrentStep("description")
    } else if (currentStep === "description") {
      setCurrentStep("unlock")
    } else if (currentStep === "unlock") {
      if (unlockType === "threshold") {
        setCurrentStep("config")
      } else if (unlockType === "time_based") {
        setCurrentStep("time_config")
      } else if (unlockType === "vip") {
        setCurrentStep("vip_config")
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
    } else if (currentStep === "config" || currentStep === "time_config" || currentStep === "vip_config") {
      setCurrentStep("unlock")
    }
  }

  const canProceed = () => {
    if (currentStep === "cover") return true
    if (currentStep === "name") return name.trim().length > 0
    if (currentStep === "description") return true
    if (currentStep === "unlock") return true
    if (currentStep === "config") return requiredCount > 0
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
            currentStep={getStepNumber()}
            totalSteps={getTotalSteps()}
            stepLabels={[
              "Cover Art",
              "Name",
              "Description",
              "Unlock Type",
              unlockType === "threshold"
                ? "Config"
                : unlockType === "time_based"
                  ? "Time Config"
                  : unlockType === "vip"
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
                    Choose a square image that represents your series. Upload your own, choose a template, or skip for now.
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
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter series name"
                    className="text-lg h-12"
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {name.length}/100 characters
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
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell collectors about this series..."
                    rows={6}
                    className="resize-none"
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {description.length}/1000 characters
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
                  <UnlockTypeCards value={unlockType} onChange={setUnlockType} />
                </div>
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
                    onChange={(e) => setRequiredCount(parseInt(e.target.value, 10) || 1)}
                    className="text-lg h-12"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Number of purchases required to unlock artworks in this series
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8 pt-6 border-t gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === "cover" ? () => router.back() : handleBack}
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
                  !["threshold", "time_based", "vip"].includes(unlockType))
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
                  !["threshold", "time_based", "vip"].includes(unlockType)) ? (
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

