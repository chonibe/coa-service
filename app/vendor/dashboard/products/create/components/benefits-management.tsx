"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileText, Key, Video, Package, Percent, Eye, Plus, Edit, Trash2, Loader2 } from "lucide-react"
import { format } from "date-fns"
import type { ProductBenefit } from "@/types/product-submission"

interface BenefitsManagementProps {
  benefits: ProductBenefit[]
  onBenefitsChange: (benefits: ProductBenefit[]) => void
  seriesId?: string | null
  isEditing?: boolean
}

// Get icon based on benefit type
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
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    benefitTypeId: "",
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

  const handleOpenDialog = (index?: number) => {
    if (index !== undefined && index !== null) {
      const benefit = benefits[index]
      setEditingIndex(index)
      setFormData({
        benefitTypeId: benefit.benefit_type_id.toString(),
        title: benefit.title,
        description: benefit.description || "",
        contentUrl: benefit.content_url || "",
        accessCode: benefit.access_code || "",
        startsAt: benefit.starts_at ? new Date(benefit.starts_at).toISOString().slice(0, 16) : "",
        expiresAt: benefit.expires_at ? new Date(benefit.expires_at).toISOString().slice(0, 16) : "",
        isSeriesLevel: benefit.is_series_level || false,
      })
    } else {
      setEditingIndex(null)
      setFormData({
        benefitTypeId: "",
        title: "",
        description: "",
        contentUrl: "",
        accessCode: "",
        startsAt: "",
        expiresAt: "",
        isSeriesLevel: false,
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingIndex(null)
    setFormData({
      benefitTypeId: "",
      title: "",
      description: "",
      contentUrl: "",
      accessCode: "",
      startsAt: "",
      expiresAt: "",
      isSeriesLevel: false,
    })
  }

  const handleSubmit = () => {
    if (!formData.benefitTypeId || !formData.title) {
      return
    }

    const benefitType = benefitTypes.find((t) => t.id.toString() === formData.benefitTypeId)
    const newBenefit: ProductBenefit = {
      benefit_type_id: parseInt(formData.benefitTypeId),
      title: formData.title,
      description: formData.description || undefined,
      content_url: formData.contentUrl || undefined,
      access_code: formData.accessCode || undefined,
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
    handleCloseDialog()
  }

  const handleDelete = (index: number) => {
    const updatedBenefits = benefits.filter((_, i) => i !== index)
    onBenefitsChange(updatedBenefits)
  }

  const getBenefitTypeName = (benefitTypeId: number) => {
    const type = benefitTypes.find((t) => t.id === benefitTypeId)
    return type?.name || "Unknown"
  }

  return (
    <div className="space-y-4">
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
          onClick={() => handleOpenDialog()}
          disabled={loadingTypes}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Benefit
        </Button>
      </div>

      {seriesId && (
        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
          <strong>Note:</strong> You can add benefits at the artwork level (specific to this artwork) or series level
          (applies to all artworks in the series). Use the toggle when creating/editing benefits.
        </div>
      )}

      {benefits.length === 0 ? (
        <div className="text-center py-8 border rounded-md bg-muted/30">
          <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No benefits added yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click "Add Benefit" to reward your collectors with exclusive perks
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {benefits.map((benefit, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="p-3 pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
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
                    <CardTitle className="text-sm font-semibold">{benefit.title}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleOpenDialog(index)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => handleDelete(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                {benefit.description && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{benefit.description}</p>
                )}
                {(benefit.starts_at || benefit.expires_at) && (
                  <div className="text-xs text-muted-foreground">
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
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? "Edit Benefit" : "Add Benefit"}</DialogTitle>
            <DialogDescription>
              {editingIndex !== null
                ? "Update the benefit details"
                : "Add a special perk for collectors who purchase this artwork"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {seriesId && (
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="space-y-0.5">
                  <Label htmlFor="series-level">Series-Level Benefit</Label>
                  <p className="text-xs text-muted-foreground">
                    Apply this benefit to all artworks in the series
                  </p>
                </div>
                <Switch
                  id="series-level"
                  checked={formData.isSeriesLevel}
                  onCheckedChange={(checked) => setFormData({ ...formData, isSeriesLevel: checked })}
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="benefit-type">
                Benefit Type <span className="text-red-500">*</span>
              </Label>
              {loadingTypes ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading types...
                </div>
              ) : (
                <Select
                  value={formData.benefitTypeId}
                  onValueChange={(value) => setFormData({ ...formData, benefitTypeId: value })}
                >
                  <SelectTrigger id="benefit-type">
                    <SelectValue placeholder="Select a benefit type" />
                  </SelectTrigger>
                  <SelectContent>
                    {benefitTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        <div className="flex items-center">
                          {getBenefitIcon(type.name)}
                          <span className="ml-2">{type.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Enter benefit title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter benefit description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid gap-2">
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

            <div className="grid gap-2">
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
              <div className="grid gap-2">
                <Label htmlFor="starts-at">Starts At</Label>
                <Input
                  id="starts-at"
                  type="datetime-local"
                  value={formData.startsAt}
                  onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="expires-at">Expires At</Label>
                <Input
                  id="expires-at"
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!formData.benefitTypeId || !formData.title}
            >
              {editingIndex !== null ? "Update" : "Add"} Benefit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

