"use client"

import { useRouter, usePathname } from "next/navigation"

import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui"
interface SmartBackButtonProps {
  dashboardBase: string
  className?: string
  minDepth?: number
}

/**
 * Smart back button that only shows on deep pages (2+ levels by default)
 * Uses browser history for navigation
 */
export function SmartBackButton({ 
  dashboardBase, 
  className,
  minDepth = 2 
}: SmartBackButtonProps) {
  const router = useRouter()
  const pathname = usePathname()

  // Calculate path depth relative to dashboard base
  const getPathDepth = () => {
    if (pathname === dashboardBase) return 0
    const relativePath = pathname.replace(dashboardBase, '')
    return relativePath.split('/').filter(Boolean).length
  }

  const depth = getPathDepth()
  const shouldShow = depth >= minDepth

  if (!shouldShow) {
    return null
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.back()}
      className={cn("flex items-center gap-2", className)}
      aria-label="Go back"
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="hidden sm:inline">Back</span>
    </Button>
  )
}
