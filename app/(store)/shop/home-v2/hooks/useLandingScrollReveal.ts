'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import styles from '../landing.module.css'

export type LandingScrollRevealOptions = {
  /** IntersectionObserver rootMargin (default triggers slightly before fully in view) */
  rootMargin?: string
  threshold?: number
  once?: boolean
  /**
   * `block` — whole element fades up (default).
   * `stagger` — container stays layout-stable; only `.landingStagger` children animate (set --stagger on each).
   */
  mode?: 'block' | 'stagger'
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduced(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  return reduced
}

/**
 * Scroll-driven reveal for home-v2 landing sections (IntersectionObserver + CSS).
 * Respects `prefers-reduced-motion`: skips scroll animation and shows content immediately.
 */
export function useLandingScrollReveal(options: LandingScrollRevealOptions = {}) {
  const {
    rootMargin = '0px 0px -10% 0px',
    threshold = 0.12,
    once = true,
    mode = 'block',
  } = options

  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (reducedMotion) {
      setVisible(true)
      return
    }
    const el = ref.current
    if (!el) return

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          setVisible(true)
          if (once) obs.unobserve(e.target)
        }
      },
      { rootMargin, threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [once, reducedMotion, rootMargin, threshold])

  const visibleOrReduced = visible || reducedMotion

  const className =
    mode === 'stagger'
      ? cn(styles.landingRevealStaggerRoot, visibleOrReduced && styles.landingRevealVisible)
      : cn(styles.landingReveal, visibleOrReduced && styles.landingRevealVisible)

  return { ref, className, visible: visibleOrReduced }
}
