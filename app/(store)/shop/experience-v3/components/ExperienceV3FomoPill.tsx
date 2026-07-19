'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  type ExperienceFomoCopyVariant,
  formatExperienceFomoMessage,
  getExperienceFomoSessionId,
  getOrCreateExperienceFomoProductState,
  isExperienceFomoFeatureEnabled,
  isExperienceFomoGatedIn,
  nextExperienceFomoCount,
  saveExperienceFomoProductState,
} from '@/lib/shop/experience-fomo-pill'

export type ExperienceV3FomoPillProps = {
  productId: string
  previewInCart: boolean
  className?: string
}

/**
 * Subtle hero FOMO pill — synthetic viewer count, persisted per session + product.
 * On by default for Experience V3 trials; disable via localStorage `experience-fomo-disabled=1` or `?experience_fomo=0`.
 */
export function ExperienceV3FomoPill({ productId, previewInCart, className }: ExperienceV3FomoPillProps) {
  const sessionId = useMemo(() => getExperienceFomoSessionId(), [])
  const enabled = isExperienceFomoFeatureEnabled()
  const gatedIn = isExperienceFomoGatedIn(productId)
  const shouldRun = enabled && gatedIn && !previewInCart

  const [visible, setVisible] = useState(false)
  const [count, setCount] = useState(2)
  const [copyVariant, setCopyVariant] = useState<ExperienceFomoCopyVariant>('collectors')
  const driftTickRef = useRef(0)

  useEffect(() => {
    if (!shouldRun) {
      setVisible(false)
      return
    }

    const { state, config } = getOrCreateExperienceFomoProductState(sessionId, productId)
    setCount(state.count)
    setCopyVariant(state.copyVariant)
    driftTickRef.current = state.driftTick

    if (state.hasAppeared) {
      setVisible(true)
      return
    }

    setVisible(false)
    const showTimer = window.setTimeout(() => {
      setVisible(true)
      saveExperienceFomoProductState(productId, { hasAppeared: true })
    }, config.showDelayMs)

    return () => window.clearTimeout(showTimer)
  }, [shouldRun, sessionId, productId])

  useEffect(() => {
    if (!shouldRun || !visible) return

    const { config } = getOrCreateExperienceFomoProductState(sessionId, productId)

    const driftTimer = window.setInterval(() => {
      driftTickRef.current += 1
      const tick = driftTickRef.current

      setCount((current) => {
        const next = nextExperienceFomoCount(current, sessionId, productId, tick)
        saveExperienceFomoProductState(productId, { count: next, driftTick: tick })
        return next
      })
    }, config.driftIntervalMs)

    return () => window.clearInterval(driftTimer)
  }, [shouldRun, visible, sessionId, productId])

  if (!shouldRun || !visible) return null

  const message = formatExperienceFomoMessage(copyVariant, count)

  return (
    <div
      className={cn(
        'mx-auto flex w-auto justify-center',
        'animate-in fade-in-0 duration-[400ms]',
        className
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span
        className={cn(
          'inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/70',
          'bg-muted/80 px-2.5 py-1 text-xs font-normal text-muted-foreground'
        )}
      >
        <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-experience-highlight opacity-50" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-experience-highlight" />
        </span>
        <span className="truncate">{message}</span>
      </span>
    </div>
  )
}
