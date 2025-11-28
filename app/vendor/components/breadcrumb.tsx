"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function Breadcrumb() {
  const pathname = usePathname()
  const router = useRouter()

  // Skip rendering breadcrumbs on the main dashboard
  if (pathname === "/vendor/dashboard") {
    return null
  }

  // Split the pathname into segments
  const segments = pathname.split("/").filter(Boolean)

  // Format a segment for display (convert kebab-case to Title Case)
  const formatSegment = (segment: string) => {
    return segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  // Get parent path for back button
  const getParentPath = () => {
    const vendorIndex = segments.indexOf("vendor")
    if (vendorIndex >= 0 && segments.length > vendorIndex + 2) {
      // Go back one level from current
      return `/${segments.slice(0, segments.length - 1).join("/")}`
    }
    return "/vendor/dashboard"
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      {/* Mobile: Back button */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(getParentPath())}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Desktop: Breadcrumbs */}
      <ol className={cn(
        "hidden md:flex items-center space-x-2 text-sm text-muted-foreground"
      )}>
        <li>
          <Link href="/vendor/dashboard" className="flex items-center hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
            <span className="sr-only">Dashboard</span>
          </Link>
        </li>

        {segments.map((segment, index) => {
          // Skip "vendor" in the breadcrumb
          if (segment === "vendor") return null

          // Build the href for this segment
          const href = `/${segments.slice(0, index + 1).join("/")}`

          // Check if this is the last segment (current page)
          const isLastSegment = index === segments.length - 1

          return (
            <li key={segment} className="flex items-center">
              <ChevronRight className="h-4 w-4 mx-1" />
              {isLastSegment ? (
                <span className="font-medium text-foreground">{formatSegment(segment)}</span>
              ) : (
                <Link href={href} className="hover:text-foreground transition-colors">
                  {formatSegment(segment)}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
