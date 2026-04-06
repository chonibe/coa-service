'use client'

import { useId } from 'react'
import { cn } from '@/lib/utils'

type CollectionArcLabelProps = {
  theme: 'light' | 'dark'
  /** `fab` matches the round sticky + control; `strip` matches the carousel violet tile width. */
  variant?: 'fab' | 'strip'
  className?: string
}

/**
 * “Collection” on a shallow upward arc, for placement above the add-to-collection + control.
 */
export function CollectionArcLabel({ theme, variant = 'fab', className }: CollectionArcLabelProps) {
  const pathId = `collection-arc-${useId().replace(/:/g, '')}`
  const isFab = variant === 'fab'
  const w = isFab ? 76 : 52
  const h = isFab ? 24 : 20
  const fontSizePx = isFab ? 9.5 : 8.5
  const d = isFab
    ? `M 5 ${h - 5} Q ${w / 2} 1.5 ${w - 5} ${h - 5}`
    : `M 3 ${h - 4} Q ${w / 2} 1 ${w - 3} ${h - 4}`

  return (
    <svg
      className={cn('block shrink-0 select-none', className)}
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden
    >
      <defs>
        <path id={pathId} d={d} fill="none" />
      </defs>
      <text
        className={cn(
          'font-semibold tracking-wide',
          theme === 'light' ? 'fill-violet-800' : 'fill-violet-100/90'
        )}
        style={{ fontSize: `${fontSizePx}px` }}
      >
        <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">
          Collection
        </textPath>
      </text>
    </svg>
  )
}
