"use client"

import { useState, useEffect, useMemo } from "react"





import { Skeleton } from "@/components/ui"

import { Search, Plus, X, Image as ImageIcon, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

import { Input, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Card, Badge, Alert, AlertDescription } from "@/components/ui"
interface ArtworkSelectorProps {
  selectedArtworks: string[]
  onChange: (artworks: string[]) => void
  sortOrder: string
  onSortOrderChange: (order: string) => void
  seriesId?: string
}

interface Artwork {
  id: string
  submission_id: string
  title: string
  image?: string
  tags?: string[]
}

export function ArtworkSelector({
  selectedArtworks,
  onChange,
  sortOrder,
  onSortOrderChange,
  seriesId,
}: ArtworkSelectorProps) {
  const [availableArtworks, setAvailableArtworks] = useState<Artwork[]>([])
  const [selectedArtworksData, setSelectedArtworksData] = useState<Artwork[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showBrowser, setShowBrowser] = useState(false)

  useEffect(() => {
    fetchArtworks()
  }, [seriesId])

  const fetchArtworks = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all submissions
      const submissionsResponse = await fetch("/api/vendor/products/submissions", {
        credentials: "include",
      })

      if (!submissionsResponse.ok) {
        throw new Error("Failed to fetch artworks")
      }

      const submissionsData = await submissionsResponse.json()
      const submissions = submissionsData.submissions || []

      // Fetch artworks already in series
      let existingSubmissionIds = new Set<string>()
      if (seriesId) {
        const membersResponse = await fetch(`/api/vendor/series/${seriesId}/members`, {
          credentials: "include",
        })
        if (membersResponse.ok) {
          const membersData = await membersResponse.json()
          existingSubmissionIds = new Set(
            membersData.members
              .map((m: any) => m.submission_id)
              .filter(Boolean)
          )
        }
      }

      // Map submissions to artwork objects
      const artworks = submissions.map((sub: any) => {
        const productData = sub.product_data as any
        let image = null
        if (productData?.images) {
          if (Array.isArray(productData.images) && productData.images.length > 0) {
            const firstImg = productData.images[0]
            image = typeof firstImg === "string" ? firstImg : (firstImg?.src || firstImg?.url || null)
          }
        }

        return {
          id: sub.id,
          submission_id: sub.id,
          title: productData?.title || "Untitled",
          image,
          tags: productData?.tags || [],
        }
      })

      // Filter out artworks already in this series
      const available = artworks.filter(
        (a: Artwork) => !existingSubmissionIds.has(a.submission_id)
      )

      // Get selected artworks data
      const selected = artworks.filter((a: Artwork) =>
        selectedArtworks.includes(a.submission_id)
      )

      setAvailableArtworks(available)
      setSelectedArtworksData(selected)
    } catch (err: any) {
      console.error("Error fetching artworks:", err)
      setError(err.message || "Failed to load artworks")
    } finally {
      setLoading(false)
    }
  }

  const filteredArtworks = useMemo(() => {
    if (!searchQuery.trim()) return availableArtworks

    const query = searchQuery.toLowerCase()
    return availableArtworks.filter((artwork) =>
      artwork.title.toLowerCase().includes(query)
    )
  }, [availableArtworks, searchQuery])

  const handleAddArtwork = (submissionId: string) => {
    if (!selectedArtworks.includes(submissionId)) {
      onChange([...selectedArtworks, submissionId])
      
      // Move from available to selected
      const artwork = availableArtworks.find((a) => a.submission_id === submissionId)
      if (artwork) {
        setSelectedArtworksData([...selectedArtworksData, artwork])
        setAvailableArtworks(availableArtworks.filter((a) => a.submission_id !== submissionId))
      }
    }
  }

  const handleRemoveArtwork = (submissionId: string) => {
    onChange(selectedArtworks.filter((id) => id !== submissionId))
    
    // Move from selected to available
    const artwork = selectedArtworksData.find((a) => a.submission_id === submissionId)
    if (artwork) {
      setAvailableArtworks([...availableArtworks, artwork])
      setSelectedArtworksData(selectedArtworksData.filter((a) => a.submission_id !== submissionId))
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Sort */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search artworks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowBrowser(!showBrowser)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Browse
        </Button>
      </div>

      {/* Sort Order */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Sort:</span>
        <Select value={sortOrder} onValueChange={onSortOrderChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="alphabetical">Alphabetical</SelectItem>
            <SelectItem value="created_desc">Date created (newest first)</SelectItem>
            <SelectItem value="created_asc">Date created (oldest first)</SelectItem>
            <SelectItem value="price_asc">Price (low to high)</SelectItem>
            <SelectItem value="price_desc">Price (high to low)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Selected Artworks */}
      {selectedArtworksData.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Selected Artworks ({selectedArtworksData.length})</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {selectedArtworksData.map((artwork) => (
              <Card key={artwork.id} className="relative group overflow-hidden">
                <div className="aspect-square bg-muted relative">
                  {artwork.image ? (
                    <img
                      src={artwork.image}
                      alt={artwork.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveArtwork(artwork.submission_id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium truncate">{artwork.title}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Browse Available Artworks */}
      {showBrowser && (
        <div className="space-y-2 border rounded-lg p-4">
          <h4 className="text-sm font-medium">Available Artworks</h4>
          {filteredArtworks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {searchQuery ? "No artworks match your search" : "No artworks available"}
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredArtworks.map((artwork) => (
                <Card
                  key={artwork.id}
                  className="relative group overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary"
                  onClick={() => handleAddArtwork(artwork.submission_id)}
                >
                  <div className="aspect-square bg-muted relative">
                    {artwork.image ? (
                      <img
                        src={artwork.image}
                        alt={artwork.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Plus className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{artwork.title}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
