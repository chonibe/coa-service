"use client"

import type { ReactNode } from "react"

/**
 * Full-screen layout for slides - NO dashboard UI elements at all
 *
 * This layout provides a complete full-page experience for the slides feature,
 * completely isolated from the vendor dashboard with no sidebar, header, or any
 * other UI elements. Pure, immersive editing experience.
 */
export default function SlidesFullScreenLayout({
  children
}: {
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Absolutely no dashboard UI - just the slides interface */}
      <div className="w-full h-full relative">
        {children}
      </div>
    </div>
  )
}