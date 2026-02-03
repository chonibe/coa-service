'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { SectionWrapper, Container, Button } from '@/components/impact'

/**
 * Video Player Section
 * 
 * Full-width video player with overlay content, matching the Impact theme video section.
 * Supports autoplay, play/pause controls, and text overlay.
 */

export interface VideoPlayerProps {
  video: {
    url: string
    mobileUrl?: string
    poster?: string
    autoplay?: boolean
    loop?: boolean
    muted?: boolean
  }
  overlay?: {
    headline?: string
    subheadline?: string
    cta?: {
      text: string
      url: string
      style?: 'primary' | 'outline' | 'secondary'
    }
    textColor?: string
    overlayColor?: string
    overlayOpacity?: number
    position?: 'center' | 'bottom-left' | 'bottom-center'
  }
  size?: 'sm' | 'md' | 'lg' | 'full'
  fullWidth?: boolean
  showControls?: boolean
  allowTransparentHeader?: boolean
  className?: string
}

export function VideoPlayer({
  video,
  overlay,
  size = 'lg',
  fullWidth = true,
  showControls = true,
  allowTransparentHeader = true,
  className,
}: VideoPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = React.useState(video.autoplay ?? true)
  const [isMuted, setIsMuted] = React.useState(video.muted ?? true)
  const [showPlayButton, setShowPlayButton] = React.useState(!video.autoplay)

  // Handle play/pause
  const togglePlay = () => {
    if (!videoRef.current) return
    
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
    setShowPlayButton(false)
  }

  // Handle mute/unmute
  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  // Video size classes
  const sizeClasses = {
    sm: 'h-[50vh] min-h-[300px]',
    md: 'h-[70vh] min-h-[400px]',
    lg: 'h-[85vh] min-h-[500px]',
    full: 'h-screen',
  }

  // Overlay position classes
  const positionClasses = {
    center: 'items-center justify-center text-center',
    'bottom-left': 'items-end justify-start text-left pb-16 px-8',
    'bottom-center': 'items-end justify-center text-center pb-16',
  }

  return (
    <section
      className={cn(
        'relative overflow-hidden',
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
    >
      {/* Video */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        src={video.url}
        poster={video.poster}
        autoPlay={video.autoplay}
        loop={video.loop ?? true}
        muted={video.muted ?? true}
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        <source src={video.url} type="video/mp4" />
        {video.mobileUrl && (
          <source src={video.mobileUrl} type="video/mp4" media="(max-width: 768px)" />
        )}
      </video>

      {/* Overlay */}
      {overlay && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: overlay.overlayColor || '#000000',
            opacity: (overlay.overlayOpacity ?? 0) / 100,
          }}
        />
      )}

      {/* Content */}
      {overlay && (overlay.headline || overlay.subheadline || overlay.cta) && (
        <div
          className={cn(
            'absolute inset-0 flex flex-col',
            positionClasses[overlay.position || 'center']
          )}
        >
          <Container maxWidth="default" paddingX="gutter">
            <div className="max-w-2xl">
              {overlay.headline && (
                <h1
                  className="font-heading text-impact-h0 xl:text-impact-h0-lg font-semibold tracking-[-0.02em] mb-4"
                  style={{ color: overlay.textColor || '#ffffff' }}
                >
                  {overlay.headline}
                </h1>
              )}
              {overlay.subheadline && (
                <p
                  className="text-lg sm:text-xl mb-6"
                  style={{ color: overlay.textColor || '#ffffff' }}
                >
                  {overlay.subheadline}
                </p>
              )}
              {overlay.cta && (
                <a href={overlay.cta.url}>
                  <Button
                    variant={overlay.cta.style || 'outline'}
                    size="lg"
                    className={overlay.cta.style === 'outline' ? 'border-white text-white hover:bg-white hover:text-[#1a1a1a]' : ''}
                  >
                    {overlay.cta.text}
                  </Button>
                </a>
              )}
            </div>
          </Container>
        </div>
      )}

      {/* Play button overlay */}
      {showPlayButton && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity hover:bg-black/30"
          aria-label="Play video"
        >
          <div className="w-20 h-20 flex items-center justify-center rounded-full bg-white/90 shadow-lg">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
      )}

      {/* Controls */}
      {showControls && !showPlayButton && (
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlay}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={toggleMute}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>
        </div>
      )}
    </section>
  )
}

export default VideoPlayer
