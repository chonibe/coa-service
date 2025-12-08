"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ProductTable } from "../components/product-table"
import { useVendorData } from "@/hooks/use-vendor-data"
import { Plus, Package, Clock, XCircle, Trash2, Loader2, Sparkles, AlertCircle, Lock, ArrowRight, Crown, ImageIcon, GripVertical } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import type { ArtworkSeries } from "@/types/artwork-series"
import { DeleteSeriesDialog } from "../series/components/DeleteSeriesDialog"
import { DuplicateSeriesDialog } from "../series/components/DuplicateSeriesDialog"

// Sortable Artwork Component (Grid Item)
function SortableArtworkItem({ artwork, seriesUnlockType }: { artwork: any; seriesUnlockType: string }) {
  // For artworks in series, use member id. For available artworks, use submission_id
  const sortableId = artwork.submission_id && !artwork.series_id 
    ? `artwork-submission-${artwork.submission_id}` 
    : `artwork-${artwork.id}`
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative w-32 h-32 rounded-md overflow-hidden bg-background border shadow-sm group/item flex-shrink-0 cursor-grab active:cursor-grabbing artwork-item"
      {...attributes}
      {...listeners}
    >
      {artwork.image ? (
        <img
          src={artwork.image}
          alt={artwork.title || "Artwork"}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
        </div>
      )}
      
      {/* Drag Handle */}
      <div className="absolute top-1 left-1 bg-black/60 p-1 rounded text-white backdrop-blur-sm opacity-0 group-hover/item:opacity-100 transition-opacity">
        <GripVertical className="h-3 w-3" />
      </div>
      
      {/* Hover Title */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/item:opacity-100 transition-opacity flex flex-col items-center justify-center p-1">
        <span className="text-[10px] text-white text-center font-medium leading-tight line-clamp-2 mb-1">
          {artwork.title}
        </span>
        {seriesUnlockType === "time_based" && (
          <Badge variant="outline" className="text-[8px] h-4 px-1 border-white/50 text-white bg-black/20 backdrop-blur-sm">
            Timed Edition
          </Badge>
        )}
      </div>

      {/* Lock Badge */}
      {artwork.is_locked && (
        <div className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white backdrop-blur-sm">
          <Lock className="h-3 w-3" />
        </div>
      )}
    </div>
  )
}


// Droppable Series Component (Kanban Column)
function DroppableSeries({
  series,
  artworks,
  getSeriesColor,
  getSeriesIcon,
  onSeriesClick,
  isOpenBox = false,
}: {
  series: ArtworkSeries | { id: "open"; name: "Open"; unlock_type: "open" }
  artworks: any[]
  getSeriesColor: (type: string) => string
  getSeriesIcon: (type: string) => React.ReactNode
  onSeriesClick: () => void
  isOpenBox?: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: isOpenBox ? "open" : `series-${series.id}`,
  })

  return (
    <div
      ref={setNodeRef}
      onClick={(e) => {
        // Don't navigate if clicking on an artwork or drag handle
        if ((e.target as HTMLElement).closest('.artwork-item') || 
            (e.target as HTMLElement).closest('[data-sortable-handle]')) return
        if (!isOpenBox) onSeriesClick()
      }}
      className={cn(
        "flex flex-col border-2 rounded-xl overflow-hidden transition-colors shadow-sm w-fit relative",
        isOpenBox ? "border-dashed border-muted-foreground/40 bg-muted/20" : getSeriesColor(series.unlock_type),
        isOver && "ring-2 ring-primary ring-offset-2 bg-primary/5",
        !isOpenBox && "cursor-pointer hover:shadow-lg"
      )}
    >
      {/* Time-Based "Water Glass" Fill */}
      {series.unlock_type === "time_based" && series.unlock_config && (() => {
        const config = series.unlock_config
        if (config.unlock_schedule?.start_date && config.unlock_schedule?.end_date) {
          const start = new Date(config.unlock_schedule.start_date)
          const end = new Date(config.unlock_schedule.end_date)
          const now = new Date()
          const isActive = now >= start && now <= end
          
          let progress = 0
          if (isActive) {
            const total = end.getTime() - start.getTime()
            const current = now.getTime() - start.getTime()
            progress = Math.min(100, Math.max(0, (current / total) * 100))
          } else if (now > end) {
            progress = 100
          }

          return (
            <div 
              className="absolute bottom-0 left-0 right-0 bg-green-500/20 transition-all duration-1000 ease-in-out pointer-events-none"
              style={{ height: `${progress}%` }}
            />
          )
        }
        return null
      })()}

      {/* Type Icon Badge */}
      {!isOpenBox && (
        <div className={cn(
          "absolute top-0 right-0 p-1.5 rounded-bl-lg z-20",
          getSeriesColor(series.unlock_type).replace('border-', 'bg-').split(' ')[0]
        )}>
          <div className="bg-background/80 backdrop-blur-sm p-1 rounded-full shadow-sm">
            {getSeriesIcon(series.unlock_type)}
          </div>
        </div>
      )}

      {/* Series Name (for empty series) */}
      {artworks.length === 0 && (
        <div className="p-3 min-w-[160px]">
          <h3 className="font-semibold text-xs mb-1 line-clamp-1">{series.name}</h3>
          <p className="text-[10px] text-muted-foreground mb-2">Empty series</p>
          <div className="flex items-center justify-center p-4 border-2 border-dashed border-muted-foreground/30 rounded-lg">
            <div className="text-center">
              <Plus className="h-5 w-5 text-muted-foreground/50 mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground">Drop artworks here</p>
            </div>
          </div>
        </div>
      )}

      {/* Artworks Grid */}
      {artworks.length > 0 && (
        <SortableContext
          items={artworks.map((a: any) => 
            a.submission_id && !a.series_id 
              ? `artwork-submission-${a.submission_id}` 
              : `artwork-${a.id}`
          )}
          strategy={undefined}
        >
          <div className="p-2 relative z-10">
            <div className="flex flex-wrap gap-2">
              {artworks.map((artwork: any) => (
                <SortableArtworkItem
                  key={artwork.id}
                  artwork={artwork}
                  seriesUnlockType={isOpenBox ? "open" : series.unlock_type}
                />
              ))}
            </div>
          </div>
        </SortableContext>
      )}
    </div>
  )
}

export default function ProductsPage() {
  const router = useRouter()
  const { products, isLoading, error } = useVendorData()
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [submissionToDelete, setSubmissionToDelete] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  // Series state
  const [series, setSeries] = useState<ArtworkSeries[]>([])
  const [loadingSeries, setLoadingSeries] = useState(true)
  const [seriesError, setSeriesError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [unlockTypeFilter, setUnlockTypeFilter] = useState("all")
  const [deleteSeriesDialogOpen, setDeleteSeriesDialogOpen] = useState(false)
  const [duplicateSeriesDialogOpen, setDuplicateSeriesDialogOpen] = useState(false)
  const [selectedSeries, setSelectedSeries] = useState<ArtworkSeries | null>(null)
  const [isDeletingSeries, setIsDeletingSeries] = useState(false)
  const [isDuplicatingSeries, setIsDuplicatingSeries] = useState(false)
  const [allArtworks, setAllArtworks] = useState<any[]>([])
  const [loadingArtworks, setLoadingArtworks] = useState(false)
  const [availableArtworks, setAvailableArtworks] = useState<any[]>([])
  const [loadingAvailable, setLoadingAvailable] = useState(false)
  const [hasLoadedAvailableArtworks, setHasLoadedAvailableArtworks] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchSeries()
    fetchAllArtworks()
  }, [])

  // Only fetch available artworks once on initial load
  useEffect(() => {
    if (!loadingArtworks && !hasLoadedAvailableArtworks) {
      fetchAvailableArtworks()
      setHasLoadedAvailableArtworks(true)
    }
  }, [loadingArtworks, hasLoadedAvailableArtworks])

  const fetchAvailableArtworks = async () => {
    try {
      setLoadingAvailable(true)
      // Get all submissions (pending, approved, published) - any artwork not in a series
      const submissionsResponse = await fetch("/api/vendor/products/submissions", {
        credentials: "include",
      })
      if (submissionsResponse.ok) {
        const data = await submissionsResponse.json()
        // Include all submissions regardless of status (pending, approved, published)
        const submissions = data.submissions || []
        
        // Fetch fresh artworks from server to check which are in series
        const artworksResponse = await fetch("/api/vendor/series/artworks", {
          credentials: "include",
        })
        let submissionIdsInSeries = new Set<string>()
        
        if (artworksResponse.ok) {
          const artworksData = await artworksResponse.json()
          const artworks = artworksData.artworks || []
          // Get all submission IDs that are already in series
          submissionIdsInSeries = new Set(
            artworks
              .filter((a: any) => a.submission_id)
              .map((a: any) => a.submission_id.toString())
          )
        }
        
        // Automatically place any artwork not in a series into the Open box
        const available = submissions
          .filter((sub: any) => {
            const productData = sub.product_data as any
            const hasImage = productData?.images && productData.images.length > 0
            // Check if this submission is NOT in any series
            const isInSeries = submissionIdsInSeries.has(sub.id.toString())
            return hasImage && !isInSeries
          })
          .map((sub: any) => {
            const productData = sub.product_data as any
            const image = productData?.images?.[0]?.src || productData?.images?.[0] || null
            return {
              id: `submission-${sub.id}`,
              submission_id: sub.id,
              shopify_product_id: sub.shopify_product_id,
              title: productData?.title || "Untitled",
              image,
              type: "available",
            }
          })
        
        setAvailableArtworks(available)
      }
    } catch (err) {
      console.error("Error fetching available artworks:", err)
    } finally {
      setLoadingAvailable(false)
    }
  }

  const fetchAllArtworks = async () => {
    try {
      setLoadingArtworks(true)
      const response = await fetch("/api/vendor/series/artworks", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        const artworks = data.artworks || []
        
        // Deduplicate by submission_id + series_id combination
        const seen = new Map<string, any>()
        const uniqueArtworks = artworks.filter((artwork: any) => {
          const key = artwork.submission_id 
            ? `${artwork.submission_id}-${artwork.series_id}` 
            : `${artwork.shopify_product_id}-${artwork.series_id}`
          
          if (seen.has(key)) {
            // Keep the one with the most recent ID (assuming newer entries have higher IDs)
            const existing = seen.get(key)
            if (artwork.id > existing.id) {
              seen.set(key, artwork)
              return true
            }
            return false
          }
          seen.set(key, artwork)
          return true
        })
        
        setAllArtworks(uniqueArtworks)
      }
    } catch (err) {
      console.error("Error fetching all artworks:", err)
      toast({
        title: "Error",
        description: "Failed to load artwork binder",
        variant: "destructive",
      })
    } finally {
      setLoadingArtworks(false)
    }
  }

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await fetch("/api/vendor/products/submissions", {
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          setSubmissions(data.submissions || [])
        }
      } catch (err) {
        console.error("Error fetching submissions:", err)
      } finally {
        setLoadingSubmissions(false)
      }
    }

    fetchSubmissions()
  }, [])

  const fetchSeries = async () => {
    try {
      setLoadingSeries(true)
      setSeriesError(null)
      const response = await fetch("/api/vendor/series", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setSeries(data.series || [])
      } else {
        const errorData = await response.json()
        setSeriesError(errorData.error || "Failed to load series")
      }
    } catch (err: any) {
      console.error("Error fetching series:", err)
      setSeriesError(err.message || "Failed to load series")
    } finally {
      setLoadingSeries(false)
    }
  }

  const filteredSeries = useMemo(() => {
    return series.filter((s) => {
      const matchesSearch = searchQuery === "" || 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesFilter = unlockTypeFilter === "all" || s.unlock_type === unlockTypeFilter
      
      return matchesSearch && matchesFilter
    })
  }, [series, searchQuery, unlockTypeFilter])

  const handleDeleteSeries = async () => {
    if (!selectedSeries) return

    setIsDeletingSeries(true)
    try {
      const response = await fetch(`/api/vendor/series/${selectedSeries.id}`, {
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

      setDeleteSeriesDialogOpen(false)
      setSelectedSeries(null)
      fetchSeries()
    } catch (error: any) {
      console.error("Error deleting series:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete series",
        variant: "destructive",
      })
    } finally {
      setIsDeletingSeries(false)
    }
  }

  const handleDuplicateSeries = async (newName: string) => {
    if (!selectedSeries) return

    setIsDuplicatingSeries(true)
    try {
      const response = await fetch(`/api/vendor/series/${selectedSeries.id}/duplicate`, {
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

      toast({
        title: "Success",
        description: "Series duplicated successfully",
      })

      setDuplicateSeriesDialogOpen(false)
      setSelectedSeries(null)
      fetchSeries()
    } catch (error: any) {
      console.error("Error duplicating series:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to duplicate series",
        variant: "destructive",
      })
    } finally {
      setIsDuplicatingSeries(false)
    }
  }

  const getUnlockTypeLabel = (type: string) => {
    switch (type) {
      case "any_purchase":
        return "Open Collection"
      case "sequential":
        return "Finish the Set"
      case "threshold":
        return "VIP Unlocks"
      case "time_based":
        return "Time-Based"
      case "vip":
        return "VIP"
      default:
        return type
    }
  }

  const getSeriesColor = (unlockType: string) => {
    switch (unlockType) {
      case "any_purchase":
        return "border-blue-500/50 bg-blue-50/10 hover:border-blue-500"
      case "sequential":
        return "border-purple-500/50 bg-purple-50/10 hover:border-purple-500"
      case "threshold":
      case "vip":
        return "border-orange-500/50 bg-orange-50/10 hover:border-orange-500"
      case "time_based":
        return "border-green-500/50 bg-green-50/10 hover:border-green-500"
      default:
        return "border-border bg-card hover:border-primary/50"
    }
  }

  const getSeriesIcon = (unlockType: string) => {
    switch (unlockType) {
      case "any_purchase":
        return <Lock className="h-4 w-4" />
      case "sequential":
        return <ArrowRight className="h-4 w-4" />
      case "threshold":
      case "vip":
        return <Crown className="h-4 w-4" />
      case "time_based":
        return <Clock className="h-4 w-4" />
      default:
        return <Lock className="h-4 w-4" />
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    setIsDragging(true)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setIsDragging(false)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // If dragging an artwork to a different series (kanban move)
    if (activeId.startsWith("artwork-")) {
      const artworkId = activeId.replace("artwork-", "")
      const artwork = allArtworks.find((a: any) => a.id === artworkId)
      
      if (!artwork) {
        // Check if it's an available artwork (from Open box)
        if (activeId.startsWith("artwork-submission-")) {
          const submissionId = activeId.replace("artwork-submission-", "")
          const availableArtwork = availableArtworks.find((a: any) => a.submission_id === submissionId)
          
          if (availableArtwork) {
            if (overId === "open") {
              // Already in open, do nothing
              return
            } else if (overId.startsWith("series-")) {
              // Adding new artwork to series
              const seriesId = overId.replace("series-", "")
              await addArtworkToSeries(submissionId, seriesId)
            } else if (overId.startsWith("artwork-")) {
              // Dropped on another artwork - find its series
              const targetArtworkId = overId.replace("artwork-", "")
              const targetArtwork = allArtworks.find((a: any) => a.id === targetArtworkId)
              if (targetArtwork && targetArtwork.series_id) {
                await addArtworkToSeries(submissionId, targetArtwork.series_id)
              }
            }
          }
        }
        return
      }

      const currentSeriesId = artwork.series_id
      let targetSeriesId: string | null = null

      if (overId === "open") {
        // Moving to open (unassigning from series)
        targetSeriesId = null
      } else if (overId.startsWith("series-")) {
        targetSeriesId = overId.replace("series-", "")
      } else if (overId.startsWith("artwork-")) {
        // Dropped on another artwork - find its series
        const targetArtworkId = overId.replace("artwork-", "")
        const targetArtwork = allArtworks.find((a: any) => a.id === targetArtworkId)
        if (targetArtwork) {
          targetSeriesId = targetArtwork.series_id
        }
      }

      // If moving to same series, just reorder
      if (targetSeriesId === currentSeriesId && overId.startsWith("artwork-")) {
        await reorderArtworksInSeries(currentSeriesId, artworkId, overId.replace("artwork-", ""))
        return
      }

      // If moving to different series or open
      if (targetSeriesId !== currentSeriesId) {
        if (targetSeriesId === null) {
          // Remove from series (move to open)
          await removeArtworkFromSeries(artworkId)
        } else {
          // Move to different series
          await moveArtworkToSeries(artworkId, targetSeriesId)
        }
      }
      return
    }

    // If dragging a submission to a series
    if (activeId.startsWith("submission-") && (overId.startsWith("series-") || overId === "open")) {
      const submissionId = activeId.replace("submission-", "")
      const availableArtwork = availableArtworks.find((a: any) => a.submission_id === submissionId)
      
      if (!availableArtwork) return

      if (overId === "open") {
        // Already in open, do nothing
        return
      }

      const seriesId = overId.replace("series-", "")
      await addArtworkToSeries(submissionId, seriesId)
    }
  }

  const addArtworkToSeries = async (submissionId: string, seriesId: string) => {
    // Find the artwork in availableArtworks
    const artworkToMove = availableArtworks.find((a: any) => a.submission_id === submissionId)
    if (!artworkToMove) return

    // Check if artwork with same submission_id already exists in target series
    const existingInTarget = allArtworks.find(
      (a: any) => a.submission_id === submissionId && a.series_id === seriesId
    )

    // If already exists, don't add again (idempotent - API will return existing)
    if (existingInTarget) {
      // Just remove from available artworks if it's there
      setAvailableArtworks(prev => prev.filter((a: any) => a.submission_id !== submissionId))
      return
    }

    // Optimistically update UI immediately
    const newArtwork = {
      id: `temp-${Date.now()}`, // Temporary ID until we get the real one
      submission_id: submissionId,
      shopify_product_id: artworkToMove.shopify_product_id,
      series_id: seriesId,
      title: artworkToMove.title,
      image: artworkToMove.image,
      is_locked: false,
      display_order: 0,
    }

    // Update state immediately (optimistic update)
    setAllArtworks(prev => [...prev, newArtwork])
    setAvailableArtworks(prev => prev.filter((a: any) => a.submission_id !== submissionId))

    try {
      const response = await fetch(`/api/vendor/series/${seriesId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          submission_id: submissionId,
          display_order: 0,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add artwork to series")
      }

      // Refresh from server to ensure consistency and avoid duplicates
      await fetchAllArtworks()
      await fetchAvailableArtworks()
    } catch (error: any) {
      console.error("Error adding artwork to series:", error)
      // Revert optimistic update on error
      setAllArtworks(prev => prev.filter(a => a.id !== newArtwork.id))
      setAvailableArtworks(prev => [...prev, artworkToMove])
      toast({
        title: "Error",
        description: error.message || "Failed to add artwork to series",
        variant: "destructive",
      })
    }
  }

  const moveArtworkToSeries = async (artworkId: string, targetSeriesId: string) => {
    // Find the artwork
    const artwork = allArtworks.find((a: any) => a.id === artworkId)
    if (!artwork || !artwork.submission_id) return

    const originalSeriesId = artwork.series_id

    // Check if artwork with same submission_id already exists in target series
    const existingInTarget = allArtworks.find(
      (a: any) => a.submission_id === artwork.submission_id && 
                   a.series_id === targetSeriesId && 
                   a.id !== artworkId
    )

    // Remove existing duplicate from target series if found
    if (existingInTarget) {
      try {
        await fetch(`/api/vendor/series/${targetSeriesId}/members/${existingInTarget.id}`, {
          method: "DELETE",
          credentials: "include",
        })
        // Remove from state
        setAllArtworks(prev => prev.filter(a => a.id !== existingInTarget.id))
      } catch (err) {
        console.error("Error removing duplicate artwork:", err)
      }
    }

    // Optimistically update UI immediately
    setAllArtworks(prev => 
      prev.map(a => a.id === artworkId ? { ...a, series_id: targetSeriesId } : a)
    )

    try {
      // First remove from current series, then add to new series
      const removeResponse = await fetch(`/api/vendor/series/${originalSeriesId}/members/${artworkId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!removeResponse.ok) {
        throw new Error("Failed to remove artwork from series")
      }

      // Add to new series
      const addResponse = await fetch(`/api/vendor/series/${targetSeriesId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          submission_id: artwork.submission_id,
          display_order: 0,
        }),
      })

      if (!addResponse.ok) {
        const errorData = await addResponse.json()
        throw new Error(errorData.error || "Failed to add artwork to series")
      }

      // Refresh from server to ensure consistency and avoid duplicates
      await fetchAllArtworks()
      await fetchAvailableArtworks()
    } catch (error: any) {
      console.error("Error moving artwork:", error)
      // Revert optimistic update on error
      setAllArtworks(prev => 
        prev.map(a => a.id === artworkId ? { ...a, series_id: originalSeriesId } : a)
      )
      toast({
        title: "Error",
        description: error.message || "Failed to move artwork",
        variant: "destructive",
      })
    }
  }

  const removeArtworkFromSeries = async (artworkId: string) => {
    // Find the artwork
    const artwork = allArtworks.find((a: any) => a.id === artworkId)
    if (!artwork || !artwork.series_id) return

    const originalSeriesId = artwork.series_id

    // Optimistically update UI immediately - move to available artworks
    const availableArtwork = {
      id: `submission-${artwork.submission_id}`,
      submission_id: artwork.submission_id,
      shopify_product_id: artwork.shopify_product_id,
      title: artwork.title,
      image: artwork.image,
      type: "available",
    }

    setAllArtworks(prev => prev.filter(a => a.id !== artworkId))
    setAvailableArtworks(prev => [...prev, availableArtwork])

    try {
      const response = await fetch(`/api/vendor/series/${originalSeriesId}/members/${artworkId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to remove artwork from series")
      }
      // No refresh needed - optimistic update already handled it
    } catch (error: any) {
      console.error("Error removing artwork from series:", error)
      // Revert optimistic update on error
      setAllArtworks(prev => [...prev, artwork])
      setAvailableArtworks(prev => prev.filter(a => a.submission_id !== artwork.submission_id))
      toast({
        title: "Error",
        description: "Failed to remove artwork from series",
        variant: "destructive",
      })
    }
  }

  const reorderArtworksInSeries = async (seriesId: string, activeArtworkId: string, overArtworkId: string) => {
    const seriesArtworks = allArtworks
      .filter((a: any) => a.series_id === seriesId)
      .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))

    const oldIndex = seriesArtworks.findIndex((a: any) => a.id === activeArtworkId)
    const newIndex = seriesArtworks.findIndex((a: any) => a.id === overArtworkId)

    if (oldIndex === -1 || newIndex === -1) return

    const reorderedArtworks = arrayMove(seriesArtworks, oldIndex, newIndex)
    const newOrder = reorderedArtworks.map((a: any) => a.id)

    // Optimistically update display_order immediately
    setAllArtworks(prev => {
      const updated = [...prev]
      reorderedArtworks.forEach((artwork, index) => {
        const idx = updated.findIndex(a => a.id === artwork.id)
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], display_order: index }
        }
      })
      return updated
    })

    try {
      const response = await fetch(`/api/vendor/series/${seriesId}/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ memberIds: newOrder }),
      })

      if (!response.ok) {
        throw new Error("Failed to reorder artworks")
      }
      // No refresh needed - optimistic update already handled it
    } catch (error: any) {
      console.error("Error reordering artworks:", error)
      // Revert on error
      setAllArtworks(prev => {
        const updated = [...prev]
        seriesArtworks.forEach((artwork, index) => {
          const idx = updated.findIndex(a => a.id === artwork.id)
          if (idx >= 0) {
            updated[idx] = { ...updated[idx], display_order: index }
          }
        })
        return updated
      })
      toast({
        title: "Error",
        description: "Failed to reorder artworks",
        variant: "destructive",
      })
    }
  }

  const handleDragCancel = () => {
    setActiveId(null)
    setIsDragging(false)
  }

  const handleDeleteClick = (submission: any, e: React.MouseEvent) => {
    e.stopPropagation()
    if (submission.status === "pending" || submission.status === "rejected") {
      setSubmissionToDelete(submission)
      setDeleteDialogOpen(true)
    } else {
      toast({
        title: "Cannot Delete",
        description: "You can only delete pending or rejected submissions. Contact admin to reject/unpublish approved or published submissions.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteConfirm = async () => {
    if (!submissionToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(
        `/api/vendor/products/submissions/${submissionToDelete.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete submission")
      }

      setSubmissions(submissions.filter((s) => s.id !== submissionToDelete.id))
      setDeleteDialogOpen(false)
      setSubmissionToDelete(null)
      
      toast({
        title: "Submission Deleted",
        description: "The artwork submission has been deleted successfully.",
      })
    } catch (err: any) {
      console.error("Error deleting submission:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to delete submission",
        variant: "destructive",
      })
      setDeleteDialogOpen(false)
      setSubmissionToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        )
      case "published":
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-600">
            <Package className="h-3 w-3" />
            Published
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Failed to load artwork data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error.message}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8 px-1">
      {/* Series Section */}
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between">
      <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Artwork Series
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your artwork series and unlock configurations
              </p>
            </div>
            <Button onClick={() => router.push("/vendor/dashboard/series/create")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Series
            </Button>
          </div>
      </div>

        {/* Booklet/Binder View */}
        {loadingArtworks || loadingSeries ? (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="aspect-[3/4]">
                <Skeleton className="h-full w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : series.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Series Found</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Create your first series to organize your artworks.
              </p>
              <Button onClick={() => router.push("/vendor/dashboard/series/create")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Series
              </Button>
          </CardContent>
        </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="flex flex-wrap gap-4 items-start content-start">
              {/* Open Box (Unassigned Artworks) */}
              <DroppableSeries
                series={{ id: "open", name: "Open", unlock_type: "open" }}
                artworks={availableArtworks.map((a: any) => ({
                  id: `submission-${a.submission_id}`, // Use submission ID for available artworks
                  title: a.title,
                  image: a.image,
                  submission_id: a.submission_id,
                  series_id: null,
                  is_locked: false,
                }))}
                getSeriesColor={() => "border-dashed border-muted-foreground/40 bg-muted/20"}
                getSeriesIcon={() => <Package className="h-4 w-4" />}
                onSeriesClick={() => {}}
                isOpenBox={true}
              />
              
              {/* Series Grid */}
              {series.map((s) => {
                // Find artworks for this series, sorted by display_order
                const seriesArtworks = allArtworks
                  .filter((artwork: any) => artwork.series_id === s.id)
                  .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
                
                return (
                  <DroppableSeries
                    key={s.id}
                    series={s}
                    artworks={seriesArtworks}
                    getSeriesColor={getSeriesColor}
                    getSeriesIcon={getSeriesIcon}
                    onSeriesClick={() => router.push(`/vendor/dashboard/series/${s.id}`)}
                    isOpenBox={false}
                  />
                )
              })}
            </div>
            
            <DragOverlay>
              {activeId && (() => {
                // Find the artwork being dragged
                let artwork: any = null
                
                if (activeId.startsWith("artwork-submission-")) {
                  // Available artwork from Open box
                  const submissionId = activeId.replace("artwork-submission-", "")
                  artwork = availableArtworks.find((a: any) => a.submission_id === submissionId)
                } else if (activeId.startsWith("artwork-")) {
                  // Artwork in a series
                  const artworkId = activeId.replace("artwork-", "")
                  artwork = allArtworks.find((a: any) => a.id === artworkId)
                } else if (activeId.startsWith("submission-")) {
                  const submissionId = activeId.replace("submission-", "")
                  artwork = availableArtworks.find((a: any) => a.submission_id === submissionId)
                }
                
                if (!artwork) return null
                
                return (
                  <div className="w-full max-w-[260px] rounded-lg overflow-hidden bg-background border-2 border-primary shadow-lg">
                    <div className="aspect-square w-full bg-muted relative">
                      {artwork.image ? (
                        <img
                          src={artwork.image}
                          alt={artwork.title || "Artwork"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <h4 className="text-sm font-medium line-clamp-2">{artwork.title || "Untitled"}</h4>
                    </div>
                  </div>
                )
              })()}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Artworks Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Your Artworks</h2>
          <p className="text-muted-foreground mt-1">
            Manage and track your individual artworks
          </p>
      </div>

      <Tabs defaultValue="catalog" className="space-y-6">
        <TabsList>
          <TabsTrigger value="catalog">Artwork Catalog</TabsTrigger>
          <TabsTrigger value="submissions">
            Submissions
            {submissions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {submissions.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-6">
      <Card className="overflow-hidden w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
        <CardHeader>
          <CardTitle>Your Artworks</CardTitle>
          <CardDescription>All your artworks in one place - manage and track them here</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-2">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
          ) : (
            <ProductTable products={products || []} />
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-6">
          <Card className="overflow-hidden w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
            <CardHeader>
              <CardTitle>Artwork Submissions</CardTitle>
              <CardDescription>
                View the status of artworks you've submitted for approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSubmissions ? (
                <div className="space-y-2">
                  {Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No artwork submissions yet.</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push("/vendor/dashboard/products/create")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Your First Artwork
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => {
                    const canEdit = submission.status === "pending" || submission.status === "rejected"
                    const productData = submission.product_data as any
                    const previewImage = productData?.images?.[0]?.src || productData?.images?.[0] || null
                    const hasBenefits = (productData?.benefits || []).filter((b: any) => !b.is_series_level).length > 0
                    const benefitCount = (productData?.benefits || []).filter((b: any) => !b.is_series_level).length
                    
                    return (
                      <div
                        key={submission.id}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          {/* Preview Image */}
                          {previewImage ? (
                            <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-muted border">
                              <img
                                src={previewImage}
                                alt={productData?.title || "Artwork"}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex-shrink-0 w-24 h-24 rounded-lg bg-muted border flex items-center justify-center">
                              <Package className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-semibold">
                                {productData?.title || "Untitled Artwork"}
                              </h3>
                              {getStatusBadge(submission.status)}
                              {(submission as any).series_metadata?.series_name && (
                                <Badge variant="secondary">
                                  Series: {(submission as any).series_metadata.series_name}
                                </Badge>
                              )}
                              {hasBenefits && (
                                <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 text-purple-700 dark:text-purple-300">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  {benefitCount} {benefitCount === 1 ? "treasure" : "treasures"}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Submitted {new Date(submission.submitted_at).toLocaleDateString()}
                            </p>
                            {submission.rejection_reason && (
                              <p className="text-sm text-destructive mt-2">
                                {submission.rejection_reason}
                              </p>
                            )}
                            {submission.admin_notes && (
                              <p className="text-sm text-muted-foreground mt-2">
                                Admin notes: {submission.admin_notes}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="text-right text-sm text-muted-foreground">
                              {submission.shopify_product_id && (
                                <div>Published to Shopify</div>
                              )}
                            </div>
                            {canEdit && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/vendor/dashboard/products/edit/${submission.id}`)
                                }}
                              >
                                Edit
                              </Button>
                            )}
                            {(submission.status === "pending" || submission.status === "rejected") && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => handleDeleteClick(submission, e)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>

      {/* Delete Submission Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the artwork
              submission
              {submissionToDelete && (
                <>
                  {" "}
                  <strong>
                    "{(submissionToDelete.product_data as any)?.title || "Untitled Artwork"}"
                  </strong>
                </>
              )}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Series Dialog */}
      <DeleteSeriesDialog
        open={deleteSeriesDialogOpen}
        onOpenChange={setDeleteSeriesDialogOpen}
        onConfirm={handleDeleteSeries}
        seriesName={selectedSeries?.name || ""}
        memberCount={selectedSeries?.member_count || 0}
        isDeleting={isDeletingSeries}
      />

      {/* Duplicate Series Dialog */}
      <DuplicateSeriesDialog
        open={duplicateSeriesDialogOpen}
        onOpenChange={setDuplicateSeriesDialogOpen}
        onConfirm={handleDuplicateSeries}
        originalName={selectedSeries?.name || ""}
        isDuplicating={isDuplicatingSeries}
      />
    </div>
  )
}
