'use client'

import Link from 'next/link'
import { Frame, Sun, Replace, BatteryCharging } from 'lucide-react'
import { getProxiedImageUrl } from '@/lib/proxy-cdn-url'
import { cn } from '@/lib/utils'

const ICONS = {
  build: Frame,
  light: Sun,
  swap: Replace,
  power: BatteryCharging,
} as const

type SpecKey = keyof typeof ICONS

type Spec = {
  key: SpecKey
  title: string
  description: string
}

export type ProductSpecBlockContent = {
  imageUrl: string
  headline: string
  body: string
  fromPrice: string
  ctaLabel: string
  ctaHref: string
  specs: readonly Spec[]
}

export function ProductSpecBlock({ content, className }: { content: ProductSpecBlockContent; className?: string }) {
  return (
    <section
      className={cn('w-full border-t border-neutral-200/80 bg-white px-4 py-14 dark:border-white/10 dark:bg-neutral-950 sm:px-6 md:px-8 md:py-16 lg:px-12', className)}
      aria-labelledby="product-spec-heading"
    >
      <div className="mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-2 lg:gap-16 lg:items-center">
        <div className="relative aspect-[4/5] w-full max-h-[min(90vh,720px)] overflow-hidden border border-neutral-200/90 bg-neutral-100 dark:border-white/10 dark:bg-neutral-900 lg:max-h-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getProxiedImageUrl(content.imageUrl)}
            alt=""
            className="h-full w-full object-cover object-center"
            width={900}
            height={1125}
            loading="lazy"
          />
        </div>
        <div>
          <h2
            id="product-spec-heading"
            className="font-serif text-3xl font-medium leading-tight tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl md:text-[2.75rem]"
          >
            {content.headline}
          </h2>
          <p className="mt-5 max-w-lg font-sans text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
            {content.body}
          </p>
          <p className="mt-6 font-sans text-sm text-neutral-500 dark:text-neutral-500">
            From <span className="font-semibold text-neutral-900 dark:text-neutral-200">{content.fromPrice}</span>
          </p>
          <Link
            href={content.ctaHref}
            prefetch={false}
            className="mt-6 inline-flex min-h-[48px] items-center justify-center border border-neutral-900 bg-neutral-900 px-6 py-3 font-sans text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-neutral-800 dark:border-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {content.ctaLabel}
            <span className="ml-2" aria-hidden>
              →
            </span>
          </Link>

          <ul className="mt-12 space-y-6 border-t border-neutral-200/80 pt-10 dark:border-white/10">
            {content.specs.map((s) => {
              const Icon = ICONS[s.key] ?? Frame
              return (
                <li key={s.key} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-neutral-200 dark:border-white/15">
                    <Icon className="h-4 w-4 text-neutral-800 dark:text-neutral-200" strokeWidth={1.5} aria-hidden />
                  </span>
                  <div>
                    <p className="font-sans text-sm font-semibold uppercase tracking-wide text-neutral-900 dark:text-neutral-100">
                      {s.title}
                    </p>
                    <p className="mt-1 font-sans text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                      {s.description}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
