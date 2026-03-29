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
  /** Section heading above taglines; omit or leave empty to hide the `<h2>`. */
  title?: string
  taglineLines?: readonly string[]
  stages: MeetTheLampStage[]
  desktopVideo: string
  mobileVideo: string
  poster: string
  /** Single line or parts joined with · — shown between title and video / stage block */
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
 * Meet the Street Lamp: price chip between title block and video / stage copy; stages advance with video/end or fallback timer.
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
    const trimmedTitle = title?.trim() ?? ''
    const showHeading = Boolean(trimmedTitle)
    const twoLineTitle = showHeading
      ? splitMeetTheStreetLampTitle(trimmedTitle)
      : null
    const lines = taglineLines?.filter(Boolean) ?? []
    /** When `title` is empty, first two taglines are the section title (same scale as former “Meet the Street Lamp”). */
    const taglinesAreTitle = !showHeading && lines.length > 0
    const titleFromTaglines = taglinesAreTitle ? lines.slice(0, 2) : []
    const secondaryTaglines = taglinesAreTitle ? lines.slice(2) : showHeading ? lines : []

    const titleHeadingClass = cn(
      'font-serif font-medium tracking-tight text-[#FFBA94]',
      spacing === 'stacked' &&
        'text-center text-[1.65rem] leading-[1.15] sm:text-4xl sm:leading-tight md:text-5xl',
      spacing === 'desktopLeft' &&
        'text-left text-4xl leading-[1.12] md:text-5xl md:leading-[1.2] lg:text-6xl lg:leading-[1.22]'
    )

    const hasPrimaryBlock =
      showHeading || (taglinesAreTitle && titleFromTaglines.length > 0)

    return (
    <div
      className={cn(
        'w-full',
        (hasPrimaryBlock || secondaryTaglines.length > 0) &&
          cn(
            'space-y-2 sm:space-y-2.5',
            spacing === 'desktopLeft'
              ? 'md:space-y-4 lg:space-y-5'
              : 'md:space-y-3'
          ),
        spacing === 'stacked' ? 'mx-auto mb-1 max-w-lg sm:mb-2' : '',
        spacing === 'desktopLeft' ? 'shrink-0' : ''
      )}
    >
      {showHeading ? (
        <h2 className={titleHeadingClass}>
          {twoLineTitle ? (
            <>
              {twoLineTitle.line1}
              <br />
              {twoLineTitle.line2}
            </>
          ) : (
            trimmedTitle
          )}
        </h2>
      ) : taglinesAreTitle && titleFromTaglines.length > 0 ? (
        <h2 className={titleHeadingClass}>
          {titleFromTaglines[0]}
          {titleFromTaglines[1] ? (
            <>
              <br />
              {titleFromTaglines[1]}
            </>
          ) : null}
        </h2>
      ) : null}
      {secondaryTaglines.length > 0 ? (
        <div
          className={cn(
            'flex flex-col gap-1.5 font-body sm:gap-2',
            spacing === 'stacked'
              ? 'mx-auto max-w-md text-center'
              : 'max-w-xl text-left md:gap-2.5 lg:gap-3'
          )}
        >
          {secondaryTaglines.map((line, i) => (
            <p
              key={`${i}-${line}`}
              className="text-[0.95rem] font-normal leading-snug text-[#FFBA94]/90 sm:text-lg md:text-xl"
            >
              {line}
            </p>
          ))}
        </div>
      ) : null}
    </div>
    )
  }

  /** Glass price chip between title block and video / rotating stage */
  const renderPricingBetweenSections = (align: 'center' | 'left') =>
    priceText ? (
      <div
        className={cn(
          'mt-4 flex w-full sm:mt-5 md:mt-0',
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
          'mt-5 flex w-full flex-col gap-3 sm:mt-6 md:mt-0 md:gap-4',
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

  /** Rotating stage title / description + progress (aligned with hero column) */
  const renderStageBlock = (opts: { variant: 'mobile' | 'desktop' }) => (
    <div
      className={cn(
        'flex w-full flex-col',
        opts.variant === 'mobile' && 'mt-6 sm:mt-8',
        opts.variant === 'desktop' && 'mt-5 shrink-0 md:mt-0 lg:mt-0'
      )}
    >
      <div
        className={cn(
          'relative flex flex-col',
          opts.variant === 'mobile' && 'mx-auto max-w-lg text-center',
          opts.variant === 'desktop' && 'max-w-xl text-left'
        )}
      >
        <div
          key={activeIndex}
          className="animate-in fade-in slide-in-from-bottom-4 w-full duration-500"
        >
          <h3
            className={cn(
              'mb-1.5 font-semibold leading-tight text-[#FFBA94] sm:mb-2',
              opts.variant === 'mobile' && 'text-xl sm:text-2xl',
              opts.variant === 'desktop' && 'text-xl leading-snug lg:text-2xl'
            )}
          >
            {stages[activeIndex]?.title}
          </h3>
          <p
            className={cn(
              'text-pretty leading-relaxed text-[#FFBA94]/80',
              opts.variant === 'mobile' && 'text-[0.9375rem] sm:text-base',
              opts.variant === 'desktop' && 'text-sm leading-relaxed lg:text-base'
            )}
          >
            {stages[activeIndex]?.description}
          </p>
        </div>
        <div
          className={cn(
            'mt-4 w-full max-w-[140px] rounded-full bg-[#FFBA94]/20 sm:mt-5',
            opts.variant === 'mobile' && 'mx-auto',
            opts.variant === 'desktop' && 'max-w-[10rem] md:mt-5 lg:mt-6'
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
        {/* Mobile: headline → price → video → rotating copy + optional CTA */}
        <div className="flex flex-col md:hidden">
          <div className="px-0.5">{renderTitleBlock('stacked')}</div>
          {renderPricingBetweenSections('center')}
          <div className="relative mt-4 w-full overflow-visible rounded-2xl sm:mt-5">
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
              'flex min-h-0 w-full min-w-0 max-w-lg flex-col md:max-w-none md:flex-[0.42] lg:flex-[0.4]',
              'md:self-stretch md:justify-center'
            )}
          >
            <div className="flex min-h-0 w-full flex-col items-stretch justify-center gap-0 px-1 text-left [scrollbar-width:thin] md:gap-6 lg:gap-7 xl:gap-8 lg:px-2">
              {renderTitleBlock('desktopLeft')}
              {renderPricingBetweenSections('left')}
              {renderStageBlock({ variant: 'desktop' })}
              {renderCtaAndTrust('left')}
            </div>
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
