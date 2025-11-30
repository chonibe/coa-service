"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { FileText, Key, Video, Package, Percent, Eye, Plus, Edit, Trash2, X, ChevronDown, ChevronUp, Lock, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import type { ProductBenefit } from "@/types/product-submission"
import { BenefitTypeCards } from "./benefit-type-cards"
import { BenefitsGuide } from "./benefits-guide"
import { HiddenSeriesForm } from "./benefits/hidden-series-form"
import { BehindScenesForm } from "./benefits/behind-scenes-form"
import { DigitalContentForm } from "./benefits/digital-content-form"
import { ArtistCommentaryForm } from "./benefits/artist-commentary-form"
import { VIPUnlockForm } from "./benefits/vip-unlock-form"
import { EarlyDropAccessForm } from "./benefits/early-drop-access-form"

interface BenefitsManagementProps {
  benefits: ProductBenefit[]
  onBenefitsChange: (benefits: ProductBenefit[]) => void
  seriesId?: string | null
  isEditing?: boolean
}

export function BenefitsManagement({
  benefits = [],
  onBenefitsChange,
  seriesId,
  isEditing = false,
}: BenefitsManagementProps) {
  const [benefitTypes, setBenefitTypes] = useState<any[]>([])
  const [availableSeries, setAvailableSeries] = useState<Array<{ id: string; name: string }>>([])
  const [loadingTypes, setLoadingTypes] = useState(true)
  const [loadingSeries, setLoadingSeries] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showGuide, setShowGuide] = useState(benefits.length === 0)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  
  // Collapsible sections state
  const [showDescription, setShowDescription] = useState(false)
  const [showLinkCode, setShowLinkCode] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  
  // Icon mapping to ensure all icons are bundled
  const iconMap = {
    FileText,
    Key,
    Video,
    Package,
    Percent,
    Eye,
    Lock,
  }

  // Get icon based on benefit type name
  const getBenefitIcon = (typeName: string) => {
    const IconComponent = (() => {
      const lowerName = typeName?.toLowerCase() || ""
      if (lowerName.includes("digital") || lowerName.includes("content")) {
        return iconMap.FileText
      }
      if (lowerName.includes("behind") || lowerName.includes("scenes")) {
        return iconMap.Eye
      }
      if (lowerName.includes("hidden") && lowerName.includes("series")) {
        return iconMap.Lock
      }
      if (lowerName.includes("vip") && lowerName.includes("artwork")) {
        return iconMap.Lock // Using Lock for VIP, could add Crown icon later
      }
      if (lowerName.includes("credits") || lowerName.includes("bonus")) {
        return iconMap.FileText // Using FileText for credits, could add Coins icon later
      }
      if (lowerName.includes("early") && lowerName.includes("drop")) {
        return iconMap.Key // Using Key for early drop
      }
      if (lowerName.includes("exclusive") && lowerName.includes("visibility")) {
        return iconMap.Eye
      }
      return iconMap.FileText
    })()
    return <IconComponent className="h-4 w-4" />
  }
  
  const [formData, setFormData] = useState({
    benefitTypeId: null as number | null,
    title: "",
    description: "",
    contentUrl: "",
    accessCode: "",
    startsAt: "",
    expiresAt: "",
    isSeriesLevel: false,
    hiddenSeriesId: null as string | null,
  })

  useEffect(() => {
    const fetchBenefitTypes = async () => {
      try {
        setLoadingTypes(true)
        
        // First, ensure benefit types are up to date
        try {
          await fetch("/api/benefits/update-types", { method: "POST" })
        } catch (error) {
          // Silently fail - types might already be updated
          console.log("Benefit types update skipped or already up to date")
        }
        
        // Then fetch the updated types
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

  useEffect(() => {
    // Fetch available series for hidden series selector
    const fetchSeries = async () => {
      try {
        setLoadingSeries(true)
        const response = await fetch("/api/vendor/series/available", {
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          setAvailableSeries(data.series || [])
        }
      } catch (error) {
        console.error("Error fetching series:", error)
      } finally {
        setLoadingSeries(false)
      }
    }

    if (showForm) {
      fetchSeries()
    }
  }, [showForm])

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
      hiddenSeriesId: null,
    })
    setShowDescription(false)
    setShowLinkCode(false)
    setShowSchedule(false)
    setShowForm(true)
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
      hiddenSeriesId: (benefit as any).hidden_series_id || null,
      vipArtworkId: (benefit as any).vip_artwork_id || null,
      vipSeriesId: (benefit as any).vip_series_id || null,
      creditsAmount: (benefit as any).credits_amount || null,
      dropDate: formatDateForInput((benefit as any).drop_date),
    })
    setShowDescription(!!benefit.description)
    setShowLinkCode(!!(benefit.content_url || benefit.access_code))
    setShowSchedule(!!(benefit.starts_at || benefit.expires_at))
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
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
      hiddenSeriesId: null,
      vipArtworkId: null,
      vipSeriesId: null,
      creditsAmount: null,
      dropDate: null,
    })
    setShowDescription(false)
    setShowLinkCode(false)
    setShowSchedule(false)
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
      ...(formData.hiddenSeriesId && { hidden_series_id: formData.hiddenSeriesId }),
      ...(formData.vipArtworkId && { vip_artwork_id: formData.vipArtworkId }),
      ...(formData.vipSeriesId && { vip_series_id: formData.vipSeriesId }),
      ...(formData.creditsAmount && { credits_amount: formData.creditsAmount }),
      ...(formData.dropDate && { drop_date: formData.dropDate }),
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

  const selectedBenefitType = benefitTypes.find((t) => t.id === formData.benefitTypeId)
  const isHiddenSeriesType = selectedBenefitType?.name?.toLowerCase().includes("hidden series")
  
  // Validation: Check if form can be saved based on type-specific requirements
  const canSave = () => {
    if (!formData.benefitTypeId || !formData.title.trim()) {
      return false
    }
    // Hidden Series requires a series to be selected
    if (isHiddenSeriesType && !formData.hiddenSeriesId) {
      return false
    }
    return true
  }

  // Get type-specific form component
  const getTypeSpecificForm = () => {
    if (!selectedBenefitType) return null

    const typeName = selectedBenefitType.name.toLowerCase()
    const commonProps = {
      formData: {
        title: formData.title,
        description: formData.description,
        contentUrl: formData.contentUrl,
        accessCode: formData.accessCode,
        startsAt: formData.startsAt,
        expiresAt: formData.expiresAt,
        hiddenSeriesId: formData.hiddenSeriesId,
        vipArtworkId: formData.vipArtworkId,
        vipSeriesId: formData.vipSeriesId,
        creditsAmount: formData.creditsAmount,
        dropDate: formData.dropDate,
      },
      setFormData: (data: any) => {
        // Merge the new data with existing formData
        setFormData((prev: any) => ({
          ...prev,
          ...data,
        }))
      },
      seriesId,
    }

    if (typeName.includes("hidden series")) {
      return <HiddenSeriesForm {...commonProps} />
    }
    if (typeName.includes("behind") || typeName.includes("scenes")) {
      return <BehindScenesForm {...commonProps} />
    }
    if (typeName.includes("digital") || typeName.includes("content")) {
      return <DigitalContentForm {...commonProps} />
    }
    if (typeName.includes("commentary") || typeName.includes("artist")) {
      return <ArtistCommentaryForm {...commonProps} />
    }
    if (typeName.includes("vip")) {
      return <VIPUnlockForm {...commonProps} />
    }
    if (typeName.includes("early") && typeName.includes("drop")) {
      return <EarlyDropAccessForm {...commonProps} />
    }

    // Default fallback - use digital content form
    return <DigitalContentForm {...commonProps} />
  }

  if (showForm) {
    return (
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div>
                <h4 className="text-lg font-semibold">
                  {editingIndex !== null ? "Edit Benefit" : "Create Hidden Treasure"}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {formData.benefitTypeId 
                    ? `Design the ${selectedBenefitType?.name.toLowerCase()} experience for collectors`
                    : "Share something special with collectors who purchase this artwork"}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Benefit Type Selection */}
            {!formData.benefitTypeId ? (
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  What are you sharing? <span className="text-red-500">*</span>
                </Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose the type of hidden treasure you want to create for collectors
                </p>
                <BenefitTypeCards
                  benefitTypes={benefitTypes}
                  value={formData.benefitTypeId}
                  onChange={(id) => {
                    setFormData({ 
                      ...formData, 
                      benefitTypeId: id, 
                      hiddenSeriesId: null,
                      title: "",
                      description: "",
                      contentUrl: "",
                      accessCode: "",
                      startsAt: "",
                      expiresAt: "",
                    })
                  }}
                  loading={loadingTypes}
                />
              </div>
            ) : (
              <>
                {/* Show selected type with option to change */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    {getBenefitIcon(getBenefitTypeName(formData.benefitTypeId))}
                    <div>
                      <p className="font-semibold">{selectedBenefitType?.name}</p>
                      <p className="text-xs text-muted-foreground">Selected benefit type</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFormData({ 
                        ...formData, 
                        benefitTypeId: null,
                        title: "",
                        description: "",
                        contentUrl: "",
                        accessCode: "",
                        startsAt: "",
                        expiresAt: "",
                        hiddenSeriesId: null,
                      })
                    }}
                  >
                    Change Type
                  </Button>
                </div>

                {/* Type-Specific Form */}
                <motion.div
                  key={formData.benefitTypeId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {getTypeSpecificForm()}
                </motion.div>

                {/* Series Level Toggle - If series exists */}
                {seriesId && (
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                    <div className="space-y-0.5">
                      <Label htmlFor="series-level" className="text-sm font-semibold">
                        Apply to all artworks in series
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        This benefit will be available for all artworks in the series
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

                {/* Save Button with Achievement Style */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-end gap-3 pt-4 border-t"
                >
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={!canSave()}
                      className="bg-gradient-to-r from-primary to-primary/80"
                    >
                      {editingIndex !== null ? "Update" : "Create"} Treasure
                    </Button>
                  </motion.div>
                </motion.div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">

      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold">Hidden Treasures</h4>
          <p className="text-xs text-muted-foreground">
            Share exclusive content, knowledge, or access with collectors
            {seriesId && " — apply to artwork or series"}
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
          Add Treasure
        </Button>
      </div>

      {benefits.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/30"
        >
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium mb-1">No hidden treasures yet</p>
          <p className="text-xs text-muted-foreground mb-4">
            Share process videos, artist commentary, or unlock hidden series
          </p>
          <Button type="button" variant="outline" size="sm" onClick={handleStartAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Treasure
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
                          {(benefit as any).hidden_series_id && (
                            <Badge variant="default" className="text-xs">
                              Hidden Series
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
