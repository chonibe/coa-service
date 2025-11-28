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
import { Loader2, ArrowLeft, Lock, Edit, Save, X, AlertCircle, ImageIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"
import type { ArtworkSeries, SeriesMember, UnlockType } from "@/types/artwork-series"
import { ArtworkCarousel } from "../components/ArtworkCarousel"
import { UnlockProgress } from "../components/UnlockProgress"
import { CoverArtUpload } from "../components/CoverArtUpload"
import { TrackListing } from "../components/TrackListing"
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
        return "Any Purchase"
      case "sequential":
        return "Sequential"
      case "threshold":
        return `Threshold (${series?.unlock_config?.required_count || 0} required)`
      case "custom":
        return "Custom"
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
              <div>
                <h1 className="text-3xl font-bold mb-2">{series.name}</h1>
                <p className="text-muted-foreground">{series.vendor_name}</p>
              </div>
              
              {series.description && (
                <p className="text-base leading-relaxed">{series.description}</p>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <Badge variant="secondary">{getUnlockTypeLabel(series.unlock_type)}</Badge>
                  <UnlockTypeTooltip unlockType={series.unlock_type} />
                </div>
                <Badge variant="outline">
                  {totalCount} {totalCount === 1 ? "artwork" : "artworks"}
                </Badge>
              </div>

              {/* Unlock Progress */}
              {totalCount > 0 && (
                <div>
                  <UnlockProgress unlocked={unlockedCount} total={totalCount} />
                </div>
              )}
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
            <div className="space-y-6">
              {/* Artwork Carousel View */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Gallery View</h3>
                <ArtworkCarousel members={members} editable={true} seriesId={seriesId} />
              </div>
              
              {/* Track Listing View */}
              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Track Listing</h3>
                <TrackListing members={members} editable={true} seriesId={seriesId} />
              </div>
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
