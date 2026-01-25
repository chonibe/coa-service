"use client"

import { useState } from "react"






import { Separator } from "@/components/ui/separator"
import { ChevronLeft, ChevronRight, Save, X, Loader2, Trash2, Copy, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ArtworkSeries, SeriesMember, UnlockType } from "@/types/artwork-series"
import { UnlockTypeCards } from "./UnlockTypeCards"
import { TimeBasedUnlockConfig } from "./TimeBasedUnlockConfig"
import { VIPUnlockConfig } from "./VIPUnlockConfig"
import { CoverArtUpload } from "./CoverArtUpload"
import { DeleteSeriesDialog } from "./DeleteSeriesDialog"
import { DuplicateSeriesDialog } from "./DuplicateSeriesDialog"

import { Card, CardContent, CardHeader, CardTitle, Button, Input, Textarea, Label, Alert, AlertDescription } from "@/components/ui"
interface SeriesSettingsSidebarProps {
  series: ArtworkSeries
  members: SeriesMember[]
  onUpdate: (updates: Partial<ArtworkSeries>) => Promise<void>
  onDelete: () => Promise<void>
  onDuplicate: (newName: string) => Promise<void>
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export function SeriesSettingsSidebar({
  series,
  members,
  onUpdate,
  onDelete,
  onDuplicate,
  collapsed = false,
  onCollapsedChange,
}: SeriesSettingsSidebarProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)

  // Edit form state
  const [editName, setEditName] = useState(series.name)
  const [editDescription, setEditDescription] = useState(series.description || "")
  const [editUnlockType, setEditUnlockType] = useState<UnlockType>(series.unlock_type)
  const [editUnlockConfig, setEditUnlockConfig] = useState<any>(series.unlock_config || {})

  const handleSave = async () => {
    setSaving(true)
    try {
      await onUpdate({
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        unlock_type: editUnlockType,
        unlock_config: editUnlockConfig,
      })
      setIsEditing(false)
    } catch (error) {
      console.error("Error saving series:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditName(series.name)
    setEditDescription(series.description || "")
    setEditUnlockType(series.unlock_type)
    setEditUnlockConfig(series.unlock_config || {})
    setIsEditing(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete()
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const handleDuplicate = async (newName: string) => {
    setIsDuplicating(true)
    try {
      await onDuplicate(newName)
    } finally {
      setIsDuplicating(false)
      setDuplicateDialogOpen(false)
    }
  }

  if (collapsed) {
    return (
      <div className="w-12 border-r bg-muted/20 flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onCollapsedChange?.(false)}
          className="mb-4"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="w-80 border-r bg-muted/20 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-background">
          <h2 className="font-semibold">Series Settings</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCollapsedChange?.(true)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="series-name">Series Name</Label>
              {isEditing ? (
                <Input
                  id="series-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Series name"
                />
              ) : (
                <div className="text-sm font-medium">{series.name}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="series-description">Description</Label>
              {isEditing ? (
                <Textarea
                  id="series-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Series description"
                  rows={4}
                />
              ) : (
                <div className="text-sm text-muted-foreground">
                  {series.description || "No description"}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Unlock Settings */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Unlock Settings</Label>
            
            {isEditing ? (
              <>
                <div className="space-y-3">
                  <Label className="text-sm font-normal text-muted-foreground">Unlock Type</Label>
                  <UnlockTypeCards
                    value={editUnlockType}
                    onChange={(type) => {
                      setEditUnlockType(type)
                      setEditUnlockConfig({})
                    }}
                  />
                </div>

                {editUnlockType === "time_based" && (
                  <div className="pt-4">
                    <TimeBasedUnlockConfig
                      value={editUnlockConfig}
                      onChange={setEditUnlockConfig}
                    />
                  </div>
                )}

                {editUnlockType === "vip" && (
                  <div className="pt-4">
                    <VIPUnlockConfig
                      value={editUnlockConfig}
                      onChange={setEditUnlockConfig}
                      seriesMembers={members}
                    />
                  </div>
                )}

                {editUnlockType === "threshold" && (
                  <div className="space-y-2 pt-4">
                    <Label htmlFor="required-count">Required Purchases</Label>
                    <Input
                      id="required-count"
                      type="number"
                      min="1"
                      value={editUnlockConfig.required_count || 1}
                      onChange={(e) =>
                        setEditUnlockConfig({
                          ...editUnlockConfig,
                          required_count: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Number of artworks collectors must purchase to unlock exclusive pieces.
                    </p>
                  </div>
                )}

                {editUnlockType === "sequential" && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Artworks will unlock in the order they are arranged in the collection view.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Type: </span>
                  <span className="font-medium">
                    {series.unlock_type === "any_purchase" && "Open Collection"}
                    {series.unlock_type === "sequential" && "Finish the Set"}
                    {series.unlock_type === "threshold" && `VIP (${series.unlock_config?.required_count || 0} required)`}
                    {series.unlock_type === "time_based" && "Time-Based"}
                    {series.unlock_type === "vip" && "VIP"}
                  </span>
                </div>
                {series.unlock_type === "threshold" && (
                  <div className="text-xs text-muted-foreground">
                    Requires {series.unlock_config?.required_count || 0} purchase{series.unlock_config?.required_count !== 1 ? "s" : ""} to unlock
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Cover Art */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Cover Art</Label>
            {isEditing ? (
              <CoverArtUpload
                value={series.thumbnail_url}
                onChange={async (url) => {
                  await onUpdate({ thumbnail_url: url })
                }}
                seriesId={series.id}
              />
            ) : (
              <div className="aspect-square rounded-lg overflow-hidden bg-muted border">
                {series.thumbnail_url ? (
                  <img
                    src={series.thumbnail_url}
                    alt={series.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                    No cover art
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Actions</Label>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => setDuplicateDialogOpen(true)}
                className="justify-start"
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicate Series
              </Button>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                className="justify-start"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Series
              </Button>
            </div>
          </div>
        </div>

        {/* Footer - Edit Controls */}
        <div className="p-4 border-t bg-background">
          {isEditing ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="w-full">
              Edit Settings
            </Button>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <DeleteSeriesDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        seriesName={series.name}
        memberCount={members.length}
        isDeleting={isDeleting}
      />

      <DuplicateSeriesDialog
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
        onConfirm={handleDuplicate}
        originalName={series.name}
        isDuplicating={isDuplicating}
      />
    </>
  )
}
