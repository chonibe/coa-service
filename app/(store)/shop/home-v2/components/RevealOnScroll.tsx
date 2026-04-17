'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  useLandingScrollReveal,
  type LandingScrollRevealOptions,
} from '../hooks/useLandingScrollReveal'

type RevealOnScrollProps = LandingScrollRevealOptions & {
  as?: keyof React.JSX.IntrinsicElements
  className?: string
  children: React.ReactNode
  ariaLabel?: string
  id?: string
}

/**
 * Thin client wrapper over `useLandingScrollReveal` so pages/sections don't each
 * need to wire up the ref + className themselves. Supports both `block` and
 * `stagger` modes; respects `prefers-reduced-motion` through the underlying hook.
 */
export function RevealOnScroll({
  as,
  className,
  children,
  ariaLabel,
  id,
  ...hookOptions
}: RevealOnScrollProps) {
  const Tag = (as ?? 'section') as React.ElementType
  const { ref, className: revealClassName } = useLandingScrollReveal(hookOptions)
  return (
    <Tag
      ref={ref}
      id={id}
      aria-label={ariaLabel}
      className={cn(revealClassName, className)}
    >
      {children}
    </Tag>
  )
}
