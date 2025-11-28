"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, Lock, Edit, Save, X, AlertCircle, ImageIcon, ArrowRight, Crown, Clock } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { ArtworkSeries, SeriesMember, UnlockType } from "@/types/artwork-series"
import { ArtworkCarousel } from "../components/ArtworkCarousel"
import { UnlockProgress } from "../components/UnlockProgress"
import { CoverArtUpload } from "../components/CoverArtUpload"
import { CoverArtDesigner } from "../components/CoverArtDesigner"
import { DeleteSeriesDialog } from "../components/DeleteSeriesDialog"
import { DuplicateSeriesDialog } from "../components/DuplicateSeriesDialog"
import { UnlockTypeTooltip } from "../components/UnlockTypeTooltip"
import { UnlockCountdown } from "../components/UnlockCountdown"
import { VIPBadge } from "../components/VIPBadge"
import { Copy, Trash2 } from "lucide-react"

export default function SeriesDetailPage() {
  const router = useRouter()
  const params = useParams()
  const seriesId = params?.id as string
  const { toast } = useToast()

  const [series, setSeries] = useState<ArtworkSeries | null>(null)
  const [members, setMembers] = useState<SeriesMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)

  // Edit form state
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editUnlockType, setEditUnlockType] = useState<UnlockType>("any_purchase")
  const [editUnlockConfig, setEditUnlockConfig] = useState<any>({})

  useEffect(() => {
    if (seriesId) {
      fetchSeriesDetails()
    }
  }, [seriesId])

  const fetchSeriesDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/vendor/series/${seriesId}`, {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setSeries(data.series)
        setMembers(data.members || [])
        
        // Initialize edit form
        setEditName(data.series.name)
        setEditDescription(data.series.description || "")
        setEditUnlockType(data.series.unlock_type)
        setEditUnlockConfig(data.series.unlock_config || {})
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to load series")
      }
    } catch (err: any) {
      console.error("Error fetching series:", err)
      setError(err.message || "Failed to load series")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!series) return

    setSaving(true)
    try {
      const response = await fetch(`/api/vendor/series/${seriesId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || undefined,
          unlock_type: editUnlockType,
          unlock_config: editUnlockConfig,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update series")
      }

      toast({
        title: "Success",
        description: "Series updated successfully",
      })

      setIsEditing(false)
      fetchSeriesDetails()
    } catch (error: any) {
      console.error("Error saving series:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update series",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    if (series) {
      setEditName(series.name)
      setEditDescription(series.description || "")
      setEditUnlockType(series.unlock_type)
      setEditUnlockConfig(series.unlock_config || {})
    }
    setIsEditing(false)
  }

  const getUnlockTypeLabel = (type: string) => {
    switch (type) {
      case "any_purchase":
        return "Open Collection"
      case "sequential":
        return "Finish the Set"
      case "threshold":
        return `VIP (${series?.unlock_config?.required_count || 0} required)`
      case "time_based":
        return "Time-Based"
      case "vip":
        return "VIP"
      default:
        return type
    }
  }

  const unlockedCount = members.filter((m) => !m.is_locked).length
  const totalCount = members.length

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="aspect-square" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (error || !series) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.push("/vendor/dashboard/series")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Series
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Series not found"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push("/vendor/dashboard/series")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Series
        </Button>
        {!isEditing && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDuplicateDialogOpen(true)
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Series
          </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Instagram-style layout: Cover art on left, info on right */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Cover Art */}
        {isEditing ? (
          <div className="aspect-square">
            <CoverArtUpload
              value={series.thumbnail_url}
              onChange={async (url) => {
                // Update local state immediately
                if (series) {
                  setSeries({ ...series, thumbnail_url: url })
                }
                // Upload will happen automatically via the component
              }}
              seriesId={seriesId}
            />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="aspect-square rounded-lg overflow-hidden bg-muted border"
          >
            {series.thumbnail_url ? (
              <img
                src={series.thumbnail_url}
                alt={series.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-16 w-16 text-muted-foreground/50" />
              </div>
            )}
          </motion.div>
        )}

        {/* Series Info */}
        <div className="space-y-6">
          {isEditing ? (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
                  <CardTitle>Edit Series</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={saving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
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
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Series Name</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                    rows={4}
                />
              </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {series.unlock_type === "any_purchase" && (
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        <Lock className="h-5 w-5" />
                      </div>
                    )}
                    {series.unlock_type === "sequential" && (
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    )}
                    {(series.unlock_type === "threshold" || series.unlock_type === "vip") && (
                      <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                        <Crown className="h-5 w-5" />
                      </div>
                    )}
                    {series.unlock_type === "time_based" && (
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                        <Clock className="h-5 w-5" />
                      </div>
                    )}
              <div>
                      <h1 className="text-3xl font-bold">{series.name}</h1>
                      <p className="text-muted-foreground text-sm mt-1">{series.vendor_name}</p>
                    </div>
                  </div>
                  
                {series.description && (
                    <p className="text-base leading-relaxed mt-3">{series.description}</p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap mt-4">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-sm border-2",
                        series.unlock_type === "any_purchase" && "border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
                        series.unlock_type === "sequential" && "border-purple-400 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300",
                        (series.unlock_type === "threshold" || series.unlock_type === "vip") && "border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300",
                        series.unlock_type === "time_based" && "border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                      )}
                    >
                      {series.unlock_type === "any_purchase" && <Lock className="h-3 w-3 mr-1" />}
                      {series.unlock_type === "sequential" && <ArrowRight className="h-3 w-3 mr-1" />}
                      {(series.unlock_type === "threshold" || series.unlock_type === "vip") && <Crown className="h-3 w-3 mr-1" />}
                      {series.unlock_type === "time_based" && <Clock className="h-3 w-3 mr-1" />}
                      {getUnlockTypeLabel(series.unlock_type)}
                    </Badge>
                    <UnlockTypeTooltip unlockType={series.unlock_type} />
                <Badge variant="outline">
                      {totalCount} {totalCount === 1 ? "artwork" : "artworks"}
                </Badge>
              </div>

                  {/* Type-specific information displays */}
                  <div className="mt-4 space-y-3">
                    {/* Sequential: Show progress */}
                    {series.unlock_type === "sequential" && totalCount > 0 && (
                      <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-2 mb-2">
                          <ArrowRight className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                            Sequential Unlock Progress
                          </span>
                        </div>
                        <UnlockProgress unlocked={unlockedCount} total={totalCount} />
                        <p className="text-xs text-purple-700 dark:text-purple-300 mt-2">
                          Artworks unlock in order: {unlockedCount} of {totalCount} available
                        </p>
                      </div>
                    )}

                    {/* Threshold: Show requirements */}
                    {series.unlock_type === "threshold" && (
                      <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Crown className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          <span className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                            VIP Unlock Requirements
                          </span>
                        </div>
                        <p className="text-sm text-orange-800 dark:text-orange-200">
                          Collectors need to purchase <strong>{series.unlock_config?.required_count || 0}</strong> artwork{series.unlock_config?.required_count !== 1 ? 's' : ''} to unlock exclusive pieces
                        </p>
                        {series.unlock_config?.unlocks && series.unlock_config.unlocks.length > 0 && (
                          <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                            {series.unlock_config.unlocks.length} exclusive artwork{series.unlock_config.unlocks.length !== 1 ? 's' : ''} will unlock
                          </p>
                        )}
                      </div>
                    )}

                    {/* Time-based: Show countdown */}
                    {series.unlock_type === "time_based" && (
                      <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm font-semibold text-green-900 dark:text-green-100">
                            Time-Based Unlock Schedule
                          </span>
                        </div>
                        <UnlockCountdown
                          unlockAt={series.unlock_config?.unlock_at}
                          unlockSchedule={series.unlock_config?.unlock_schedule}
                        />
                        {series.unlock_config?.unlock_at && (
                          <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                            Unlocks at: {new Date(series.unlock_config.unlock_at).toLocaleString()}
                          </p>
                        )}
                        {series.unlock_config?.unlock_schedule && (
                          <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                            Schedule: {series.unlock_config.unlock_schedule.type} at {series.unlock_config.unlock_schedule.time}
                          </p>
                        )}
                      </div>
                    )}

                    {/* VIP: Show requirements */}
                    {series.unlock_type === "vip" && (
                      <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Crown className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          <span className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                            VIP Unlock Requirements
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-orange-800 dark:text-orange-200">
                          {series.unlock_config?.requires_ownership && series.unlock_config.requires_ownership.length > 0 && (
                            <p>
                              Must own <strong>{series.unlock_config.requires_ownership.length}</strong> specific artwork{series.unlock_config.requires_ownership.length !== 1 ? 's' : ''}
                            </p>
                          )}
                          {series.unlock_config?.vip_tier !== undefined && (
                            <p>
                              Requires VIP Tier <strong>{series.unlock_config.vip_tier}</strong> or higher
                            </p>
                          )}
                          {series.unlock_config?.loyalty_points_required !== undefined && (
                            <p>
                              Requires <strong>{series.unlock_config.loyalty_points_required}</strong> loyalty points
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Any Purchase: Show open status */}
                    {series.unlock_type === "any_purchase" && (
                      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                            Open Collection
                          </span>
                        </div>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                          All artworks are immediately available for purchase. No unlocking required.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Artwork Collection */}
      <Card>
        <CardHeader>
          <CardTitle>Artwork Collection</CardTitle>
          <CardDescription>
            Artworks that are part of this series
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No artworks in this series yet.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push("/vendor/dashboard/products/create")}
              >
                Add Artwork to Series
              </Button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-muted-foreground">Artworks</h3>
                <span className="text-xs text-muted-foreground">Drag to reorder</span>
                      </div>
              <ArtworkCarousel members={members} editable={true} seriesId={seriesId} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      {series && (
        <>
          <DeleteSeriesDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={async () => {
              setIsDeleting(true)
              try {
                const response = await fetch(`/api/vendor/series/${seriesId}`, {
                  method: "DELETE",
                  credentials: "include",
                })

                if (!response.ok) {
                  const errorData = await response.json()
                  throw new Error(errorData.error || "Failed to delete series")
                }

                toast({
                  title: "Success",
                  description: "Series deleted successfully",
                })

                router.push("/vendor/dashboard/series")
              } catch (error: any) {
                console.error("Error deleting series:", error)
                toast({
                  title: "Error",
                  description: error.message || "Failed to delete series",
                  variant: "destructive",
                })
              } finally {
                setIsDeleting(false)
                setDeleteDialogOpen(false)
              }
            }}
            seriesName={series.name}
            memberCount={totalCount}
            isDeleting={isDeleting}
          />

          {/* Duplicate Dialog */}
          <DuplicateSeriesDialog
            open={duplicateDialogOpen}
            onOpenChange={setDuplicateDialogOpen}
            onConfirm={async (newName: string) => {
              setIsDuplicating(true)
              try {
                const response = await fetch(`/api/vendor/series/${seriesId}/duplicate`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  credentials: "include",
                  body: JSON.stringify({ newName }),
                })

                if (!response.ok) {
                  const errorData = await response.json()
                  throw new Error(errorData.error || "Failed to duplicate series")
                }

                const data = await response.json()
                toast({
                  title: "Success",
                  description: "Series duplicated successfully",
                })

                router.push(`/vendor/dashboard/series/${data.series.id}`)
              } catch (error: any) {
                console.error("Error duplicating series:", error)
                toast({
                  title: "Error",
                  description: error.message || "Failed to duplicate series",
                  variant: "destructive",
                })
              } finally {
                setIsDuplicating(false)
                setDuplicateDialogOpen(false)
              }
            }}
            originalName={series.name}
            isDuplicating={isDuplicating}
          />
        </>
      )}
    </div>
  )
}
