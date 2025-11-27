"use client"

import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Lock, TrendingUp, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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

  // Auto-generate SKU, set defaults, and ensure single variant when title or vendor changes
  useEffect(() => {
    if (formData.title && formData.vendor) {
      setFormData((prev) => {
        // Ensure we always have exactly one variant
        const variants = prev.variants.length > 0 ? prev.variants : [{
          price: "",
          sku: "",
          requires_shipping: true,
          weight: 90,
          weight_unit: "g",
        }]

        const updatedVariants = variants.map((variant, index) => {
          // Auto-generate SKU if empty
          const sku = variant.sku || generateSKU(formData.vendor, formData.title, index)
          // Set default weight to 90g if not set
          const weight = variant.weight || 90
          const weight_unit = variant.weight_unit || "g"
          return {
            ...variant,
            sku,
            weight,
            weight_unit,
            requires_shipping: true, // Always true
          }
        })
        return { ...prev, variants: updatedVariants.slice(0, 1) } // Only keep first variant
      })
    }
  }, [formData.title, formData.vendor, setFormData])

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

  const handlePriceChange = (index: number, price: string | number) => {
    const priceStr = typeof price === "number" ? price.toString() : price
    updateVariant(index, "price", priceStr)

    // Validate price if edition size is set
    const variant = formData.variants[index]
    const editionSizeMetafield = formData.metafields?.find(
      (m) => m.namespace === "custom" && m.key === "edition_size",
    )

    if (editionSizeMetafield) {
      const editionSize = Number.parseInt(editionSizeMetafield.value, 10) as EditionSize
      const priceNum = typeof price === "number" ? price : Number.parseFloat(price)
      const totalSales = unlockStatus?.totalSales ?? 0
      const validation = validatePrice(priceNum, editionSize, totalSales)

      if (!validation.valid && validation.message) {
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

  // Ensure requires_shipping is always true
  useEffect(() => {
    setFormData((prev) => {
      const variants = prev.variants.map((variant) => ({
        ...variant,
        requires_shipping: true,
      }))
      return { ...prev, variants }
    })
  }, [setFormData])

  const getNextUnlock = () => {
    if (!unlockStatus) return null

    const lockedSizes = unlockStatus.editionSizes.filter((e) => !e.unlocked)
    if (lockedSizes.length === 0) return null

    // Return the next unlock (smallest minSales)
    return lockedSizes.sort((a, b) => a.minSales - b.minSales)[0]
  }

  const getUnlockProgress = (minSales: number) => {
    if (!unlockStatus) return 0
    const progress = (unlockStatus.totalSales / minSales) * 100
    return Math.min(progress, 100)
  }

  const currentEditionSize = getCurrentEditionSize()
  const totalSales = unlockStatus?.totalSales ?? 0
  const nextUnlock = getNextUnlock()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Pricing & Edition Size</h3>
        <p className="text-sm text-muted-foreground">
          Select edition size and set pricing for your artwork
        </p>
      </div>

      {/* Sales Performance & Next Unlock */}
      {unlockStatus && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-sm">Your Sales Performance</span>
              </div>
              <Badge variant="secondary" className="text-base font-semibold">
                {totalSales} {totalSales === 1 ? "sale" : "sales"}
              </Badge>
            </div>
            {nextUnlock && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Next unlock: <span className="font-medium text-foreground">{nextUnlock.size} editions</span>
                  </span>
                  <span className="text-muted-foreground">
                    {totalSales} / {nextUnlock.minSales} sales
                  </span>
                </div>
                <Progress value={getUnlockProgress(nextUnlock.minSales)} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {nextUnlock.minSales - totalSales} more {nextUnlock.minSales - totalSales === 1 ? "sale" : "sales"} to unlock
                </p>
              </div>
            )}
            {!nextUnlock && (
              <p className="text-sm text-green-600 font-medium">All edition sizes unlocked!</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edition Size Selection - Button Grid */}
      <div className="space-y-3">
        <Label>
          Edition Size <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {EDITION_SIZES.map((size) => {
            const isUnlocked = unlockStatus
              ? unlockStatus.editionSizes.find((e) => e.size === size)?.unlocked ?? false
              : size === 90 // Default: 90 is always unlocked
            const minSales = unlockStatus
              ? unlockStatus.editionSizes.find((e) => e.size === size)?.minSales ?? 0
              : 0
            const isSelected = currentEditionSize === size
            const priceRange = getPriceRange(size)
            const recommendedPrice = getRecommendedPrice(size, totalSales)

            return (
              <TooltipProvider key={size}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      className={`relative h-24 flex flex-col items-center justify-center gap-1 ${
                        !isUnlocked ? "opacity-60 cursor-not-allowed" : ""
                      } ${isSelected ? "ring-2 ring-primary ring-offset-2" : ""}`}
                      disabled={!isUnlocked}
                      onClick={() => handleEditionSizeChange(0, size)}
                    >
                      {!isUnlocked && (
                        <Lock className="h-4 w-4 absolute top-2 right-2 text-muted-foreground" />
                      )}
                      <span className="text-2xl font-bold">{size}</span>
                      <span className="text-xs text-muted-foreground">editions</span>
                      {isUnlocked && (
                        <span className="text-xs font-medium">£{priceRange.min}-£{priceRange.max}</span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-semibold">{size} Editions</p>
                      {isUnlocked ? (
                        <>
                          <p>Price Range: £{priceRange.min} - £{priceRange.max}</p>
                          <p>Recommended: £{recommendedPrice}</p>
                        </>
                      ) : (
                        <p>Unlock at {minSales} sales (need {minSales - totalSales} more)</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          })}
        </div>
        {!loadingUnlock && unlockStatus && (
          <div className="space-y-1 text-xs text-muted-foreground">
            {unlockStatus.editionSizes
              .filter((e) => !e.unlocked)
              .map((e) => {
                const progress = getUnlockProgress(e.minSales)
                return (
                  <div key={e.size} className="flex items-center justify-between">
                    <span>
                      {e.size} editions locked - {e.minSales - totalSales} more sales needed
                    </span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                )
              })}
          </div>
        )}
      </div>

      {/* Price Section */}
      {(() => {
        const variant = formData.variants[0] || {
          price: "",
          sku: "",
          requires_shipping: true,
          weight: 90,
          weight_unit: "g",
        }
        const editionSizeMetafield = formData.metafields?.find(
          (m) => m.namespace === "custom" && m.key === "edition_size",
        )
        const editionSize = editionSizeMetafield
          ? (Number.parseInt(editionSizeMetafield.value, 10) as EditionSize)
          : null
        const recommendedPrice = editionSize ? getRecommendedPrice(editionSize, totalSales) : 50
        const priceRange = editionSize ? getPriceRange(editionSize) : { min: 40, max: 60 }
        const currentPrice = variant.price ? Number.parseFloat(variant.price) : recommendedPrice

        return (
          <div className="border rounded-lg p-6 space-y-6">
            {editionSize ? (
              <>
                {/* Price with Slider */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="price">
                        Price (£) <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">£{currentPrice.toFixed(2)}</span>
                        <Badge variant="outline" className="text-xs">
                          Range: £{priceRange.min} - £{priceRange.max}
                        </Badge>
                      </div>
                    </div>
                    <Slider
                      value={[currentPrice]}
                      onValueChange={([value]) => handlePriceChange(0, value)}
                      min={priceRange.min}
                      max={priceRange.max}
                      step={0.50}
                      className="w-full"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>£{priceRange.min}</span>
                      <span className="font-medium text-foreground">
                        Recommended: £{recommendedPrice}
                      </span>
                      <span>£{priceRange.max}</span>
                    </div>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min={priceRange.min}
                      max={priceRange.max}
                      value={variant.price || ""}
                      onChange={(e) => handlePriceChange(0, e.target.value)}
                      placeholder={recommendedPrice.toString()}
                      required
                      className="text-center font-semibold text-lg"
                    />
                  </div>
                  {variant.price && (Number.parseFloat(variant.price) < priceRange.min || Number.parseFloat(variant.price) > priceRange.max) && (
                    <Alert variant="destructive" className="py-2">
                      <AlertDescription className="text-xs">
                        {Number.parseFloat(variant.price) < priceRange.min
                          ? `Price must be at least £${priceRange.min} for ${editionSize} edition size`
                          : `Price cannot exceed £${priceRange.max} for ${editionSize} edition size`}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Please select an edition size above to set the price
                </AlertDescription>
              </Alert>
            )}
          </div>
        )
      })()}
    </div>
  )
}
