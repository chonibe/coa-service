'use client'

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { Info } from 'lucide-react'
import { ComponentErrorBoundary } from '@/components/error-boundaries'
import { cn } from '@/lib/utils'
import { useExperienceTheme } from '../../experience-v2/ExperienceThemeContext'

/** Static facade as LCP candidate; Spline scene mounts after user tap. */
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
  /**
   * When provided, renders a smaller two-column layout — the 3D viewport on one side,
   * `sideContent` (e.g. bundle offer copy/CTA) on the other — instead of the standalone
   * centered "Your Collection" heading/hint/viewport stack. Used to double this section up
   * as the bundle offer without mounting a second Spline instance.
   */
  sideContent?: ReactNode
  /** Overrides the default "Your Collection" heading. Ignored when `sideContent` is set. */
  heading?: string
  /**
   * When set, fully covers the 3D viewport with an opaque backdrop plus a floating artwork image
   * (continuous idle tilt, no card border/box) and hides the lamp entirely — used for the
   * bundle offer's "Artwork only" toggle state. The outer wrapper needs an opaque fill (matching
   * the viewport's own backdrop, see `unifiedSplineBg` below) because the artwork card is
   * intentionally NOT full-bleed — without that opaque wrapper the Spline canvas underneath shows
   * through in the negative space around the card. The Spline scene stays mounted underneath the
   * whole time (no reload when toggling back to "Add Street Lamp"), it's just fully obscured.
   *
   * This intentionally does NOT try to hide just the lamp mesh inside the Spline scene itself:
   * the artwork mount panels ("Panel Side A/B") are discovered as descendants of the same scene
   * graph as the lamp assembly, so toggling the lamp object's own visibility risks hiding the
   * artwork panels too (or doing nothing), depending on how the compiled scene nests them — too
   * fragile to depend on. An opaque image overlay is the version of "show art, hide lamp" that's
   * guaranteed correct regardless of the scene's internal structure.
   */
  artworkOverlaySrc?: string | null
  artworkOverlayAlt?: string
}

/**
 * `spline-3d-preview.tsx` hardcodes its own WebGL scene background/clear-color per theme
 * (`setBackgroundFromVariant`: `#F5F5F5` light / `#171515` dark) — independent of any CSS token,
 * and shared by other Spline consumers across the app, so it isn't safe to change there. To get a
 * single seamless background across the section shell + viewport wrapper + Spline canvas + artwork
 * overlay, we match those exact hex values here rather than using `bg-background`/
 * `bg-experience-surface` (which are close, but not identical, to what the canvas actually renders).
 */
const SPLINE_BG_HEX = { light: '#F5F5F5', dark: '#171515' } as const

export function ExperienceV3SplineLampSection({
  image1,
  image2,
  splineBindings,
  onFrontSideSettled,
  onInViewChange,
  reelScrollContainerRef,
  footer,
  sideContent,
  heading = 'Your Collection',
  artworkOverlaySrc = null,
  artworkOverlayAlt = 'Artwork preview',
}: ExperienceV3SplineLampSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)
  const [splineReady, setSplineReady] = useState(false)
  const { theme } = useExperienceTheme()
  const unifiedSplineBg = SPLINE_BG_HEX[theme === 'light' ? 'light' : 'dark']

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

  const facadeSrc = image1 ?? image2 ?? SPLINE_FACADE_SRC
  const splineImage1 = image1 ?? null
  const splineImage2 = image2 ?? image1 ?? null
  const compact = Boolean(sideContent)

  const viewportMinH = compact
    ? 'min-h-[min(46svh,420px)] md:min-h-[40rem]'
    : 'min-h-[min(64svh,680px)] md:min-h-[min(72svh,820px)]'
  const viewportMaxW = compact ? 'max-w-[560px] md:max-w-none' : 'max-w-[min(100%,720px)]'
  /**
   * The artwork overlay (bundle "Artwork only" toggle state) shares this same viewport box, but
   * its own visual size must stay pinned to the ORIGINAL compact-mode footprint regardless of how
   * much bigger `viewportMinH` grows the Spline model's box — otherwise growing the Spline
   * container would inadvertently blow up the artwork image too. Fixed (not `h-full`) so it no
   * longer tracks `viewportMinH`. Scaled down proportionally to the mobile `viewportMinH` cut
   * below so it still reads at the same relative size inside the now-shorter mobile viewport.
   */
  const artworkOverlayH = compact ? 'h-[min(28svh,270px)] md:h-[24rem]' : 'h-full'

  const viewport = (
    <div
      className={cn('relative mx-auto w-full overflow-hidden rounded-xl', viewportMinH, viewportMaxW)}
      style={{ backgroundColor: unifiedSplineBg }}
    >
      {!splineReady ? (
        <button
          type="button"
          onClick={() => setSplineReady(true)}
          className={cn(
            'absolute inset-0 flex h-full w-full cursor-pointer items-center justify-center focus:outline-none focus:ring-0',
            viewportMinH
          )}
          aria-label="Load 3D preview"
        >
          <Image
            src={facadeSrc}
            alt="Street Lamp preview"
            fill
            className="object-contain p-4"
            sizes={compact ? '(max-width: 767px) 92vw, 560px' : '(max-width: 767px) 92vw, 720px'}
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
            <div className={cn('flex items-center justify-center p-6 text-center text-sm text-muted-foreground', viewportMinH)}>
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
            className={cn('relative h-full w-full', viewportMinH)}
          />
        </ComponentErrorBoundary>
      )}
      {artworkOverlaySrc ? (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center"
          style={{ backgroundColor: unifiedSplineBg }}
        >
          {/* Base size matches the Spline canvas's own edge-to-edge framing (pinned to the
              original compact-mode viewport height via `artworkOverlayH`, independent of how
              large `viewportMinH` makes the Spline model's own box — see note above);
              `scale-150` then pushes it ~1.5x beyond that, same as the "with lamp" model reads
              as filling a generous, substantial portion of the section. */}
          <div className={cn('relative aspect-[14/20] max-h-full w-auto max-w-full scale-150', artworkOverlayH)}>
            <div className="experience-bundle-artwork-tilt relative h-full w-full">
              <Image
                src={artworkOverlaySrc}
                alt={artworkOverlayAlt}
                fill
                className="object-contain"
                style={{
                  maskImage: 'radial-gradient(ellipse at center, black 58%, transparent 88%)',
                  WebkitMaskImage: 'radial-gradient(ellipse at center, black 58%, transparent 88%)',
                }}
                sizes={compact ? '(max-width: 767px) 60vw, 260px' : '(max-width: 767px) 70vw, 480px'}
                unoptimized
                priority={inView}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )

  return (
    <section
      ref={sectionRef}
      id="experience-v3-lamp-preview"
      aria-labelledby="experience-v3-lamp-heading"
      className={cn(
        'relative z-0 w-full max-w-full shrink-0',
        'scroll-mt-[max(4.5rem,env(safe-area-inset-top))]'
      )}
      style={{ backgroundColor: unifiedSplineBg }}
    >
      <div
        className={cn(
          'mx-auto w-full max-w-[min(100%,1200px)] px-3 md:px-6 md:pb-10',
          // Compact (bundle) mode gets tighter bottom pad than the standalone heading layout.
          compact ? 'pb-4' : 'pb-6'
        )}
      >
        {sideContent ? (
          <div className="grid gap-4 md:grid-cols-[3fr_2fr] md:items-center md:gap-10">
            <h2 id="experience-v3-lamp-heading" className="sr-only">
              {heading}
            </h2>
            {viewport}
            {sideContent}
          </div>
        ) : (
          <>
            <h2
              id="experience-v3-lamp-heading"
              className="mb-4 pt-6 text-center font-serif text-xl font-semibold tracking-tight text-experience-title md:mb-6 md:pt-8 md:text-2xl"
            >
              {heading}
            </h2>
            <div className="mb-4 flex items-center justify-center gap-2 text-center text-xs font-medium text-muted-foreground md:-mt-2 md:mb-6">
              <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>click artwork tile to preview on lamp</span>
            </div>
            {viewport}
          </>
        )}
        {footer ? <div className="mt-4 w-full md:mt-6">{footer}</div> : null}
      </div>
    </section>
  )
}
