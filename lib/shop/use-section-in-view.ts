'use client'

import { useEffect, useState, type RefObject } from 'react'

type UseSectionInViewOptions = {
  rootMargin?: string
  threshold?: number
}

/**
 * Returns true when the ref target intersects the viewport.
 * Used to defer video / heavy section work until scroll proximity.
 */
export function useSectionInView(
  ref: RefObject<Element | null>,
  { rootMargin = '0px', threshold = 0.08 }: UseSectionInViewOptions = {}
): boolean {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setInView(true)
        }
      },
      { rootMargin, threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [ref, rootMargin, threshold])

  return inView
}
