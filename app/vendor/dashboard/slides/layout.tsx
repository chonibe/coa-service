import type { ReactNode } from "react"

/**
 * Full-screen layout for slides editor
 *
 * This layout provides a complete full-page experience for the slides feature,
 * removing all vendor dashboard elements (sidebar, header, etc.) for an immersive
 * canvas editing experience.
 */
export default function SlidesFullScreenLayout({
  children
}: {
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Full-screen container with no padding or margins */}
      <div className="w-full h-full relative">
        {children}
      </div>
    </div>
  )
}
