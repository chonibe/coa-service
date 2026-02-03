'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Container, Button } from '@/components/impact'

/**
 * Slideshow Section
 * 
 * Full-width image/video slideshow with autoplay, matching the Impact theme slideshow section.
 */

export interface SlideshowSlide {
  id: string
  type: 'image' | 'video'
  src: string
  mobileSrc?: string
  alt?: string
  poster?: string
  content?: {
    subheading?: string
    title?: string
    buttonText?: string
    buttonLink?: string
    textPosition?: 'center' | 'left' | 'right'
    textColor?: string
  }
  overlayColor?: string
  overlayOpacity?: number
}

export interface SlideshowProps {
  slides: SlideshowSlide[]
  autoplay?: boolean
  cycleSpeed?: number // seconds
  transitionType?: 'fade' | 'slide' | 'fade_with_text'
  controlsType?: 'dots' | 'numbers' | 'arrows' | 'none'
  showInitialTransition?: boolean
  imageSize?: 'auto' | 'cover' | 'contain'
  fullWidth?: boolean
  allowTransparentHeader?: boolean
  className?: string
}

export function Slideshow({
  slides,
  autoplay = true,
  cycleSpeed = 6,
  transitionType = 'fade',
  controlsType = 'dots',
  showInitialTransition = false,
  imageSize = 'cover',
  fullWidth = true,
  allowTransparentHeader = true,
  className,
}: SlideshowProps) {
  const [currentSlide, setCurrentSlide] = React.useState(0)
  const [isTransitioning, setIsTransitioning] = React.useState(showInitialTransition)
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null)

  // Autoplay
  React.useEffect(() => {
    if (!autoplay || slides.length <= 1) return

    intervalRef.current = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length)
        setIsTransitioning(false)
      }, 300)
    }, cycleSpeed * 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoplay, cycleSpeed, slides.length])

  // Navigate to slide
  const goToSlide = (index: number) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentSlide(index)
      setIsTransitioning(false)
    }, 300)
  }

  const slide = slides[currentSlide]
  if (!slide) return null

  // Position classes
  const textPositionClasses = {
    center: 'items-center justify-center text-center',
    left: 'items-center justify-start text-left',
    right: 'items-center justify-end text-right',
  }

  return (
    <section
      className={cn(
        'relative h-screen min-h-[500px] overflow-hidden',
        fullWidth && 'w-full',
        className
      )}
    >
      {/* Slides */}
      {slides.map((s, index) => (
        <div
          key={s.id}
          className={cn(
            'absolute inset-0 transition-opacity duration-500',
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          )}
        >
          {/* Media */}
          {s.type === 'image' ? (
            <picture>
              {s.mobileSrc && (
                <source media="(max-width: 768px)" srcSet={s.mobileSrc} />
              )}
              <img
                src={s.src}
                alt={s.alt || ''}
                className={cn(
                  'w-full h-full',
                  imageSize === 'cover' && 'object-cover',
                  imageSize === 'contain' && 'object-contain',
                  imageSize === 'auto' && 'object-cover'
                )}
              />
            </picture>
          ) : (
            <video
              src={s.src}
              poster={s.poster}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          )}

          {/* Overlay */}
          {s.overlayColor && (
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: s.overlayColor,
                opacity: (s.overlayOpacity ?? 30) / 100,
              }}
            />
          )}
        </div>
      ))}

      {/* Content */}
      {slide.content && (slide.content.title || slide.content.subheading || slide.content.buttonText) && (
        <div
          className={cn(
            'absolute inset-0 z-20 flex p-8',
            textPositionClasses[slide.content.textPosition || 'center'],
            isTransitioning && transitionType === 'fade_with_text' && 'opacity-0',
            !isTransitioning && 'opacity-100 transition-opacity duration-300'
          )}
        >
          <Container maxWidth="narrow" paddingX="gutter">
            <div className="max-w-xl">
              {slide.content.subheading && (
                <p
                  className="text-sm uppercase tracking-wider mb-4"
                  style={{ color: slide.content.textColor || '#ffffff' }}
                >
                  {slide.content.subheading}
                </p>
              )}
              {slide.content.title && (
                <h2
                  className="font-heading text-impact-h0 xl:text-impact-h0-lg font-semibold tracking-[-0.02em] mb-6"
                  style={{ color: slide.content.textColor || '#ffffff' }}
                >
                  {slide.content.title}
                </h2>
              )}
              {slide.content.buttonText && slide.content.buttonLink && (
                <a href={slide.content.buttonLink}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white text-white hover:bg-white hover:text-[#1a1a1a]"
                  >
                    {slide.content.buttonText}
                  </Button>
                </a>
              )}
            </div>
          </Container>
        </div>
      )}

      {/* Controls */}
      {slides.length > 1 && controlsType !== 'none' && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
          {controlsType === 'dots' && (
            <div className="flex items-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => goToSlide(index)}
                  className={cn(
                    'w-2.5 h-2.5 rounded-full transition-all',
                    index === currentSlide
                      ? 'bg-white scale-125'
                      : 'bg-white/50 hover:bg-white/75'
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}

          {controlsType === 'numbers' && (
            <div className="flex items-center gap-4">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => goToSlide(index)}
                  className={cn(
                    'text-sm font-medium transition-all',
                    index === currentSlide
                      ? 'text-white scale-110'
                      : 'text-white/50 hover:text-white/75'
                  )}
                >
                  {String(index + 1).padStart(2, '0')}
                </button>
              ))}
            </div>
          )}

          {controlsType === 'arrows' && (
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => goToSlide((currentSlide - 1 + slides.length) % slides.length)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                aria-label="Previous slide"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <span className="text-white text-sm">
                {currentSlide + 1} / {slides.length}
              </span>
              <button
                type="button"
                onClick={() => goToSlide((currentSlide + 1) % slides.length)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                aria-label="Next slide"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default Slideshow
