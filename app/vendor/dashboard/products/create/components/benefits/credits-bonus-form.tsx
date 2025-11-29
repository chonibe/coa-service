"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Coins, ArrowRight, Sparkles, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"

interface CreditsBonusFormProps {
  formData: {
    title: string
    description: string
    creditsAmount: number | null
  }
  setFormData: (data: any) => void
  seriesId?: string | null
}

export function CreditsBonusForm({ formData, setFormData, seriesId }: CreditsBonusFormProps) {
  const handleAmountChange = (value: string) => {
    const numValue = parseInt(value) || 0
    const newAmount = numValue > 0 ? numValue : null
    setFormData({ 
      creditsAmount: newAmount,
      // Auto-generate title if not set
      ...(newAmount && !formData.title ? { title: `${newAmount} Credits Bonus` } : {})
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-semibold text-primary">Step 1 of 2:</span>
        <span>Set credits amount</span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="credits-amount" className="text-base font-semibold">
          Credits Amount <span className="text-red-500">*</span>
        </Label>
        <Input
          id="credits-amount"
          type="number"
          min="1"
          placeholder="e.g., 50, 100, 200"
          value={formData.creditsAmount || ""}
          onChange={(e) => handleAmountChange(e.target.value)}
          className="text-lg h-12"
        />
        <p className="text-xs text-muted-foreground">
          Credits will be added to collector's account for their next purchase
        </p>
      </div>

      {formData.creditsAmount && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 rounded-lg p-4 space-y-3"
        >
          <h5 className="font-semibold text-sm flex items-center gap-2">
            <Coins className="h-4 w-4 text-green-600" />
            Circular Value Preview
          </h5>
          <div className="flex items-center justify-around text-center">
            <div className="flex-1 text-center">
              <div className="text-xs font-medium mb-1">When they purchase</div>
              <div className="text-sm">This artwork</div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 text-center">
              <div className="text-xs font-medium mb-1">They receive</div>
              <div className="text-sm font-semibold text-green-600">{formData.creditsAmount} Credits</div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 text-center">
              <div className="text-xs font-medium mb-1">They can use for</div>
              <div className="text-sm">Next artwork/series</div>
            </div>
          </div>
        </motion.div>
      )}

      {formData.creditsAmount && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 pt-4 border-t"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-semibold text-primary">Step 2 of 2:</span>
            <span>Describe the benefit</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-semibold">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder={`${formData.creditsAmount} Credits Bonus`}
              value={formData.title}
              onChange={(e) => setFormData({ title: e.target.value })}
              className="text-lg h-12"
            />
            <p className="text-xs text-muted-foreground">
              How this credits bonus will appear to collectors
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Explain how collectors can use these credits and what they can purchase..."
              value={formData.description}
              onChange={(e) => setFormData({ description: e.target.value })}
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.description.length}/200 characters
            </p>
          </div>
        </motion.div>
      )}

      {/* Circular Connection Visualization */}
      {formData.creditsAmount && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pt-4 border-t"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Sparkles className="h-4 w-4" />
            <span className="font-semibold">Circular Ecosystem</span>
          </div>
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs">
                  <TrendingUp className="h-3 w-3" />
                  <span className="font-medium">This benefit creates a circular connection:</span>
                </div>
                <div className="text-xs space-y-1 pl-5">
                  <div>• Collectors receive <span className="font-semibold">{formData.creditsAmount} credits</span> to use on future purchases</div>
                  <div>• This incentivizes them to return and purchase more of your work</div>
                  <div>• Creates a loyalty loop that keeps collectors engaged</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

