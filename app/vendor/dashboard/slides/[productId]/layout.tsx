"use client"

import { ReactNode } from "react"
import { useIsMobile } from "@/hooks/use-is-mobile"

interface SlidesLayoutProps {
  children: ReactNode
}

/**
 * Layout for the slides editor
 * 
 * On mobile: Full-screen, no sidebar
 * On desktop: Uses the normal vendor dashboard layout
 * 
 * This layout component hides the vendor sidebar on mobile to provide
 * a full-screen canvas editing experience.
 */
export default function SlidesLayout({ children }: SlidesLayoutProps) {
  const { isMobile, isHydrated } = useIsMobile()

  // During SSR or before hydration, render normally
  if (!isHydrated) {
    return <>{children}</>
  }

  // On mobile, render full-screen (the parent vendor layout handles sidebar)
  // We add a class that the parent can use to hide sidebar
  return (
    <div 
      className={isMobile ? "slides-editor-mobile" : ""}
      data-slides-editor="true"
    >
      {children}
    </div>
  )
}
