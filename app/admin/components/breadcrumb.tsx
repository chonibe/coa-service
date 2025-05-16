/// <reference types="react" />
"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

interface BreadcrumbProps {
  className?: string
}

export function Breadcrumb({ className }: BreadcrumbProps) {
  const pathname = usePathname()
  const [productTitle, setProductTitle] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Skip rendering breadcrumbs on the main dashboard
  if (pathname === "/admin" || pathname === "/admin/dashboard") {
    return null
  }

  // Get product ID from pathname if it exists
  const paths = pathname.split("/").filter(Boolean)
  const productEditionsIdx = paths.findIndex((p) => p === "product-editions")
  const productId = productEditionsIdx !== -1 && paths.length > productEditionsIdx + 1
    ? paths[productEditionsIdx + 1]
    : null

  // Fetch product title when productId changes
  useEffect(() => {
    if (productId && mounted) {
      fetch(`/api/products/${productId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.product?.title) {
            setProductTitle(data.product.title)
          } else {
            setProductTitle(null)
          }
        })
        .catch(() => setProductTitle(null))
    }
  }, [productId, mounted])

  // Generate breadcrumb items
  const breadcrumbs = paths.map((path, index) => {
    // Build the URL for this breadcrumb
    const href = `/${paths.slice(0, index + 1).join("/")}`

    // Format the label (capitalize, replace hyphens with spaces)
    let label = path.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
    
    // If this is the productId segment under product-editions, use productTitle
    if (
      productEditionsIdx !== -1 &&
      index === productEditionsIdx + 1 &&
      productTitle &&
      mounted
    ) {
      label = productTitle
    }
    return { href, label }
  })

  // Don't render anything until mounted
  if (!mounted) {
    return null
  }

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
