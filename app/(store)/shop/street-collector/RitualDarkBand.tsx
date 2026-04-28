'use client'

import { Play } from 'lucide-react'
import { LazyVideo } from '@/components/LazyVideo'
import { getProxiedImageUrl } from '@/lib/proxy-cdn-url'
import { cn } from '@/lib/utils'

export type RitualBandContent = {
  videoUrl: string
  posterUrl: string
  watchLabel: string
  quote: string
  attribution: string
}

function videoSrc(url: string): string {
  return url.startsWith('https://cdn.shopify.com/')
    ? url
    : `/api/proxy-video?url=${encodeURIComponent(url)}`
}

export function RitualDarkBand({ content, className }: { content: RitualBandContent; className?: string }) {
  return (
    <section
      className={cn('relative w-full overflow-hidden bg-neutral-950 text-white', className)}
      aria-labelledby="ritual-heading"
    >
      <div className="mx-auto grid max-w-[1400px] lg:grid-cols-2 lg:min-h-[420px]">
        <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[420px]">
          <LazyVideo
            src={videoSrc(content.videoUrl)}
            poster={getProxiedImageUrl(content.posterUrl)}
            autoPlay
            muted
            loop
            playsInline
            className="opacity-90"
          >
            <track kind="captions" src="/captions/hero-no-speech.vtt" srcLang="en" label="English" />
          </LazyVideo>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent lg:bg-gradient-to-r" />

          <p className="pointer-events-none absolute bottom-6 left-6 flex items-center gap-2 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-white/95">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/30 backdrop-blur-sm">
              <Play className="ml-0.5 h-4 w-4 fill-white text-white" aria-hidden />
            </span>
            {content.watchLabel}
          </p>
        </div>

        <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
          <h2 id="ritual-heading" className="sr-only">
            The ritual
          </h2>
          <blockquote className="font-serif text-2xl font-medium leading-snug tracking-tight text-white sm:text-3xl md:text-[2rem] lg:text-4xl">
            &ldquo;{content.quote}&rdquo;
          </blockquote>
          <p className="mt-6 font-sans text-sm text-white/60">— {content.attribution}</p>
        </div>
      </div>
    </section>
  )
}
