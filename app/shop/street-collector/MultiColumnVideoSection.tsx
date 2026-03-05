'use client'

import React from 'react'
import { cn } from '@/lib/utils'

/** Video aspect ratio 4×5 (width:height) so they render the same size. */
const VIDEO_ASPECT_RATIO = 4 / 5

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
  className?: string
}

/**
 * Multi-column section with autoplay videos + copy, matching thestreetcollector.com.
 * All videos use the same aspect ratio and object-cover for consistent sizing.
 * Mobile: stacked vertically; desktop: 3-col grid. Video ratio 4×5.
 */
export function MultiColumnVideoSection({ title, items, cue, cueHref = '/shop/experience', className }: MultiColumnVideoSectionProps) {
  return (
    <section
      className={cn(
        'w-full py-6 sm:py-10 md:py-16',
        'bg-white text-neutral-900',
        className
      )}
    >
      <div className="section-stack w-full max-w-[1400px] mx-auto">
        {title && (
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-neutral-900 tracking-tight text-center mb-8 sm:mb-10 md:mb-12 px-4 sm:px-6 lg:px-8">
            {title}
          </h2>
        )}
        {/* Mobile: stacked; desktop: 3 equal columns, top-aligned */}
        <div
          className={cn(
            'multi-column flex flex-col gap-6 sm:gap-8 md:gap-10',
            'md:grid md:grid-cols-3 md:gap-8 md:items-start',
            'px-4 sm:px-6 md:px-6 lg:px-8'
          )}
        >
          {items.map((prop, i) => (
            <article
              key={i}
              className={cn(
                'multi-column__item flex flex-col w-full overflow-hidden',
                'bg-neutral-900 rounded-2xl shadow-lg border border-neutral-800',
                'md:w-full md:min-w-0'
              )}
            >
              {/* Video card top */}
              <div
                className="relative w-full overflow-hidden flex-shrink-0"
                style={{ aspectRatio: VIDEO_ASPECT_RATIO }}
              >
                <video
                  playsInline
                  muted
                  loop
                  preload="metadata"
                  autoPlay
                  poster={prop.poster}
                  className="absolute inset-0 h-full w-full object-cover"
                >
                  <source
                    src={`/api/proxy-video?url=${encodeURIComponent(prop.video)}`}
                    type={prop.video.toLowerCase().endsWith('.mov') ? 'video/quicktime' : 'video/mp4'}
                  />
                  <img
                    src={prop.poster}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </video>
              </div>
              {/* Card body */}
              <div className="flex flex-col gap-3 sm:gap-4 text-center w-full p-5 sm:p-6">
                <h3 className="font-serif text-xl sm:text-2xl md:text-2xl lg:text-3xl font-normal tracking-tight text-white">
                  {prop.title}
                </h3>
                <p className="text-base sm:text-lg leading-relaxed text-neutral-300 max-w-none">
                  {prop.description}
                </p>
              </div>
            </article>
          ))}
        </div>
        {cue && (
          <div className="text-center mt-8 sm:mt-10 md:mt-12">
            <a
              href={cueHref}
              className="text-base sm:text-lg text-neutral-600 hover:text-neutral-900 underline underline-offset-2 transition-colors"
            >
              {cue}
            </a>
          </div>
        )}
      </div>
    </section>
  )
}
