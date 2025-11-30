"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import type { JourneyMapSettings } from "@/types/artwork-series"

interface JourneySettingsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mapSettings: JourneyMapSettings | null
  onSettingsUpdate: () => void
}

export function JourneySettingsPanel({
  open,
  onOpenChange,
  mapSettings,
  onSettingsUpdate,
}: JourneySettingsPanelProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [mapStyle, setMapStyle] = useState<string>("island")
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>("")
  const [themeColors, setThemeColors] = useState<Record<string, any>>({})

  useEffect(() => {
    if (mapSettings) {
      setMapStyle(mapSettings.map_style || "island")
      setBackgroundImageUrl(mapSettings.background_image_url || "")
      setThemeColors(mapSettings.theme_colors || {})
    }
  }, [mapSettings])

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/vendor/journey-map/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          map_style: mapStyle,
          background_image_url: backgroundImageUrl || null,
          theme_colors: themeColors,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update settings")
      }

      toast({
        title: "Success",
        description: "Journey map settings updated successfully",
      })

      onSettingsUpdate()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error updating settings:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Journey Map Settings</DialogTitle>
          <DialogDescription>
            Customize the appearance and style of your journey map
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Map Style */}
          <div className="space-y-2">
            <Label htmlFor="map-style">Map Style</Label>
            <Select value={mapStyle} onValueChange={setMapStyle}>
              <SelectTrigger id="map-style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="island">Island Style</SelectItem>
                <SelectItem value="timeline">Timeline Style</SelectItem>
                <SelectItem value="level">Level Style</SelectItem>
                <SelectItem value="custom">Custom Style</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose how series are displayed on your journey map
            </p>
          </div>

          {/* Background Image */}
          <div className="space-y-2">
            <Label htmlFor="background-image">Background Image URL</Label>
            <Input
              id="background-image"
              type="url"
              value={backgroundImageUrl}
              onChange={(e) => setBackgroundImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-xs text-muted-foreground">
              Optional: Add a custom background image for your journey map
            </p>
          </div>

          {/* Preview */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <p className="text-sm font-medium mb-2">Preview</p>
            <p className="text-xs text-muted-foreground">
              Map Style: <span className="font-medium">{mapStyle}</span>
            </p>
            {backgroundImageUrl && (
              <p className="text-xs text-muted-foreground">
                Background: <span className="font-medium">Custom Image</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
