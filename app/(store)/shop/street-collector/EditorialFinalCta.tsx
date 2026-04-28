'use client'

import Link from 'next/link'
import { getProxiedImageUrl } from '@/lib/proxy-cdn-url'
import { cn } from '@/lib/utils'

type FinalCta = {
  headline: string
  subheadline: string
  cta: { text: string; url: string }
  ctaSecondary?: { text: string; url: string }
}

export function EditorialFinalCta({ content, className }: { content: FinalCta; className?: string }) {
  const secondary = content.ctaSecondary
  return (
    <section
      className={cn(
        'relative w-full overflow-hidden px-4 py-16 sm:px-6 sm:py-20 md:px-8 md:py-24 lg:px-12',
        className
      )}
      aria-labelledby="final-cta-heading"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] dark:opacity-[0.12]" aria-hidden>
        {/* subtle texture from brand asset */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getProxiedImageUrl(
            'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/Group_8252.png?v=1771844884&width=1200'
          )}
          alt=""
          className="h-full w-full object-cover object-center"
        />
      </div>
      <div className="relative mx-auto max-w-[900px] text-center">
        <h2
          id="final-cta-heading"
          className="font-serif text-3xl font-medium leading-tight tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl md:text-5xl"
        >
          {content.headline}
        </h2>
        {content.subheadline ? (
          <p className="mt-4 font-sans text-base text-neutral-600 dark:text-neutral-400">{content.subheadline}</p>
        ) : null}
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href={content.cta.url}
            prefetch={false}
            className="inline-flex min-h-[48px] w-full max-w-xs items-center justify-center border border-neutral-900 bg-neutral-900 px-6 py-3 font-sans text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-neutral-800 sm:w-auto dark:border-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {content.cta.text}
            <span className="ml-2" aria-hidden>
              →
            </span>
          </Link>
          {secondary ? (
            <Link
              href={secondary.url}
              prefetch={false}
              className="inline-flex min-h-[48px] w-full max-w-xs items-center justify-center border border-neutral-900 bg-transparent px-6 py-3 font-sans text-xs font-semibold uppercase tracking-wider text-neutral-900 transition-colors hover:bg-neutral-900/5 sm:w-auto dark:border-white dark:text-white dark:hover:bg-white/10"
            >
              {secondary.text}
              <span className="ml-2" aria-hidden>
                →
              </span>
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}
