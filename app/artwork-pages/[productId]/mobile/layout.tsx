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
    <div 
      className="fixed inset-0 bg-black overflow-hidden z-[9999]"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000',
        zIndex: 9999,
      }}
    >
      <div className="w-full h-full relative flex flex-col">
        {children}
      </div>
    </div>
  )
}
