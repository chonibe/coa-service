'use client'

import Link from 'next/link'
import { LazyVideo } from '@/components/LazyVideo'
import { getProxiedImageUrl } from '@/lib/proxy-cdn-url'
import { cn } from '@/lib/utils'

type HudLine = { label: string; value: string }

export type EditorialHeroContent = {
  headline: string
  subheadline: string
  ctaPrimary: { label: string; href: string }
  ctaSecondary: { label: string; href: string }
  videoUrl: string
  posterUrl: string
  hud: readonly HudLine[]
}

function videoSrc(url: string): string {
  return url.startsWith('https://cdn.shopify.com/')
    ? url
    : `/api/proxy-video?url=${encodeURIComponent(url)}`
}

export function EditorialHero({ content, className }: { content: EditorialHeroContent; className?: string }) {
  const poster = getProxiedImageUrl(content.posterUrl)
  const src = videoSrc(content.videoUrl)

  return (
    <section
      className={cn(
        'w-full bg-white px-4 pb-6 pt-24 dark:bg-neutral-950 sm:px-6 sm:pb-8 sm:pt-28 md:px-8 md:pt-32 lg:px-12',
        className
      )}
      aria-label="Introduction"
    >
      <div className="mx-auto grid max-w-[1400px] gap-8 lg:grid-cols-2 lg:items-center lg:gap-12 xl:gap-16">
        <div className="flex flex-col justify-center lg:max-w-xl lg:pr-4">
          <h1 className="font-serif text-[1.85rem] font-medium leading-[1.12] tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl md:text-5xl lg:text-[3.25rem]">
            {content.headline}
          </h1>
          <p className="mt-4 max-w-md font-sans text-base font-normal leading-snug tracking-wide text-neutral-600 dark:text-neutral-400 sm:text-lg">
            {content.subheadline}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href={content.ctaPrimary.href}
              prefetch={false}
              className="inline-flex min-h-[48px] w-fit items-center justify-center border border-neutral-900 bg-neutral-900 px-6 py-3 font-sans text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-neutral-800 dark:border-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {content.ctaPrimary.label}
              <span className="ml-2 inline-block" aria-hidden>
                →
              </span>
            </Link>
            <Link
              href={content.ctaSecondary.href}
              prefetch={false}
              className="inline-flex min-h-[48px] w-fit items-center justify-center font-sans text-xs font-semibold uppercase tracking-wider text-neutral-900 underline decoration-neutral-400 underline-offset-4 transition-colors hover:decoration-neutral-900 dark:text-neutral-200 dark:decoration-neutral-500 dark:hover:decoration-white"
            >
              {content.ctaSecondary.label}
              <span className="ml-1.5" aria-hidden>
                →
              </span>
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
          <div className="relative aspect-[4/5] w-full overflow-hidden border border-neutral-200/90 bg-neutral-100 sm:aspect-[5/6] dark:border-white/10 dark:bg-neutral-900">
            <LazyVideo
              src={src}
              poster={poster}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            >
              <track kind="captions" src="/captions/hero-no-speech.vtt" srcLang="en" label="English" />
            </LazyVideo>

            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4 pt-16 sm:p-5 sm:pt-20"
              aria-hidden
            >
              <dl className="space-y-2 font-mono text-[10px] uppercase leading-tight tracking-widest text-white/90 sm:text-[11px]">
                {content.hud.map((row) => (
                  <div key={row.label} className="flex flex-wrap gap-x-2 gap-y-0.5 border-b border-white/15 pb-2 last:border-0">
                    <dt className="text-white/60">{row.label}</dt>
                    <dd className="font-medium text-white">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
