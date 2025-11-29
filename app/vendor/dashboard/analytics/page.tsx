"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

export default function AnalyticsPage() {
  const router = useRouter()
  
  // Redirect to profile analytics tab
  useEffect(() => {
    router.replace("/vendor/dashboard/profile?tab=analytics")
  }, [router])
  
  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Skeleton className="h-8 w-64" />
    </div>
  )
}
