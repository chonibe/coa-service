'use client'

import { useEffect, useRef, useState } from 'react'
import type { ComponentProps } from 'react'

interface SplineWhenVisibleProps extends ComponentProps<'div'> {
  /** The Spline component to render when visible */
  children: React.ReactNode
  /** Placeholder to show while waiting for visibility */
  placeholder?: React.ReactNode
  /** Render children immediately, skipping viewport wait */
  forceRender?: boolean
}

/**
 * Defers rendering children until the container is in the viewport.
 * Used for Spline 3D to avoid loading ~7MB scene + runtime until the preview is visible.
 */
export function SplineWhenVisible({ children, placeholder, className, forceRender = false, ...rest }: SplineWhenVisibleProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)
  const isInViewRef = useRef(false)
  isInViewRef.current = isInView

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // If forceRender is true, check visibility immediately and set up observer
    if (forceRender) {
      let lastIntersecting = false
      const checkVisibility = () => {
        if (isInViewRef.current) return
        const rect = el.getBoundingClientRect()
        // Ensure container has valid dimensions before allowing Spline to load
        const hasValidDimensions = rect.width > 50 && rect.height > 50
        const inViewport =
          rect.top < window.innerHeight && rect.bottom > 0 &&
          rect.left < window.innerWidth && rect.right > 0
        const isVisible = hasValidDimensions && (lastIntersecting || inViewport)
        
        if (isVisible) {
          setIsInView(true)
          // Trigger selector settled event for Spline to initialize properly after layout settles
          requestAnimationFrame(() => {
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('experience-selector-settled'))
            }, 100)
          })
        }
      }
      
      // Check after a brief delay to ensure layout has settled
      const initialTimeout = setTimeout(checkVisibility, 100)
      
      // Still set up observer to catch when it becomes visible
      const io = new IntersectionObserver(
        ([entry]) => {
          lastIntersecting = !!entry?.isIntersecting
          if (entry?.isIntersecting) {
            checkVisibility()
          }
        },
        { rootMargin: '100px', threshold: 0.01 }
      )
      io.observe(el)

      // React to size changes when selector panel expands/collapses.
      const ro = new ResizeObserver(() => {
        checkVisibility()
      })
      ro.observe(el)
      
      // Also trigger a check after layout settling delays
      const timeoutId = setTimeout(checkVisibility, 200)
      const finalTimeoutId = setTimeout(checkVisibility, 400)
      const lateTimeoutId = setTimeout(checkVisibility, 1000)
      const onResize = () => checkVisibility()
      const onSettled = () => checkVisibility()
      window.addEventListener('resize', onResize)
      window.addEventListener('orientationchange', onResize)
      window.addEventListener('experience-selector-settled', onSettled as EventListener)
      
      return () => {
        clearTimeout(initialTimeout)
        io.disconnect()
        ro.disconnect()
        clearTimeout(timeoutId)
        clearTimeout(finalTimeoutId)
        clearTimeout(lateTimeoutId)
        window.removeEventListener('resize', onResize)
        window.removeEventListener('orientationchange', onResize)
        window.removeEventListener('experience-selector-settled', onSettled as EventListener)
      }
    }
    
    // Normal IntersectionObserver behavior when not force rendering
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
  }, [forceRender])

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
