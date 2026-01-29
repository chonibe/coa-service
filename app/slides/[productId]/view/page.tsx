"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
/**
 * Vendor Preview - Redirects to collector view
 * 
 * Shows slides exactly as collectors will see them
 */
export default function VendorSlidesPreview() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string

  useEffect(() => {
    // Redirect to collector view for true preview
    router.replace(`/collector/slides/${productId}`)
  }, [productId, router])

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent" />
    </div>
  )
}
