"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"


import { AlertCircle, Loader2, ArrowLeft } from "lucide-react"

import { Alert, AlertDescription, AlertTitle, Button } from "@/components/ui"
export default function ArtworkPageByHandleRedirect() {
  const params = useParams()
  const router = useRouter()
  const handle = params.handle as string
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProductId = async () => {
      if (!handle) {
        setError("Missing product handle")
        setIsLoading(false)
        return
      }
      try {
        setError(null)
        setIsLoading(true)
        const response = await fetch(`/api/vendor/products/by-handle/${handle}`, {
          credentials: "include",
        })

        if (!response.ok) {
          setError("Product not found")
          return
        }

        const data = await response.json()
        if (data.product?.id) {
          router.replace(`/artwork-editor/${data.product.id}`)
          return
        }
        setError("Product ID not found")
      } catch (err: any) {
        console.error("Error fetching product:", err)
        setError(err.message || "Something went wrong")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProductId()
  }, [handle, router])

  if (error) {
    return (
      <div className="container mx-auto py-8 max-w-7xl">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Product not found</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/vendor/dashboard/products">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Artworks
              </Link>
            </Button>
            <Button variant="default" onClick={() => router.push("/vendor/dashboard/products")}>
              Go to Artworks
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Loading artwork page editor...</p>
        </div>
      </div>
    </div>
  )
}
