"use client"

import { useState, useEffect } from "react"






import { Separator } from "@/components/ui/separator"


import { Loader2, Save, X, Plus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { ProductSubmissionData, ProductCreationFields } from "@/types/product-submission"
import { BasicInfoStep } from "./basic-info-step"
import { ImagesStep } from "./images-step"
import { VariantsStep } from "./variants-step"
import { PrintFilesStep } from "./print-files-step"
import { SeriesStep } from "./series-step"

import { Card, CardContent, CardHeader, CardTitle, Button, Label, Input, Textarea, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Alert, AlertDescription } from "@/components/ui"
interface ShopifyStyleFormProps {
  initialData?: ProductSubmissionData
  submissionId?: string
  onComplete: () => void
  onCancel: () => void
}

export function ShopifyStyleArtworkForm({
  initialData,
  submissionId,
  onComplete,
  onCancel,
}: ShopifyStyleFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [fieldsConfig, setFieldsConfig] = useState<ProductCreationFields | null>(null)
  const [loadingFields, setLoadingFields] = useState(true)
  const [maskSaved, setMaskSaved] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")

  const [formData, setFormData] = useState<ProductSubmissionData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    product_type: initialData?.product_type || "Art Prints",
    vendor: "",
    handle: initialData?.handle || "",
    tags: initialData?.tags || [],
    variants: initialData?.variants || [
      {
        price: "",
        sku: "",
        requires_shipping: true,
      },
    ],
    images: initialData?.images || [],
    metafields: initialData?.metafields || [],
  })

  // Fetch field configuration
  useEffect(() => {
    const fetchFields = async () => {
      try {
        const response = await fetch("/api/vendor/products/create/fields", {
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          setFieldsConfig(data)
          if (!formData.vendor && data.vendor_collections?.[0]) {
            setFormData((prev) => ({ ...prev, vendor: data.vendor_collections[0].vendor_name }))
          }
        }
      } catch (err) {
        console.error("Error fetching fields:", err)
      } finally {
        setLoadingFields(false)
      }
    }

    fetchFields()
  }, [])

  // Initialize tags from formData
  useEffect(() => {
    if (formData.tags) {
      setTags(formData.tags)
    }
  }, [formData.tags])

  const canSubmit = () => {
    return (
      !!formData.title &&
      formData.title.trim().length > 0 &&
      formData.variants.length > 0 &&
      formData.variants.every((v) => v.price && parseFloat(v.price) > 0) &&
      (!formData.images || formData.images.length === 0 || maskSaved)
    )
  }

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !tags.includes(tag)) {
      const newTags = [...tags, tag]
      setTags(newTags)
      setFormData((prev) => ({ ...prev, tags: newTags }))
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter((t) => t !== tagToRemove)
    setTags(newTags)
    setFormData((prev) => ({ ...prev, tags: newTags }))
  }

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!isDraft && !canSubmit()) {
      toast({
        title: "Validation Error",
        description: "Please complete all required fields",
        variant: "destructive",
      })
      return
    }

    const setLoading = isDraft ? setIsSavingDraft : setIsSubmitting
    setLoading(true)

    try {
      const url = submissionId
        ? `/api/vendor/products/submissions/${submissionId}`
        : "/api/vendor/products/submit"
      const method = submissionId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          product_data: formData,
          status: isDraft ? "draft" : "pending",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit artwork")
      }

      toast({
        title: "Success",
        description: isDraft
          ? "Draft saved successfully"
          : "Artwork submitted for review successfully",
      })

      onComplete()
    } catch (error: any) {
      console.error("Error submitting artwork:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to submit artwork",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingFields) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 py-4 border-b">
        <h1 className="text-2xl font-semibold">
          {submissionId ? "Edit Artwork" : "Add Artwork"}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting || isSavingDraft}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting || isSavingDraft}
          >
            {isSavingDraft ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Draft"
            )}
          </Button>
          <Button onClick={() => handleSubmit(false)} disabled={isSubmitting || isSavingDraft || !canSubmit()}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit for Review"
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Description */}
          <Card>
            <CardContent className="pt-6">
              <BasicInfoStep
                formData={formData}
                setFormData={setFormData}
                fieldsConfig={fieldsConfig}
              />
            </CardContent>
          </Card>

          {/* Media */}
          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
            </CardHeader>
            <CardContent>
              <ImagesStep
                formData={formData}
                setFormData={setFormData}
                onMaskSavedStatusChange={setMaskSaved}
              />
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <VariantsStep formData={formData} setFormData={setFormData} />
            </CardContent>
          </Card>

          {/* Print Files */}
          <Card>
            <CardHeader>
              <CardTitle>Print Files</CardTitle>
            </CardHeader>
            <CardContent>
              <PrintFilesStep formData={formData} setFormData={setFormData} />
            </CardContent>
          </Card>

          {/* Series */}
          <Card>
            <CardHeader>
              <CardTitle>Series (Collection)</CardTitle>
            </CardHeader>
            <CardContent>
              <SeriesStep formData={formData} setFormData={setFormData} />
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Organization */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">
                {submissionId ? "Draft" : "Not Submitted"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product Organization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product_type">Type</Label>
                <Select
                  value={formData.product_type}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, product_type: value }))
                  }
                >
                  <SelectTrigger id="product_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Art Prints">Art Prints</SelectItem>
                    <SelectItem value="Original Art">Original Art</SelectItem>
                    <SelectItem value="Digital Art">Digital Art</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                    placeholder="Add a tag"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAddTag}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {formData.vendor && (
                <div className="space-y-2">
                  <Label>Vendor</Label>
                  <Input value={formData.vendor} disabled className="bg-muted" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
