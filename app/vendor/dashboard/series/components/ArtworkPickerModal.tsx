"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Image as ImageIcon, AlertCircle, Loader2, Package } from "lucide-react"
import { cn } from "@/lib/utils"

interface Artwork {
  id: string
  submission_id: string
  shopify_product_id?: string
  title: string
  image?: string
  tags?: string[]
  status?: string
}

interface ArtworkPickerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddArtworks: (submissionIds: string[]) => Promise<void>
  seriesId: string
  excludeSubmissionIds?: string[]
}

export function ArtworkPickerModal({
  open,
  onOpenChange,
  onAddArtworks,
  seriesId,
  excludeSubmissionIds = [],
}: ArtworkPickerModalProps) {
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string>("all")
  const [selectedArtworks, setSelectedArtworks] = useState<Set<string>>(new Set())
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (open) {
      fetchAvailableArtworks()
      setSelectedArtworks(new Set())
      setSearchQuery("")
      setSelectedTag("all")
    }
  }, [open, seriesId])

  const fetchAvailableArtworks = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all submissions
      const submissionsResponse = await fetch("/api/vendor/products/submissions", {
        credentials: "include",
      })

      if (!submissionsResponse.ok) {
        throw new Error("Failed to fetch submissions")
      }

      const submissionsData = await submissionsResponse.json()
      const submissions = submissionsData.submissions || []

      // Fetch artworks already in series to exclude them
      const artworksResponse = await fetch("/api/vendor/series/artworks", {
        credentials: "include",
      })

      let submissionIdsInSeries = new Set<string>()
      if (artworksResponse.ok) {
        const artworksData = await artworksResponse.json()
        const artworksInSeries = artworksData.artworks || []
        submissionIdsInSeries = new Set(
          artworksInSeries
            .filter((a: any) => a.submission_id)
            .map((a: any) => a.submission_id.toString())
        )
      }

      // Filter to available artworks (not in any series)
      const available = submissions
        .filter((sub: any) => {
          const isInSeries = submissionIdsInSeries.has(sub.id.toString())
          const isExcluded = excludeSubmissionIds.includes(sub.id.toString())
          return !isInSeries && !isExcluded
        })
        .map((sub: any) => {
          const productData = sub.product_data as any
          let image = null
          if (productData?.images) {
            if (Array.isArray(productData.images) && productData.images.length > 0) {
              const firstImg = productData.images[0]
              image = typeof firstImg === "string" ? firstImg : (firstImg?.src || firstImg?.url || null)
            } else if (typeof productData.images === "string") {
              image = productData.images
            }
          }

          return {
            id: sub.id,
            submission_id: sub.id,
            shopify_product_id: sub.shopify_product_id,
            title: productData?.title || "Untitled",
            image,
            tags: productData?.tags || [],
            status: sub.status,
          }
        })

      setArtworks(available)
    } catch (err: any) {
      console.error("Error fetching available artworks:", err)
      setError(err.message || "Failed to load artworks")
    } finally {
      setLoading(false)
    }
  }

  // Extract unique tags from all artworks
  const availableTags = useMemo(() => {
    const tagsSet = new Set<string>()
    artworks.forEach((artwork) => {
      artwork.tags?.forEach((tag) => {
        if (tag && tag.trim()) {
          tagsSet.add(tag.trim())
        }
      })
    })
    return Array.from(tagsSet).sort()
  }, [artworks])

  // Filter artworks by search and tag
  const filteredArtworks = useMemo(() => {
    let filtered = artworks

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((artwork) =>
        artwork.title.toLowerCase().includes(query)
      )
    }

    // Filter by tag
    if (selectedTag !== "all") {
      filtered = filtered.filter((artwork) =>
        artwork.tags?.some((tag) => tag === selectedTag)
      )
    }

    return filtered
  }, [artworks, searchQuery, selectedTag])

  const toggleArtwork = (submissionId: string) => {
    setSelectedArtworks((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId)
      } else {
        newSet.add(submissionId)
      }
      return newSet
    })
  }

  const toggleAll = () => {
    if (selectedArtworks.size === filteredArtworks.length) {
      setSelectedArtworks(new Set())
    } else {
      setSelectedArtworks(new Set(filteredArtworks.map((a) => a.submission_id)))
    }
  }

  const handleAddArtworks = async () => {
    if (selectedArtworks.size === 0) return

    setAdding(true)
    try {
      await onAddArtworks(Array.from(selectedArtworks))
      onOpenChange(false)
    } catch (err: any) {
      console.error("Error adding artworks:", err)
      setError(err.message || "Failed to add artworks")
    } finally {
      setAdding(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Artworks to Series</DialogTitle>
          <DialogDescription>
            Select artworks to add to this series. Only artworks not currently in any series are shown.
          </DialogDescription>
        </DialogHeader>

        {/* Search and Filter Bar */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search artworks by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {availableTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Artworks Grid */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array(8)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
            </div>
          ) : filteredArtworks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">
                {artworks.length === 0
                  ? "No available artworks. All artworks are already in series."
                  : "No artworks match your search criteria."}
              </p>
            </div>
          ) : (
            <>
              {/* Select All */}
              {filteredArtworks.length > 0 && (
                <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                  <Checkbox
                    checked={selectedArtworks.size === filteredArtworks.length && filteredArtworks.length > 0}
                    onCheckedChange={toggleAll}
                    id="select-all"
                  />
                  <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                    Select all ({filteredArtworks.length})
                  </label>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredArtworks.map((artwork) => {
                  const isSelected = selectedArtworks.has(artwork.submission_id)
                  return (
                    <div
                      key={artwork.id}
                      onClick={() => toggleArtwork(artwork.submission_id)}
                      className={cn(
                        "relative rounded-lg border-2 overflow-hidden cursor-pointer transition-all hover:shadow-md",
                        isSelected
                          ? "border-primary ring-2 ring-primary ring-offset-2"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {/* Checkbox */}
                      <div className="absolute top-2 left-2 z-10">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleArtwork(artwork.submission_id)}
                          className="bg-background shadow-md"
                        />
                      </div>

                      {/* Image */}
                      <div className="aspect-square bg-muted relative">
                        {artwork.image ? (
                          <img
                            src={artwork.image}
                            alt={artwork.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>

                      {/* Title and Tags */}
                      <div className="p-3 space-y-2">
                        <h4 className="font-medium text-sm line-clamp-2" title={artwork.title}>
                          {artwork.title}
                        </h4>
                        {artwork.tags && artwork.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {artwork.tags.slice(0, 2).map((tag, idx) => (
                              <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0">
                                {tag}
                              </Badge>
                            ))}
                            {artwork.tags.length > 2 && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                +{artwork.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="flex-row justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {selectedArtworks.size > 0 ? (
              <span className="font-medium text-foreground">
                {selectedArtworks.size} artwork{selectedArtworks.size !== 1 ? "s" : ""} selected
              </span>
            ) : (
              <span>No artworks selected</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={adding}>
              Cancel
            </Button>
            <Button
              onClick={handleAddArtworks}
              disabled={selectedArtworks.size === 0 || adding}
            >
              {adding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>Add {selectedArtworks.size > 0 ? selectedArtworks.size : ""} Artwork{selectedArtworks.size !== 1 ? "s" : ""}</>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
