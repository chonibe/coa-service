"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"

export default function ArtworkPageByHandleRedirect() {
  const params = useParams()
  const router = useRouter()
  const handle = params.handle as string

  useEffect(() => {
    const fetchProductId = async () => {
      try {
        const response = await fetch(`/api/vendor/products/by-handle/${handle}`, {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Product not found")
        }

        const data = await response.json()
        if (data.product?.id) {
          // Redirect to the artwork page editor with the database UUID
          router.replace(`/vendor/dashboard/artwork-pages/${data.product.id}`)
        } else {
          throw new Error("Product ID not found")
        }
      } catch (err: any) {
        console.error("Error fetching product:", err)
        // Show error and redirect back
        setTimeout(() => {
          router.push("/vendor/dashboard/artwork-pages")
        }, 2000)
      }
    }

    if (handle) {
      fetchProductId()
    }
  }, [handle, router])

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
