/**
 * VideoPlayer Enhanced
 * 
 * Enhanced hero video player with:
 * - Scroll-linked zoom and parallax
 * - Animated text split on load
 * - Progressive overlay fade
 * - Elastic CTA animation
 * 
 * @example
 * ```tsx
 * <VideoPlayerEnhanced
 *   video={{ url: '...', autoplay: true }}
 *   overlay={{
 *     headline: 'Welcome',
 *     subheadline: 'Experience the future',
 *     cta: { text: 'Shop Now', url: '/shop' }
 *   }}
 * />
 * ```
 */

'use client'

import * as React from 'react'
import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { SectionWrapper, Container, Button } from '@/components/impact'
import { gsap } from '@/lib/animations/gsap-config'
import { useGSAP } from '@gsap/react'
import { wrapTextInSpans, fadeUpReveal } from '@/lib/animations/text-animations'

export interface VideoPlayerEnhancedProps {
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
  /** Enable scroll-linked animations */
  enableScrollEffects?: boolean
  /** Enable text split animation */
  enableTextAnimation?: boolean
}

export function VideoPlayerEnhanced({
  video,
  overlay,
  size = 'lg',
  fullWidth = true,
  showControls = true,
  allowTransparentHeader = true,
  className,
  enableScrollEffects = true,
  enableTextAnimation = true,
}: VideoPlayerEnhancedProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const subheadlineRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  const [isPlaying, setIsPlaying] = React.useState(video.autoplay ?? true)
  const [isMuted, setIsMuted] = React.useState(video.muted ?? true)
  const [showPlayButton, setShowPlayButton] = React.useState(!video.autoplay)
  const [videoError, setVideoError] = React.useState(false)

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

  // Text split animation on mount
  useEffect(() => {
    if (!enableTextAnimation) return

    let headlineSpans: HTMLSpanElement[] = []
    let subheadlineSpans: HTMLSpanElement[] = []

    if (headlineRef.current && overlay?.headline) {
      headlineSpans = wrapTextInSpans(headlineRef.current, { type: 'chars' })
    }

    if (subheadlineRef.current && overlay?.subheadline) {
      subheadlineSpans = wrapTextInSpans(subheadlineRef.current, { type: 'words' })
    }

    // Animate text in
    const tl = gsap.timeline({ delay: 0.3 })

    if (headlineSpans.length > 0) {
      tl.from(headlineSpans, {
        opacity: 0,
        y: 40,
        rotateX: -90,
        transformOrigin: 'top center',
        stagger: 0.02,
        duration: 0.6,
        ease: 'back.out(1.2)',
      })
    }

    if (subheadlineSpans.length > 0) {
      tl.from(
        subheadlineSpans,
        {
          opacity: 0,
          y: 20,
          stagger: 0.03,
          duration: 0.5,
          ease: 'power2.out',
        },
        '-=0.3'
      )
    }

    // Animate CTA button
    if (ctaRef.current) {
      tl.from(
        ctaRef.current,
        {
          opacity: 0,
          scale: 0.8,
          duration: 0.6,
          ease: 'elastic.out(1, 0.5)',
        },
        '-=0.2'
      )
    }

    return () => {
      tl.kill()
    }
  }, [overlay, enableTextAnimation])

  // Scroll-linked animations
  useGSAP(() => {
    if (!enableScrollEffects) return
    if (!sectionRef.current || !videoRef.current) return

    const section = sectionRef.current
    const videoElement = videoRef.current

    // Video zoom-out effect
    gsap.fromTo(
      videoElement,
      { scale: 1.15 },
      {
        scale: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      }
    )

    // Parallax video movement
    gsap.to(videoElement, {
      y: '20%',
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
      },
    })

    // Progressive overlay fade
    if (overlayRef.current) {
      gsap.fromTo(
        overlayRef.current,
        { opacity: (overlay?.overlayOpacity ?? 0) / 100 },
        {
          opacity: Math.min(1, ((overlay?.overlayOpacity ?? 0) / 100) + 0.4),
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        }
      )
    }
  }, { dependencies: [enableScrollEffects, overlay?.overlayOpacity], scope: sectionRef })

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
      ref={sectionRef}
      className={cn(
        'relative overflow-hidden',
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
    >
      {/* Video Container with transform origin at center */}
      <div className="absolute inset-0">
        {!videoError ? (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              transformOrigin: 'center center',
            }}
            src={video.url}
            poster={video.poster}
            autoPlay={video.autoplay}
            loop={video.loop ?? true}
            muted={video.muted ?? true}
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={(e) => {
              console.error('Video load error:', e)
              setVideoError(true)
            }}
          />
        ) : (
          // Fallback poster image if video fails to load
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: video.poster ? `url(${video.poster})` : 'linear-gradient(135deg, #390000 0%, #5a1a1a 100%)',
            }}
          />
        )}
      </div>

      {/* Overlay */}
      {overlay && (
        <div
          ref={overlayRef}
          className="absolute inset-0 pointer-events-none"
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
            positionClasses[overlay.position || 'center'],
            'pointer-events-none'
          )}
        >
          <Container maxWidth="default" paddingX="gutter">
            <div className="max-w-2xl">
              {overlay.headline && (
                <h1
                  ref={headlineRef}
                  className="font-heading text-impact-h0 xl:text-impact-h0-lg font-semibold tracking-[-0.02em] mb-4"
                  style={{ 
                    color: overlay.textColor || '#ffffff',
                    perspective: '1000px',
                  }}
                >
                  {overlay.headline}
                </h1>
              )}
              {overlay.subheadline && (
                <p
                  ref={subheadlineRef}
                  className="text-lg sm:text-xl mb-6"
                  style={{ color: overlay.textColor || '#ffffff' }}
                >
                  {overlay.subheadline}
                </p>
              )}
              {overlay.cta && (
                <div ref={ctaRef} className="pointer-events-auto inline-block">
                  <a href={overlay.cta.url}>
                    <Button
                      variant={overlay.cta.style || 'outline'}
                      size="lg"
                      className={overlay.cta.style === 'outline' ? 'border-white text-white hover:bg-white hover:text-[#1a1a1a]' : ''}
                    >
                      {overlay.cta.text}
                    </Button>
                  </a>
                </div>
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
          className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity hover:bg-black/30 pointer-events-auto z-10"
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
        <div className="absolute bottom-4 right-4 flex items-center gap-2 pointer-events-auto z-10">
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

export default VideoPlayerEnhanced
