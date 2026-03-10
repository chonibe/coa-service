"use client"

import Link from "next/link"

/**
 * Skip link component for keyboard navigation
 * Allows users to skip to main content
 */
export function SkipLink() {
  return (
    <Link
      href="#main-content"
      className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-4 focus-visible:left-4 focus-visible:z-50 focus-visible:px-4 focus-visible:py-2 focus-visible:bg-primary focus-visible:text-primary-foreground focus-visible:rounded-md focus-visible:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      Skip to main content
    </Link>
  )
}

