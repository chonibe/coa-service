"use client"

import { useState } from "react"






import { Percent, Calendar, Sparkles } from "lucide-react"
import { motion } from "framer-motion"

import { Label, Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Card, CardContent, Badge } from "@/components/ui"
interface DiscountFormProps {
  formData: {
    title: string
    description: string
    accessCode: string
    expiresAt: string
  }
  setFormData: (data: any) => void
}

type DiscountType = "percentage" | "fixed"

export function DiscountForm({ formData, setFormData }: DiscountFormProps) {
  const [discountType, setDiscountType] = useState<DiscountType>("percentage")
  const [discountValue, setDiscountValue] = useState("")

  const handleDiscountChange = (value: string) => {
    setDiscountValue(value)
    // Update title with discount info
    if (value) {
      const title = discountType === "percentage" 
        ? `${value}% Off`
        : `$${value} Off`
      setFormData({ ...formData, title })
    }
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-semibold text-primary">Step 1 of 3:</span>
        <span>Set discount amount</span>
      </div>

      {/* Discount Type */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">
          Discount Type <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setDiscountType("percentage")
              setDiscountValue("")
              setFormData({ ...formData, title: "" })
            }}
            className={`h-20 border-2 rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${
              discountType === "percentage"
                ? "border-primary bg-primary/10"
                : "border-muted hover:border-primary/50"
            }`}
          >
            <Percent className="h-6 w-6" />
            <span className="font-semibold">Percentage</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setDiscountType("fixed")
              setDiscountValue("")
              setFormData({ ...formData, title: "" })
            }}
            className={`h-20 border-2 rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${
              discountType === "fixed"
                ? "border-primary bg-primary/10"
                : "border-muted hover:border-primary/50"
            }`}
          >
            <span className="text-2xl font-bold">$</span>
            <span className="font-semibold">Fixed Amount</span>
          </button>
        </div>
      </div>

      {/* Discount Value */}
      <div className="space-y-2">
        <Label htmlFor="discount-value" className="text-base font-semibold">
          Discount Amount <span className="text-red-500">*</span>
        </Label>
        <div className="flex items-center gap-2">
          {discountType === "percentage" ? (
            <>
              <Input
                id="discount-value"
                type="number"
                min="1"
                max="100"
                placeholder="10"
                value={discountValue}
                onChange={(e) => handleDiscountChange(e.target.value)}
                className="text-lg h-12"
              />
              <span className="text-2xl font-bold">%</span>
            </>
          ) : (
            <>
              <span className="text-2xl font-bold">$</span>
              <Input
                id="discount-value"
                type="number"
                min="1"
                placeholder="25"
                value={discountValue}
                onChange={(e) => handleDiscountChange(e.target.value)}
                className="text-lg h-12"
              />
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {discountType === "percentage" 
            ? "Percentage off future purchases"
            : "Fixed dollar amount off future purchases"}
        </p>
      </div>

      {/* Title (auto-generated but editable) */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-base font-semibold">
          Discount Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          placeholder={discountValue ? (discountType === "percentage" ? `${discountValue}% Off` : `$${discountValue} Off`) : "e.g., 20% Off, $50 Off"}
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="text-lg h-12"
        />
      </div>

      {/* Description */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: discountValue ? 1 : 0.5 }}
        className="space-y-2 pt-4 border-t"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span className="font-semibold text-primary">Step 2 of 3:</span>
          <span>Add details</span>
        </div>
        <Label htmlFor="description">Discount Details</Label>
        <Textarea
          id="description"
          placeholder="Specify what this discount applies to: all future purchases, specific items, minimum purchase amount, etc..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          maxLength={300}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Clarify terms and conditions
          </p>
          <p className="text-xs text-muted-foreground">
            {formData.description.length}/300
          </p>
        </div>
      </motion.div>

      {/* Expiration & Access Code */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: discountValue ? 1 : 0.5 }}
        className="space-y-4 pt-4 border-t"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span className="font-semibold text-primary">Step 3 of 3:</span>
          <span>Set expiration (optional)</span>
        </div>
        <div className="space-y-2">
          <Label htmlFor="expires-at" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Expiration Date
          </Label>
          <Input
            id="expires-at"
            type="datetime-local"
            value={formData.expiresAt || ""}
            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            When does this discount expire? (Leave empty for no expiration)
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="access-code">Discount Code (Optional)</Label>
          <Input
            id="access-code"
            placeholder="e.g., COLLECTOR20"
            value={formData.accessCode}
            onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Optional code collectors will use to apply this discount
          </p>
        </div>
      </motion.div>

      {/* Preview */}
      {formData.title && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-4 border-t"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Sparkles className="h-4 w-4" />
            <span className="font-semibold">Collector Preview</span>
          </div>
          <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Percent className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{formData.title}</h4>
                    <Badge variant="outline" className="bg-yellow-500/10">
                      Discount
                    </Badge>
                  </div>
                  {formData.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {formData.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {formData.expiresAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Expires {new Date(formData.expiresAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    {formData.accessCode && (
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-semibold">{formData.accessCode}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

