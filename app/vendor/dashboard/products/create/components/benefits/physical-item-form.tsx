"use client"

import { useState } from "react"





import { Package, Truck, Sparkles } from "lucide-react"
import { motion } from "framer-motion"

import { Label, Input, Textarea, Card, CardContent, Badge } from "@/components/ui"
interface PhysicalItemFormProps {
  formData: {
    title: string
    description: string
  }
  setFormData: (data: any) => void
}

export function PhysicalItemForm({ formData, setFormData }: PhysicalItemFormProps) {
  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-semibold text-primary">Step 1 of 3:</span>
        <span>Describe the item</span>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-base font-semibold">
          Item Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          placeholder="e.g., Signed Print, Limited Edition Poster, Artist Merchandise"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="text-lg h-12"
        />
        <p className="text-xs text-muted-foreground">
          What physical item will collectors receive?
        </p>
      </div>

      {/* Description */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-2 pt-4 border-t"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span className="font-semibold text-primary">Step 2 of 3:</span>
          <span>Item details</span>
        </div>
        <Label htmlFor="description">Item Description</Label>
        <Textarea
          id="description"
          placeholder="Describe the item: size, materials, special features, edition details, what makes it special..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={5}
          maxLength={500}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Help collectors understand what they're receiving
          </p>
          <p className="text-xs text-muted-foreground">
            {formData.description.length}/500
          </p>
        </div>
      </motion.div>

      {/* Shipping Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-3 pt-4 border-t"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span className="font-semibold text-primary">Step 3 of 3:</span>
          <span>Fulfillment notes</span>
        </div>
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Truck className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">Shipping Information</h4>
                <p className="text-xs text-muted-foreground">
                  Physical items will be shipped separately. Make sure to collect shipping addresses
                  from collectors when they claim this benefit. You'll be notified when a collector
                  claims this benefit so you can fulfill the order.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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
          <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Package className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{formData.title}</h4>
                    <Badge variant="outline" className="bg-orange-500/10">
                      Physical Item
                    </Badge>
                  </div>
                  {formData.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {formData.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                    <Truck className="h-3 w-3" />
                    <span>Will be shipped separately</span>
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

