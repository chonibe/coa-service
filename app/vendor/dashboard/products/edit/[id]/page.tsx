"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ShopifyStyleArtworkForm } from "../../create/components/shopify-style-form"
import { Skeleton } from "@/components/ui"

import { AlertCircle, ArrowLeft } from "lucide-react"

import type { ProductSubmissionData } from "@/types/product-submission"

import { Alert, AlertDescription, Button } from "@/components/ui"
export default function EditProductPage() {
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
          // Check if submission can be edited
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

          // Merge series data into product_data
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

  const handleComplete = () => {
    router.push("/vendor/dashboard/products")
  }

  const handleCancel = () => {
    router.push("/vendor/dashboard/products")
  }

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-[600px]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <Button variant="outline" onClick={() => router.push("/vendor/dashboard/products")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
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
      <div className="p-6 space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No submission data found</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6">
      <ShopifyStyleArtworkForm
        initialData={initialData}
        submissionId={submissionId}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </div>
  )
}

