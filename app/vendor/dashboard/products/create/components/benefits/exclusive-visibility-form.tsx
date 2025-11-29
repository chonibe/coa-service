"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Eye, ArrowRight, Sparkles, Lock } from "lucide-react"
import { motion } from "framer-motion"

interface ExclusiveVisibilityFormProps {
  formData: {
    title: string
    description: string
    exclusiveVisibilitySeriesId: string | null
  }
  setFormData: (data: any) => void
  seriesId?: string | null
}

export function ExclusiveVisibilityForm({ formData, setFormData, seriesId }: ExclusiveVisibilityFormProps) {
  const [availableSeries, setAvailableSeries] = useState<Array<{ id: string; name: string; description?: string }>>([])
  const [loadingSeries, setLoadingSeries] = useState(false)
  const [selectedSeries, setSelectedSeries] = useState<{ id: string; name: string; description?: string } | null>(null)

  useEffect(() => {
    const fetchSeries = async () => {
      setLoadingSeries(true)
      try {
        const response = await fetch("/api/vendor/series/available", { credentials: "include" })
        if (response.ok) {
          const data = await response.json()
          setAvailableSeries(data.series || [])
          if (formData.exclusiveVisibilitySeriesId) {
            const found = data.series?.find((s: any) => s.id === formData.exclusiveVisibilitySeriesId)
            if (found) {
              setSelectedSeries(found)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching series:", error)
      } finally {
        setLoadingSeries(false)
      }
    }
    fetchSeries()
  }, [formData.exclusiveVisibilitySeriesId])

  const handleSeriesSelect = (seriesId: string) => {
    const series = availableSeries.find((s) => s.id === seriesId)
    if (series) {
      setSelectedSeries(series)
      setFormData({ exclusiveVisibilitySeriesId: seriesId })
      // Auto-generate title if not set
      if (!formData.title) {
        setFormData({ 
          exclusiveVisibilitySeriesId: seriesId,
          title: `Exclusive Access: ${series.name}` 
        })
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-semibold text-primary">Step 1 of 2:</span>
        <span>Choose the exclusive series</span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="exclusive-series" className="text-base font-semibold">
          Select Exclusive Series <span className="text-red-500">*</span>
        </Label>
        {loadingSeries ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading series...
          </div>
        ) : (
          <Select
            value={formData.exclusiveVisibilitySeriesId || ""}
            onValueChange={handleSeriesSelect}
          >
            <SelectTrigger id="exclusive-series" className="h-12">
              <SelectValue placeholder="Choose a series only visible to perk holders" />
            </SelectTrigger>
            <SelectContent>
              {availableSeries.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  No series available. Create a series first.
                </div>
              ) : (
                availableSeries.map((series) => (
                  <SelectItem key={series.id} value={series.id}>
                    {series.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        )}
        <p className="text-xs text-muted-foreground">
          This series will only be visible to collectors who purchase this artwork. Others won't see it at all.
        </p>
      </div>

      {selectedSeries && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20 border-indigo-200 rounded-lg p-4 space-y-3"
        >
          <h5 className="font-semibold text-sm flex items-center gap-2">
            <Eye className="h-4 w-4 text-indigo-600" />
            Exclusive Visibility Preview
          </h5>
          <div className="flex items-center justify-around text-center">
            <div className="flex-1 text-center">
              <div className="text-xs font-medium mb-1">When they purchase</div>
              <div className="text-sm">This artwork</div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 text-center">
              <div className="text-xs font-medium mb-1">They unlock</div>
              <div className="text-sm font-semibold text-indigo-600">Exclusive Visibility</div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 text-center">
              <div className="text-xs font-medium mb-1">They can see</div>
              <div className="text-sm">{selectedSeries.name}</div>
            </div>
          </div>
          <div className="text-xs text-center text-muted-foreground pt-2 border-t">
            <Lock className="h-3 w-3 inline mr-1" />
            This series is hidden from everyone else
          </div>
        </motion.div>
      )}

      {selectedSeries && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 pt-4 border-t"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-semibold text-primary">Step 2 of 2:</span>
            <span>Describe the exclusive access</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-semibold">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder={`Exclusive Access: ${selectedSeries.name}`}
              value={formData.title}
              onChange={(e) => setFormData({ title: e.target.value })}
              className="text-lg h-12"
            />
            <p className="text-xs text-muted-foreground">
              A compelling title for this exclusive visibility unlock
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Explain why this series is exclusive and what makes it special..."
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
      {selectedSeries && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pt-4 border-t"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Sparkles className="h-4 w-4" />
            <span className="font-semibold">Circular Ecosystem</span>
          </div>
          <Card className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20 border-indigo-200">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs">
                  <Lock className="h-3 w-3" />
                  <span className="font-medium">This benefit creates a circular connection:</span>
                </div>
                <div className="text-xs space-y-1 pl-5">
                  <div>• Purchasing this artwork reveals <span className="font-semibold">{selectedSeries.name}</span> to collectors</div>
                  <div>• This series is completely hidden from everyone else</div>
                  <div>• Creates exclusive value and incentivizes purchases</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

