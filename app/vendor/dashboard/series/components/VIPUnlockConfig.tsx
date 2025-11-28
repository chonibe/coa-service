"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Crown, Check } from "lucide-react"
import type { UnlockConfig } from "@/types/artwork-series"
import type { SeriesMember } from "@/types/artwork-series"

interface VIPUnlockConfigProps {
  value: UnlockConfig
  onChange: (config: UnlockConfig) => void
  seriesMembers?: SeriesMember[]
}

export function VIPUnlockConfig({
  value,
  onChange,
  seriesMembers = [],
}: VIPUnlockConfigProps) {
  const [selectedArtworks, setSelectedArtworks] = useState<string[]>(
    value.requires_ownership || []
  )

  useEffect(() => {
    onChange({
      ...value,
      requires_ownership: selectedArtworks,
    })
  }, [selectedArtworks])

  const toggleArtwork = (artworkId: string) => {
    setSelectedArtworks((prev) =>
      prev.includes(artworkId)
        ? prev.filter((id) => id !== artworkId)
        : [...prev, artworkId]
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          VIP Unlock Configuration
        </CardTitle>
        <CardDescription>
          Reward loyalty and make owning earlier pieces matter. Build a hierarchy that keeps
          collectors inside the ecosystem.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Required Ownership</Label>
          <p className="text-sm text-muted-foreground">
            Select which artworks collectors must own to unlock VIP pieces.
          </p>
          {seriesMembers.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {seriesMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => toggleArtwork(member.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    selectedArtworks.includes(member.id)
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {member.artwork_image && (
                      <img
                        src={member.artwork_image}
                        alt={member.artwork_title || "Artwork"}
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                    <div className="text-left">
                      <p className="font-medium text-sm">
                        {member.artwork_title || "Untitled Artwork"}
                      </p>
                    </div>
                  </div>
                  {selectedArtworks.includes(member.id) && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Add artworks to this series first to configure VIP unlocks.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Label htmlFor="vip-tier">Minimum VIP Tier (Optional)</Label>
          <Input
            id="vip-tier"
            type="number"
            min="0"
            max="5"
            value={value.vip_tier || ""}
            onChange={(e) => {
              onChange({
                ...value,
                vip_tier: e.target.value ? Number.parseInt(e.target.value, 10) : undefined,
              })
            }}
            placeholder="0-5"
          />
          <p className="text-xs text-muted-foreground">
            Require collectors to have a minimum VIP tier level (0-5).
          </p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="loyalty-points">Loyalty Points Required (Optional)</Label>
          <Input
            id="loyalty-points"
            type="number"
            min="0"
            value={value.loyalty_points_required || ""}
            onChange={(e) => {
              onChange({
                ...value,
                loyalty_points_required: e.target.value
                  ? Number.parseInt(e.target.value, 10)
                  : undefined,
              })
            }}
            placeholder="0"
          />
          <p className="text-xs text-muted-foreground">
            Require collectors to have a minimum number of loyalty points.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

