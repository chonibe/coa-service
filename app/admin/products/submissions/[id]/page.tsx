"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Package,
  DollarSign,
  Image as ImageIcon,
  Tag,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function SubmissionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [submission, setSubmission] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [adminNotes, setAdminNotes] = useState("")
  const submissionId = params.id as string

  useEffect(() => {
    if (submissionId) {
      fetchSubmission()
    }
  }, [submissionId])

  const fetchSubmission = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/products/submissions/${submissionId}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch submission")
      }

      const data = await response.json()
      setSubmission(data.submission)
      setAdminNotes(data.submission?.admin_notes || "")
    } catch (err: any) {
      console.error("Error fetching submission:", err)
      setError(err.message || "Failed to fetch submission")
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    setActionLoading("approve")
    try {
      const response = await fetch(`/api/admin/products/submissions/${submissionId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          admin_notes: adminNotes,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to approve submission")
      }

      toast({
        title: "Submission Approved",
        description: "The product submission has been approved.",
      })

      fetchSubmission()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to approve submission",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      })
      return
    }

    setActionLoading("reject")
    try {
      const response = await fetch(`/api/admin/products/submissions/${submissionId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          reason: rejectionReason,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to reject submission")
      }

      toast({
        title: "Submission Rejected",
        description: "The product submission has been rejected.",
      })

      fetchSubmission()
      setRejectionReason("")
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to reject submission",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handlePublish = async () => {
    setActionLoading("publish")
    try {
      const response = await fetch(`/api/admin/products/submissions/${submissionId}/publish`, {
        method: "POST",
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to publish product")
      }

      toast({
        title: "Product Published",
        description: "The product has been published to Shopify successfully.",
      })

      fetchSubmission()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to publish product",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  if (error || !submission) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Submission not found"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const productData = submission.product_data as any
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
            <CheckCircle className="h-3 w-3" />
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
          <Badge className="flex items-center gap-1 bg-green-600">
            <CheckCircle className="h-3 w-3" />
            Published
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Submissions
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{productData.title}</h1>
          <p className="text-muted-foreground mt-1">
            Submitted by {submission.vendor_name} on{" "}
            {new Date(submission.submitted_at).toLocaleString()}
          </p>
        </div>
        {getStatusBadge(submission.status)}
      </div>

      {/* Actions */}
      {submission.status === "pending" && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-notes">Admin Notes (optional)</Label>
              <Textarea
                id="admin-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about this submission..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleApprove}
                disabled={actionLoading !== null}
                className="flex-1"
              >
                {actionLoading === "approve" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={actionLoading !== null}
                className="flex-1"
              >
                {actionLoading === "reject" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </>
                )}
              </Button>
            </div>
            {actionLoading === "reject" && (
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  rows={3}
                  required
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {submission.status === "approved" && !submission.shopify_product_id && (
        <Card>
          <CardHeader>
            <CardTitle>Publish to Shopify</CardTitle>
            <CardDescription>
              This submission has been approved and is ready to be published
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handlePublish}
              disabled={actionLoading !== null}
              className="w-full"
            >
              {actionLoading === "publish" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 mr-2" />
                  Publish to Shopify
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Product Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground">Title</div>
            <div className="text-base font-semibold">{productData.title}</div>
          </div>
          {productData.description && (
            <div>
              <div className="text-sm font-medium text-muted-foreground">Description</div>
              <div
                className="text-sm prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: productData.description }}
              />
            </div>
          )}
          {productData.product_type && (
            <div>
              <div className="text-sm font-medium text-muted-foreground">Product Type</div>
              <div className="text-sm">{productData.product_type}</div>
            </div>
          )}
          <div>
            <div className="text-sm font-medium text-muted-foreground">Handle</div>
            <div className="text-sm font-mono">{productData.handle}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Vendor</div>
            <div className="text-sm">{productData.vendor}</div>
          </div>
        </CardContent>
      </Card>

      {/* Variants */}
      {productData.variants && productData.variants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Variants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productData.variants.map((variant: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="font-medium mb-2">Variant {index + 1}</div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Price: </span>
                      <span className="font-semibold">${variant.price}</span>
                    </div>
                    {variant.sku && (
                      <div>
                        <span className="text-muted-foreground">SKU: </span>
                        <span>{variant.sku}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Images */}
      {productData.images && productData.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {productData.images.map((image: any, index: number) => (
                <div
                  key={index}
                  className="relative aspect-square border rounded-md overflow-hidden bg-muted"
                >
                  <img
                    src={image.src}
                    alt={image.alt || `Product image ${index + 1}`}
                    className="w-full h-full object-contain"
                  />
                  {index === 0 && (
                    <Badge className="absolute top-2 left-2">Primary</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {productData.tags && productData.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {productData.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submission Info */}
      <Card>
        <CardHeader>
          <CardTitle>Submission Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Status:</span> {submission.status}
          </div>
          <div>
            <span className="font-medium">Submitted:</span>{" "}
            {new Date(submission.submitted_at).toLocaleString()}
          </div>
          {submission.approved_at && (
            <div>
              <span className="font-medium">Approved:</span>{" "}
              {new Date(submission.approved_at).toLocaleString()}
              {submission.approved_by && ` by ${submission.approved_by}`}
            </div>
          )}
          {submission.published_at && (
            <div>
              <span className="font-medium">Published:</span>{" "}
              {new Date(submission.published_at).toLocaleString()}
            </div>
          )}
          {submission.shopify_product_id && (
            <div>
              <span className="font-medium">Shopify Product ID:</span>{" "}
              {submission.shopify_product_id}
            </div>
          )}
          {submission.rejection_reason && (
            <div>
              <span className="font-medium text-destructive">Rejection Reason:</span>{" "}
              {submission.rejection_reason}
            </div>
          )}
          {submission.admin_notes && (
            <div>
              <span className="font-medium">Admin Notes:</span> {submission.admin_notes}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

