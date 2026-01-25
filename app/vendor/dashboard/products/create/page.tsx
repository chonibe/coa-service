"use client"

import { useRouter } from "next/navigation"
import { ShopifyStyleArtworkForm } from "./components/shopify-style-form"

export default function CreateProductPage() {
  const router = useRouter()

  const handleComplete = () => {
    router.push("/vendor/dashboard/products")
  }

  const handleCancel = () => {
    router.push("/vendor/dashboard/products")
  }

  return (
    <div className="p-6">
      <ShopifyStyleArtworkForm onComplete={handleComplete} onCancel={handleCancel} />
    </div>
  )
}

