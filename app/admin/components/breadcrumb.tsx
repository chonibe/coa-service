"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbProps {
  className?: string
}

export function Breadcrumb({ className }: BreadcrumbProps) {
  const pathname = usePathname()

  // Skip rendering breadcrumbs on the main dashboard
  if (pathname === "/admin" || pathname === "/admin/dashboard") {
    return null
  }

  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = () => {
    // Remove leading slash and split by slash
    const paths = pathname.split("/").filter(Boolean)

    // Create breadcrumb items
    const breadcrumbs = paths.map((path, index) => {
      // Build the URL for this breadcrumb
      const href = `/${paths.slice(0, index + 1).join("/")}`

      // Format the label (capitalize, replace hyphens with spaces)
      const label = path.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())

      return { href, label }
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  return (
    <nav className={cn("flex items-center text-sm text-muted-foreground", className)}>
      <ol className="flex items-center space-x-2">
        <li>
          <Link href="/admin/dashboard" className="flex items-center hover:text-foreground">
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.href} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-1" />
            <Link
              href={breadcrumb.href}
              className={cn(
                "hover:text-foreground transition-colors",
                index === breadcrumbs.length - 1 ? "font-medium text-foreground" : "",
              )}
            >
              {breadcrumb.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  )
}
