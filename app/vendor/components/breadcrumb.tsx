"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

export function Breadcrumb() {
  const pathname = usePathname()

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

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
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
