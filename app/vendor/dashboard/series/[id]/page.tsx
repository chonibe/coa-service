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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2, ArrowLeft, Lock, Edit, Save, X, AlertCircle, ImageIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { ArtworkSeries, SeriesMember, UnlockType } from "@/types/artwork-series"

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
      fetchSeriesDetails() // Refresh data
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
        return "Any Purchase - Unlock all when any artwork is purchased"
      case "sequential":
        return "Sequential - Unlock artworks in order"
      case "threshold":
        return `Threshold - Unlock after purchasing ${series?.unlock_config?.required_count || 0} artworks`
      case "custom":
        return "Custom - Define custom unlock rules"
      default:
        return type
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
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
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Series
          </Button>
        )}
      </div>

      {/* Series Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Series Details</CardTitle>
            {isEditing && (
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
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
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
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-unlock-type">Unlock Type</Label>
                <Select
                  value={editUnlockType}
                  onValueChange={(value: UnlockType) => {
                    setEditUnlockType(value)
                    if (value === "threshold") {
                      setEditUnlockConfig({ required_count: editUnlockConfig.required_count || 1, unlocks: [] })
                    } else {
                      setEditUnlockConfig({})
                    }
                  }}
                >
                  <SelectTrigger id="edit-unlock-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any_purchase">Any Purchase</SelectItem>
                    <SelectItem value="sequential">Sequential</SelectItem>
                    <SelectItem value="threshold">Threshold</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-2xl font-bold">{series.name}</h2>
                {series.description && (
                  <p className="text-muted-foreground mt-2">{series.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{getUnlockTypeLabel(series.unlock_type)}</Badge>
                <Badge variant="outline">
                  {members.length} {members.length === 1 ? "artwork" : "artworks"}
                </Badge>
              </div>
              {series.thumbnail_url && (
                <div className="aspect-video rounded-lg overflow-hidden bg-muted max-w-md">
                  <img
                    src={series.thumbnail_url}
                    alt={series.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Series Members */}
      <Card>
        <CardHeader>
          <CardTitle>Series Artworks</CardTitle>
          <CardDescription>
            Artworks that are part of this series
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No artworks in this series yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="border rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {member.artwork_image && (
                      <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted">
                        <img
                          src={member.artwork_image}
                          alt={member.artwork_title || "Artwork"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold">{member.artwork_title || "Untitled Artwork"}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {member.is_locked && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            Locked
                          </Badge>
                        )}
                        {member.unlock_order && (
                          <Badge variant="outline">
                            Unlock Order: {member.unlock_order}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

