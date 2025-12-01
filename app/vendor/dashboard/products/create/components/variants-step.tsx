"use client"

import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Lock, TrendingUp, Info, Clock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PricePickerCards } from "./PricePickerCards"
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

  const handleTimedEditionChange = () => {
    // Set Timed Edition (Open Edition)
    // Remove edition_size metafield
    // Set inventory to unlimited/continue (represented by null or huge number, usually handled by platform)
    
    // For Timed Edition, we might want a specific price range or recommended price
    // Let's assume similar to 90 edition size (entry level) or custom
    const recommendedPrice = 50 

    setFormData((prev) => {
      const variants = [...prev.variants]
      variants[0] = {
        ...variants[0],
        inventory_quantity: undefined, // Open/Unlimited
        inventory_policy: 'continue', // Shopify flag for selling without stock tracking
        price: prev.variants[0].price || recommendedPrice.toString(),
      }
      
      // Remove edition_size metafield
      const metafields = (prev.metafields || []).filter(
        (m) => !(m.namespace === "custom" && m.key === "edition_size")
      )
      
      // Add timed_edition metafield flag if needed, or just relying on absence of edition_size
      const timedMetafield = {
        namespace: "custom",
        key: "timed_edition",
        value: "true",
        type: "boolean",
      }
      
      // Check if it exists and update, or push
      const existingIndex = metafields.findIndex(m => m.namespace === "custom" && m.key === "timed_edition")
      if (existingIndex >= 0) {
        metafields[existingIndex] = timedMetafield
      } else {
        metafields.push(timedMetafield)
      }

      return { ...prev, variants, metafields }
    })
  }

  const isTimedEdition = (() => {
    const timed = formData.metafields?.find(m => m.namespace === "custom" && m.key === "timed_edition")
    return timed?.value === "true"
  })()

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
      const metafields = (prev.metafields || []).filter(
        (m) => !(m.namespace === "custom" && m.key === "timed_edition")
      ) // Remove timed_edition flag if selecting fixed size

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
          Choose your edition size <span className="text-red-500">*</span>
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
                        <span className="text-xs font-medium">${priceRange.min}-${priceRange.max}</span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-semibold">{size} Editions</p>
                      {isUnlocked ? (
                        <>
                          <p>Price Range: ${priceRange.min} - ${priceRange.max}</p>
                          <p>Recommended: ${recommendedPrice}</p>
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
          
          {/* Timed Edition Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant={isTimedEdition ? "default" : "outline"}
                  className={`relative h-24 flex flex-col items-center justify-center gap-1 ${
                    isTimedEdition ? "ring-2 ring-primary ring-offset-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200" : "hover:border-green-200 hover:bg-green-50/50"
                  }`}
                  onClick={handleTimedEditionChange}
                >
                  <Clock className={`h-6 w-6 ${isTimedEdition ? "text-green-700" : "text-green-600/70"}`} />
                  <span className="text-sm font-bold">Timed Edition</span>
                  <span className="text-[10px] text-muted-foreground">Open Window</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-semibold">Timed Edition</p>
                  <p>Edition size is determined by sales during a specific time window.</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
        
        const isTimed = formData.metafields?.find(
          (m) => m.namespace === "custom" && m.key === "timed_edition"
        )?.value === "true"

        const recommendedPrice = editionSize ? getRecommendedPrice(editionSize, totalSales) : 50
        const priceRange = editionSize ? getPriceRange(editionSize) : { min: 40, max: 100 } // Default wider range for timed
        
        return (
          <div className="space-y-4">
            {editionSize || isTimed ? (
              <>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                    <Label>
                      Choose your price <span className="text-red-500">*</span>
                      </Label>
                        <Badge variant="outline" className="text-xs">
                          Range: ${priceRange.min} - ${priceRange.max}
                        </Badge>
                      </div>
                  <p className="text-sm text-muted-foreground">
                    Choose a price point that matches your artwork's value and market positioning.
                  </p>
                  
                  {isTimed ? (
                    <div className="space-y-4">
                      <Label>Select Progressive Pricing Range</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { label: "Accessible", start: 40, end: 60, desc: "Entry level range" },
                          { label: "Collector", start: 70, end: 100, desc: "Standard release range" },
                          { label: "Invest", start: 120, end: 200, desc: "Premium tier range" }
                        ].map((range) => {
                          const isSelected = 
                            parseFloat(variant.price || "0") === range.start && 
                            parseFloat(formData.metafields?.find(m => m.key === "final_price")?.value || "0") === range.end

                          return (
                            <div 
                              key={range.label}
                              onClick={() => {
                                updateVariant(0, "price", range.start.toString())
                                setFormData(prev => {
                                  const metas = [...(prev.metafields || [])]
                                  const idx = metas.findIndex(m => m.key === "final_price")
                                  if (idx >= 0) {
                                    metas[idx] = { ...metas[idx], value: range.end.toString() }
                                  } else {
                                    metas.push({ namespace: "custom", key: "final_price", value: range.end.toString(), type: "number_decimal" })
                                  }
                                  return { ...prev, metafields: metas }
                                })
                              }}
                              className={cn(
                                "cursor-pointer rounded-xl border-2 p-4 transition-all hover:border-primary",
                                isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-muted bg-card"
                              )}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-semibold text-sm">{range.label}</span>
                                {isSelected && <TrendingUp className="h-4 w-4 text-primary" />}
                              </div>
                              <div className="text-2xl font-bold mb-1">
                                ${range.start} <span className="text-sm text-muted-foreground font-normal">to</span> ${range.end}
                              </div>
                              <p className="text-xs text-muted-foreground">{range.desc}</p>
                            </div>
                          )
                        })}
                      </div>
                      <Alert className="bg-blue-50 border-blue-200">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-700 text-xs">
                          Price increases automatically from start to end price as the time window closes.
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : (
                    <PricePickerCards
                      value={variant.price ? Number.parseFloat(variant.price) : null}
                      onChange={(price) => handlePriceChange(0, price)}
                      min={priceRange.min}
                      max={priceRange.max}
                      recommended={recommendedPrice}
                    />
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
