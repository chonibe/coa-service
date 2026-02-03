'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { SectionWrapper, Container } from '@/components/impact'

/**
 * Spline 3D Viewer Block
 * 
 * Embeds a Spline 3D scene, matching the Impact theme custom block.
 * Based on blocks/ai_gen_block_8e027ba.liquid
 */

export interface Spline3DViewerProps {
  splineUrl: string
  iframeTitle?: string
  position?: 'above' | 'below' | 'center'
  aspectRatio?: number // Percentage for desktop
  mobileAspectRatio?: number // Percentage for mobile
  desktopWidthPercent?: number // Width percentage on desktop
  backgroundColor?: string
  borderRadius?: number
  fullWidth?: boolean
  removeVerticalSpacing?: boolean
  removeHorizontalSpacing?: boolean
  className?: string
}

export function Spline3DViewer({
  splineUrl,
  iframeTitle = '3D Product Model',
  position = 'below',
  aspectRatio = 50,
  mobileAspectRatio = 60,
  desktopWidthPercent = 70,
  backgroundColor = '#d7d6d3',
  borderRadius = 0,
  fullWidth = true,
  removeVerticalSpacing = true,
  removeHorizontalSpacing = true,
  className,
}: Spline3DViewerProps) {
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [hasError, setHasError] = React.useState(false)

  // Handle iframe load
  const handleLoad = () => {
    setIsLoaded(true)
  }

  // Handle iframe error
  const handleError = () => {
    setHasError(true)
  }

  // Position classes
  const positionClasses = {
    above: 'items-start',
    below: 'items-end',
    center: 'items-center',
  }

  return (
    <section
      className={cn(
        'relative overflow-hidden',
        removeVerticalSpacing ? '' : 'py-12 sm:py-16',
        fullWidth && 'w-full',
        className
      )}
      style={{ backgroundColor }}
    >
      <div className={cn(
        'flex justify-center',
        positionClasses[position],
        removeHorizontalSpacing ? '' : 'px-5 sm:px-8 lg:px-12'
      )}>
        <div
          className="w-full relative"
          style={{
            maxWidth: desktopWidthPercent ? `${desktopWidthPercent}%` : '100%',
          }}
        >
          {/* Aspect ratio container */}
          <div
            className="relative w-full"
            style={{
              paddingBottom: `${mobileAspectRatio}%`,
            }}
          >
            {/* Desktop aspect ratio override */}
            <style jsx>{`
              @media (min-width: 768px) {
                .aspect-container {
                  padding-bottom: ${aspectRatio}% !important;
                }
              }
            `}</style>

            {/* Loading state */}
            {!isLoaded && !hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#f5f5f5] rounded-[var(--radius)]" style={{ '--radius': `${borderRadius}px` } as React.CSSProperties}>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 border-4 border-[#2c4bce]/20 border-t-[#2c4bce] rounded-full animate-spin" />
                  <p className="text-sm text-[#1a1a1a]/60">Loading 3D model...</p>
                </div>
              </div>
            )}

            {/* Error state */}
            {hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#f5f5f5] rounded-[var(--radius)]" style={{ '--radius': `${borderRadius}px` } as React.CSSProperties}>
                <div className="text-center">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1" className="mx-auto mb-3 opacity-30">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p className="text-sm text-[#1a1a1a]/60">Failed to load 3D model</p>
                </div>
              </div>
            )}

            {/* Spline iframe */}
            <iframe
              src={splineUrl}
              title={iframeTitle}
              className={cn(
                'absolute inset-0 w-full h-full border-0',
                !isLoaded && 'opacity-0'
              )}
              style={{ borderRadius: `${borderRadius}px` }}
              onLoad={handleLoad}
              onError={handleError}
              allow="autoplay; fullscreen"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Spline3DViewer
