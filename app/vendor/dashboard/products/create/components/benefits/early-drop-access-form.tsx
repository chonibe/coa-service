"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, ArrowRight, Sparkles, Calendar } from "lucide-react"
import { motion } from "framer-motion"

interface EarlyDropAccessFormProps {
  formData: {
    title: string
    description: string
    dropDate: string | null
  }
  setFormData: (data: any) => void
  seriesId?: string | null
}

export function EarlyDropAccessForm({ formData, setFormData, seriesId }: EarlyDropAccessFormProps) {
  const handleDateChange = (value: string) => {
    const newDate = value || null
    const updates: any = { dropDate: newDate }
    
    // Auto-generate title if not set
    if (newDate && !formData.title) {
      const date = new Date(newDate)
      const formattedDate = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      updates.title = `Early Access: ${formattedDate} Drop`
    }
    
    setFormData(updates)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-semibold text-primary">Step 1 of 2:</span>
        <span>Set drop date</span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="drop-date" className="text-base font-semibold">
          Drop Date <span className="text-red-500">*</span>
        </Label>
        <Input
          id="drop-date"
          type="datetime-local"
          value={formData.dropDate || ""}
          onChange={(e) => handleDateChange(e.target.value)}
          className="text-lg h-12"
        />
        <p className="text-xs text-muted-foreground">
          When collectors will get early access to the next drop (before public release)
        </p>
      </div>

      {formData.dropDate && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 rounded-lg p-4 space-y-3"
        >
          <h5 className="font-semibold text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            Early Access Preview
          </h5>
          <div className="flex items-center justify-around text-center">
            <div className="flex-1 text-center">
              <div className="text-xs font-medium mb-1">When they purchase</div>
              <div className="text-sm">This artwork</div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 text-center">
              <div className="text-xs font-medium mb-1">They get access</div>
              <div className="text-sm font-semibold text-blue-600">Early Drop</div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 text-center">
              <div className="text-xs font-medium mb-1">On</div>
              <div className="text-sm">
                {formData.dropDate 
                  ? new Date(formData.dropDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "Select date"
                }
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {formData.dropDate && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 pt-4 border-t"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-semibold text-primary">Step 2 of 2:</span>
            <span>Describe the early access</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-semibold">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Early Access: Next Drop"
              value={formData.title}
              onChange={(e) => setFormData({ title: e.target.value })}
              className="text-lg h-12"
            />
            <p className="text-xs text-muted-foreground">
              How this early access will appear to collectors
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Explain what collectors will get early access to and why it's special..."
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
      {formData.dropDate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pt-4 border-t"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Sparkles className="h-4 w-4" />
            <span className="font-semibold">Circular Ecosystem</span>
          </div>
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="h-3 w-3" />
                  <span className="font-medium">This benefit creates a circular connection:</span>
                </div>
                <div className="text-xs space-y-1 pl-5">
                  <div>• Collectors get early access to your next drop on <span className="font-semibold">{formData.dropDate ? new Date(formData.dropDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "selected date"}</span></div>
                  <div>• This creates anticipation and ensures collectors return for your next release</div>
                  <div>• Builds a cycle of engagement with your artwork ecosystem</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

