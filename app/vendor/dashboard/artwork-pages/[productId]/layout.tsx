import { ReactNode } from "react"

interface ArtworkPageEditorLayoutProps {
  children: ReactNode
}

/**
 * Artwork Page Editor Layout (Desktop)
 * 
 * Overrides the vendor dashboard sidebar layout to provide
 * a full-screen editing experience for artwork pages.
 */
export default function ArtworkPageEditorLayout({
  children,
}: ArtworkPageEditorLayoutProps) {
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
