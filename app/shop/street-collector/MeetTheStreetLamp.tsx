'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface MeetTheLampStage {
  title: string
  description: string
}

interface MeetTheStreetLampProps {
  title: string
  stages: MeetTheLampStage[]
  desktopVideo: string
  mobileVideo: string
  poster: string
  /** Momentum cue—subtle link after section (e.g. "Explore available artworks.") */
  cue?: string
  cueHref?: string
  className?: string
}

const PROGRESS_BAR_WIDTH = 4

/** lg breakpoint = 1024px - matches desktop grid */
const DESKTOP_BREAKPOINT = 1024

/** Seconds per stage for text rotation (faster cycle) */
const STAGE_INTERVAL_MS = 4000

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(true)
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`)
    const handler = () => setIsDesktop(mq.matches)
    handler()
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isDesktop
}

/**
 * Meet the Street Lamp section: one looping video (desktop/mobile), stages with progress bar
 * that rotates through texts on a timer (every 4s). Video and text list are centered.
 */
export function MeetTheStreetLamp({
  title,
  stages,
  desktopVideo,
  mobileVideo,
  poster,
  cue,
  cueHref = '/shop/experience',
  className,
}: MeetTheStreetLampProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const isDesktop = useIsDesktop()
  const videoUrl = isDesktop ? desktopVideo : mobileVideo

  const goToNext = useCallback(() => {
    setProgress(0)
    setActiveIndex((i) => (i + 1) % stages.length)
  }, [stages.length])

  /** Timer-driven stage rotation + progress bar (faster cycle) */
  useEffect(() => {
    const tick = 100
    const step = (100 / STAGE_INTERVAL_MS) * tick
    const id = setInterval(() => {
      setProgress((p) => {
        if (p + step >= 100) {
          goToNext()
          return 0
        }
        return Math.min(100, p + step)
      })
    }, tick)
    return () => clearInterval(id)
  }, [goToNext])

  const handleSelectIndex = (index: number) => {
    if (index === activeIndex) return
    setProgress(0)
    setActiveIndex(index)
  }

  const stageList = (
    <ul className="space-y-0">
      {stages.map((stage, index) => {
        const isActive = activeIndex === index
        return (
          <li key={stage.title}>
            <button
              type="button"
              onClick={() => handleSelectIndex(index)}
              className={cn(
                'relative w-full text-left py-3 md:py-4 pl-5 transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFBA94]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#390000]',
                isActive ? 'text-[#FFBA94]' : 'text-[#FFBA94]/60 hover:text-[#FFBA94]/80'
              )}
            >
              {isActive && (
                <span
                  className="absolute left-0 top-0 bottom-0 w-[4px] rounded-full bg-[#FFBA94]/20 overflow-hidden"
                  style={{ width: PROGRESS_BAR_WIDTH }}
                  aria-hidden
                >
                  <span
                    className="absolute left-0 top-0 w-full bg-[#FFBA94] transition-all duration-150 ease-linear"
                    style={{ height: `${progress}%` }}
                  />
                </span>
              )}
              {!isActive && (
                <span
                  className="absolute left-0 top-0 bottom-0 w-[4px] rounded-full bg-[#FFBA94]/20"
                  style={{ width: PROGRESS_BAR_WIDTH }}
                  aria-hidden
                />
              )}
              <span className="text-base md:text-lg font-medium">{stage.title}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )

  /** Mobile: centered rotating text with marquee-style animation */
  const mobileCenteredStage = !isDesktop && (
    <div className="relative overflow-hidden min-h-[120px] flex flex-col items-center justify-center text-center mb-6">
      <div
        key={activeIndex}
        className="animate-in fade-in slide-in-from-bottom-4 duration-500"
      >
        <h3 className="text-xl sm:text-2xl font-semibold text-[#FFBA94] mb-2">
          {stages[activeIndex]?.title}
        </h3>
        <p className="text-base text-[#FFBA94]/80 leading-relaxed max-w-md mx-auto px-2">
          {stages[activeIndex]?.description}
        </p>
      </div>
      {/* Stage dots */}
      <div className="flex items-center justify-center gap-1.5 mt-4" aria-hidden>
        {stages.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSelectIndex(i)}
            className={cn(
              'min-w-0 min-h-0 p-0 rounded-full transition-colors shrink-0',
              i === activeIndex ? 'bg-[#FFBA94]' : 'bg-[#FFBA94]/30 hover:bg-[#FFBA94]/50'
            )}
            style={{ width: 4, height: 4 }}
            aria-label={`Go to step ${i + 1}`}
          />
        ))}
      </div>
      {/* Progress bar */}
      <div className="w-full max-w-[120px] h-0.5 bg-[#FFBA94]/20 rounded-full overflow-hidden mt-3">
        <div
          className="h-full bg-[#FFBA94] rounded-full transition-all duration-150 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )

  const titleBlock = (
    <h2 className="font-serif font-medium text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#FFBA94] mb-4 md:mb-6 tracking-tight text-center lg:text-left">
      {title}
    </h2>
  )

  return (
    <section className={cn('w-full py-8 sm:py-10 md:py-16 bg-[#151212]', className)}>
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        {/* Mobile: title, video, then centered rotating stage text slideshow */}
        {!isDesktop && (
        <div className="flex flex-col gap-8 sm:gap-10">
          <div>{titleBlock}</div>
          <div className="relative w-full overflow-hidden rounded-2xl aspect-[3/4]">
            <video
              ref={videoRef}
              key={`mobile-${videoUrl}`}
              playsInline
              muted
              loop
              autoPlay
              preload="metadata"
              poster={poster}
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source
                src={`/api/proxy-video?url=${encodeURIComponent(videoUrl)}`}
                type="video/mp4"
              />
            </video>
          </div>
          <div>{mobileCenteredStage}</div>
        </div>
        )}

        {/* Desktop: title + list left, video right; title directly above texts */}
        {isDesktop && (
        <div className="grid grid-cols-[minmax(200px,280px)_1fr] gap-8 lg:gap-12 items-center">
          <div>
            {titleBlock}
            {stageList}
          </div>
          <div className="relative w-full rounded-2xl overflow-hidden bg-neutral-800 aspect-[4/5] max-h-[640px]">
            <video
              ref={videoRef}
              key={`desktop-${videoUrl}`}
              playsInline
              muted
              loop
              autoPlay
              preload="metadata"
              poster={poster}
              className="absolute inset-0 w-full h-full object-cover rounded-2xl"
            >
              <source
                src={`/api/proxy-video?url=${encodeURIComponent(videoUrl)}`}
                type="video/mp4"
              />
            </video>
          </div>
        </div>
        )}
        {cue && (
          <div className="text-center mt-8 md:mt-10">
            <a
              href={cueHref}
              className="text-base sm:text-lg text-[#FFBA94]/80 hover:text-[#FFBA94] underline underline-offset-2 transition-colors"
            >
              {cue}
            </a>
          </div>
        )}
      </div>
    </section>
  )
}
