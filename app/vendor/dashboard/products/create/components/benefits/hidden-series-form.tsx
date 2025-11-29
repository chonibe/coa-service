"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Lock, ArrowRight, Sparkles } from "lucide-react"
import { motion } from "framer-motion"

interface HiddenSeriesFormProps {
  formData: {
    title: string
    description: string
    hiddenSeriesId: string | null
  }
  setFormData: (data: any) => void
  seriesId?: string | null
}

export function HiddenSeriesForm({ formData, setFormData, seriesId }: HiddenSeriesFormProps) {
  const [availableSeries, setAvailableSeries] = useState<Array<{ id: string; name: string; description?: string }>>([])
  const [loadingSeries, setLoadingSeries] = useState(false)
  const [selectedSeries, setSelectedSeries] = useState<{ id: string; name: string; description?: string } | null>(null)

  useEffect(() => {
    const fetchSeries = async () => {
      setLoadingSeries(true)
      try {
        const response = await fetch("/api/vendor/series/available", {
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          setAvailableSeries(data.series || [])
          
          // If formData already has a hiddenSeriesId, find and set the selected series
          if (formData.hiddenSeriesId) {
            const found = data.series?.find((s: any) => s.id === formData.hiddenSeriesId)
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
  }, [formData.hiddenSeriesId])

  const handleSeriesSelect = (seriesId: string) => {
    const series = availableSeries.find((s) => s.id === seriesId)
    if (series) {
      setSelectedSeries(series)
      setFormData({ hiddenSeriesId: seriesId })
    }
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-semibold text-primary">Step 1 of 2:</span>
        <span>Choose the hidden series</span>
      </div>

      {/* Series Selector */}
      <div className="space-y-3">
        <Label htmlFor="hidden-series" className="text-base font-semibold">
          Which series will collectors unlock? <span className="text-red-500">*</span>
        </Label>
        <p className="text-sm text-muted-foreground">
          Select a series that will only be accessible to collectors who purchase this artwork
        </p>
        {loadingSeries ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading your series...
          </div>
        ) : (
          <Select
            value={formData.hiddenSeriesId || ""}
            onValueChange={handleSeriesSelect}
          >
            <SelectTrigger id="hidden-series" className="h-12">
              <SelectValue placeholder="Choose a series to unlock" />
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
      </div>

      {/* Series Preview Card */}
      {selectedSeries && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Lock className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{selectedSeries.name}</h4>
                    <Badge variant="default" className="bg-amber-500">
                      Hidden Series
                    </Badge>
                  </div>
                  {selectedSeries.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {selectedSeries.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3" />
                    <span>Exclusive access for collectors</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Collector Journey Visualization */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Collector Journey</Label>
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
              <div className="flex-1 text-center">
                <div className="text-xs font-medium mb-1">When they purchase</div>
                <div className="text-sm">This artwork</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 text-center">
                <div className="text-xs font-medium mb-1">They unlock</div>
                <div className="text-sm font-semibold text-amber-600">Hidden Series</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 text-center">
                <div className="text-xs font-medium mb-1">They can access</div>
                <div className="text-sm">{selectedSeries.name}</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Step 2: Title and Description */}
      {selectedSeries && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 pt-4 border-t"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-semibold text-primary">Step 2 of 2:</span>
            <span>Describe the unlock</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-semibold">
              Unlock Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Unlock Hidden Series: [Series Name]"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="text-lg h-12"
            />
            <p className="text-xs text-muted-foreground">
              How this unlock will appear to collectors
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">What makes this series special?</Label>
            <Textarea
              id="description"
              placeholder="Tell collectors why this hidden series is exclusive and valuable..."
              value={formData.description}
              onChange={(e) => setFormData({ description: e.target.value })}
              rows={4}
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.description.length}/300
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
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs">
                  <Lock className="h-3 w-3" />
                  <span className="font-medium">This benefit creates a circular connection:</span>
                </div>
                <div className="text-xs space-y-1 pl-5">
                  <div>• Purchasing this artwork unlocks access to <span className="font-semibold">{selectedSeries.name}</span></div>
                  <div>• This series is only accessible to collectors who purchase this artwork</div>
                  <div>• Creates value for both artworks and incentivizes collecting more of your work</div>
                  <div>• The hidden series can have its own benefits that unlock even more content</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

