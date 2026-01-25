"use client"

import { useEffect, useState } from "react"



import { Slider } from "@/components/ui"

import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui"

import { Lock, TrendingUp, Info, Clock, Check } from "lucide-react"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PricePickerCards } from "./PricePickerCards"
import type { ProductSubmissionData, ProductVariant } from "@/types/product-submission"
import { Label, Input, Button, Badge, Card, CardContent, Alert, AlertDescription } from "@/components/ui"
import {
  EDITION_SIZES,
  type EditionSize,
  getRecommendedPrice,
  getPriceRange,
  validatePrice,
  type UnlockStatus,
} from "@/lib/pricing/unlock-system"

type DropType = "fixed" | "timed" | null
type WizardStep = 1 | 2 | 3

// Simplified edition sizes for the guided flow
const GUIDED_EDITION_SIZES: EditionSize[] = [90, 44, 24]

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
  const [currentStep, setCurrentStep] = useState<WizardStep>(1)
  const [selectedDropType, setSelectedDropType] = useState<DropType>(null)
  const [selectedEditionSize, setSelectedEditionSize] = useState<EditionSize | null>(null)

  // Initialize wizard state from form data (only once on mount)
  useEffect(() => {
    // Only initialize if we haven't set a drop type yet
    if (selectedDropType !== null) return
    
    const isTimed = formData.metafields?.find(
      (m) => m.namespace === "custom" && m.key === "timed_edition"
    )?.value === "true"
    
    const editionSizeMetafield = formData.metafields?.find(
      (m) => m.namespace === "custom" && m.key === "edition_size"
    )
    
    if (isTimed) {
      setSelectedDropType("timed")
      setCurrentStep(3) // Skip to price step
    } else if (editionSizeMetafield) {
      const size = Number.parseInt(editionSizeMetafield.value, 10) as EditionSize
      if (GUIDED_EDITION_SIZES.includes(size)) {
        setSelectedDropType("fixed")
        setSelectedEditionSize(size)
        setCurrentStep(3) // Skip to price step
      }
    }
  }, [formData.metafields, selectedDropType])

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

  const handleDropTypeSelect = (type: "fixed" | "timed") => {
    setSelectedDropType(type)
    
    if (type === "timed") {
      // Set Timed Edition immediately
      const recommendedPrice = 50
      setFormData((prev) => {
        const variants = [...prev.variants]
        variants[0] = {
          ...variants[0],
          inventory_quantity: undefined,
          inventory_policy: 'continue',
          price: prev.variants[0].price || recommendedPrice.toString(),
        }
        
        const metafields = (prev.metafields || []).filter(
          (m) => !(m.namespace === "custom" && m.key === "edition_size")
        )
        
        const timedMetafield = {
          namespace: "custom",
          key: "timed_edition",
          value: "true",
          type: "boolean",
        }
        
        const existingIndex = metafields.findIndex(m => m.namespace === "custom" && m.key === "timed_edition")
        if (existingIndex >= 0) {
          metafields[existingIndex] = timedMetafield
        } else {
          metafields.push(timedMetafield)
        }

        return { ...prev, variants, metafields }
      })
      // Skip to price step for timed editions
      setCurrentStep(3)
    } else {
      // Fixed edition - go to step 2
      setCurrentStep(2)
    }
  }

  const isTimedEdition = selectedDropType === "timed" || (() => {
    const timed = formData.metafields?.find(m => m.namespace === "custom" && m.key === "timed_edition")
    return timed?.value === "true"
  })()

  const handleEditionSizeSelect = (editionSize: EditionSize) => {
    setSelectedEditionSize(editionSize)
    const totalSales = unlockStatus?.totalSales ?? 0
    const recommendedPrice = getRecommendedPrice(editionSize, totalSales)

    setFormData((prev) => {
      const variants = [...prev.variants]
      variants[0] = {
        ...variants[0],
        inventory_quantity: editionSize,
        price: prev.variants[0].price || recommendedPrice.toString(),
      }
      return { ...prev, variants }
    })

    setFormData((prev) => {
      const metafields = (prev.metafields || []).filter(
        (m) => !(m.namespace === "custom" && m.key === "timed_edition")
      )

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
    
    // Move to price step
    setCurrentStep(3)
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

  const currentEditionSize = selectedEditionSize || getCurrentEditionSize()
  const totalSales = unlockStatus?.totalSales ?? 0
  const nextUnlock = getNextUnlock()

  // Step 1: Choose Drop Type
  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Choose your drop format</h3>
        <p className="text-sm text-muted-foreground">
          Select how you want to sell your artwork
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fixed Edition Option */}
        <Card
          className={cn(
            "cursor-pointer transition-all hover:border-primary",
            selectedDropType === "fixed" && "border-primary ring-2 ring-primary ring-offset-2 bg-primary/5"
          )}
          onClick={() => handleDropTypeSelect("fixed")}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className={cn(
                "p-3 rounded-lg",
                selectedDropType === "fixed" ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                <Lock className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-lg mb-2">Fixed Edition</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose a set edition size and price. Limited quantity creates scarcity.
                </p>
                {selectedDropType === "fixed" && (
                  <Badge variant="default" className="mt-2">
                    <Check className="h-3 w-3 mr-1" />
                    Selected
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timed Edition Option */}
        <Card
          className={cn(
            "cursor-pointer transition-all hover:border-primary",
            selectedDropType === "timed" && "border-primary ring-2 ring-primary ring-offset-2 bg-primary/5"
          )}
          onClick={() => handleDropTypeSelect("timed")}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className={cn(
                "p-3 rounded-lg",
                selectedDropType === "timed" ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                <Clock className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-lg mb-2">Timed Edition</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Sell for a limited time. The number of sales becomes your edition size.
                </p>
                {selectedDropType === "timed" && (
                  <Badge variant="default" className="mt-2">
                    <Check className="h-3 w-3 mr-1" />
                    Selected
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Step 2: Choose Edition Size (only for Fixed Edition)
  const renderStep2 = () => {
    const editionSizeLabels: Record<EditionSize, { label: string; description: string }> = {
      90: { label: "Baseline", description: "Great for building your collector base" },
      44: { label: "Premium", description: "Balanced scarcity and accessibility" },
      24: { label: "Capsule", description: "Exclusive limited release" },
      78: { label: "Standard", description: "" },
      8: { label: "Ultra Premium", description: "" },
    }

    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCurrentStep(1)
                setSelectedDropType(null)
              }}
            >
              ← Back
            </Button>
            <h3 className="text-lg font-semibold">Choose your edition size</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Select the number of pieces you want to create
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {GUIDED_EDITION_SIZES.map((size) => {
            const isUnlocked = unlockStatus
              ? unlockStatus.editionSizes.find((e) => e.size === size)?.unlocked ?? false
              : size === 90
            const minSales = unlockStatus
              ? unlockStatus.editionSizes.find((e) => e.size === size)?.minSales ?? 0
              : 0
            const isSelected = selectedEditionSize === size
            const priceRange = getPriceRange(size)
            const label = editionSizeLabels[size]?.label || `${size} editions`
            const description = editionSizeLabels[size]?.description || ""

            return (
              <Card
                key={size}
                className={cn(
                  "cursor-pointer transition-all hover:border-primary",
                  isSelected && "border-primary ring-2 ring-primary ring-offset-2 bg-primary/5",
                  !isUnlocked && "opacity-60 cursor-not-allowed"
                )}
                onClick={() => isUnlocked && handleEditionSizeSelect(size)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    {!isUnlocked && (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    )}
                    {isSelected && (
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold mb-2">{size}</div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">{label}</div>
                    {description && (
                      <p className="text-xs text-muted-foreground">{description}</p>
                    )}
                  </div>
                  {isUnlocked ? (
                    <div className="text-center">
                      <Badge variant="outline" className="text-xs">
                        ${priceRange.min} - ${priceRange.max}
                      </Badge>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Badge variant="secondary" className="text-xs">
                        Unlock at {minSales} sales
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {!loadingUnlock && unlockStatus && (
          <div className="space-y-2">
            {unlockStatus.editionSizes
              .filter((e) => !e.unlocked && GUIDED_EDITION_SIZES.includes(e.size))
              .map((e) => {
                const progress = getUnlockProgress(e.minSales)
                return (
                  <div key={e.size} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {e.size} editions locked - {e.minSales - totalSales} more sales needed
                    </span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                )
              })}
          </div>
        )}
      </div>
    )
  }

  // Step 3: Choose Price
  const renderStep3 = () => {
    const variant = formData.variants[0] || {
      price: "",
      sku: "",
      requires_shipping: true,
      weight: 90,
      weight_unit: "g",
    }

    const isTimed = selectedDropType === "timed" || isTimedEdition
    const editionSize = selectedEditionSize || currentEditionSize

    const recommendedPrice = editionSize 
      ? getRecommendedPrice(editionSize, totalSales) 
      : 50
    const priceRange = editionSize 
      ? getPriceRange(editionSize) 
      : { min: 40, max: 100 }

    // Edition size labels
    const editionSizeLabels: Record<EditionSize, { label: string }> = {
      90: { label: "Baseline" },
      44: { label: "Premium" },
      24: { label: "Capsule" },
      78: { label: "Standard" },
      8: { label: "Ultra Premium" },
    }

    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (isTimed) {
                  setCurrentStep(1)
                  setSelectedDropType(null)
                } else {
                  setCurrentStep(2)
                }
              }}
            >
              ← Back
            </Button>
            <h3 className="text-lg font-semibold">Choose your price</h3>
          </div>
          {!isTimed && editionSize && (
            <div className="mb-3 p-3 bg-muted/50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {editionSize} Editions — {editionSizeLabels[editionSize]?.label || "Fixed Edition"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Price range based on your selected edition size
                  </p>
                </div>
                <Badge variant="secondary" className="text-sm font-semibold">
                  ${priceRange.min} - ${priceRange.max}
                </Badge>
              </div>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            {isTimed 
              ? "Set your price for the timed edition window"
              : `Select a price within the range for your ${editionSize} edition size`
            }
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>
              Price <span className="text-red-500">*</span>
            </Label>
            {!isTimed && editionSize && (
              <Badge variant="outline" className="text-xs">
                Range: ${priceRange.min} - ${priceRange.max}
              </Badge>
            )}
          </div>

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
      </div>
    )
  }

  return (
    <div className="space-y-6">
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

      {/* Step Indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className={cn(
          "flex items-center gap-2",
          currentStep >= 1 && "text-foreground font-medium"
        )}>
          <div className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center",
            currentStep >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"
          )}>
            {currentStep > 1 ? <Check className="h-4 w-4" /> : "1"}
          </div>
          <span>Drop Type</span>
        </div>
        <div className="h-px w-8 bg-muted" />
        <div className={cn(
          "flex items-center gap-2",
          currentStep >= 2 && "text-foreground font-medium",
          selectedDropType === "timed" && "opacity-50"
        )}>
          <div className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center",
            currentStep >= 2 ? "bg-primary text-primary-foreground" : "bg-muted",
            selectedDropType === "timed" && "opacity-50"
          )}>
            {currentStep > 2 ? <Check className="h-4 w-4" /> : "2"}
          </div>
          <span>Edition Size</span>
        </div>
        <div className="h-px w-8 bg-muted" />
        <div className={cn(
          "flex items-center gap-2",
          currentStep >= 3 && "text-foreground font-medium"
        )}>
          <div className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center",
            currentStep >= 3 ? "bg-primary text-primary-foreground" : "bg-muted"
          )}>
            3
          </div>
          <span>Price</span>
        </div>
      </div>

      {/* Render Current Step */}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
    </div>
  )
}
