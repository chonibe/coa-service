'use client'

import Link from 'next/link'
import { getProxiedImageUrl } from '@/lib/proxy-cdn-url'
import { cn } from '@/lib/utils'

type Step = {
  n: string
  title: string
  hint: string
  imageUrl: string
}

export type HowItWorksStripContent = {
  eyebrow: string
  title: string
  viewGuideLabel: string
  viewGuideHref: string
  steps: readonly Step[]
}

export function HowItWorksStrip({ content, className }: { content: HowItWorksStripContent; className?: string }) {
  return (
    <section
      className={cn('w-full bg-white px-4 py-14 dark:bg-neutral-950 sm:px-6 md:px-8 md:py-16 lg:px-12 lg:py-20', className)}
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:mb-12 sm:flex-row sm:items-end">
          <div>
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
              {content.eyebrow}
            </p>
            <h2
              id="how-it-works-heading"
              className="mt-3 max-w-xl font-serif text-2xl font-medium leading-snug tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl md:text-4xl"
            >
              {content.title}
            </h2>
          </div>
          <Link
            href={content.viewGuideHref}
            prefetch={false}
            className="shrink-0 self-start font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-900 underline decoration-neutral-400 underline-offset-4 hover:decoration-neutral-900 dark:text-neutral-200 dark:decoration-neutral-500 dark:hover:decoration-white sm:self-auto"
          >
            {content.viewGuideLabel}
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5 lg:gap-6">
          {content.steps.map((step, i) => (
            <div key={step.n} className="flex flex-col">
              <div className="flex items-baseline justify-between gap-2 border-b border-neutral-200 pb-2 dark:border-white/10">
                <span className="font-mono text-xs text-neutral-500 dark:text-neutral-500">{step.n}</span>
                {i < content.steps.length - 1 ? (
                  <span className="hidden text-neutral-300 dark:text-neutral-600 sm:inline" aria-hidden>
                    →
                  </span>
                ) : null}
              </div>
              <div className="relative mt-3 aspect-square w-full overflow-hidden border border-neutral-200/90 bg-neutral-100 dark:border-white/10 dark:bg-neutral-900">
                {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN */}
                <img
                  src={getProxiedImageUrl(step.imageUrl)}
                  alt=""
                  className="h-full w-full object-cover"
                  width={400}
                  height={400}
                  loading="lazy"
                />
              </div>
              <p className="mt-3 font-sans text-xs font-medium uppercase tracking-wide text-neutral-900 dark:text-neutral-200 sm:text-sm">
                {step.title}
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
                {step.hint}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
