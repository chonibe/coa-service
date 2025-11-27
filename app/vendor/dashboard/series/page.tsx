"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus, Lock, Edit, Trash2, Eye, AlertCircle, Copy } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"
import type { ArtworkSeries } from "@/types/artwork-series"
import { UnlockProgress } from "./components/UnlockProgress"
import { FloatingCreateButton } from "./components/FloatingCreateButton"
import { SearchAndFilter } from "./components/SearchAndFilter"
import { DeleteSeriesDialog } from "./components/DeleteSeriesDialog"
import { DuplicateSeriesDialog } from "./components/DuplicateSeriesDialog"
import { UnlockTypeTooltip } from "./components/UnlockTypeTooltip"

export default function SeriesPage() {
  const router = useRouter()
  const [series, setSeries] = useState<ArtworkSeries[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [unlockTypeFilter, setUnlockTypeFilter] = useState("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [selectedSeries, setSelectedSeries] = useState<ArtworkSeries | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchSeries()
  }, [])

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
        return "Any Purchase"
      case "sequential":
        return "Sequential"
      case "threshold":
        return "Threshold"
      case "custom":
        return "Custom"
      default:
        return type
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Artwork Series
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your artwork series and unlock configurations
          </p>
        </div>
        <Button onClick={() => router.push("/vendor/dashboard/products/create")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Series
        </Button>
      </div>

      {/* Search and Filter */}
      {series.length > 0 && (
        <SearchAndFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          unlockTypeFilter={unlockTypeFilter}
          onUnlockTypeFilterChange={setUnlockTypeFilter}
        />
      )}

      {series.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Series Yet</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Create your first series by assigning an artwork to a new series during creation.
            </p>
            <Button onClick={() => router.push("/vendor/dashboard/products/create")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Artwork with Series
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
          {filteredSeries.map((s, index) => {
            const totalCount = s.member_count || 0
            
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="group relative"
                onMouseEnter={() => setHoveredId(s.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <Card
                  className="overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300"
                  onClick={() => router.push(`/vendor/dashboard/series/${s.id}`)}
                >
                  <div className="aspect-square relative overflow-hidden bg-muted">
                    {s.thumbnail_url ? (
                      <motion.img
                        src={s.thumbnail_url}
                        alt={s.name}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Lock className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    )}
                    
                    {/* Hover overlay with actions */}
                    {hoveredId === s.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/vendor/dashboard/series/${s.id}`)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedSeries(s)
                            setDuplicateDialogOpen(true)
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedSeries(s)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </motion.div>
                    )}

                    {/* Series name overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <h3 className="font-semibold text-white text-sm truncate">{s.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {totalCount} {totalCount === 1 ? "artwork" : "artworks"}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {getUnlockTypeLabel(s.unlock_type)}
                          </Badge>
                          <UnlockTypeTooltip unlockType={s.unlock_type} />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress indicator */}
                  {totalCount > 0 && (
                    <div className="p-3 border-t">
                      <UnlockProgress
                        unlocked={totalCount}
                        total={totalCount}
                        showLabels={false}
                      />
                    </div>
                  )}
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
      
      <FloatingCreateButton />

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
