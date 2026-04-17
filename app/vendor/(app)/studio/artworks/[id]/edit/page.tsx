"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { ShopifyStyleArtworkForm } from "@/app/vendor/dashboard/products/create/components/shopify-style-form"
import { Skeleton, Alert, AlertDescription, Button } from "@/components/ui"
import { AlertCircle, ArrowLeft } from "lucide-react"
import type { ProductSubmissionData } from "@/types/product-submission"

/**
 * /vendor/studio/artworks/[id]/edit — AppShell-native artwork edit.
 *
 * Replaces /vendor/dashboard/products/edit/[id] (now a redirect shim).
 */
export default function EditArtworkPage() {
  const router = useRouter()
  const params = useParams()
  const submissionId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initialData, setInitialData] = useState<ProductSubmissionData | null>(null)

  useEffect(() => {
    const fetchSubmission = async () => {
      if (!submissionId) {
        setError("Submission ID is required")
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/vendor/products/submissions/${submissionId}`, {
          credentials: "include",
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to load submission")
        }

        const data = await response.json()
        if (data.submission && data.submission.product_data) {
          if (
            data.submission.status !== "pending" &&
            data.submission.status !== "rejected" &&
            data.submission.status !== "draft"
          ) {
            setError(
              `Cannot edit submission with status: ${data.submission.status}. Only pending, draft, or rejected submissions can be edited.`,
            )
            setLoading(false)
            return
          }

          const productData: ProductSubmissionData = {
            ...data.submission.product_data,
            series_id: data.submission.series_id || undefined,
            series_name: data.submission.series_metadata?.series_name || undefined,
            is_locked: data.submission.series_metadata?.is_locked || undefined,
            unlock_order: data.submission.series_metadata?.unlock_order || undefined,
          }

          setInitialData(productData)
        } else {
          setError("Submission data not found")
        }
      } catch (err: any) {
        console.error("Error fetching submission:", err)
        setError(err.message || "Failed to load submission")
      } finally {
        setLoading(false)
      }
    }

    fetchSubmission()
  }, [submissionId])

  const handleComplete = () => router.push("/vendor/studio")
  const handleCancel = () => router.push("/vendor/studio")

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-[600px]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Button variant="outline" onClick={() => router.push("/vendor/studio")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Studio
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!initialData) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No submission data found</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto mb-4">
        <Link
          href="/vendor/studio"
          className="inline-flex items-center gap-1.5 font-body text-xs tracking-wide text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Studio
        </Link>
      </div>
      <ShopifyStyleArtworkForm
        initialData={initialData}
        submissionId={submissionId}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </div>
  )
}
