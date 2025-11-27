"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ProductWizard } from "../../create/components/product-wizard"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { ProductSubmissionData } from "@/types/product-submission"

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
            data.submission.status !== "rejected"
          ) {
            setError(
              `Cannot edit submission with status: ${data.submission.status}. Only pending or rejected submissions can be edited.`,
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
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[600px] w-full" />
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
        <Card>
          <CardContent className="p-6">
            <button
              onClick={() => router.push("/vendor/dashboard/products")}
              className="text-primary hover:underline"
            >
              ← Back to Products
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!initialData) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No submission data found</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Edit Artwork Submission
        </h1>
        <p className="text-muted-foreground mt-1">
          Update your artwork submission. Changes will reset the status to pending for admin review.
        </p>
      </div>

      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
        <CardContent className="p-6">
          <ProductWizard
            onComplete={handleComplete}
            onCancel={handleCancel}
            initialData={initialData}
            submissionId={submissionId}
          />
        </CardContent>
      </Card>
    </div>
  )
}

