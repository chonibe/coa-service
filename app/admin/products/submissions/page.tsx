"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"





import { Skeleton } from "@/components/ui"


import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Alert, AlertDescription, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui"
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  Trash2,
  FileText,
  Download,
  ArrowUpDown,
} from "lucide-react"
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

export default function ProductSubmissionsPage() {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [submissionToDelete, setSubmissionToDelete] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  // Print Files tab state
  const [pdfFiles, setPdfFiles] = useState<any[]>([])
  const [loadingPdfFiles, setLoadingPdfFiles] = useState(false)
  const [pdfSortBy, setPdfSortBy] = useState<string>("submitted_at")
  const [pdfSortOrder, setPdfSortOrder] = useState<"asc" | "desc">("desc")
  const [pdfSearchQuery, setPdfSearchQuery] = useState("")

  useEffect(() => {
    fetchSubmissions()
  }, [statusFilter, page])

  const fetchPdfFiles = useCallback(async () => {
    setLoadingPdfFiles(true)
    try {
      const response = await fetch(
        `/api/admin/products/submissions/print-files?sortBy=${pdfSortBy}&sortOrder=${pdfSortOrder}`,
        {
          credentials: "include",
        }
      )

      if (!response.ok) {
        throw new Error("Failed to fetch PDF files")
      }

      const data = await response.json()
      setPdfFiles(data.pdfFiles || [])
    } catch (err: any) {
      console.error("Error fetching PDF files:", err)
      setError(err.message || "Failed to fetch PDF files")
    } finally {
      setLoadingPdfFiles(false)
    }
  }, [pdfSortBy, pdfSortOrder])

  const fetchSubmissions = async () => {
    setLoading(true)
    setError(null)

    try {
      let url = `/api/admin/products/submissions?page=${page}&limit=20`
      if (statusFilter !== "all") {
        url += `&status=${statusFilter}`
      }

      const response = await fetch(url, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch submissions")
      }

      const data = await response.json()
      setSubmissions(data.submissions || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (err: any) {
      console.error("Error fetching submissions:", err)
      setError(err.message || "Failed to fetch submissions")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="default" className="flex items-center gap-1 w-fit">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        )
      case "published":
        return (
          <Badge className="flex items-center gap-1 w-fit bg-green-600">
            <CheckCircle className="h-3 w-3" />
            Published
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  const filteredSubmissions = submissions.filter((submission) => {
    if (!searchQuery) return true
    const title = (submission.product_data as any)?.title || ""
    const vendorName = submission.vendor_name || ""
    return (
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendorName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const handleDeleteClick = (submission: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setSubmissionToDelete(submission)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!submissionToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(
        `/api/admin/products/submissions/${submissionToDelete.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete submission")
      }

      // Remove from list
      setSubmissions(submissions.filter((s) => s.id !== submissionToDelete.id))
      setDeleteDialogOpen(false)
      setSubmissionToDelete(null)
    } catch (err: any) {
      console.error("Error deleting submission:", err)
      setError(err.message || "Failed to delete submission")
      setDeleteDialogOpen(false)
      setSubmissionToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  const filteredPdfFiles = pdfFiles.filter((pdf) => {
    if (!pdfSearchQuery) return true
    const title = pdf.productTitle || ""
    const vendorName = pdf.vendorName || ""
    return (
      title.toLowerCase().includes(pdfSearchQuery.toLowerCase()) ||
      vendorName.toLowerCase().includes(pdfSearchQuery.toLowerCase())
    )
  })

  const handlePdfSortChange = (newSortBy: string) => {
    if (pdfSortBy === newSortBy) {
      setPdfSortOrder(pdfSortOrder === "asc" ? "desc" : "asc")
    } else {
      setPdfSortBy(newSortBy)
      setPdfSortOrder("desc")
    }
  }

  useEffect(() => {
    fetchPdfFiles()
  }, [fetchPdfFiles])

  const handlePdfDownload = (pdfUrl: string, productTitle: string) => {
    const link = document.createElement("a")
    link.href = pdfUrl
    link.download = `${productTitle.replace(/[^a-z0-9]/gi, "_")}.pdf`
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Product Submissions</h1>
        <p className="text-muted-foreground mt-1">
          Review and manage vendor product submissions
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs 
        defaultValue="submissions" 
        className="w-full space-y-6"
        onValueChange={(value) => {
          if (value === "print-files" && pdfFiles.length === 0) {
            fetchPdfFiles()
          }
        }}
      >
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground mb-6">
          <TabsTrigger value="submissions" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Submissions
            {submissions.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {filteredSubmissions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="print-files" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Print Files
            {pdfFiles.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {filteredPdfFiles.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by title or vendor..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Submissions List */}
          <Card>
        <CardHeader>
          <CardTitle>Submissions ({filteredSubmissions.length})</CardTitle>
          <CardDescription>
            Click on a submission to review and approve/reject
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No submissions found.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {filteredSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() =>
                      router.push(`/admin/products/submissions/${submission.id}`)
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">
                            {(submission.product_data as any)?.title || "Untitled Product"}
                          </h3>
                          {getStatusBadge(submission.status)}
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>
                            <span className="font-medium">Vendor:</span> {submission.vendor_name}
                          </p>
                          <p>
                            <span className="font-medium">Submitted:</span>{" "}
                            {new Date(submission.submitted_at).toLocaleString()}
                          </p>
                          {submission.approved_at && (
                            <p>
                              <span className="font-medium">Approved:</span>{" "}
                              {new Date(submission.approved_at).toLocaleString()}
                            </p>
                          )}
                          {submission.published_at && (
                            <p>
                              <span className="font-medium">Published:</span>{" "}
                              {new Date(submission.published_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                        {submission.rejection_reason && (
                          <p className="text-sm text-destructive mt-2">
                            <span className="font-medium">Rejection reason:</span>{" "}
                            {submission.rejection_reason}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/admin/products/submissions/${submission.id}`)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleDeleteClick(submission, e)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="print-files" className="space-y-6">
          {/* PDF Files Filters and Sort */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by product title or vendor..."
                      value={pdfSearchQuery}
                      onChange={(e) => setPdfSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={pdfSortBy} onValueChange={(value) => handlePdfSortChange(value)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submitted_at">Date Submitted</SelectItem>
                    <SelectItem value="vendor_name">Vendor Name</SelectItem>
                    <SelectItem value="product_title">Product Title</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPdfSortOrder(pdfSortOrder === "asc" ? "desc" : "asc")}
                  className="w-[120px]"
                >
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  {pdfSortOrder === "asc" ? "Asc" : "Desc"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchPdfFiles}
                  disabled={loadingPdfFiles}
                >
                  {loadingPdfFiles ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Refresh"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* PDF Files List */}
          <Card>
            <CardHeader>
              <CardTitle>Print Files ({filteredPdfFiles.length})</CardTitle>
              <CardDescription>
                All uploaded PDF files from product submissions. Click to download.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPdfFiles ? (
                <div className="space-y-4">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                </div>
              ) : filteredPdfFiles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No PDF files found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPdfFiles.map((pdf) => (
                    <div
                      key={pdf.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <h3 className="font-semibold text-lg">{pdf.productTitle}</h3>
                            {getStatusBadge(pdf.status)}
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground ml-8">
                            <p>
                              <span className="font-medium">Vendor:</span> {pdf.vendorName}
                            </p>
                            <p>
                              <span className="font-medium">Submitted:</span>{" "}
                              {new Date(pdf.submittedAt).toLocaleString()}
                            </p>
                            {pdf.shopifyProductId && (
                              <p>
                                <span className="font-medium">Shopify Product ID:</span>{" "}
                                {pdf.shopifyProductId}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePdfDownload(pdf.pdfUrl, pdf.productTitle)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(`/admin/products/submissions/${pdf.submissionId}`)
                            }
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Submission
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              submission
              {submissionToDelete && (
                <>
                  {" "}
                  <strong>
                    "{(submissionToDelete.product_data as any)?.title || "Untitled Product"}"
                  </strong>
                </>
              )}
              .
              {submissionToDelete?.status === "published" && (
                <span className="block mt-2 text-destructive font-medium">
              Warning: This submission is published. The product will be unpublished from Shopify
              and the submission status will be reset to "rejected" so the vendor can see it.
                </span>
              )}
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
    </div>
  )
}

