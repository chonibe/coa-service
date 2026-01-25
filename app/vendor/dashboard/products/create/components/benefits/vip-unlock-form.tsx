"use client"

import { useState, useEffect } from "react"






import { Loader2, Crown, ArrowRight, Sparkles, Lock } from "lucide-react"
import { motion } from "framer-motion"


import { Label, Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Card, CardContent, Badge, Button } from "@/components/ui"
interface VIPUnlockFormProps {
  formData: {
    title: string
    description: string
    vipArtworkId: string | null
    vipSeriesId: string | null
  }
  setFormData: (data: any) => void
  seriesId?: string | null
}

interface VIPArtwork {
  id: string
  title: string
  series_name?: string
  price?: string
}

interface VIPSeries {
  id: string
  name: string
  description?: string
}

export function VIPUnlockForm({ formData, setFormData, seriesId }: VIPUnlockFormProps) {
  const [unlockType, setUnlockType] = useState<"artwork" | "series">("artwork")
  const [availableArtworks, setAvailableArtworks] = useState<VIPArtwork[]>([])
  const [availableSeries, setAvailableSeries] = useState<VIPSeries[]>([])
  const [loadingArtworks, setLoadingArtworks] = useState(false)
  const [loadingSeries, setLoadingSeries] = useState(false)
  const [selectedArtwork, setSelectedArtwork] = useState<VIPArtwork | null>(null)
  const [selectedSeries, setSelectedSeries] = useState<VIPSeries | null>(null)

  // Determine unlock type from existing data
  useEffect(() => {
    if (formData.vipSeriesId) {
      setUnlockType("series")
    } else if (formData.vipArtworkId) {
      setUnlockType("artwork")
    }
  }, [formData.vipArtworkId, formData.vipSeriesId])

  useEffect(() => {
    const fetchVIPArtworks = async () => {
      setLoadingArtworks(true)
      try {
        const response = await fetch("/api/vendor/products/vip-artworks", { credentials: "include" })
        if (response.ok) {
          const data = await response.json()
          setAvailableArtworks(data.artworks || [])
          if (formData.vipArtworkId) {
            const found = data.artworks?.find((a: VIPArtwork) => a.id === formData.vipArtworkId)
            if (found) {
              setSelectedArtwork(found)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching VIP artworks:", error)
      } finally {
        setLoadingArtworks(false)
      }
    }
    fetchVIPArtworks()
  }, [formData.vipArtworkId])

  useEffect(() => {
    const fetchVIPSeries = async () => {
      setLoadingSeries(true)
      try {
        const response = await fetch("/api/vendor/series/available", { credentials: "include" })
        if (response.ok) {
          const data = await response.json()
          // Filter to only VIP series
          const vipSeries = (data.series || []).filter((s: any) => s.unlock_type === "vip")
          setAvailableSeries(vipSeries)
          if (formData.vipSeriesId) {
            const found = vipSeries.find((s: VIPSeries) => s.id === formData.vipSeriesId)
            if (found) {
              setSelectedSeries(found)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching VIP series:", error)
      } finally {
        setLoadingSeries(false)
      }
    }
    fetchVIPSeries()
  }, [formData.vipSeriesId])

  const handleUnlockTypeChange = (type: "artwork" | "series") => {
    setUnlockType(type)
    // Clear the other type's selection
    if (type === "artwork") {
      setFormData({ vipSeriesId: null, vipArtworkId: null })
      setSelectedSeries(null)
    } else {
      setFormData({ vipArtworkId: null, vipSeriesId: null })
      setSelectedArtwork(null)
    }
  }

  const handleArtworkSelect = (artworkId: string) => {
    const artwork = availableArtworks.find((a) => a.id === artworkId)
    if (artwork) {
      setSelectedArtwork(artwork)
      setFormData({ vipArtworkId: artworkId, vipSeriesId: null })
      if (!formData.title) {
        setFormData({ 
          vipArtworkId: artworkId,
          vipSeriesId: null,
          title: `Unlock: ${artwork.title}` 
        })
      }
    }
  }

  const handleSeriesSelect = (seriesId: string) => {
    const series = availableSeries.find((s) => s.id === seriesId)
    if (series) {
      setSelectedSeries(series)
      setFormData({ vipSeriesId: seriesId, vipArtworkId: null })
      if (!formData.title) {
        setFormData({ 
          vipSeriesId: seriesId,
          vipArtworkId: null,
          title: `Unlock: ${series.name}` 
        })
      }
    }
  }

  const selectedItem = unlockType === "artwork" ? selectedArtwork : selectedSeries

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-semibold text-primary">Step 1 of 3:</span>
        <span>Choose unlock type</span>
      </div>

      {/* Unlock Type Selector */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">
          What will collectors unlock? <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant={unlockType === "artwork" ? "default" : "outline"}
            onClick={() => handleUnlockTypeChange("artwork")}
            className="h-24 flex flex-col gap-2 items-center justify-center"
          >
            <Crown className="h-5 w-5" />
            <span className="font-semibold">VIP Artwork</span>
            <span className="text-xs text-muted-foreground">Single artwork</span>
          </Button>
          <Button
            type="button"
            variant={unlockType === "series" ? "default" : "outline"}
            onClick={() => handleUnlockTypeChange("series")}
            className="h-24 flex flex-col gap-2 items-center justify-center"
          >
            <Lock className="h-5 w-5" />
            <span className="font-semibold">VIP Series</span>
            <span className="text-xs text-muted-foreground">Entire series</span>
          </Button>
        </div>
      </div>

      {/* Artwork Selector */}
      {unlockType === "artwork" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <Label htmlFor="vip-artwork" className="text-base font-semibold">
            Select VIP Artwork <span className="text-red-500">*</span>
          </Label>
          {loadingArtworks ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading VIP artworks...
            </div>
          ) : (
            <Select
              value={formData.vipArtworkId || ""}
              onValueChange={handleArtworkSelect}
            >
              <SelectTrigger id="vip-artwork" className="h-12">
                <SelectValue placeholder="Choose an artwork from a VIP series" />
              </SelectTrigger>
              <SelectContent>
                {availableArtworks.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    No VIP artworks available. Create a VIP series first.
                  </div>
                ) : (
                  availableArtworks.map((artwork) => (
                    <SelectItem key={artwork.id} value={artwork.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{artwork.title}</span>
                        {artwork.series_name && (
                          <Badge variant="outline" className="ml-2">
                            {artwork.series_name}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
          <p className="text-xs text-muted-foreground">
            This artwork will only be accessible to collectors who purchase this artwork and meet VIP requirements.
          </p>
        </motion.div>
      )}

      {/* Series Selector */}
      {unlockType === "series" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <Label htmlFor="vip-series" className="text-base font-semibold">
            Select VIP Series <span className="text-red-500">*</span>
          </Label>
          {loadingSeries ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading VIP series...
            </div>
          ) : (
            <Select
              value={formData.vipSeriesId || ""}
              onValueChange={handleSeriesSelect}
            >
              <SelectTrigger id="vip-series" className="h-12">
                <SelectValue placeholder="Choose a VIP series to unlock" />
              </SelectTrigger>
              <SelectContent>
                {availableSeries.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    No VIP series available. Create a VIP series first.
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
            This entire series will be accessible to collectors who purchase this artwork and meet VIP requirements.
          </p>
        </motion.div>
      )}

      {/* Preview */}
      {selectedItem && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 rounded-lg p-4 space-y-3"
        >
          <h5 className="font-semibold text-sm flex items-center gap-2">
            <Crown className="h-4 w-4 text-purple-600" />
            Circular Unlock Preview
          </h5>
          <div className="flex items-center justify-around text-center">
            <div className="flex-1 text-center">
              <div className="text-xs font-medium mb-1">When they purchase</div>
              <div className="text-sm">This artwork</div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 text-center">
              <div className="text-xs font-medium mb-1">They unlock</div>
              <div className="text-sm font-semibold text-purple-600">
                VIP {unlockType === "artwork" ? "Artwork" : "Series"}
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 text-center">
              <div className="text-xs font-medium mb-1">They can access</div>
              <div className="text-sm">
                {unlockType === "artwork" 
                  ? (selectedItem as VIPArtwork).title 
                  : (selectedItem as VIPSeries).name}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Title and Description */}
      {selectedItem && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 pt-4 border-t"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-semibold text-primary">Step 2 of 3:</span>
            <span>Describe the unlock</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-semibold">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder={
                unlockType === "artwork"
                  ? `Unlock: ${(selectedItem as VIPArtwork).title}`
                  : `Unlock: ${(selectedItem as VIPSeries).name}`
              }
              value={formData.title}
              onChange={(e) => setFormData({ title: e.target.value })}
              className="text-lg h-12"
            />
            <p className="text-xs text-muted-foreground">
              A compelling title for this VIP unlock
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Explain why this VIP unlock is special and what collectors will gain..."
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
      {selectedItem && (
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
                  <div>• Purchasing this artwork unlocks access to <span className="font-semibold">
                    {unlockType === "artwork" 
                      ? (selectedItem as VIPArtwork).title 
                      : (selectedItem as VIPSeries).name}
                  </span></div>
                  <div>• This creates value for both artworks in your ecosystem</div>
                  <div>• Collectors are incentivized to collect more of your work</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

