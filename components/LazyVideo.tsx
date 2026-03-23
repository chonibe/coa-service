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
  const videoRef = useRef<HTMLVideoElement>(null)

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

  // Force mute and lock audio: re-apply mute on volumechange so audio never plays through
  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    el.muted = true
    const forceMute = () => { el.muted = true }
    el.addEventListener('volumechange', forceMute)
    return () => el.removeEventListener('volumechange', forceMute)
  }, [shouldLoad])

  const tryMutedAutoplay = (el: HTMLVideoElement) => {
    el.muted = true
    if (!props.autoPlay) return
    const attempt = () => {
      if (!el.paused) return
      el.play().catch(() => {})
    }
    attempt()
    requestAnimationFrame(attempt)
  }

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full">
      <video
        ref={videoRef}
        {...props}
        poster={poster}
        preload="none"
        playsInline
        muted
        loop
        disablePictureInPicture
        disableRemotePlayback
        controlsList="nodownload nofullscreen noremoteplayback"
        className={cn(
          'absolute inset-0 h-full w-full object-cover outline-none ring-0 focus:outline-none focus-visible:outline-none',
          className
        )}
        onLoadedData={(e) => {
          tryMutedAutoplay(e.currentTarget)
          props.onLoadedData?.(e)
        }}
        onCanPlay={(e) => {
          tryMutedAutoplay(e.currentTarget)
          props.onCanPlay?.(e)
        }}
      >
        {shouldLoad && <source src={src} type={type} />}
        {children}
      </video>
    </div>
  )
}
