'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { getProxiedImageUrl } from '@/lib/proxy-cdn-url'

/** Video aspect ratio 4×5 (width:height) so they render the same size. */
const VIDEO_ASPECT_RATIO = 4 / 5

/** Video card only (no section wrapper) - for embedding in other sections */
export function ValuePropVideoCard({ items }: { items: ValuePropItem[] }) {
  return (
    <article
      className={cn(
        'w-full overflow-hidden',
        'bg-[#1a0a0a] rounded-2xl shadow-lg',
        'p-4 sm:p-6 md:p-8'
      )}
    >
      <div
        className={cn(
          'flex flex-col gap-6 sm:gap-8',
          'md:grid md:grid-cols-3 md:gap-8 md:items-start'
        )}
      >
        {items.map((prop, i) => (
          <div
            key={i}
            className={cn(
              'flex flex-col w-full overflow-hidden md:min-w-0',
              i < 2 && 'hidden md:flex'
            )}
          >
            <div
              className="relative w-full overflow-hidden flex-shrink-0 rounded-lg"
              style={{ aspectRatio: VIDEO_ASPECT_RATIO }}
            >
              <video
                playsInline
                muted
                loop
                preload="metadata"
                autoPlay
                poster={getProxiedImageUrl(prop.poster)}
                className="absolute inset-0 h-full w-full object-cover"
              >
                <source
                  src={`/api/proxy-video?url=${encodeURIComponent(prop.video)}`}
                  type={prop.video.toLowerCase().endsWith('.mov') ? 'video/quicktime' : 'video/mp4'}
                />
                <img src={getProxiedImageUrl(prop.poster)} alt="" className="absolute inset-0 h-full w-full object-cover" />
              </video>
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
 * Section with autoplay videos in a dark card and copy outside.
 * Card contains only videos; titles and descriptions sit below the card.
 * Mobile: stacked vertically; desktop: 3-col grid. Video ratio 4×5.
 */
export function MultiColumnVideoSection({ title, items, cue, cueHref = '/experience', showTiles = true, className }: MultiColumnVideoSectionProps) {
  return (
    <section
      className={cn(
        'w-full py-6 sm:py-10 md:py-16',
        'bg-[#2a0000] text-[#FFBA94]',
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
        <article
          className={cn(
            'w-full overflow-hidden',
            'bg-[#1a0a0a] rounded-2xl shadow-lg',
            'p-4 sm:p-6 md:p-8'
          )}
        >
          <div
            className={cn(
              'flex flex-col gap-6 sm:gap-8',
              'md:grid md:grid-cols-3 md:gap-8 md:items-start'
            )}
          >
            {items.map((prop, i) => (
              <div
                key={i}
                className="flex flex-col w-full overflow-hidden md:min-w-0"
              >
                <div
                  className="relative w-full overflow-hidden flex-shrink-0 rounded-lg"
                  style={{ aspectRatio: VIDEO_ASPECT_RATIO }}
                >
                  <video
                    playsInline
                    muted
                    loop
                    preload="metadata"
                    autoPlay
                    poster={getProxiedImageUrl(prop.poster)}
                    className="absolute inset-0 h-full w-full object-cover"
                  >
                    <source
                      src={`/api/proxy-video?url=${encodeURIComponent(prop.video)}`}
                      type={prop.video.toLowerCase().endsWith('.mov') ? 'video/quicktime' : 'video/mp4'}
                    />
                    <img
                      src={getProxiedImageUrl(prop.poster)}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </video>
                </div>
              </div>
            ))}
          </div>
        </article>
        {/* Numbered tiles outside card — same width as video cards via matching padding + gap */}
        {showTiles && (
        <div className="px-4 sm:px-6 md:px-8 mt-6 sm:mt-8">
          <div
            className={cn(
              'flex flex-col gap-6 sm:gap-8',
              'md:grid md:grid-cols-3 md:gap-8 md:items-stretch'
            )}
          >
          {items.map((prop, i) => (
            <div
              key={i}
              className={cn(
                'flex flex-col gap-2 sm:gap-3 text-center items-center w-full',
                'bg-[#390000]/10 rounded-xl p-4 sm:p-5',
                'border border-[#390000]/20'
              )}
            >
              <span
                className={cn(
                  'inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full',
                  'font-body text-sm sm:text-base font-medium tabular-nums',
                  'bg-[#390000] text-white'
                )}
              >
                {i + 1}
              </span>
              <h3 className="font-body text-sm sm:text-base md:text-lg font-normal tracking-tight text-[#390000]">
                {prop.title}
              </h3>
              <p className="font-body text-xs sm:text-sm leading-relaxed text-neutral-600 max-w-none">
                {prop.description}
              </p>
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
