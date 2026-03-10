'use client'

import React, { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

/**
 * Video that is always muted and re-applies mute on volumechange.
 * Use on landing/shop pages where audio must never play.
 */
export interface MutedVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string
  className?: string
}

export function MutedVideo({ className, ...props }: MutedVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    el.muted = true
    const forceMute = () => { el.muted = true }
    el.addEventListener('volumechange', forceMute)
    return () => el.removeEventListener('volumechange', forceMute)
  }, [])

  return (
    <video
      ref={videoRef}
      {...props}
      muted
      playsInline
      disablePictureInPicture
      disableRemotePlayback
      controlsList="nodownload nofullscreen noremoteplayback"
      className={cn('absolute inset-0 w-full h-full object-cover', className)}
    />
  )
}
