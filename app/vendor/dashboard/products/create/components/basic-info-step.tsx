"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { ProductSubmissionData, ProductCreationFields } from "@/types/product-submission"

interface BasicInfoStepProps {
  formData: ProductSubmissionData
  setFormData: (data: ProductSubmissionData) => void
  fieldsConfig: ProductCreationFields | null
}

export function BasicInfoStep({ formData, setFormData, fieldsConfig }: BasicInfoStepProps) {
  const updateField = (field: keyof ProductSubmissionData, value: any) => {
    setFormData({ ...formData, [field]: value })
  }

  // Generate handle from title
  const generateHandle = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 255)
  }

  const handleTitleChange = (value: string) => {
    updateField("title", value)
    // Auto-generate handle if not manually set
    if (!formData.handle || formData.handle === generateHandle(formData.title)) {
      updateField("handle", generateHandle(value))
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">
          Product Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Enter product title"
          required
        />
        <p className="text-xs text-muted-foreground">
          The name of your product as it will appear on the store
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ""}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="Enter product description (HTML supported)"
          rows={6}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Product description. You can use HTML formatting.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="product_type">Product Type</Label>
        <Input
          id="product_type"
          value={formData.product_type || ""}
          onChange={(e) => updateField("product_type", e.target.value)}
          placeholder="e.g., Art Print, Photography, Digital Art"
        />
        <p className="text-xs text-muted-foreground">
          The type or category of your product
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="handle">URL Handle</Label>
        <Input
          id="handle"
          value={formData.handle || ""}
          onChange={(e) => updateField("handle", e.target.value)}
          placeholder="product-url-handle"
        />
        <p className="text-xs text-muted-foreground">
          The URL-friendly version of your product name. Auto-generated from title if left empty.
        </p>
      </div>

      {formData.vendor && (
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
      )}
    </div>
  )
}

