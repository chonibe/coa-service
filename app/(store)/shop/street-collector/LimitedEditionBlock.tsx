'use client'

import Link from 'next/link'
import { getProxiedImageUrl } from '@/lib/proxy-cdn-url'
import { cn } from '@/lib/utils'

export type LimitedDropContent = {
  eyebrow: string
  headline: string
  body: string
  editionOf: number
  remaining: number
  ctaLabel: string
  ctaHref: string
  imageUrl: string
}

export function LimitedEditionBlock({ content, className }: { content: LimitedDropContent; className?: string }) {
  return (
    <section
      className={cn(
        'w-full border-t border-neutral-200/80 bg-neutral-50 px-4 py-14 dark:border-white/10 dark:bg-neutral-950 sm:px-6 md:px-8 md:py-16 lg:px-12',
        className
      )}
      aria-labelledby="limited-drop-heading"
    >
      <div className="mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div className="relative order-2 lg:order-1">
          <div className="relative aspect-[5/4] w-full overflow-hidden border border-neutral-200/80 dark:border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getProxiedImageUrl(content.imageUrl)}
              alt=""
              className="h-full w-full object-cover"
              width={1000}
              height={800}
              loading="lazy"
            />
          </div>
          <div className="absolute -bottom-3 -right-3 flex h-24 w-24 flex-col items-center justify-center rounded-full border-2 border-neutral-900 bg-white text-center dark:border-white dark:bg-neutral-900 sm:h-28 sm:w-28">
            <span className="font-sans text-[8px] font-bold uppercase leading-tight tracking-wider text-neutral-900 dark:text-white">
              Limited
              <br />
              edition
            </span>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
            {content.eyebrow}
          </p>
          <h2
            id="limited-drop-heading"
            className="mt-3 font-serif text-3xl font-medium leading-tight tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl"
          >
            {content.headline}
          </h2>
          <p className="mt-4 max-w-md font-sans text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
            {content.body}
          </p>

          <div className="mt-8 flex flex-wrap gap-8 border-y border-neutral-200 py-6 dark:border-white/10">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-500">Edition of</p>
              <p className="mt-1 font-serif text-2xl text-neutral-900 dark:text-white">{content.editionOf}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-500">Left</p>
              <p className="mt-1 font-serif text-2xl text-neutral-900 dark:text-white">{content.remaining}</p>
            </div>
          </div>

          <Link
            href={content.ctaHref}
            prefetch={false}
            className="mt-8 inline-flex min-h-[48px] items-center justify-center border border-neutral-900 bg-neutral-900 px-6 py-3 font-sans text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-neutral-800 dark:border-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {content.ctaLabel}
            <span className="ml-2" aria-hidden>
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}
