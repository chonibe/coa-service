import { ReactNode } from "react"

interface MobileArtworkEditorLayoutProps {
  children: ReactNode
}

/**
 * Mobile Artwork Pages Editor Layout
 * 
 * Provides full-screen, isolated editing experience for mobile devices.
 * No dashboard sidebar, full-screen black background, safe area padding.
 */
export default function MobileArtworkEditorLayout({
  children,
}: MobileArtworkEditorLayoutProps) {
  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <div className="w-full h-full relative flex flex-col">
        {children}
      </div>
    </div>
  )
}
