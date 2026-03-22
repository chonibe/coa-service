'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { LazyVideo } from '@/components/LazyVideo'

export interface MeetTheLampStage {
  title: string
  description: string
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
  className?: string
}

const PROGRESS_BAR_HEIGHT = 4
const STAGE_INTERVAL_MS = 4000

/**
 * Meet the Street Lamp: mobile price chip overlaps top of video; desktop chip under subtitle;
 * stages auto-advance with progress bar only (no dots).
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
  className,
}: MeetTheStreetLampProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const mobileSrc = mobileVideo.startsWith('https://cdn.shopify.com/')
    ? mobileVideo
    : `/api/proxy-video?url=${encodeURIComponent(mobileVideo)}`
  const desktopSrc = desktopVideo.startsWith('https://cdn.shopify.com/')
    ? desktopVideo
    : `/api/proxy-video?url=${encodeURIComponent(desktopVideo)}`

  const priceText = pricingLabelFromChips(pricingChips)

  const goToNext = useCallback(() => {
    setProgress(0)
    setActiveIndex((i) => (i + 1) % stages.length)
  }, [stages.length])

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
            <p className="text-base font-medium text-[#FFBA94]/90 sm:text-lg md:text-xl">
              {taglineLines[0]}
            </p>
          ) : null}
          {taglineLines[1] ? (
            <p className="text-lg font-semibold tracking-tight text-[#FFBA94] sm:text-xl md:text-2xl">
              {taglineLines[1]}
            </p>
          ) : null}
          {taglineLines.slice(2).map((line) => (
            <p key={line} className="text-base text-[#FFBA94]/85 sm:text-lg">
              {line}
            </p>
          ))}
        </div>
      ) : null}
    </div>
    )
  }

  /** Mobile: glass chip top center of video, slight upward overlap (as before) */
  const renderPricingOnVideoMobile = () =>
    priceText ? (
      <div
        className="pointer-events-none absolute left-1/2 top-0 z-10 flex w-full max-w-[calc(100%-1rem)] -translate-x-1/2 -translate-y-[28%] justify-center px-2 sm:max-w-[calc(100%-1.5rem)]"
        role="status"
        aria-label={`Pricing: ${priceText}`}
      >
        <span className={cn(pricingGlassClass, 'pointer-events-auto')}>{priceText}</span>
      </div>
    ) : null

  /** Desktop: glass chip under subtitle (left-aligned with copy) */
  const renderPricingBelowSubtitle = () =>
    priceText ? (
      <div
        className="mt-4 flex w-full justify-start md:mt-10 lg:mt-12"
        role="status"
        aria-label={`Pricing: ${priceText}`}
      >
        <span className={pricingGlassClass}>{priceText}</span>
      </div>
    ) : null

  /** Sliding copy + timer only */
  const renderStageBlock = (opts: { variant: 'mobile' | 'desktop' }) => (
    <div
      className={cn(
        'flex flex-col',
        opts.variant === 'mobile' && 'mt-10 sm:mt-12',
        opts.variant === 'desktop' && 'shrink-0 pt-4'
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
          <h3 className="mb-2 text-xl font-semibold text-[#FFBA94] sm:text-2xl md:text-2xl">
            {stages[activeIndex]?.title}
          </h3>
          <p className="mx-auto max-w-md text-base leading-relaxed text-[#FFBA94]/80 md:mx-0 md:max-w-lg">
            {stages[activeIndex]?.description}
          </p>
        </div>
        <div
          className={cn(
            'mt-5 w-full max-w-[140px] rounded-full bg-[#FFBA94]/20',
            opts.variant === 'mobile' && 'mx-auto',
            opts.variant === 'desktop' && 'max-w-xs'
          )}
          style={{ height: PROGRESS_BAR_HEIGHT }}
          aria-hidden
        >
          <div
            className="h-full rounded-full bg-[#FFBA94] transition-all duration-150 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )

  return (
    <section className={cn('w-full bg-[#171515] py-8 sm:py-10 md:pb-14 lg:pb-16', className)}>
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        {/* Mobile */}
        <div className="flex flex-col md:hidden">
          <div>{renderTitleBlock('stacked')}</div>
          <div className="relative mt-5 w-full overflow-visible rounded-2xl sm:mt-6">
            {renderPricingOnVideoMobile()}
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl">
              <LazyVideo
                key={`meet-mobile-${mobileVideo}`}
                src={mobileSrc}
                poster={poster}
                autoPlay
              >
                <track kind="captions" src="/captions/hero-no-speech.vtt" srcLang="en" label="English" />
              </LazyVideo>
            </div>
          </div>
          {renderStageBlock({ variant: 'mobile' })}
        </div>

        {/* Desktop: same aspect as video; title block vertically centered in upper area, stage pinned bottom */}
        <div className="hidden md:flex md:flex-row md:items-start md:justify-center md:gap-x-10 lg:gap-x-14">
          <div
            className={cn(
              'grid w-full min-w-0 max-w-md grid-rows-[1fr_auto]',
              'aspect-[4/5] max-h-[min(640px,75vh)]'
            )}
          >
            <div className="flex min-h-0 w-full flex-col items-start justify-center overflow-y-auto px-2 text-left [scrollbar-width:thin]">
              {renderTitleBlock('desktopLeft')}
              {renderPricingBelowSubtitle()}
            </div>
            <div className="min-w-0 px-2 pb-1">{renderStageBlock({ variant: 'desktop' })}</div>
          </div>
          <div
            className={cn(
              'relative w-full min-w-0 max-w-md overflow-hidden rounded-2xl bg-neutral-800',
              'aspect-[4/5] max-h-[min(640px,75vh)]'
            )}
          >
            <div className="relative h-full w-full overflow-hidden rounded-2xl">
              <LazyVideo
                key={`meet-desktop-${desktopVideo}`}
                src={desktopSrc}
                poster={poster}
                autoPlay
                className="h-full w-full rounded-2xl object-cover"
              >
                <track kind="captions" src="/captions/hero-no-speech.vtt" srcLang="en" label="English" />
              </LazyVideo>
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
