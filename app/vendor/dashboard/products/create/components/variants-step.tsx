"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import type { ProductSubmissionData, ProductVariant } from "@/types/product-submission"

interface VariantsStepProps {
  formData: ProductSubmissionData
  setFormData: (data: ProductSubmissionData) => void
}

export function VariantsStep({ formData, setFormData }: VariantsStepProps) {
  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const variants = [...formData.variants]
    variants[index] = { ...variants[index], [field]: value }
    setFormData({ ...formData, variants })
  }

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [
        ...formData.variants,
        {
          price: "",
          sku: "",
          requires_shipping: true,
        },
      ],
    })
  }

  const removeVariant = (index: number) => {
    if (formData.variants.length > 1) {
      const variants = formData.variants.filter((_, i) => i !== index)
      setFormData({ ...formData, variants })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Product Variants</h3>
          <p className="text-sm text-muted-foreground">
            Define pricing and inventory for your product variants
          </p>
        </div>
        {formData.variants.length < 5 && (
          <Button type="button" variant="outline" size="sm" onClick={addVariant}>
            <Plus className="h-4 w-4 mr-2" />
            Add Variant
          </Button>
        )}
      </div>

      {formData.variants.map((variant, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Variant {index + 1}</h4>
            {formData.variants.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeVariant(index)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`price-${index}`}>
                Price <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`price-${index}`}
                type="number"
                step="0.01"
                min="0"
                value={variant.price}
                onChange={(e) => updateVariant(index, "price", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`compare_at_price-${index}`}>Compare at Price</Label>
              <Input
                id={`compare_at_price-${index}`}
                type="number"
                step="0.01"
                min="0"
                value={variant.compare_at_price || ""}
                onChange={(e) =>
                  updateVariant(index, "compare_at_price", e.target.value || null)
                }
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`sku-${index}`}>SKU</Label>
              <Input
                id={`sku-${index}`}
                value={variant.sku || ""}
                onChange={(e) => updateVariant(index, "sku", e.target.value)}
                placeholder="SKU-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`inventory_quantity-${index}`}>Inventory Quantity</Label>
              <Input
                id={`inventory_quantity-${index}`}
                type="number"
                min="0"
                value={variant.inventory_quantity || ""}
                onChange={(e) =>
                  updateVariant(index, "inventory_quantity", parseInt(e.target.value) || 0)
                }
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`weight-${index}`}>Weight</Label>
              <div className="flex gap-2">
                <Input
                  id={`weight-${index}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={variant.weight || ""}
                  onChange={(e) =>
                    updateVariant(index, "weight", parseFloat(e.target.value) || null)
                  }
                  placeholder="0.00"
                />
                <Select
                  value={variant.weight_unit || "kg"}
                  onValueChange={(value) => updateVariant(index, "weight_unit", value)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="lb">lb</SelectItem>
                    <SelectItem value="oz">oz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`inventory_management-${index}`}>Inventory Management</Label>
              <Select
                value={variant.inventory_management || "shopify"}
                onValueChange={(value) =>
                  updateVariant(index, "inventory_management", value as "shopify" | null)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shopify">Shopify</SelectItem>
                  <SelectItem value="">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id={`requires_shipping-${index}`}
              checked={variant.requires_shipping !== false}
              onCheckedChange={(checked) =>
                updateVariant(index, "requires_shipping", checked !== false)
              }
            />
            <Label htmlFor={`requires_shipping-${index}`} className="cursor-pointer">
              Requires shipping
            </Label>
          </div>
        </div>
      ))}
    </div>
  )
}

