"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProductWizard } from "./components/product-wizard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function CreateProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleComplete = () => {
    router.push("/vendor/dashboard/products")
  }

  const handleCancel = () => {
    router.push("/vendor/dashboard/products")
  }

  useEffect(() => {
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Upload New Artwork
        </h1>
        <p className="text-muted-foreground mt-1">
          Add a new artwork to your catalog. Your submission will be reviewed by admin before going live.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
        <CardContent className="p-6">
          <ProductWizard onComplete={handleComplete} onCancel={handleCancel} />
        </CardContent>
      </Card>
    </div>
  )
}

