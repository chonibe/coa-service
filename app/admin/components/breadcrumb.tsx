/// <reference types="react" />
"use client"

import React from "react"
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

  // Skip rendering breadcrumbs on the main dashboard
  if (pathname === "/admin" || pathname === "/admin/dashboard") {
    return null
  }

  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = () => {
    // Remove leading slash and split by slash
    const paths = pathname.split("/").filter(Boolean)

    // If this is a product-editions page, fetch the product title
    const productEditionsIdx = paths.findIndex(
      (p) => p === "product-editions"
    )
    let productId: string | null = null
    if (
      productEditionsIdx !== -1 &&
      paths.length > productEditionsIdx + 1
    ) {
      productId = paths[productEditionsIdx + 1]
    }

    useEffect(() => {
      if (productId) {
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
    }, [productId])

    // Create breadcrumb items
    const breadcrumbs = paths.map((path, index) => {
      // Build the URL for this breadcrumb
      const href = `/${paths.slice(0, index + 1).join("/")}`

      // Format the label (capitalize, replace hyphens with spaces)
      let label = path.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
      // If this is the productId segment under product-editions, use productTitle
      if (
        productEditionsIdx !== -1 &&
        index === productEditionsIdx + 1 &&
        productTitle
      ) {
        label = productTitle
      }
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
