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
      case "hidden series":
        return <Lock className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
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
  const canSave = formData.benefitTypeId !== null && formData.title.trim().length > 0

  // Live Preview Component
  const LivePreview = () => {
    if (!formData.benefitTypeId && !formData.title) return null

    return (
      <Card className="bg-muted/30 border-2 border-dashed">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {formData.benefitTypeId && getBenefitIcon(getBenefitTypeName(formData.benefitTypeId))}
                {formData.benefitTypeId && (
                  <Badge variant="outline" className="text-xs">
                    {getBenefitTypeName(formData.benefitTypeId)}
                  </Badge>
                )}
                {formData.isSeriesLevel && seriesId && (
                  <Badge variant="secondary" className="text-xs">
                    Series
                  </Badge>
                )}
                {formData.hiddenSeriesId && (
                  <Badge variant="default" className="text-xs">
                    Hidden Series
                  </Badge>
                )}
              </div>
              <h5 className="font-semibold text-sm mb-1">
                {formData.title || "Benefit title..."}
              </h5>
              {formData.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {formData.description}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (showForm) {
    return (
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-lg font-semibold">
                {editingIndex !== null ? "Edit Benefit" : "Add Hidden Treasure"}
              </h4>
              <p className="text-sm text-muted-foreground">
                Share something special with collectors who purchase this artwork
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Benefit Type Selection */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                What are you sharing? <span className="text-red-500">*</span>
              </Label>
              <BenefitTypeCards
                benefitTypes={benefitTypes}
                value={formData.benefitTypeId}
                onChange={(id) => {
                  setFormData({ ...formData, benefitTypeId: id, hiddenSeriesId: null })
                }}
                loading={loadingTypes}
              />
            </div>

            {/* Title - Always visible */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base font-semibold">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., Process Video, Artist Commentary, Hidden Series Access"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="text-lg h-12"
              />
            </div>

            {/* Hidden Series Selector - Conditional */}
            {isHiddenSeriesType && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2"
              >
                <Label htmlFor="hidden-series" className="text-base font-semibold">
                  Select Hidden Series <span className="text-red-500">*</span>
                </Label>
                {loadingSeries ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading series...
                  </div>
                ) : (
                  <Select
                    value={formData.hiddenSeriesId || ""}
                    onValueChange={(value) => setFormData({ ...formData, hiddenSeriesId: value })}
                  >
                    <SelectTrigger id="hidden-series" className="h-12">
                      <SelectValue placeholder="Choose a series to unlock" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSeries.length === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground text-center">
                          No series available. Create a series first.
                        </div>
                      ) : (
                        availableSeries.map((series) => (
                          <SelectItem key={series.id} value={series.id}>
                            {series.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground">
                  This series will only be accessible to collectors who purchase this artwork
                </p>
              </motion.div>
            )}

            {/* Series Level Toggle - If series exists */}
            {seriesId && (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="space-y-0.5">
                  <Label htmlFor="series-level" className="text-sm font-semibold">
                    Apply to all artworks in series
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    This benefit will be available for all artworks in "{seriesId}"
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

            {/* Live Preview */}
            <LivePreview />

            {/* Collapsible: Description */}
            <Collapsible open={showDescription} onOpenChange={setShowDescription}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-between p-3 h-auto"
                >
                  <span className="text-sm font-medium">
                    {showDescription ? "Hide" : "Add"} Description
                  </span>
                  {showDescription ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2">
                <Textarea
                  placeholder="Briefly describe what collectors will receive..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.description.length}/200
                </p>
              </CollapsibleContent>
            </Collapsible>

            {/* Collapsible: Link or Code */}
            <Collapsible open={showLinkCode} onOpenChange={setShowLinkCode}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-between p-3 h-auto"
                >
                  <span className="text-sm font-medium">
                    {showLinkCode ? "Hide" : "Add"} Link or Access Code
                  </span>
                  {showLinkCode ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="content-url">Content URL</Label>
                  <Input
                    id="content-url"
                    placeholder="https://..."
                    value={formData.contentUrl}
                    onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="access-code">Access Code</Label>
                  <Input
                    id="access-code"
                    placeholder="Optional code"
                    value={formData.accessCode}
                    onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Collapsible: Schedule */}
            <Collapsible open={showSchedule} onOpenChange={setShowSchedule}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-between p-3 h-auto"
                >
                  <span className="text-sm font-medium">
                    {showSchedule ? "Hide" : "Add"} Schedule
                  </span>
                  {showSchedule ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4">
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
              </CollapsibleContent>
            </Collapsible>

            {/* Save Button */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={!canSave || (isHiddenSeriesType && !formData.hiddenSeriesId)}
              >
                {editingIndex !== null ? "Update" : "Add"} Benefit
              </Button>
            </div>
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
