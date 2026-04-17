"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { ShopifyStyleArtworkForm } from "./components/shopify-style-form"

export default function CreateProductPage() {
  const router = useRouter()

  const handleComplete = () => {
    router.push("/vendor/studio")
  }

  const handleCancel = () => {
    router.push("/vendor/studio")
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto mb-4">
        <Link
          href="/vendor/studio"
          className="inline-flex items-center gap-1.5 font-body text-xs tracking-wide text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Studio
        </Link>
      </div>
      <ShopifyStyleArtworkForm onComplete={handleComplete} onCancel={handleCancel} />
    </div>
  )
}
