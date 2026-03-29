'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LazyVideo } from '@/components/LazyVideo'

export interface MeetTheLampStage {
  title: string
  description: string
  /** Optional per-slide video URLs (`content/street-collector.ts` → `meetTheLamp.stages`). */
  desktopVideo?: string | null
  mobileVideo?: string | null
  poster?: string | null
}

/** Single glassmorphism price chip */
const pricingGlassClass = cn(
  'inline-flex max-w-[min(100%,22rem)] items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-center font-semibold',
  'text-[11px] leading-snug sm:px-3.5 sm:py-2 sm:text-sm sm:leading-normal',
  'text-white',
  'border border-white/20 bg-white/10 backdrop-blur-xl backdrop-saturate-150',
  'shadow-[0_6px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.14)]'
)

function pricingLabelFromChips(chips?: string[]): string | null {
  if (!chips?.length) return null
  return chips.length === 1 ? chips[0] : chips.join(' · ')
}

/** Two-line desktop title when copy ends with "Street Lamp" (e.g. Meet the / Street Lamp). */
function splitMeetTheStreetLampTitle(title: string): { line1: string; line2: string } | null {
  const t = title.trim()
  const line2 = 'Street Lamp'
  if (!t.endsWith(line2) || t.length <= line2.length) return null
  const line1 = t.slice(0, t.length - line2.length).trimEnd()
  if (!line1) return null
  return { line1, line2 }
}

interface MeetTheStreetLampProps {
  title: string
  taglineLines?: readonly string[]
  stages: MeetTheLampStage[]
  desktopVideo: string
  mobileVideo: string
  poster: string
  /** Single line or parts joined with · — mobile: on video; desktop: under subtitle */
  pricingChips?: string[]
  cue?: string
  cueHref?: string
  /** Primary hero CTA (e.g. Start your collection → experience) */
  primaryCta?: { label: string; href: string }
  /** Short trust bullets under CTA (shipping, guarantee, returns) */
  trustMicroItems?: readonly string[]
  className?: string
}

const PROGRESS_BAR_HEIGHT = 4
/** If metadata has no finite duration, fall back to fixed slide length. */
const FALLBACK_STAGE_MS = 8000

function videoSrcForPlayback(url: string): string {
  return url.startsWith('https://cdn.shopify.com/')
    ? url
    : `/api/proxy-video?url=${encodeURIComponent(url)}`
}

/**
 * Meet the Street Lamp: price chip sits below rotating stage copy + progress bar; stages advance with video/end or fallback timer.
 */
export function MeetTheStreetLamp({
  title,
  taglineLines,
  stages,
  desktopVideo,
  mobileVideo,
  poster,
  pricingChips,
  cue,
  cueHref = '/experience',
  primaryCta,
  trustMicroItems,
  className,
}: MeetTheStreetLampProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  /** When true, slide advance + progress use a timer (no finite video duration). */
  const [advanceByClock, setAdvanceByClock] = useState(false)

  const activeStage = stages[activeIndex] ?? stages[0]
  const resolvedDesktopUrl =
    activeStage?.desktopVideo?.trim() || desktopVideo
  const resolvedMobileUrl =
    activeStage?.mobileVideo?.trim() ||
    activeStage?.desktopVideo?.trim() ||
    mobileVideo
  const resolvedPoster = activeStage?.poster?.trim() || poster

  const mobileSrc = useMemo(
    () => videoSrcForPlayback(resolvedMobileUrl),
    [resolvedMobileUrl]
  )
  const desktopSrc = useMemo(
    () => videoSrcForPlayback(resolvedDesktopUrl),
    [resolvedDesktopUrl]
  )

  const priceText = pricingLabelFromChips(pricingChips)

  const goToNext = useCallback(() => {
    setProgress(0)
    setAdvanceByClock(false)
    setActiveIndex((i) => (i + 1) % stages.length)
  }, [stages.length])

  useEffect(() => {
    setProgress(0)
    setAdvanceByClock(false)
  }, [activeIndex, mobileSrc, desktopSrc])

  const handleVideoLoadedMetadata = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const d = e.currentTarget.duration
      if (!Number.isFinite(d) || d <= 0) {
        setAdvanceByClock(true)
      } else {
        setAdvanceByClock(false)
      }
      setProgress(0)
    },
    []
  )

  const handleVideoTimeUpdate = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      if (advanceByClock) return
      const v = e.currentTarget
      const d = v.duration
      if (d > 0 && Number.isFinite(d)) {
        setProgress(Math.min(100, (v.currentTime / d) * 100))
      }
    },
    [advanceByClock]
  )

  const handleVideoEnded = useCallback(() => {
    if (advanceByClock) return
    goToNext()
  }, [advanceByClock, goToNext])

  useEffect(() => {
    if (!advanceByClock) return
    const tick = 100
    const step = (100 / FALLBACK_STAGE_MS) * tick
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
  }, [advanceByClock, goToNext])

  const renderTitleBlock = (spacing: 'stacked' | 'desktopLeft') => {
    const desktopTwoLine =
      spacing === 'desktopLeft' ? splitMeetTheStreetLampTitle(title) : null
    return (
    <div
      className={cn(
        'space-y-2 md:space-y-3',
        spacing === 'stacked' ? 'mb-3 sm:mb-4' : '',
        spacing === 'desktopLeft' ? 'w-full' : ''
      )}
    >
      <h2
        className={cn(
          'font-serif font-medium text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#FFBA94] tracking-tight',
          spacing === 'stacked' ? 'text-center' : 'text-left'
        )}
      >
        {desktopTwoLine ? (
          <>
            {desktopTwoLine.line1}
            <br />
            {desktopTwoLine.line2}
          </>
        ) : (
          title
        )}
      </h2>
      {taglineLines && taglineLines.length > 0 ? (
        <div
          className={cn(
            'flex flex-col gap-1 font-body',
            spacing === 'stacked' ? 'text-center' : 'text-left'
          )}
        >
          {taglineLines[0] ? (
            <p className="text-base font-normal leading-snug text-[#FFBA94]/90 sm:text-lg md:text-xl">
              {taglineLines[0]}
            </p>
          ) : null}
          {taglineLines[1] ? (
            <p className="text-base font-normal leading-snug text-[#FFBA94]/90 sm:text-lg md:text-xl">
              {taglineLines[1]}
            </p>
          ) : null}
          {taglineLines.slice(2).map((line) => (
            <p key={line} className="text-base font-normal leading-snug text-[#FFBA94]/90 sm:text-lg md:text-xl">
              {line}
            </p>
          ))}
        </div>
      ) : null}
    </div>
    )
  }

  /** Glass price chip below rotating stage title / description / progress bar */
  const renderPricingBelowRotating = (align: 'center' | 'left') =>
    priceText ? (
      <div
        className={cn(
          'mt-4 flex w-full sm:mt-5',
          align === 'center' ? 'justify-center' : 'justify-start'
        )}
        role="status"
        aria-label={`Pricing: ${priceText}`}
      >
        <span className={pricingGlassClass}>{priceText}</span>
      </div>
    ) : null

  const renderCtaAndTrust = (align: 'center' | 'left') =>
    primaryCta || (trustMicroItems && trustMicroItems.length > 0) ? (
      <div
        className={cn(
          'mt-5 flex w-full flex-col gap-3 sm:mt-6',
          align === 'center' ? 'items-center text-center' : 'items-start text-left'
        )}
      >
        {primaryCta ? (
          <Link
            href={primaryCta.href}
            prefetch={false}
            className={cn(
              'inline-flex min-h-[48px] items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors',
              'bg-[#047AFF] hover:bg-[#0366d6] hover:opacity-95'
            )}
          >
            {primaryCta.label}
          </Link>
        ) : null}
        {trustMicroItems && trustMicroItems.length > 0 ? (
          <p className="max-w-md text-xs leading-relaxed text-[#FFBA94]/75 sm:text-sm">
            {trustMicroItems.join(' · ')}
          </p>
        ) : null}
      </div>
    ) : null

  /** Sliding copy + timer only */
  const renderStageBlock = (opts: { variant: 'mobile' | 'desktop' }) => (
    <div
      className={cn(
        'flex flex-col',
        opts.variant === 'mobile' && 'mt-10 sm:mt-12',
        opts.variant === 'desktop' && 'mt-2 w-full shrink-0'
      )}
    >
      <div
        className={cn(
          'relative flex flex-col text-center md:items-start md:text-left',
          opts.variant === 'mobile' && 'min-h-[120px] justify-center sm:min-h-[130px]',
          opts.variant === 'desktop' && 'min-h-0'
        )}
      >
        <div
          key={activeIndex}
          className="animate-in fade-in slide-in-from-bottom-4 w-full duration-500"
        >
          <h3
            className={cn(
              'mb-2 font-semibold text-[#FFBA94]',
              opts.variant === 'mobile' && 'text-xl sm:text-2xl',
              opts.variant === 'desktop' && 'text-lg leading-snug lg:text-xl'
            )}
          >
            {stages[activeIndex]?.title}
          </h3>
          <p
            className={cn(
              'leading-relaxed text-[#FFBA94]/80',
              opts.variant === 'mobile' && 'mx-auto max-w-md text-base',
              opts.variant === 'desktop' && 'max-w-md text-sm lg:max-w-lg'
            )}
          >
            {stages[activeIndex]?.description}
          </p>
        </div>
        <div
          className={cn(
            'w-full max-w-[140px] rounded-full bg-[#FFBA94]/20',
            opts.variant === 'mobile' && 'mx-auto mt-5',
            opts.variant === 'desktop' && 'mt-3 max-w-xs'
          )}
          style={{ height: PROGRESS_BAR_HEIGHT }}
          aria-hidden
        >
          <div
            className="h-full rounded-full bg-[#FFBA94] transition-[width] duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )

  return (
    <section
      className={cn(
        'w-full bg-[#171515] py-8 sm:py-10 md:flex md:min-h-[calc(100dvh-5.5rem)] md:flex-col md:py-0 md:pb-8 lg:pb-10',
        className
      )}
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-6 md:flex md:min-h-0 md:max-w-none md:flex-1 md:flex-col md:px-5 lg:px-8 xl:px-12 2xl:px-16">
        {/* Mobile */}
        <div className="flex flex-col md:hidden">
          <div>{renderTitleBlock('stacked')}</div>
          <div className="relative mt-5 w-full overflow-visible rounded-2xl sm:mt-6">
            <div className="relative aspect-[5/4] w-full overflow-hidden rounded-2xl">
              <LazyVideo
                key={`meet-mobile-${activeIndex}-${mobileSrc}`}
                src={mobileSrc}
                poster={resolvedPoster}
                autoPlay
                loop={false}
                onLoadedMetadata={handleVideoLoadedMetadata}
                onTimeUpdate={handleVideoTimeUpdate}
                onEnded={handleVideoEnded}
              >
                <track kind="captions" src="/captions/hero-no-speech.vtt" srcLang="en" label="English" />
              </LazyVideo>
            </div>
          </div>
          {renderStageBlock({ variant: 'mobile' })}
          {renderPricingBelowRotating('center')}
          {renderCtaAndTrust('center')}
        </div>

        {/* Desktop: full-fold row — video left, copy + stages right */}
        <div
          className={cn(
            'hidden md:flex md:min-h-0 md:w-full md:flex-1 md:flex-row md:items-stretch md:justify-center',
            'md:gap-6 lg:gap-8 xl:gap-10 2xl:gap-12',
            'md:max-h-[calc(100dvh-6rem)] md:py-4 lg:py-5'
          )}
        >
          <div
            className={cn(
              'relative min-h-0 w-full min-w-0 max-w-lg overflow-hidden rounded-2xl bg-neutral-800 md:max-w-none md:flex-[0.58] lg:flex-[0.6]',
              'md:self-stretch'
            )}
          >
            <div className="relative h-full min-h-[200px] w-full overflow-hidden rounded-2xl">
              <LazyVideo
                key={`meet-desktop-${activeIndex}-${desktopSrc}`}
                src={desktopSrc}
                poster={resolvedPoster}
                autoPlay
                loop={false}
                onLoadedMetadata={handleVideoLoadedMetadata}
                onTimeUpdate={handleVideoTimeUpdate}
                onEnded={handleVideoEnded}
                className="h-full w-full min-h-[200px] rounded-2xl object-cover"
              >
                <track kind="captions" src="/captions/hero-no-speech.vtt" srcLang="en" label="English" />
              </LazyVideo>
            </div>
          </div>
          <div
            className={cn(
              'flex min-h-0 w-full min-w-0 max-w-lg flex-col items-start justify-start overflow-y-auto px-1 text-left [scrollbar-width:thin] lg:px-2',
              'md:max-w-none md:flex-[0.42] lg:flex-[0.4] md:self-stretch',
              'md:pt-4 md:pb-4 lg:pt-5 lg:pb-5'
            )}
          >
            {renderTitleBlock('desktopLeft')}
            {renderStageBlock({ variant: 'desktop' })}
            {renderPricingBelowRotating('left')}
            {renderCtaAndTrust('left')}
          </div>
        </div>
        {cue && (
          <div className="mt-8 text-center md:mt-10">
            <a
              href={cueHref}
              className="text-base text-[#FFBA94]/80 underline underline-offset-2 transition-colors hover:text-[#FFBA94] sm:text-lg"
            >
              {cue}
            </a>
          </div>
        )}
      </div>
    </section>
  )
}
