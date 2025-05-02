"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function DashboardRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.push("/admin")
  }, [router])

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Redirecting to dashboard...</p>
      </div>
    </div>
  )
}
