"use client"

import { useState, useEffect } from "react"




import { Crown, Check } from "lucide-react"
import type { UnlockConfig } from "@/types/artwork-series"
import type { SeriesMember } from "@/types/artwork-series"

import { Label, Input, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
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
        <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 mb-4">
          <p className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-2">
            💡 How VIP Unlocks Work:
          </p>
          <ul className="text-xs text-orange-800 dark:text-orange-200 space-y-1 list-disc list-inside">
            <li>Select artworks that collectors must <strong>own</strong> to unlock VIP pieces</li>
            <li>These can be from <strong>this series</strong> or <strong>any other series</strong> by you</li>
            <li>All artworks in this series that aren't selected as "required" will be <strong>VIP exclusives</strong></li>
            <li>Collectors who own the required pieces can purchase the VIP exclusives</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Label className="text-base font-semibold">Required Artworks to Own</Label>
          <p className="text-sm text-muted-foreground">
            Select which artworks collectors must <strong>already own</strong> to unlock VIP pieces in this series.
            These can be from this series or other series you've created.
          </p>
          {seriesMembers.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {seriesMembers.map((member) => {
                const isRequired = selectedArtworks.includes(member.id)
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleArtwork(member.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                      isRequired
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-900/30 shadow-sm"
                        : "border-muted hover:border-orange-300 hover:bg-muted/50"
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
                        <p className="text-xs text-muted-foreground">
                          {isRequired ? "✅ Required to unlock VIP pieces" : "🔒 Will be VIP exclusive"}
                        </p>
                      </div>
                    </div>
                    {isRequired && (
                      <Crown className="h-5 w-5 text-orange-600" />
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-muted border border-dashed text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Add artworks to this series first to configure VIP unlocks.
              </p>
              <p className="text-xs text-muted-foreground">
                Once you add artworks, you can select which ones collectors must own to unlock VIP pieces.
              </p>
            </div>
          )}
        </div>

        <div className="pt-4 border-t space-y-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs font-medium mb-2">Additional Requirements (Optional)</p>
            <p className="text-xs text-muted-foreground">
              You can also require VIP tier or loyalty points in addition to artwork ownership.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vip-tier" className="text-sm">VIP Tier (0-5)</Label>
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
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loyalty-points" className="text-sm">Loyalty Points</Label>
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
                placeholder="Optional"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

