"use client"

import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Lock, Unlock, Info, Trash2, Plus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { ProductSubmissionData, ProductVariant } from "@/types/product-submission"
import {
  EDITION_SIZES,
  type EditionSize,
  getRecommendedPrice,
  getPriceRange,
  validatePrice,
  type UnlockStatus,
} from "@/lib/pricing/unlock-system"

interface VariantsStepProps {
  formData: ProductSubmissionData
  setFormData: (data: ProductSubmissionData) => void
}

// Generate SKU based on vendor name and product title
function generateSKU(vendorName: string, productTitle: string, variantIndex: number): string {
  const vendorPrefix = vendorName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .substring(0, 6)
  const productCode = productTitle
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .substring(0, 6)
  const variantSuffix = variantIndex > 0 ? `-V${variantIndex + 1}` : ""
  return `${vendorPrefix}-${productCode}${variantSuffix}`
}

export function VariantsStep({ formData, setFormData }: VariantsStepProps) {
  const [unlockStatus, setUnlockStatus] = useState<UnlockStatus | null>(null)
  const [loadingUnlock, setLoadingUnlock] = useState(true)

  // Fetch unlock status on mount
  useEffect(() => {
    const fetchUnlockStatus = async () => {
      try {
        const response = await fetch("/api/vendor/pricing/unlock-status", {
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          setUnlockStatus(data)
        }
      } catch (error) {
        console.error("Error fetching unlock status:", error)
      } finally {
        setLoadingUnlock(false)
      }
    }

    fetchUnlockStatus()
  }, [])

  // Auto-generate SKU when title or vendor changes
  useEffect(() => {
    if (formData.title && formData.vendor) {
      setFormData((prev) => {
        const variants = prev.variants.map((variant, index) => {
          // Only auto-generate if SKU is empty
          if (!variant.sku) {
            return {
              ...variant,
              sku: generateSKU(formData.vendor, formData.title, index),
            }
          }
          return variant
        })
        return { ...prev, variants }
      })
    }
  }, [formData.title, formData.vendor, setFormData])

  // Set default weight to 90g on mount
  useEffect(() => {
    setFormData((prev) => {
      const variants = prev.variants.map((variant) => {
        if (!variant.weight && !variant.weight_unit) {
          return {
            ...variant,
            weight: 90,
            weight_unit: "g",
          }
        }
        return variant
      })
      return { ...prev, variants }
    })
  }, [setFormData])

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    setFormData((prev) => {
      const variants = [...prev.variants]
      variants[index] = { ...variants[index], [field]: value }
      return { ...prev, variants }
    })
  }

  const handleEditionSizeChange = (index: number, editionSize: EditionSize) => {
    const totalSales = unlockStatus?.totalSales ?? 0
    const recommendedPrice = getRecommendedPrice(editionSize, totalSales)
    const priceRange = getPriceRange(editionSize)

    setFormData((prev) => {
      const variants = [...prev.variants]
      // Update edition size as metafield (will be stored separately)
      variants[index] = {
        ...variants[index],
        inventory_quantity: editionSize, // Set inventory = edition size
        price: prev.variants[index].price || recommendedPrice.toString(), // Set recommended price if empty
      }
      return { ...prev, variants }
    })

    // Update metafields to include edition_size
    setFormData((prev) => {
      const metafields = prev.metafields || []
      const editionSizeMetafieldIndex = metafields.findIndex(
        (m) => m.namespace === "custom" && m.key === "edition_size",
      )

      const editionSizeMetafield = {
        namespace: "custom",
        key: "edition_size",
        value: editionSize.toString(),
        type: "number_integer",
      }

      if (editionSizeMetafieldIndex >= 0) {
        metafields[editionSizeMetafieldIndex] = editionSizeMetafield
      } else {
        metafields.push(editionSizeMetafield)
      }

      return { ...prev, metafields }
    })
  }

  const handlePriceChange = (index: number, price: string) => {
    updateVariant(index, "price", price)

    // Validate price if edition size is set
    const variant = formData.variants[index]
    const editionSizeMetafield = formData.metafields?.find(
      (m) => m.namespace === "custom" && m.key === "edition_size",
    )

    if (editionSizeMetafield) {
      const editionSize = Number.parseInt(editionSizeMetafield.value, 10) as EditionSize
      const priceNum = Number.parseFloat(price)
      const totalSales = unlockStatus?.totalSales ?? 0
      const validation = validatePrice(priceNum, editionSize, totalSales)

      if (!validation.valid && validation.message) {
        // Price validation feedback would go here
        console.warn(validation.message)
      }
    }
  }

  const getCurrentEditionSize = (): EditionSize | null => {
    const editionSizeMetafield = formData.metafields?.find(
      (m) => m.namespace === "custom" && m.key === "edition_size",
    )
    if (editionSizeMetafield) {
      const size = Number.parseInt(editionSizeMetafield.value, 10)
      if (EDITION_SIZES.includes(size as EditionSize)) {
        return size as EditionSize
      }
    }
    return null
  }

  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          price: "",
          sku: generateSKU(formData.vendor || "", formData.title || "", prev.variants.length),
          requires_shipping: true,
          weight: 90,
          weight_unit: "g",
        },
      ],
    }))
  }

  const removeVariant = (index: number) => {
    if (formData.variants.length > 1) {
      setFormData((prev) => {
        const variants = prev.variants.filter((_, i) => i !== index)
        return { ...prev, variants }
      })
    }
  }

  const currentEditionSize = getCurrentEditionSize()
  const totalSales = unlockStatus?.totalSales ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Product Variants</h3>
          <p className="text-sm text-muted-foreground">
            Define pricing and edition size for your product
          </p>
        </div>
        {formData.variants.length < 5 && (
          <Button type="button" variant="outline" size="sm" onClick={addVariant}>
            <Plus className="h-4 w-4 mr-2" />
            Add Variant
          </Button>
        )}
      </div>

      {/* Edition Size Selection */}
      <div className="space-y-2">
        <Label htmlFor="edition-size">
          Edition Size <span className="text-red-500">*</span>
        </Label>
        <Select
          value={currentEditionSize?.toString() || ""}
          onValueChange={(value) => handleEditionSizeChange(0, Number.parseInt(value, 10) as EditionSize)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select edition size" />
          </SelectTrigger>
          <SelectContent>
            {EDITION_SIZES.map((size) => {
              const isUnlocked = unlockStatus
                ? unlockStatus.editionSizes.find((e) => e.size === size)?.unlocked ?? false
                : size === 90 // Default: 90 is always unlocked
              const minSales = unlockStatus
                ? unlockStatus.editionSizes.find((e) => e.size === size)?.minSales ?? 0
                : 0

              return (
                <SelectItem
                  key={size}
                  value={size.toString()}
                  disabled={!isUnlocked}
                  className={!isUnlocked ? "opacity-50 cursor-not-allowed" : ""}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{size} editions</span>
                    {!isUnlocked && (
                      <Lock className="h-3 w-3 ml-2" />
                    )}
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
        {unlockStatus && (
          <div className="space-y-1">
            {unlockStatus.editionSizes
              .filter((e) => !e.unlocked)
              .map((e) => (
                <p key={e.size} className="text-xs text-muted-foreground">
                  Unlock {e.size} editions at {e.minSales} sales (current: {totalSales})
                </p>
              ))}
          </div>
        )}
      </div>

      {formData.variants.map((variant, index) => {
        const editionSizeMetafield = formData.metafields?.find(
          (m) => m.namespace === "custom" && m.key === "edition_size",
        )
        const editionSize = editionSizeMetafield
          ? (Number.parseInt(editionSizeMetafield.value, 10) as EditionSize)
          : null
        const recommendedPrice = editionSize ? getRecommendedPrice(editionSize, totalSales) : 50
        const priceRange = editionSize ? getPriceRange(editionSize) : { min: 40, max: 60 }

        return (
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

            {/* Price with recommendations */}
            <div className="space-y-2">
              <Label htmlFor={`price-${index}`}>
                Price (£) <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`price-${index}`}
                type="number"
                step="0.01"
                min={priceRange.min}
                max={priceRange.max}
                value={variant.price}
                onChange={(e) => handlePriceChange(index, e.target.value)}
                placeholder={recommendedPrice.toString()}
                required
              />
              {editionSize && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Recommended: £{recommendedPrice} | Range: £{priceRange.min} - £{priceRange.max}
                  </p>
                  {variant.price && Number.parseFloat(variant.price) < priceRange.min && (
                    <Alert variant="destructive" className="py-2">
                      <AlertDescription className="text-xs">
                        Price must be at least £{priceRange.min} for {editionSize} edition size
                      </AlertDescription>
                    </Alert>
                  )}
                  {variant.price && Number.parseFloat(variant.price) > priceRange.max && (
                    <Alert variant="destructive" className="py-2">
                      <AlertDescription className="text-xs">
                        Price cannot exceed £{priceRange.max} for {editionSize} edition size
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>

            {/* SKU - Auto-generated, read-only */}
            <div className="space-y-2">
              <Label htmlFor={`sku-${index}`}>SKU (Auto-generated)</Label>
              <Input
                id={`sku-${index}`}
                value={variant.sku || ""}
                readOnly
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                SKU is automatically generated based on vendor and product name
              </p>
            </div>

            {/* Inventory Quantity - Auto-set to edition size, read-only */}
            <div className="space-y-2">
              <Label htmlFor={`inventory_quantity-${index}`}>Inventory Quantity</Label>
              <Input
                id={`inventory_quantity-${index}`}
                type="number"
                value={variant.inventory_quantity || editionSize || ""}
                readOnly
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                Inventory is automatically set to edition size
              </p>
            </div>

            {/* Weight - Default 90g */}
            <div className="space-y-2">
              <Label htmlFor={`weight-${index}`}>Weight</Label>
              <div className="flex gap-2">
                <Input
                  id={`weight-${index}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={variant.weight || 90}
                  onChange={(e) =>
                    updateVariant(index, "weight", parseFloat(e.target.value) || 90)
                  }
                  placeholder="90"
                />
                <Select
                  value={variant.weight_unit || "g"}
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

            {/* Inventory Management */}
            <div className="space-y-2">
              <Label htmlFor={`inventory_management-${index}`}>Inventory Management</Label>
              <Select
                value={variant.inventory_management || "shopify"}
                onValueChange={(value) => {
                  const finalValue = value === "none" ? null : (value as "shopify")
                  updateVariant(index, "inventory_management", finalValue)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select inventory management" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shopify">Shopify</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Requires Shipping */}
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
        )
      })}
    </div>
  )
}
