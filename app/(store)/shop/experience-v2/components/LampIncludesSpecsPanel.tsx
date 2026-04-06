'use client'

import {
  Lamp,
  Ruler,
  Cable,
  Plug,
  BookOpen,
  Magnet,
  Package,
  Gift,
  ShoppingBag,
  List,
  Scale,
  Box,
  Sun,
  Battery,
  Zap,
  ImageIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type LampIncludeItem = {
  label: string
  icon: 'lamp' | 'ruler' | 'cable' | 'plug' | 'book' | 'magnet' | 'package' | 'gift' | 'bag'
}

export type LampSpecItem = {
  title: string
  icon?: 'ruler' | 'scale' | 'box' | 'sun' | 'battery' | 'zap'
  items: string[]
}

const includeIconMap = {
  lamp: Lamp,
  ruler: Ruler,
  cable: Cable,
  plug: Plug,
  book: BookOpen,
  magnet: Magnet,
  package: Package,
  gift: Gift,
  bag: ShoppingBag,
} as const

const specIconMap = {
  ruler: Ruler,
  scale: Scale,
  box: Box,
  sun: Sun,
  battery: Battery,
  zap: Zap,
} as const

/** Lamp / bundle: description only (scroll column on mobile; composed with panel on desktop). */
export function LampDescriptionSection({
  description,
  productDetailsLabel,
  layout,
}: {
  description: string
  productDetailsLabel: string
  layout: 'mobile' | 'desktop'
}) {
  if (!description.trim()) return null
  const wrap =
    layout === 'mobile'
      ? 'px-4 pt-5 pb-3 border-t border-neutral-100 dark:border-white/10'
      : undefined
  const inner = (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-[#201c1c] flex items-center justify-center flex-shrink-0">
          <ImageIcon className="w-4 h-4 text-neutral-500 dark:text-[#c4a0a0]" />
        </div>
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-[#d4b8b8]">{productDetailsLabel}</h3>
      </div>
      <p className="text-sm text-neutral-600 dark:text-[#c4a0a0] leading-relaxed">{description}</p>
    </section>
  )
  if (layout === 'mobile') {
    return <div className={wrap}>{inner}</div>
  }
  return inner
}

/**
 * Single panel: What's included + Specifications.
 * - sticky: nested scroll under mobile sheet title (1-col specs, compact).
 * - inline: desktop / slideout scroll column (2-col specs from sm).
 */
export function LampIncludesSpecsPanel({
  productIncludes,
  productSpecs,
  variant,
  className,
}: {
  productIncludes?: LampIncludeItem[]
  productSpecs?: LampSpecItem[]
  variant: 'sticky' | 'inline'
  className?: string
}) {
  const hasIncludes = Boolean(productIncludes && productIncludes.length > 0)
  const hasSpecs = Boolean(productSpecs && productSpecs.length > 0)
  if (!hasIncludes && !hasSpecs) return null

  const specGridClass =
    variant === 'sticky' ? 'grid grid-cols-1 gap-2' : 'grid grid-cols-1 gap-3 sm:grid-cols-2'
  const specCardPad = variant === 'sticky' ? 'px-3 py-2.5' : 'px-4 py-3'
  const zoneLabelClass =
    'text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-[#FFBA94]'

  const body = (
    <div className="space-y-4">
      {hasIncludes ? (
        <div>
          <p className={cn(zoneLabelClass, 'mb-2.5')}>In the box</p>
          <ul className="space-y-2">
            {productIncludes!.map((item, i) => {
              const Icon = includeIconMap[item.icon]
              return (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-left text-xs font-medium text-neutral-700 dark:text-[#d4b8b8] leading-snug"
                >
                  <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-100/90 dark:bg-black/25">
                    <Icon className="h-3.5 w-3.5 text-neutral-500 dark:text-[#c4a0a0]" aria-hidden />
                  </span>
                  <span className="min-w-0 pt-1">{item.label}</span>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      {hasIncludes && hasSpecs ? (
        <div
          className="border-t border-neutral-200/70 dark:border-white/10"
          role="separator"
          aria-hidden
        />
      ) : null}

      {hasSpecs ? (
        <div>
          <p className={cn(zoneLabelClass, 'mb-2.5')}>Specifications</p>
          <div className={specGridClass}>
            {productSpecs!.map((spec, i) => {
              const SpecIcon = spec.icon ? specIconMap[spec.icon] : List
              const isSingleValue = spec.items.length === 1
              return (
                <div
                  key={i}
                  className={cn(
                    'rounded-xl border border-neutral-100 dark:border-white/10 bg-white/60 dark:bg-black/20',
                    specCardPad
                  )}
                >
                  <div className="mb-1.5 flex items-center gap-2">
                    <SpecIcon className="h-3.5 w-3.5 flex-shrink-0 text-neutral-400 dark:text-[#d4b8b8]" />
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-[#FFBA94]">
                      {spec.title}
                    </h4>
                  </div>
                  {isSingleValue ? (
                    <p className="text-xs text-neutral-700 dark:text-[#d4b8b8] leading-snug">{spec.items[0]}</p>
                  ) : (
                    <ul className="space-y-1">
                      {spec.items.map((item, j) => (
                        <li
                          key={j}
                          className="flex items-start gap-2 text-xs text-neutral-700 dark:text-[#d4b8b8] leading-relaxed"
                        >
                          <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-neutral-400 dark:bg-[#5c0000]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )

  if (variant === 'sticky') {
    return (
      <div className={cn('mt-2 w-full min-w-0 text-left', className)}>
        <div
          className="max-h-[min(40vh,320px)] overflow-y-auto overscroll-y-contain rounded-xl border border-neutral-200/90 dark:border-white/10 bg-neutral-50/90 dark:bg-[#1c1818]/80 px-3 py-3 shadow-sm dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] [touch-action:pan-y]"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {body}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-neutral-100 dark:border-white/10 bg-neutral-50/40 dark:bg-[#201c1c]/35 px-4 py-4',
        className
      )}
    >
      {body}
    </div>
  )
}
