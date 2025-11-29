"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Crown, ArrowRight, Sparkles, Lock } from "lucide-react"
import { motion } from "framer-motion"

interface VIPArtworkUnlockFormProps {
  formData: {
    title: string
    description: string
    vipArtworkId: string | null
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

export function VIPArtworkUnlockForm({ formData, setFormData, seriesId }: VIPArtworkUnlockFormProps) {
  const [availableArtworks, setAvailableArtworks] = useState<VIPArtwork[]>([])
  const [loadingArtworks, setLoadingArtworks] = useState(false)
  const [selectedArtwork, setSelectedArtwork] = useState<VIPArtwork | null>(null)

  useEffect(() => {
    const fetchVIPArtworks = async () => {
      setLoadingArtworks(true)
      try {
        // Fetch artworks from VIP series (series with unlock_type = 'vip')
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

  const handleArtworkSelect = (artworkId: string) => {
    const artwork = availableArtworks.find((a) => a.id === artworkId)
    if (artwork) {
      setSelectedArtwork(artwork)
      setFormData({ vipArtworkId: artworkId })
      // Auto-generate title if not set
      if (!formData.title) {
        setFormData({ 
          vipArtworkId: artworkId,
          title: `Unlock: ${artwork.title}` 
        })
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-semibold text-primary">Step 1 of 2:</span>
        <span>Choose the VIP artwork to unlock</span>
      </div>

      <div className="space-y-2">
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
      </div>

      {selectedArtwork && (
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
              <div className="text-sm font-semibold text-purple-600">VIP Artwork</div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 text-center">
              <div className="text-xs font-medium mb-1">They can access</div>
              <div className="text-sm">{selectedArtwork.title}</div>
            </div>
          </div>
          {selectedArtwork.series_name && (
            <div className="text-xs text-center text-muted-foreground pt-2 border-t">
              From VIP Series: <span className="font-semibold">{selectedArtwork.series_name}</span>
            </div>
          )}
        </motion.div>
      )}

      {selectedArtwork && (
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
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder={`Unlock: ${selectedArtwork.title}`}
              value={formData.title}
              onChange={(e) => setFormData({ title: e.target.value })}
              className="text-lg h-12"
            />
            <p className="text-xs text-muted-foreground">
              A compelling title for this VIP artwork unlock
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Explain why this VIP artwork is special and what collectors will gain..."
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
      {selectedArtwork && (
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
                  <div>• Purchasing this artwork unlocks access to <span className="font-semibold">{selectedArtwork.title}</span></div>
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

