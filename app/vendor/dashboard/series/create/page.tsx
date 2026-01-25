"use client"

import { useRouter } from "next/navigation"
import { ShopifyStyleSeriesForm } from "../components/ShopifyStyleSeriesForm"

export default function CreateSeriesPage() {
  const router = useRouter()

  const handleComplete = (seriesId: string) => {
    router.push(`/vendor/dashboard/series/${seriesId}`)
  }

  const handleCancel = () => {
    router.push("/vendor/dashboard/products")
  }

  return (
    <div className="p-6">
      <ShopifyStyleSeriesForm onComplete={handleComplete} onCancel={handleCancel} />
    </div>
  )
}
