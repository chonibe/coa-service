'use client'

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { ComponentErrorBoundary } from '@/components/error-boundaries'
import { cn } from '@/lib/utils'
import { useExperienceTheme } from '../../experience-v2/ExperienceThemeContext'

/** Static facade as LCP candidate; Spline scene mounts via requestIdleCallback (same as V2). */
const SPLINE_FACADE_SRC = '/internal.webp'

const CHUNK_RELOAD_KEY = 'spline_chunk_reload'
const loadSpline3DPreview = () =>
  import('@/app/template-preview/components/spline-3d-preview')
    .then((mod) => mod.Spline3DPreview)
    .catch((err) => {
      const isChunkError = err?.name === 'ChunkLoadError' || err?.message?.includes?.('Loading chunk')
      if (!isChunkError) throw err
      return import('@/app/template-preview/components/spline-3d-preview')
        .then((m) => m.Spline3DPreview)
        .catch((retryErr) => {
          if (typeof window !== 'undefined' && !sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
            sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
            window.location.reload()
            return new Promise(() => {})
          }
          throw retryErr
        })
    })

function SplinePreviewLoading() {
  const { theme } = useExperienceTheme()
  return (
    <div
      className={cn(
        'relative flex h-full w-full items-center justify-center',
        theme === 'light' ? 'bg-neutral-200/80' : 'bg-neutral-900/80'
      )}
    >
      <div
        className={cn(
          'h-8 w-8 animate-spin rounded-full border-2',
          theme === 'light' ? 'border-neutral-300 border-t-neutral-600' : 'border-white/30 border-t-white'
        )}
      />
    </div>
  )
}

const Spline3DPreview = dynamic(loadSpline3DPreview, {
  ssr: false,
  loading: () => <SplinePreviewLoading />,
})

type SplineBindings = ComponentProps<typeof Spline3DPreview>

interface ExperienceV3SplineLampSectionProps {
  image1: string | null
  image2: string | null
  splineBindings: Omit<SplineBindings, 'image1' | 'image2' | 'className' | 'parentScrollMode'>
  onFrontSideSettled?: (side: 'A' | 'B') => void
  onInViewChange?: (inView: boolean) => void
  reelScrollContainerRef?: React.RefObject<HTMLDivElement | null>
  /** Bottom tile bar (cart thumbnails) — rendered inside the section below the 3D viewport. */
  footer?: ReactNode
}

export function ExperienceV3SplineLampSection({
  image1,
  image2,
  splineBindings,
  onFrontSideSettled,
  onInViewChange,
  reelScrollContainerRef,
  footer,
}: ExperienceV3SplineLampSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)
  const [splineReady, setSplineReady] = useState(false)
  const splineIdleScheduledRef = useRef(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const scrollRoot = reelScrollContainerRef?.current ?? null
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting
        setInView(visible)
        onInViewChange?.(visible)
      },
      scrollRoot
        ? { root: scrollRoot, rootMargin: '0px', threshold: 0.1 }
        : { rootMargin: '120px 0px', threshold: 0.08 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [onInViewChange, reelScrollContainerRef])

  // Defer Spline mount until idle (3s max) when section is near viewport — same as V2 SplineFullScreen.
  // Never reset on artwork/image change; texture updates flow through image1/image2 props in-place.
  useEffect(() => {
    if (!inView || splineIdleScheduledRef.current) return
    splineIdleScheduledRef.current = true
    const schedule = (cb: () => void) =>
      typeof requestIdleCallback !== 'undefined'
        ? requestIdleCallback(cb, { timeout: 3000 })
        : (setTimeout(cb, 3000) as unknown as number)
    const cancel = (id: number) =>
      typeof cancelIdleCallback !== 'undefined' ? cancelIdleCallback(id) : clearTimeout(id)
    const id = schedule(() => setSplineReady(true))
    return () => cancel(id)
  }, [inView])

  const facadeSrc = image1 ?? image2 ?? SPLINE_FACADE_SRC
  const splineImage1 = image1 ?? null
  const splineImage2 = image2 ?? image1 ?? null

  return (
    <section
      ref={sectionRef}
      id="experience-v3-lamp-preview"
      aria-labelledby="experience-v3-lamp-heading"
      className={cn(
        'relative z-0 w-full max-w-full shrink-0',
        'border-t border-border bg-experience-surface',
        'scroll-mt-[max(4.5rem,env(safe-area-inset-top))]'
      )}
    >
      <div className="mx-auto w-full max-w-[min(100%,1200px)] px-3 pb-6 pt-8 md:px-6 md:pb-10 md:pt-10">
        <h2
          id="experience-v3-lamp-heading"
          className="mb-4 text-center font-serif text-xl font-semibold tracking-tight text-experience-title md:mb-6 md:text-2xl"
        >
          Your Collection
        </h2>
        <div className="relative mx-auto min-h-[min(64svh,680px)] w-full max-w-[min(100%,720px)] overflow-hidden rounded-xl bg-background md:min-h-[min(72svh,820px)]">
          {!splineReady ? (
            <button
              type="button"
              onClick={() => setSplineReady(true)}
              className="absolute inset-0 flex h-full min-h-[min(64svh,680px)] w-full cursor-pointer items-center justify-center focus:outline-none focus:ring-0 md:min-h-[min(72svh,820px)]"
              aria-label="Load 3D preview"
            >
              <Image
                src={facadeSrc}
                alt="Street Lamp preview"
                fill
                className="object-contain p-4"
                sizes="(max-width: 767px) 92vw, 720px"
                unoptimized
                priority={inView}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
                <span className="rounded-full bg-black/55 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white/80 backdrop-blur-sm">
                  Tap to load 3D preview
                </span>
              </div>
            </button>
          ) : (
            <ComponentErrorBoundary
              componentName="Spline3DPreview"
              fallback={
                <div className="flex h-full min-h-[min(64svh,680px)] items-center justify-center p-6 text-center text-sm text-muted-foreground md:min-h-[min(72svh,820px)]">
                  3D preview unavailable.
                </div>
              }
            >
              <Spline3DPreview
                {...splineBindings}
                image1={splineImage1}
                image2={splineImage2}
                parentScrollMode="contain"
                reelScrollContainerRef={reelScrollContainerRef}
                onFrontSideSettled={onFrontSideSettled}
                className="relative h-full min-h-[min(64svh,680px)] w-full md:min-h-[min(72svh,820px)]"
              />
            </ComponentErrorBoundary>
          )}
        </div>
        {footer ? <div className="mt-4 w-full md:mt-6">{footer}</div> : null}
      </div>
    </section>
  )
}
