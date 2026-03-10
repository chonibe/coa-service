'use client'

import React, { useRef, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

/**
 * Video that only loads src when near viewport (Intersection Observer).
 * Reduces initial payload by not loading below-the-fold videos until needed.
 */
export interface LazyVideoProps
  extends Omit<React.VideoHTMLAttributes<HTMLVideoElement>, 'src'> {
  src: string
  poster?: string
  /** MIME type for source (default: video/mp4) */
  type?: string
  /** Root margin for IntersectionObserver (default: 200px ahead) */
  rootMargin?: string
}

export function LazyVideo({
  src,
  poster,
  type = 'video/mp4',
  rootMargin = '200px',
  className,
  children,
  ...props
}: LazyVideoProps) {
  const [shouldLoad, setShouldLoad] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setShouldLoad(true)
      },
      { rootMargin, threshold: 0 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [rootMargin])

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full">
      <video
        {...props}
        poster={poster}
        preload="none"
        playsInline
        muted
        loop
        className={cn('absolute inset-0 w-full h-full object-cover', className)}
        onLoadedData={(e) => {
          e.currentTarget.muted = true
          if (props.autoPlay) e.currentTarget.play().catch(() => {})
          props.onLoadedData?.(e)
        }}
      >
        {shouldLoad && <source src={src} type={type} />}
        {children}
      </video>
    </div>
  )
}
