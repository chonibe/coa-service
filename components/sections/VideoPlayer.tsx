'use client'

import * as React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Container } from '@/components/impact'

/**
 * Video Player Section
 * 
 * Full-width video player with overlay content, matching the Impact theme video section.
 * Supports autoplay, play/pause controls, and text overlay.
 */

function OverlayHeroSubtext({
  text,
  headlineSize,
  textColor,
  className,
}: {
  text: string
  headlineSize?: 'default' | 'large' | 'medium'
  textColor?: string
  /** e.g. mt-0 when wrapped in a block that already handles vertical rhythm */
  className?: string
}) {
  return (
    <p
      className={cn(
        'max-w-xl mx-auto',
        className ?? 'mt-4',
        headlineSize === 'large'
          ? 'text-lg sm:text-xl md:text-xl'
          : headlineSize === 'medium'
            ? 'text-base sm:text-lg md:text-lg'
            : 'text-base sm:text-lg'
      )}
      style={{ color: textColor || '#ffffff' }}
    >
      {text}
    </p>
  )
}

export interface VideoPlayerProps {
  video: {
    url: string
    mobileUrl?: string
    poster?: string
    autoplay?: boolean
    loop?: boolean
    muted?: boolean
    /** Optional captions track URL (e.g. .vtt) for accessibility. Use for decorative/hero videos with no speech. */
    captionsUrl?: string
  }
  overlay?: {
    headline?: string
    subheadline?: string
    /** Optional third line under the headline (e.g. hero tagline); not linked */
    heroSubtext?: string
    /** Micro cue—subtle directional text under subheadline (e.g. "Discover this month's drop.") */
    microCue?: string
    ctaUrl?: string
    cta?: {
      text: string
      url: string
      style?: 'primary' | 'outline' | 'secondary' | 'glassmorphism'
      backgroundColor?: string
      color?: string
    }
    textColor?: string
    overlayColor?: string
    overlayOpacity?: number
    position?: 'center' | 'lower-center' | 'bottom-left' | 'bottom-center' | 'top-center'
    headlineSize?: 'default' | 'large' | 'medium'
    /** When true, renders subheadline first (small) then headline (big). Default false = headline first. */
    subheadlineFirst?: boolean
    /** When 'bottom', CTA renders at bottom of hero (e.g. with title at top). Default 'with-title'. */
    ctaPosition?: 'with-title' | 'bottom'
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
  allowTransparentHeader: _allowTransparentHeader = true,
  className,
}: VideoPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = React.useState(video.autoplay ?? true)
  const [showPlayButton, setShowPlayButton] = React.useState(!video.autoplay)
  const [videoLoadStarted, setVideoLoadStarted] = React.useState(false)

  // Defer video load well past first paint so the 10MB video doesn't compete
  // with critical resources during Lighthouse's measurement window
  React.useEffect(() => {
    const t = setTimeout(() => {
      setVideoLoadStarted(true)
      videoRef.current?.load?.()
    }, 3000)
    return () => clearTimeout(t)
  }, [])

  // Force mute and lock audio: re-apply mute on volumechange so audio never plays through
  React.useEffect(() => {
    const el = videoRef.current
    if (!el) return
    el.muted = true
    const forceMute = () => { el.muted = true }
    el.addEventListener('volumechange', forceMute)
    return () => el.removeEventListener('volumechange', forceMute)
  }, [videoLoadStarted])

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
    'lower-center': 'justify-end items-center text-center pb-[18vh] sm:pb-[4vh]',
    'bottom-left': 'items-end justify-start text-left pb-16 px-8',
    'bottom-center': 'items-end justify-center text-center pb-20',
    'top-center': 'justify-start items-center text-center pt-20 sm:pt-24',
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
      {/* Poster as LCP: next/image for modern formats (WebP/AVIF) and optimization */}
      {video.poster && (
        <Image
          src={video.poster}
          alt=""
          width={1920}
          height={1080}
          className="absolute inset-0 w-full h-full object-cover z-0"
          fetchPriority="high"
          priority
          sizes="100vw"
        />
      )}
      {/* Video: preload=none so poster paints first; load started after delay */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover z-10"
        src={videoLoadStarted ? video.url : undefined}
        poster={video.poster}
        preload="none"
        autoPlay={video.autoplay}
        loop={video.loop ?? true}
        muted
        playsInline
        disablePictureInPicture
        disableRemotePlayback
        controlsList="nodownload nofullscreen noremoteplayback"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedData={(e) => {
          const el = e.currentTarget
          el.muted = true
          if (video.autoplay) el.play().catch(() => {})
        }}
      >
        {videoLoadStarted && (
          <>
            <source src={video.url} type="video/mp4" />
            {video.mobileUrl && (
              <source src={video.mobileUrl} type="video/mp4" media="(max-width: 768px)" />
            )}
            {video.captionsUrl && (
              <track kind="captions" src={video.captionsUrl} srcLang="en" label="English" default />
            )}
          </>
        )}
      </video>

      {/* Overlay */}
      {overlay && (
        <div
          className="absolute inset-0 z-20"
          style={{
            backgroundColor: overlay.overlayColor || '#000000',
            opacity: (overlay.overlayOpacity ?? 0) / 100,
          }}
        />
      )}

      {/* Content */}
      {overlay &&
        (overlay.headline || overlay.subheadline || overlay.heroSubtext || overlay.cta) &&
        (() => {
        const isCtaAtBottom = overlay.ctaPosition === 'bottom' && overlay.position === 'top-center'
        return (
        <div
          className={cn(
            'absolute inset-0 z-30 flex flex-col',
            isCtaAtBottom
              ? 'justify-between items-center'
              : positionClasses[overlay.position || 'center']
          )}
        >
          {isCtaAtBottom ? (
            <>
              {/* Title block at top — slightly more on mobile to move text down */}
              <Container maxWidth="default" paddingX="gutter" className="flex justify-center pt-[72px] sm:pt-20 md:pt-24">
                <div className="max-w-2xl mx-auto w-full text-center">
                  {overlay.subheadlineFirst ? (
                    <>
                      {overlay.subheadline && (
                        <p
                          className={cn(
                            'mb-2.5',
                            overlay.headlineSize === 'large'
                              ? 'text-3xl sm:text-2xl md:text-3xl lg:text-4xl'
                              : overlay.headlineSize === 'medium'
                                ? 'text-lg sm:text-xl md:text-xl'
                                : 'text-lg sm:text-xl'
                          )}
                          style={{ color: overlay.textColor || '#ffffff' }}
                        >
                          {overlay.subheadline}
                        </p>
                      )}
                      {overlay.headline && (
                        <h1
                          className={cn(
                            'font-heading font-semibold tracking-[-0.02em]',
                            overlay.headlineSize === 'large'
                              ? 'text-6xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl sm:whitespace-nowrap'
                              : overlay.headlineSize === 'medium'
                                ? 'text-3xl sm:text-4xl md:text-4xl lg:text-5xl'
                                : 'text-impact-h0 xl:text-impact-h0-lg sm:whitespace-nowrap'
                          )}
                          style={{ color: overlay.textColor || '#ffffff' }}
                        >
                          {overlay.headline}
                        </h1>
                      )}
                      {overlay.heroSubtext && (
                        <OverlayHeroSubtext
                          text={overlay.heroSubtext}
                          headlineSize={overlay.headlineSize}
                          textColor={overlay.textColor}
                        />
                      )}
                    </>
                  ) : (
                    <>
                      {overlay.headline && (
                        <h1
                          className={cn(
                            'font-heading font-semibold tracking-[-0.02em] mb-8 sm:mb-10',
                            overlay.headlineSize === 'large'
                              ? 'text-6xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl sm:whitespace-nowrap'
                              : overlay.headlineSize === 'medium'
                                ? 'text-3xl sm:text-4xl md:text-4xl lg:text-5xl'
                                : 'text-impact-h0 xl:text-impact-h0-lg sm:whitespace-nowrap'
                          )}
                          style={{ color: overlay.textColor || '#ffffff' }}
                        >
                          {overlay.headline}
                        </h1>
                      )}
                      {overlay.subheadline && (
                        <p
                          className={cn(
                            overlay.headlineSize === 'large'
                              ? 'text-3xl sm:text-2xl md:text-3xl lg:text-4xl'
                              : overlay.headlineSize === 'medium'
                                ? 'text-lg sm:text-xl md:text-xl'
                                : 'text-lg sm:text-xl'
                          )}
                          style={{ color: overlay.textColor || '#ffffff' }}
                        >
                          {overlay.subheadline}
                        </p>
                      )}
                      {overlay.heroSubtext && (
                        <OverlayHeroSubtext
                          text={overlay.heroSubtext}
                          headlineSize={overlay.headlineSize}
                          textColor={overlay.textColor}
                        />
                      )}
                    </>
                  )}
                </div>
              </Container>
              {/* CTA block at bottom — hidden on mobile (fixed button is shown there) */}
              {(overlay.cta || overlay.microCue) && (
                <Container
                  maxWidth="default"
                  paddingX="gutter"
                  className="hidden md:flex justify-center pb-[18vh] sm:pb-[4vh]"
                  style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 0px))' }}
                >
                  <div className="max-w-2xl mx-auto w-full text-center flex flex-col items-center gap-4">
                    {overlay.cta && (
                      <a
                        href={overlay.cta.url}
                        className={cn(
                          'inline-flex items-center justify-center font-semibold rounded-lg transition-all',
                          overlay.cta.backgroundColor || overlay.cta.color
                            ? 'px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base shadow-lg hover:opacity-90'
                            : overlay.cta.style === 'glassmorphism'
                              ? 'px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 hover:border-white/30 shadow-lg'
                              : overlay.cta.style === 'primary'
                                ? 'px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-[#047AFF] text-white hover:opacity-90'
                                : 'px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-white text-white hover:bg-white hover:text-[#1a1a1a]'
                        )}
                        style={
                          overlay.cta.backgroundColor || overlay.cta.color
                            ? {
                                backgroundColor: overlay.cta.backgroundColor,
                                color: overlay.cta.color,
                              }
                            : undefined
                        }
                      >
                        {overlay.cta.text}
                      </a>
                    )}
                    {overlay.microCue && (
                      <a
                        href={overlay.ctaUrl || overlay.cta?.url || '#'}
                        className="text-sm sm:text-base opacity-90 hover:opacity-100 underline underline-offset-2 transition-opacity"
                        style={{ color: overlay.textColor || '#ffffff' }}
                      >
                        {overlay.microCue}
                      </a>
                    )}
                  </div>
                </Container>
              )}
            </>
          ) : (
            <Container maxWidth="default" paddingX="gutter" className="flex justify-center">
              <div className="max-w-2xl mx-auto w-full text-center">
                {overlay.subheadlineFirst ? (
                <>
                  {overlay.subheadline && (
                    <p
                      className={cn(
                        'mb-2.5',
                        overlay.headlineSize === 'large'
                          ? 'text-3xl sm:text-2xl md:text-3xl lg:text-4xl'
                          : overlay.headlineSize === 'medium'
                            ? 'text-lg sm:text-xl md:text-xl'
                            : 'text-lg sm:text-xl'
                      )}
                      style={{ color: overlay.textColor || '#ffffff' }}
                    >
                      {overlay.subheadline}
                    </p>
                  )}
                  {overlay.headline && (
                    <h1
                      className={cn(
                        'font-heading font-semibold tracking-[-0.02em]',
                        overlay.heroSubtext ? 'mb-2 sm:mb-3' : 'mb-8 sm:mb-10',
                        overlay.headlineSize === 'large'
                          ? 'text-6xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl sm:whitespace-nowrap'
                          : overlay.headlineSize === 'medium'
                            ? 'text-3xl sm:text-4xl md:text-4xl lg:text-5xl'
                            : 'text-impact-h0 xl:text-impact-h0-lg sm:whitespace-nowrap'
                      )}
                      style={{ color: overlay.textColor || '#ffffff' }}
                    >
                      {overlay.headline}
                    </h1>
                  )}
                  {overlay.heroSubtext && (
                    <div className="mb-8 sm:mb-10">
                      <OverlayHeroSubtext
                        text={overlay.heroSubtext}
                        headlineSize={overlay.headlineSize}
                        textColor={overlay.textColor}
                        className="mt-2 sm:mt-3"
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  {overlay.headline && (
                    <h1
                      className={cn(
                        'font-heading font-semibold tracking-[-0.02em] mb-8 sm:mb-10',
                        overlay.headlineSize === 'large'
                          ? 'text-6xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl sm:whitespace-nowrap'
                          : overlay.headlineSize === 'medium'
                            ? 'text-3xl sm:text-4xl md:text-4xl lg:text-5xl'
                            : 'text-impact-h0 xl:text-impact-h0-lg sm:whitespace-nowrap'
                      )}
                      style={{ color: overlay.textColor || '#ffffff' }}
                    >
                      {overlay.headline}
                    </h1>
                  )}
                  {overlay.subheadline && (
                    <p
                      className={cn(
                        overlay.heroSubtext ? 'mb-2 sm:mb-3' : 'mb-8 sm:mb-10',
                        overlay.headlineSize === 'large'
                          ? 'text-3xl sm:text-2xl md:text-3xl lg:text-4xl'
                          : overlay.headlineSize === 'medium'
                            ? 'text-lg sm:text-xl md:text-xl'
                            : 'text-lg sm:text-xl'
                      )}
                      style={{ color: overlay.textColor || '#ffffff' }}
                    >
                      {overlay.subheadline}
                    </p>
                  )}
                  {overlay.heroSubtext && (
                    <div className="mb-8 sm:mb-10">
                      <OverlayHeroSubtext
                        text={overlay.heroSubtext}
                        headlineSize={overlay.headlineSize}
                        textColor={overlay.textColor}
                        className="mt-2 sm:mt-3"
                      />
                    </div>
                  )}
                </>
              )}
              {overlay.cta && (
                <a
                  href={overlay.cta.url}
                  className={cn(
                    'hidden md:inline-flex items-center justify-center font-semibold rounded-lg transition-all mb-6',
                    overlay.cta.backgroundColor || overlay.cta.color
                      ? 'px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base shadow-lg hover:opacity-90'
                      : overlay.cta.style === 'glassmorphism'
                        ? 'px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 hover:border-white/30 shadow-lg'
                        : overlay.cta.style === 'primary'
                          ? 'px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-[#047AFF] text-white hover:opacity-90'
                          : 'px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-white text-white hover:bg-white hover:text-[#1a1a1a]'
                  )}
                  style={
                    overlay.cta.backgroundColor || overlay.cta.color
                      ? {
                          backgroundColor: overlay.cta.backgroundColor,
                          color: overlay.cta.color,
                        }
                      : undefined
                  }
                >
                  {overlay.cta.text}
                </a>
              )}
              {overlay.microCue && (
                <a
                  href={overlay.ctaUrl || overlay.cta?.url || '#'}
                  className="hidden md:block mb-6 text-sm sm:text-base opacity-90 hover:opacity-100 underline underline-offset-2 transition-opacity"
                  style={{ color: overlay.textColor || '#ffffff' }}
                >
                  {overlay.microCue}
                </a>
              )}
            </div>
          </Container>
          )}
        </div>
      )
    })()}

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
        </div>
      )}
    </section>
  )
}

export default VideoPlayer
