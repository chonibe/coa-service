"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import type { UnlockType } from "@/types/artwork-series"
import { UnlockTypeCards } from "./UnlockTypeCards"
import { TimeBasedUnlockConfig } from "./TimeBasedUnlockConfig"
import { VIPUnlockConfig } from "./VIPUnlockConfig"
import { CoverArtUpload } from "./CoverArtUpload"

interface BehaviorBlocksProps {
  unlockTypeEnabled: boolean
  onUnlockTypeEnabledChange: (enabled: boolean) => void
  unlockType: UnlockType
  onUnlockTypeChange: (type: UnlockType) => void
  unlockConfig: any
  onUnlockConfigChange: (config: any) => void
  coverArtUrl: string
  onCoverArtUrlChange: (url: string) => void
  milestoneEnabled: boolean
  onMilestoneEnabledChange: (enabled: boolean) => void
  seriesId?: string
}

export function BehaviorBlocks({
  unlockTypeEnabled,
  onUnlockTypeEnabledChange,
  unlockType,
  onUnlockTypeChange,
  unlockConfig,
  onUnlockConfigChange,
  coverArtUrl,
  onCoverArtUrlChange,
  milestoneEnabled,
  onMilestoneEnabledChange,
  seriesId,
}: BehaviorBlocksProps) {
  const [unlockExpanded, setUnlockExpanded] = useState(true)
  const [coverArtExpanded, setCoverArtExpanded] = useState(false)
  const [milestoneExpanded, setMilestoneExpanded] = useState(false)

  return (
    <div className="space-y-4">
      {/* Unlock Type Block */}
      <Card>
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Switch
                checked={unlockTypeEnabled}
                onCheckedChange={onUnlockTypeEnabledChange}
              />
              <div>
                <Label className="text-base font-semibold">Unlock Type</Label>
                <p className="text-sm text-muted-foreground">
                  How artworks unlock for collectors
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setUnlockExpanded(!unlockExpanded)}
            >
              {unlockExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        {unlockTypeEnabled && unlockExpanded && (
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="space-y-3">
              <Label className="text-sm">Select unlock behavior</Label>
              <UnlockTypeCards
                value={unlockType}
                onChange={(type) => {
                  onUnlockTypeChange(type)
                  onUnlockConfigChange({})
                }}
              />
            </div>

            {unlockType === "time_based" && (
              <TimeBasedUnlockConfig
                value={unlockConfig}
                onChange={onUnlockConfigChange}
              />
            )}

            {unlockType === "vip" && (
              <VIPUnlockConfig
                value={unlockConfig}
                onChange={onUnlockConfigChange}
                seriesMembers={[]}
              />
            )}

            {unlockType === "threshold" && (
              <div className="space-y-2">
                <Label htmlFor="required-count">Required Purchases</Label>
                <Input
                  id="required-count"
                  type="number"
                  min="1"
                  value={unlockConfig.required_count || 1}
                  onChange={(e) =>
                    onUnlockConfigChange({
                      ...unlockConfig,
                      required_count: parseInt(e.target.value) || 1,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Number of artworks collectors must purchase to unlock exclusive pieces
                </p>
              </div>
            )}

            {unlockType === "sequential" && (
              <p className="text-sm text-muted-foreground">
                Artworks will unlock in the order they are arranged
              </p>
            )}

            {unlockType === "any_purchase" && (
              <p className="text-sm text-muted-foreground">
                All artworks are immediately available for purchase
              </p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Cover Art Block */}
      <Card>
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div>
                <Label className="text-base font-semibold">Cover Art</Label>
                <p className="text-sm text-muted-foreground">
                  Custom series thumbnail
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCoverArtExpanded(!coverArtExpanded)}
            >
              {coverArtExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        {coverArtExpanded && (
          <CardContent className="p-4 pt-0">
            {seriesId ? (
              <CoverArtUpload
                value={coverArtUrl}
                onChange={onCoverArtUrlChange}
                seriesId={seriesId}
              />
            ) : (
              <Input
                placeholder="Cover art URL or upload after creating series"
                value={coverArtUrl}
                onChange={(e) => onCoverArtUrlChange(e.target.value)}
              />
            )}
          </CardContent>
        )}
      </Card>

      {/* Completion Milestones Block */}
      <Card>
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Switch
                checked={milestoneEnabled}
                onCheckedChange={onMilestoneEnabledChange}
              />
              <div>
                <Label className="text-base font-semibold">Completion Milestones</Label>
                <p className="text-sm text-muted-foreground">
                  Track series completion progress
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMilestoneExpanded(!milestoneExpanded)}
            >
              {milestoneExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        {milestoneEnabled && milestoneExpanded && (
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="completion-type">Completion Type</Label>
              <Select defaultValue="all_sold">
                <SelectTrigger id="completion-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_sold">All sold</SelectItem>
                  <SelectItem value="percentage_sold">Percentage sold</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
