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
import { Plus, Package, Clock, XCircle, Trash2, Loader2, Sparkles, AlertCircle, Lock, ArrowRight, Crown } from "lucide-react"
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
import type { ArtworkSeries } from "@/types/artwork-series"
import { SearchAndFilter } from "../series/components/SearchAndFilter"
import { DeleteSeriesDialog } from "../series/components/DeleteSeriesDialog"
import { DuplicateSeriesDialog } from "../series/components/DuplicateSeriesDialog"
import { SeriesCard } from "../series/components/SeriesCard"

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

  useEffect(() => {
    fetchSeries()
  }, [])

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

        {/* Search and Filter */}
        {!loadingSeries && series.length > 0 && (
          <SearchAndFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            unlockTypeFilter={unlockTypeFilter}
            onUnlockTypeFilterChange={setUnlockTypeFilter}
          />
        )}

        {/* Series Content */}
        {loadingSeries ? (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-square">
                <Skeleton className="h-full w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : seriesError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{seriesError}</AlertDescription>
          </Alert>
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
                  setDuplicateSeriesDialogOpen(true)
                }}
                onDelete={() => {
                  setSelectedSeries(s)
                  setDeleteSeriesDialogOpen(true)
                }}
                getUnlockTypeLabel={getUnlockTypeLabel}
              />
            ))}
          </div>
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
