"use client"




import type { ProductSubmissionData, ProductCreationFields } from "@/types/product-submission"

import { Label, Input, Textarea } from "@/components/ui"
interface BasicInfoStepProps {
  formData: ProductSubmissionData
  setFormData: (data: ProductSubmissionData) => void
  fieldsConfig: ProductCreationFields | null
}

export function BasicInfoStep({ formData, setFormData, fieldsConfig }: BasicInfoStepProps) {
  // Generate handle from title
  const generateHandle = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 255)
  }

  const handleTitleChange = (value: string) => {
    setFormData((prev) => {
      const newHandle = generateHandle(value)
      // Auto-generate handle if not manually set or if handle matches the old title
      const shouldUpdateHandle = !prev.handle || prev.handle === generateHandle(prev.title)
      
      return {
        ...prev,
        title: value,
        handle: shouldUpdateHandle ? newHandle : prev.handle,
      }
    })
  }
  
  const updateField = (field: keyof ProductSubmissionData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">
          Artwork Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Enter artwork title"
          required
        />
        <p className="text-xs text-muted-foreground">
          The name of your artwork as it will appear on the store
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ""}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="Enter artwork description (HTML supported)"
          rows={6}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Artwork description. You can use HTML formatting.
        </p>
      </div>

      {/* Hidden: URL Handle and Vendor fields */}
      {/* <div className="space-y-2">
        <Label htmlFor="handle">URL Handle</Label>
        <Input
          id="handle"
          value={formData.handle || ""}
          onChange={(e) => updateField("handle", e.target.value)}
          placeholder="artwork-url-handle"
        />
        <p className="text-xs text-muted-foreground">
          The URL-friendly version of your artwork name. Auto-generated from title if left empty.
        </p>
      </div> */}

      {/* Hidden: Vendor name field */}
      {/* {formData.vendor && (
        <div className="space-y-2">
          <Label htmlFor="vendor">Vendor</Label>
          <Input
            id="vendor"
            value={formData.vendor}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            Your vendor name (automatically assigned)
          </p>
        </div>
      )} */}
    </div>
  )
}

