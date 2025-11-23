"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import type { ProductSubmissionData, ProductCreationFields, ProductMetafield } from "@/types/product-submission"

interface MetafieldsStepProps {
  formData: ProductSubmissionData
  setFormData: (data: ProductSubmissionData) => void
  fieldsConfig: ProductCreationFields | null
}

export function MetafieldsStep({ formData, setFormData, fieldsConfig }: MetafieldsStepProps) {
  const [tagInput, setTagInput] = useState("")

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault()
      addTag(tagInput.trim())
      setTagInput("")
    }
  }

  const addTag = (tag: string) => {
    if (tag && !formData.tags?.includes(tag)) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tag],
      })
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((tag) => tag !== tagToRemove) || [],
    })
  }

  const updateMetafield = (index: number, field: keyof ProductMetafield, value: string) => {
    const metafields = [...(formData.metafields || [])]
    metafields[index] = { ...metafields[index], [field]: value }
    setFormData({ ...formData, metafields })
  }

  const addMetafield = () => {
    setFormData({
      ...formData,
      metafields: [
        ...(formData.metafields || []),
        {
          namespace: "custom",
          key: "",
          value: "",
          type: "single_line_text_field",
        },
      ],
    })
  }

  const removeMetafield = (index: number) => {
    const metafields = formData.metafields?.filter((_, i) => i !== index) || []
    setFormData({ ...formData, metafields })
  }

  // Get common metafields
  const commonMetafields = fieldsConfig?.metafields?.filter(
    (m) => m.namespace === "custom" && m.key === "edition_size",
  ) || []

  return (
    <div className="space-y-6">
      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagInputKeyDown}
          placeholder="Enter tags and press Enter"
        />
        <p className="text-xs text-muted-foreground">
          Add tags to help customers find your product. Press Enter to add each tag.
        </p>
        {formData.tags && formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Vendor Collection Info */}
      {fieldsConfig?.vendor_collections?.[0] && (
        <div className="space-y-2">
          <Label>Collection</Label>
          <Input
            value={fieldsConfig.vendor_collections[0].collection_title}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            Your products will be automatically added to your vendor collection.
          </p>
        </div>
      )}

      {/* Common Metafields */}
      {commonMetafields.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Common Metafields</h3>
            <p className="text-sm text-muted-foreground">
              Additional product information
            </p>
          </div>

          {commonMetafields.map((metafieldDef) => {
            const existingMetafield = formData.metafields?.find(
              (m) => m.namespace === metafieldDef.namespace && m.key === metafieldDef.key,
            )

            if (!existingMetafield) {
              // Add default metafield
              const newMetafield: ProductMetafield = {
                namespace: metafieldDef.namespace,
                key: metafieldDef.key,
                value: "",
                type: metafieldDef.type,
              }
              setFormData({
                ...formData,
                metafields: [...(formData.metafields || []), newMetafield],
              })
            }

            const metafield = formData.metafields?.find(
              (m) => m.namespace === metafieldDef.namespace && m.key === metafieldDef.key,
            )

            if (!metafield) return null

            const index = formData.metafields?.indexOf(metafield) || 0

            return (
              <div key={`${metafieldDef.namespace}.${metafieldDef.key}`} className="space-y-2">
                <Label htmlFor={`metafield-${index}`}>
                  {metafieldDef.name}
                  {metafieldDef.description && (
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      - {metafieldDef.description}
                    </span>
                  )}
                </Label>
                {metafieldDef.type === "number_integer" ? (
                  <Input
                    id={`metafield-${index}`}
                    type="number"
                    value={metafield.value}
                    onChange={(e) => updateMetafield(index, "value", e.target.value)}
                    placeholder="Enter number"
                  />
                ) : (
                  <Input
                    id={`metafield-${index}`}
                    value={metafield.value}
                    onChange={(e) => updateMetafield(index, "value", e.target.value)}
                    placeholder={`Enter ${metafieldDef.name.toLowerCase()}`}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Custom Metafields */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Custom Metafields</h3>
          <p className="text-sm text-muted-foreground">
            Add custom metadata for your product
          </p>
        </div>

        {formData.metafields
          ?.filter(
            (m) => !commonMetafields.some((cm) => cm.namespace === m.namespace && cm.key === m.key),
          )
          .map((metafield, index) => {
            const actualIndex = formData.metafields?.indexOf(metafield) || 0
            return (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`meta-namespace-${actualIndex}`}>Namespace</Label>
                    <Input
                      id={`meta-namespace-${actualIndex}`}
                      value={metafield.namespace}
                      onChange={(e) => updateMetafield(actualIndex, "namespace", e.target.value)}
                      placeholder="custom"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`meta-key-${actualIndex}`}>Key</Label>
                    <Input
                      id={`meta-key-${actualIndex}`}
                      value={metafield.key}
                      onChange={(e) => updateMetafield(actualIndex, "key", e.target.value)}
                      placeholder="my_key"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`meta-value-${actualIndex}`}>Value</Label>
                  <Textarea
                    id={`meta-value-${actualIndex}`}
                    value={metafield.value}
                    onChange={(e) => updateMetafield(actualIndex, "value", e.target.value)}
                    placeholder="Enter value"
                    rows={2}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMetafield(actualIndex)}
                >
                  Remove
                </Button>
              </div>
            )
          })}

        <Button type="button" variant="outline" onClick={addMetafield}>
          Add Custom Metafield
        </Button>
      </div>
    </div>
  )
}

