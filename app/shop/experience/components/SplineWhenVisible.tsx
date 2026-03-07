'use client'

import { useEffect, useRef, useState } from 'react'
import type { ComponentProps } from 'react'

interface SplineWhenVisibleProps extends ComponentProps<'div'> {
  /** The Spline component to render when visible */
  children: React.ReactNode
  /** Placeholder to show while waiting for visibility */
  placeholder?: React.ReactNode
}

/**
 * Defers rendering children until the container is in the viewport.
 * Used for Spline 3D to avoid loading ~7MB scene + runtime until the preview is visible.
 */
export function SplineWhenVisible({ children, placeholder, className, ...rest }: SplineWhenVisibleProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsInView(true)
        }
      },
      { rootMargin: '100px', threshold: 0.01 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const defaultPlaceholder = (
    <div className="relative w-full h-full flex items-center justify-center bg-neutral-200/80 dark:bg-[#171515]/80">
      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
    </div>
  )

  return (
    <div ref={ref} className={className} {...rest}>
      {isInView ? children : (placeholder ?? defaultPlaceholder)}
    </div>
  )
}
