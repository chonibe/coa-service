'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { getProxiedImageUrl } from '@/lib/proxy-cdn-url'
import { LazyVideo } from '@/components/LazyVideo'

/** Video aspect ratio 4×5 (width:height) so they render the same size. */
const VIDEO_ASPECT_RATIO = 4 / 5

/** Glass numeral — on dark overlay over video */
const stepGlassBadgeInlineClass = cn(
  'inline-flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full sm:size-12 md:size-[3.25rem]',
  'font-body text-lg font-bold tabular-nums leading-none text-white sm:text-xl md:text-2xl',
  'border border-white/20 bg-white/12 backdrop-blur-md backdrop-saturate-150',
  'shadow-[0_4px_16px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.12)]'
)

/** Glass bar: numeral + title one row, centered on video; vertically half above / half below top edge */
const valuePropVideoOverlayBarClass = cn(
  'pointer-events-none absolute left-1/2 top-0 z-20 flex w-max max-w-[calc(100%-0.75rem)] min-w-0 -translate-x-1/2 -translate-y-1/2 flex-row items-center gap-2.5 rounded-lg sm:gap-3 md:gap-3.5',
  'border border-white/[0.12] bg-black/65 px-2.5 py-1.5 backdrop-blur-xl backdrop-saturate-150 sm:px-3 sm:py-2',
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_10px_28px_rgba(0,0,0,0.5)]'
)

/** Outer value-prop card — darker shell */
const valuePropOuterCardClass = cn(
  'w-full max-w-full overflow-visible',
  'rounded-2xl border border-[#ffba94]/[0.07] bg-[#0c0b0b]/95 shadow-[0_16px_48px_rgba(0,0,0,0.55)]',
  'p-4 sm:p-6 md:p-8'
)

/** Video card only (no section wrapper) - for embedding in other sections */
export function ValuePropVideoCard({ items }: { items: ValuePropItem[] }) {
  return (
    <article className={valuePropOuterCardClass}>
      <div
        className={cn(
          'flex flex-col gap-8 sm:gap-10',
          'md:grid md:grid-cols-3 md:gap-10 lg:gap-12 md:items-start'
        )}
      >
        {items.map((prop, i) => (
          <div
            key={i}
            className="flex flex-col w-full min-w-0"
          >
            <div className="relative w-full shrink-0 overflow-visible rounded-xl">
              <div
                className="relative z-0 w-full overflow-hidden rounded-xl bg-black/50"
                style={{ aspectRatio: VIDEO_ASPECT_RATIO }}
              >
                <LazyVideo
                  src={prop.video.startsWith('https://cdn.shopify.com/') ? prop.video : `/api/proxy-video?url=${encodeURIComponent(prop.video)}`}
                  poster={getProxiedImageUrl(prop.poster)}
                  type={prop.video.toLowerCase().endsWith('.mov') ? 'video/quicktime' : 'video/mp4'}
                  autoPlay
                />
              </div>
              <div className={valuePropVideoOverlayBarClass}>
                <span className={stepGlassBadgeInlineClass} aria-hidden>
                  {i + 1}
                </span>
                <h3 className="line-clamp-1 min-w-0 max-w-[min(14rem,55vw)] text-left font-body text-sm font-semibold leading-tight text-[#FFBA94] sm:max-w-[16rem] sm:text-base md:max-w-[18rem] md:text-[0.95rem]">
                  <span className="sr-only">{`Step ${i + 1}: `}</span>
                  {prop.title}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}

export interface ValuePropItem {
  title: string
  description: string
  poster: string
  video: string
}

interface MultiColumnVideoSectionProps {
  /** Section title above the video grid */
  title?: string
  items: ValuePropItem[]
  /** Momentum cue—subtle link after section */
  cue?: string
  cueHref?: string
  /** When false, hide the numbered tiles (e.g. when tiles are shown elsewhere) */
  showTiles?: boolean
  className?: string
}

/**
 * Section with value-prop videos in a dark card.
 * Each column: video with dark glass overlay bar (numeral + title); optional description tiles below the card.
 */
export function MultiColumnVideoSection({ title, items, cue, cueHref = '/experience', showTiles = true, className }: MultiColumnVideoSectionProps) {
  return (
    <section
      className={cn(
        'w-full py-6 sm:py-10 md:py-16',
        'bg-[#171515] text-[#FFBA94]',
        className
      )}
    >
      <div className="section-stack w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-6 lg:px-8">
        {title && (
          <h2 className="font-body font-medium text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#FFBA94] tracking-tight text-center mb-6 sm:mb-8">
            {title}
          </h2>
        )}
        {/* Card with videos only */}
        <article className={valuePropOuterCardClass}>
          <div
            className={cn(
              'flex flex-col gap-8 sm:gap-10',
              'md:grid md:grid-cols-3 md:gap-10 lg:gap-12 md:items-start'
            )}
          >
            {items.map((prop, i) => (
              <div
                key={i}
                className="flex flex-col w-full min-w-0"
              >
                <div className="relative w-full shrink-0 overflow-visible rounded-xl">
                  <div
                    className="relative z-0 w-full overflow-hidden rounded-xl bg-black/50"
                    style={{ aspectRatio: VIDEO_ASPECT_RATIO }}
                  >
                    <LazyVideo
                      src={prop.video.startsWith('https://cdn.shopify.com/') ? prop.video : `/api/proxy-video?url=${encodeURIComponent(prop.video)}`}
                      poster={getProxiedImageUrl(prop.poster)}
                      type={prop.video.toLowerCase().endsWith('.mov') ? 'video/quicktime' : 'video/mp4'}
                      autoPlay
                    />
                  </div>
                  <div className={valuePropVideoOverlayBarClass}>
                    <span className={stepGlassBadgeInlineClass} aria-hidden>
                      {i + 1}
                    </span>
                    <h3 className="line-clamp-1 min-w-0 max-w-[min(14rem,55vw)] text-left font-body text-sm font-semibold leading-tight text-[#FFBA94] sm:max-w-[16rem] sm:text-base md:max-w-[18rem] md:text-[0.95rem]">
                      <span className="sr-only">{`Step ${i + 1}: `}</span>
                      {prop.title}
                    </h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
        {/* Copy under card — titles live on the card; tiles are description only */}
        {showTiles && (
        <div className="px-4 sm:px-6 md:px-8 mt-6 sm:mt-8">
          <div
            className={cn(
              'flex flex-col gap-8 sm:gap-10',
              'md:grid md:grid-cols-3 md:gap-10 lg:gap-12 md:items-stretch'
            )}
          >
          {items.map((prop, i) => (
            <div
              key={i}
              className={cn(
                'flex flex-col gap-2 text-center items-center w-full',
                'rounded-xl border border-[#ffba94]/15 bg-[#201c1c]/55 p-4 sm:p-5'
              )}
            >
              <p className="font-body text-xs sm:text-sm leading-relaxed text-[#FFBA94]/80 max-w-none">
                {prop.description}
              </p>
              <span className="sr-only">
                {prop.title}
              </span>
            </div>
          ))}
          </div>
        </div>
        )}
        {cue && (
          <div className="text-center mt-8 sm:mt-10 md:mt-12">
            <a
              href={cueHref}
              className="font-body text-base sm:text-lg text-[#FFBA94]/80 hover:text-[#FFBA94] underline underline-offset-2 transition-colors"
            >
              {cue}
            </a>
          </div>
        )}
      </div>
    </section>
  )
}
