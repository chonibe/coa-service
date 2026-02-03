"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function ArtworkPageRedirect() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string

  useEffect(() => {
    if (productId) {
      // Redirect to new artwork editor route
      router.replace(`/artwork-editor/${productId}`)
    }
  }, [productId, router])

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Redirecting to artwork editor...</p>
        </div>
      </div>
    </div>
  )
}
