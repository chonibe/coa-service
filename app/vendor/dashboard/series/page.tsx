"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus, Lock, Edit, Trash2, Eye, AlertCircle, Copy, LayoutGrid, BookOpen, ImageIcon, Unlock, ListOrdered, Gem, Clock, Crown, ShoppingCart, ArrowRight } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import type { ArtworkSeries } from "@/types/artwork-series"
import { SearchAndFilter } from "./components/SearchAndFilter"
import { DeleteSeriesDialog } from "./components/DeleteSeriesDialog"
import { DuplicateSeriesDialog } from "./components/DuplicateSeriesDialog"
import { SeriesCard } from "./components/SeriesCard"

export default function SeriesPage() {
  const router = useRouter()
  const [series, setSeries] = useState<ArtworkSeries[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [unlockTypeFilter, setUnlockTypeFilter] = useState("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [selectedSeries, setSelectedSeries] = useState<ArtworkSeries | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [viewMode, setViewMode] = useState<"series" | "binder">("series")
  const [allArtworks, setAllArtworks] = useState<any[]>([])
  const [loadingArtworks, setLoadingArtworks] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchSeries()
  }, [])

  useEffect(() => {
    if (viewMode === "binder" && allArtworks.length === 0) {
      fetchAllArtworks()
    }
  }, [viewMode])

  const fetchAllArtworks = async () => {
    try {
      setLoadingArtworks(true)
      const response = await fetch("/api/vendor/series/artworks", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setAllArtworks(data.artworks || [])
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

  const fetchSeries = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/vendor/series", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setSeries(data.series || [])
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

  const filteredSeries = useMemo(() => {
    return series.filter((s) => {
      const matchesSearch = searchQuery === "" || 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesFilter = unlockTypeFilter === "all" || s.unlock_type === unlockTypeFilter
      
      return matchesSearch && matchesFilter
    })
  }, [series, searchQuery, unlockTypeFilter])

  const handleDelete = async () => {
    if (!selectedSeries) return

    setIsDeleting(true)
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

      setDeleteDialogOpen(false)
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
      setIsDeleting(false)
    }
  }

  const handleDuplicate = async (newName: string) => {
    if (!selectedSeries) return

    setIsDuplicating(true)
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

      setDuplicateDialogOpen(false)
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
      setIsDuplicating(false)
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-square">
              <Skeleton className="h-full w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
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
          <div className="flex bg-muted p-1 rounded-lg">
            <Button
              variant={viewMode === "series" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("series")}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              Series View
            </Button>
            <Button
              variant={viewMode === "binder" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("binder")}
              className="gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Binder View
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filter - Only show in Series View for now */}
      {viewMode === "series" && series.length > 0 && (
        <SearchAndFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          unlockTypeFilter={unlockTypeFilter}
          onUnlockTypeFilterChange={setUnlockTypeFilter}
        />
      )}

      {viewMode === "binder" ? (
        <div className="space-y-6">
          {loadingArtworks ? (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} className="aspect-[3/4]">
                  <Skeleton className="h-full w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : allArtworks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Artworks Found</h3>
                <p className="text-sm text-muted-foreground mb-4 text-center">
                  Add artworks to your series to see them here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-wrap gap-4 items-start content-start">
              {Object.entries(
                allArtworks.reduce((acc, artwork) => {
                  const seriesId = artwork.series_id || "unknown"
                  if (!acc[seriesId]) {
                    acc[seriesId] = {
                      name: artwork.series_name || "Unknown Series",
                      unlock_type: artwork.series_unlock_type || "unknown",
                      unlock_config: artwork.series_unlock_config || {},
                      artworks: []
                    }
                  }
                  acc[seriesId].artworks.push(artwork)
                  return acc
                }, {} as Record<string, { name: string; unlock_type: string; unlock_config: any; artworks: any[] }>)
              ).map(([seriesId, group]: [string, any]) => (
                <div 
                  key={seriesId} 
                  className={cn(
                    "flex flex-col border-2 rounded-xl overflow-hidden transition-colors shadow-sm w-fit relative",
                    getSeriesColor(group.unlock_type)
                  )}
                >
                  {/* Type Icon Badge */}
                  <div className={cn(
                    "absolute top-0 right-0 p-1.5 rounded-bl-lg z-10",
                    getSeriesColor(group.unlock_type).replace('border-', 'bg-').split(' ')[0] // Simple hack to get bg color from border class
                  )}>
                    <div className="bg-background/80 backdrop-blur-sm p-1 rounded-full shadow-sm">
                      {getSeriesIcon(group.unlock_type)}
                    </div>
                  </div>

                  {/* Artworks Flex Grid - Adapts to content size */}
                  <div className="p-2 overflow-x-auto no-scrollbar max-w-[80vw]">
                    <div className="flex flex-nowrap gap-2 min-w-max">
                      {group.artworks.map((artwork: any) => (
                        <div key={artwork.id} className="relative w-32 h-32 rounded-md overflow-hidden bg-background border shadow-sm group/item flex-shrink-0">
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
                          
                          {/* Hover Title */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/item:opacity-100 transition-opacity flex flex-col items-center justify-center p-1">
                            <span className="text-[10px] text-white text-center font-medium leading-tight line-clamp-2 mb-1">
                              {artwork.title}
                            </span>
                            {group.unlock_type === "time_based" && (
                              <Badge variant="outline" className="text-[8px] h-4 px-1 border-white/50 text-white bg-black/20 backdrop-blur-sm">
                                Timed Edition
                              </Badge>
                            )}
                          </div>

                          {/* Status Icons */}
                          {artwork.is_locked && (
                            <div className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white backdrop-blur-sm">
                              <Lock className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Time-Based Info Footer */}
                  {group.unlock_type === "time_based" && (
                    <div className="px-2 pb-1 text-[10px] text-muted-foreground border-t bg-muted/20">
                      {(() => {
                        const config = group.unlock_config
                        if (config.unlock_at) {
                          const date = new Date(config.unlock_at)
                          const isPast = date < new Date()
                          return (
                            <div className="flex items-center gap-1 py-1">
                              <Clock className="h-3 w-3" />
                              <span>{isPast ? "Unlocked" : `Unlocks ${date.toLocaleDateString()}`}</span>
                            </div>
                          )
                        } else if (config.unlock_schedule?.start_date && config.unlock_schedule?.end_date) {
                          const start = new Date(config.unlock_schedule.start_date)
                          const end = new Date(config.unlock_schedule.end_date)
                          const now = new Date()
                          const isActive = now >= start && now <= end
                          const isPast = now > end
                          
                          // Calculate percentage if active
                          let progress = 0
                          if (isActive) {
                            const total = end.getTime() - start.getTime()
                            const current = now.getTime() - start.getTime()
                            progress = Math.min(100, Math.max(0, (current / total) * 100))
                          }

                          return (
                            <div className="w-full py-1">
                              <div className="flex justify-between items-center mb-0.5">
                                <span className={cn("font-medium", isActive ? "text-green-600" : "")}>
                                  {isActive ? "Active Now" : isPast ? "Ended" : "Coming Soon"}
                                </span>
                                <span className="opacity-70">{end.toLocaleDateString()}</span>
                              </div>
                              {isActive && (
                                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-green-500 rounded-full" 
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          )
                        }
                        return null
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : series.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Series Yet</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Create your first series to organize your artworks with unlock mechanics.
            </p>
            <Button onClick={() => router.push("/vendor/dashboard/series/create")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Series
            </Button>
          </CardContent>
        </Card>
      ) : filteredSeries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Series Found</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              No series match your search criteria. Try adjusting your filters.
            </p>
            <Button variant="outline" onClick={() => {
              setSearchQuery("")
              setUnlockTypeFilter("all")
            }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredSeries.map((s, index) => (
            <SeriesCard
              key={s.id}
              series={s}
              index={index}
              isHovered={false}
              onHover={() => {}}
              onView={() => router.push(`/vendor/dashboard/series/${s.id}`)}
              onDuplicate={() => {
                setSelectedSeries(s)
                setDuplicateDialogOpen(true)
              }}
              onDelete={() => {
                setSelectedSeries(s)
                setDeleteDialogOpen(true)
              }}
              getUnlockTypeLabel={getUnlockTypeLabel}
            />
          ))}
        </div>
      )}
      

      {/* Delete Dialog */}
      <DeleteSeriesDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        seriesName={selectedSeries?.name || ""}
        memberCount={selectedSeries?.member_count || 0}
        isDeleting={isDeleting}
      />

      {/* Duplicate Dialog */}
      <DuplicateSeriesDialog
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
        onConfirm={handleDuplicate}
        originalName={selectedSeries?.name || ""}
        isDuplicating={isDuplicating}
      />
    </div>
  )
}
