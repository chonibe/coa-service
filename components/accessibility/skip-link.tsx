"use client"

import Link from "next/link"

/**
 * Skip link: visually hidden until focused via keyboard (Tab).
 * Kept off-screen on load so it never flashes; only appears on focus-visible.
 */
export function SkipLink() {
  return (
    <Link
      href="#main-content"
      className="absolute left-[-9999px] top-4 z-[100] px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-lg outline-none ring-2 ring-ring ring-offset-2 focus-visible:left-4"
    >
      Skip to main content
    </Link>
  )
}

