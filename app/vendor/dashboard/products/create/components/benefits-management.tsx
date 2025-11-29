"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { FileText, Key, Video, Package, Percent, Eye, Plus, Edit, Trash2, Loader2, ArrowLeft, ArrowRight, Check, X } from "lucide-react"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import type { ProductBenefit } from "@/types/product-submission"
import { BenefitTypeCards } from "./benefit-type-cards"
import { BenefitsGuide } from "./benefits-guide"
import { StepProgress } from "@/app/vendor/dashboard/series/components/StepProgress"

interface BenefitsManagementProps {
  benefits: ProductBenefit[]
  onBenefitsChange: (benefits: ProductBenefit[]) => void
  seriesId?: string | null
  isEditing?: boolean
}

type WizardStep = "type" | "details" | "optional"

// Get icon based on benefit type name
const getBenefitIcon = (typeName: string) => {
  switch (typeName?.toLowerCase()) {
    case "digital content":
      return <FileText className="h-4 w-4" />
    case "exclusive access":
      return <Key className="h-4 w-4" />
    case "virtual event":
      return <Video className="h-4 w-4" />
    case "physical item":
      return <Package className="h-4 w-4" />
    case "discount":
      return <Percent className="h-4 w-4" />
    case "behind the scenes":
      return <Eye className="h-4 w-4" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

export function BenefitsManagement({
  benefits = [],
  onBenefitsChange,
  seriesId,
  isEditing = false,
}: BenefitsManagementProps) {
  const [benefitTypes, setBenefitTypes] = useState<any[]>([])
  const [loadingTypes, setLoadingTypes] = useState(true)
  const [showWizard, setShowWizard] = useState(false)
  const [showGuide, setShowGuide] = useState(benefits.length === 0)
  const [currentStep, setCurrentStep] = useState<WizardStep>("type")
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    benefitTypeId: null as number | null,
    title: "",
    description: "",
    contentUrl: "",
    accessCode: "",
    startsAt: "",
    expiresAt: "",
    isSeriesLevel: false,
  })

  useEffect(() => {
    const fetchBenefitTypes = async () => {
      try {
        setLoadingTypes(true)
        const response = await fetch("/api/benefits/types")
        if (response.ok) {
          const data = await response.json()
          setBenefitTypes(data.types || [])
        }
      } catch (error) {
        console.error("Error fetching benefit types:", error)
      } finally {
        setLoadingTypes(false)
      }
    }

    fetchBenefitTypes()
  }, [])

  const handleStartAdd = () => {
    setEditingIndex(null)
    setFormData({
      benefitTypeId: null,
      title: "",
      description: "",
      contentUrl: "",
      accessCode: "",
      startsAt: "",
      expiresAt: "",
      isSeriesLevel: false,
    })
    setCurrentStep("type")
    setShowWizard(true)
    setShowGuide(false)
  }

  const handleStartEdit = (index: number) => {
    const benefit = benefits[index]
    setEditingIndex(index)
    const formatDateForInput = (dateStr: string | null | undefined) => {
      if (!dateStr) return ""
      try {
        const date = new Date(dateStr)
        const offset = date.getTimezoneOffset()
        const localDate = new Date(date.getTime() - offset * 60 * 1000)
        return localDate.toISOString().slice(0, 16)
      } catch {
        return ""
      }
    }
    setFormData({
      benefitTypeId: benefit.benefit_type_id,
      title: benefit.title,
      description: benefit.description || "",
      contentUrl: benefit.content_url || "",
      accessCode: benefit.access_code || "",
      startsAt: formatDateForInput(benefit.starts_at),
      expiresAt: formatDateForInput(benefit.expires_at),
      isSeriesLevel: benefit.is_series_level || false,
    })
    setCurrentStep("type")
    setShowWizard(true)
  }

  const handleCancel = () => {
    setShowWizard(false)
    setCurrentStep("type")
    setEditingIndex(null)
    setFormData({
      benefitTypeId: null,
      title: "",
      description: "",
      contentUrl: "",
      accessCode: "",
      startsAt: "",
      expiresAt: "",
      isSeriesLevel: false,
    })
  }

  const handleNext = () => {
    if (currentStep === "type") {
      if (formData.benefitTypeId) {
        setCurrentStep("details")
      }
    } else if (currentStep === "details") {
      if (formData.title.trim()) {
        setCurrentStep("optional")
      }
    }
  }

  const handleBack = () => {
    if (currentStep === "details") {
      setCurrentStep("type")
    } else if (currentStep === "optional") {
      setCurrentStep("details")
    }
  }

  const handleSave = () => {
    if (!formData.benefitTypeId || !formData.title.trim()) {
      return
    }

    const newBenefit: ProductBenefit = {
      benefit_type_id: formData.benefitTypeId,
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      content_url: formData.contentUrl.trim() || undefined,
      access_code: formData.accessCode.trim() || undefined,
      starts_at: formData.startsAt || null,
      expires_at: formData.expiresAt || null,
      is_series_level: formData.isSeriesLevel && !!seriesId,
    }

    const updatedBenefits = [...benefits]
    if (editingIndex !== null) {
      updatedBenefits[editingIndex] = newBenefit
    } else {
      updatedBenefits.push(newBenefit)
    }

    onBenefitsChange(updatedBenefits)
    handleCancel()
  }

  const handleDelete = (index: number) => {
    const updatedBenefits = benefits.filter((_, i) => i !== index)
    onBenefitsChange(updatedBenefits)
  }

  const getBenefitTypeName = (benefitTypeId: number) => {
    const type = benefitTypes.find((t) => t.id === benefitTypeId)
    return type?.name || "Unknown"
  }

  const canProceed = () => {
    if (currentStep === "type") return formData.benefitTypeId !== null
    if (currentStep === "details") return formData.title.trim().length > 0
    return true
  }

  const getStepNumber = () => {
    const steps: WizardStep[] = ["type", "details", "optional"]
    return steps.indexOf(currentStep) + 1
  }

  if (showWizard) {
    return (
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-lg font-semibold">
                {editingIndex !== null ? "Edit Benefit" : "Add Benefit"}
              </h4>
              <p className="text-sm text-muted-foreground">
                {editingIndex !== null
                  ? "Update the benefit details"
                  : "Add a special perk for collectors who purchase this artwork"}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <StepProgress
            currentStep={getStepNumber()}
            totalSteps={3}
            stepLabels={["Select Type", "Basic Details", "Additional Info"]}
            onStepClick={(step) => {
              const steps: WizardStep[] = ["type", "details", "optional"]
              const targetStep = steps[step - 1]
              if (targetStep && step <= getStepNumber()) {
                setCurrentStep(targetStep)
              }
            }}
          />

          <AnimatePresence mode="wait">
            {currentStep === "type" && (
              <motion.div
                key="type"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <Label className="text-base font-semibold mb-4 block">
                    Select Benefit Type <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose the type of perk you want to offer to collectors
                  </p>
                  <BenefitTypeCards
                    benefitTypes={benefitTypes}
                    value={formData.benefitTypeId}
                    onChange={(id) => setFormData({ ...formData, benefitTypeId: id })}
                    loading={loadingTypes}
                  />
                </div>
              </motion.div>
            )}

            {currentStep === "details" && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Enter benefit title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="text-lg h-12"
                  />
                  <p className="text-xs text-muted-foreground">
                    A clear, descriptive title for this benefit
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter benefit description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Explain what collectors will receive and how to access it
                  </p>
                </div>
              </motion.div>
            )}

            {currentStep === "optional" && (
              <motion.div
                key="optional"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {seriesId && (
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                    <div className="space-y-0.5">
                      <Label htmlFor="series-level" className="text-base font-semibold">
                        Series-Level Benefit
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Apply this benefit to all artworks in the series
                      </p>
                    </div>
                    <Switch
                      id="series-level"
                      checked={formData.isSeriesLevel}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isSeriesLevel: checked })
                      }
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="content-url">Content URL</Label>
                  <Input
                    id="content-url"
                    placeholder="https://example.com/content"
                    value={formData.contentUrl}
                    onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Link to digital content, event page, or related resource
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="access-code">Access Code</Label>
                  <Input
                    id="access-code"
                    placeholder="Optional access code"
                    value={formData.accessCode}
                    onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional code collectors will need to access this benefit
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="starts-at">Starts At</Label>
                    <Input
                      id="starts-at"
                      type="datetime-local"
                      value={formData.startsAt}
                      onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expires-at">Expires At</Label>
                    <Input
                      id="expires-at"
                      type="datetime-local"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8 pt-6 border-t gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === "type" ? handleCancel : handleBack}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {currentStep === "type" ? "Cancel" : "Back"}
            </Button>
            {currentStep === "optional" ? (
              <Button
                type="button"
                onClick={handleSave}
                disabled={!formData.benefitTypeId || !formData.title.trim()}
              >
                <Check className="h-4 w-4 mr-2" />
                {editingIndex !== null ? "Update" : "Add"} Benefit
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {showGuide && benefits.length === 0 && (
        <BenefitsGuide onDismiss={() => setShowGuide(false)} />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold">Perks for Purchased Artworks</h4>
          <p className="text-xs text-muted-foreground">
            Add exclusive benefits that collectors receive when they purchase this artwork
            {seriesId && " or series"}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleStartAdd}
          disabled={loadingTypes}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Benefit
        </Button>
      </div>

      {seriesId && (
        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg border">
          <strong>Note:</strong> You can add benefits at the artwork level (specific to this artwork)
          or series level (applies to all artworks in the series). Use the toggle when creating
          benefits.
        </div>
      )}

      {benefits.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/30"
        >
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium mb-1">No benefits added yet</p>
          <p className="text-xs text-muted-foreground mb-4">
            Click "Add Benefit" to reward your collectors with exclusive perks
          </p>
          <Button type="button" variant="outline" size="sm" onClick={handleStartAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Benefit
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {getBenefitIcon(getBenefitTypeName(benefit.benefit_type_id))}
                          <Badge variant="outline" className="text-xs">
                            {getBenefitTypeName(benefit.benefit_type_id)}
                          </Badge>
                          {benefit.is_series_level && (
                            <Badge variant="secondary" className="text-xs">
                              Series
                            </Badge>
                          )}
                        </div>
                        <h5 className="font-semibold text-sm mb-1 truncate">{benefit.title}</h5>
                        {benefit.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {benefit.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleStartEdit(index)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {(benefit.starts_at || benefit.expires_at) && (
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        {benefit.starts_at && (
                          <div>Starts: {format(new Date(benefit.starts_at), "MMM d, yyyy")}</div>
                        )}
                        {benefit.expires_at && (
                          <div>Expires: {format(new Date(benefit.expires_at), "MMM d, yyyy")}</div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
