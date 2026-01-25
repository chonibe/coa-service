"use client"

import { useState } from "react"







import { Loader2, Info } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { ArtworkSeries, UnlockType } from "@/types/artwork-series"
import { CollectionTypeSelector } from "./CollectionTypeSelector"
import { SmartConditionsBuilder } from "./SmartConditionsBuilder"
import { ArtworkSelector } from "./ArtworkSelector"
import { BehaviorBlocks } from "./BehaviorBlocks"

import { Card, CardContent, CardHeader, CardTitle, Button, Label, Input, Textarea, RadioGroup, RadioGroupItem, Alert, AlertDescription } from "@/components/ui"
interface ShopifyStyleSeriesFormProps {
  initialData?: Partial<ArtworkSeries>
  seriesId?: string
  onComplete: (seriesId: string) => void
  onCancel: () => void
}

interface SmartCondition {
  field: 'tag' | 'title' | 'type' | 'price' | 'created_at'
  operator: 'equals' | 'contains' | 'starts_with' | 'greater_than' | 'less_than' | 'before' | 'after'
  value: string | number
}

export function ShopifyStyleSeriesForm({
  initialData,
  seriesId,
  onComplete,
  onCancel,
}: ShopifyStyleSeriesFormProps) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [name, setName] = useState(initialData?.name || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [collectionType, setCollectionType] = useState<"manual" | "smart">(
    (initialData as any)?.collection_type || "manual"
  )
  const [smartConditions, setSmartConditions] = useState<SmartCondition[]>(
    (initialData as any)?.smart_conditions || []
  )
  const [smartMatch, setSmartMatch] = useState<"all" | "any">(
    (initialData as any)?.smart_match || "all"
  )
  const [sortOrder, setSortOrder] = useState<string>(
    (initialData as any)?.sort_order || "manual"
  )
  const [selectedArtworks, setSelectedArtworks] = useState<string[]>([])
  // Always sync to Shopify - no toggle needed for vendors
  const syncToShopify = true

  // Behavior settings
  const [unlockTypeEnabled, setUnlockTypeEnabled] = useState(!!initialData?.unlock_type)
  const [unlockType, setUnlockType] = useState<UnlockType>(
    initialData?.unlock_type || "any_purchase"
  )
  const [unlockConfig, setUnlockConfig] = useState<any>(initialData?.unlock_config || {})
  const [coverArtUrl, setCoverArtUrl] = useState(initialData?.thumbnail_url || "")
  const [milestoneEnabled, setMilestoneEnabled] = useState(
    !!(initialData as any)?.milestone_config
  )

  const canSave = () => {
    return name.trim().length > 0
  }

  const handleSave = async () => {
    if (!canSave()) {
      toast({
        title: "Validation Error",
        description: "Series name is required",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const payload: any = {
        name: name.trim(),
        description: description.trim() || undefined,
        collection_type: collectionType,
        sort_order: sortOrder,
        sync_to_shopify: syncToShopify,
        unlock_type: unlockTypeEnabled ? unlockType : "any_purchase",
        unlock_config: unlockTypeEnabled ? unlockConfig : {},
        thumbnail_url: coverArtUrl || undefined,
      }

      if (collectionType === "smart") {
        payload.smart_conditions = smartConditions
        payload.smart_match = smartMatch
      }

      const url = seriesId ? `/api/vendor/series/${seriesId}` : "/api/vendor/series"
      const method = seriesId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save series")
      }

      const data = await response.json()
      const savedSeriesId = seriesId || data.series.id

      // If manual collection and artworks selected, add them
      if (collectionType === "manual" && selectedArtworks.length > 0) {
        await fetch(`/api/vendor/series/${savedSeriesId}/members/bulk`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ submission_ids: selectedArtworks }),
        })
      }

      // If smart collection, sync artworks
      if (collectionType === "smart") {
        await fetch(`/api/vendor/series/${savedSeriesId}/sync-smart`, {
          method: "POST",
          credentials: "include",
        })
      }

      toast({
        title: "Success",
        description: seriesId ? "Series updated successfully" : "Series created successfully",
      })

      onComplete(savedSeriesId)
    } catch (error: any) {
      console.error("Error saving series:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save series",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 py-4 border-b">
        <h1 className="text-2xl font-semibold">
          {seriesId ? "Edit Series" : "Create Series"}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !canSave()}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Description */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Summer collection, Under $100, Staff picks"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this collection..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Collection Type */}
          <Card>
            <CardHeader>
              <CardTitle>Collection Type</CardTitle>
            </CardHeader>
            <CardContent>
              <CollectionTypeSelector
                value={collectionType}
                onChange={setCollectionType}
              />

              {collectionType === "smart" && (
                <div className="mt-4">
                  <SmartConditionsBuilder
                    conditions={smartConditions}
                    onChange={setSmartConditions}
                    match={smartMatch}
                    onMatchChange={setSmartMatch}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Artworks (Manual only) */}
          {collectionType === "manual" && (
            <Card>
              <CardHeader>
                <CardTitle>Artworks</CardTitle>
              </CardHeader>
              <CardContent>
                <ArtworkSelector
                  selectedArtworks={selectedArtworks}
                  onChange={setSelectedArtworks}
                  sortOrder={sortOrder}
                  onSortOrderChange={setSortOrder}
                  seriesId={seriesId}
                />
              </CardContent>
            </Card>
          )}

          {/* Series Behaviors */}
          <Card>
            <CardHeader>
              <CardTitle>Series Behaviors</CardTitle>
              <p className="text-sm text-muted-foreground">
                Optional features to customize collector experience
              </p>
            </CardHeader>
            <CardContent>
              <BehaviorBlocks
                unlockTypeEnabled={unlockTypeEnabled}
                onUnlockTypeEnabledChange={setUnlockTypeEnabled}
                unlockType={unlockType}
                onUnlockTypeChange={setUnlockType}
                unlockConfig={unlockConfig}
                onUnlockConfigChange={setUnlockConfig}
                coverArtUrl={coverArtUrl}
                onCoverArtUrlChange={setCoverArtUrl}
                milestoneEnabled={milestoneEnabled}
                onMilestoneEnabledChange={setMilestoneEnabled}
                seriesId={seriesId}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Organization */}
        <div className="space-y-6">
          {collectionType === "smart" && (
            <Card>
              <CardHeader>
                <CardTitle>Smart Collection Info</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Artworks matching your conditions will be automatically added to this series
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
