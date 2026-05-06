'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, CircleDot, Images, RotateCw } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { cn } from '@/lib/utils'
import { useExperienceTheme } from '@/app/(store)/shop/experience-v2/ExperienceThemeContext'
import {
  readExperienceV3MainMediaMode,
  writeExperienceV3MainMediaMode,
  type ExperienceV3MainMediaMode,
} from '@/lib/shop/experience-v3-main-media'
import {
  buildProductCarouselSlides,
  splitProductCarouselMediaSlides,
  getCarouselSlideThumbnailUrl,
  type ProductCarouselSlide,
} from '@/lib/shop/product-carousel-slides'
import { loadImagePosition, DEFAULT_SIDE_POSITION, DEFAULT_SIDE_B_POSITION } from '@/lib/experience-image-position'
import { ComponentErrorBoundary } from '@/components/error-boundaries'

const SPLINE_FACADE_SRC = '/internal.webp'

const CHUNK_RELOAD_KEY = 'spline_chunk_reload'
const loadSpline3DPreview = () =>
  import('@/app/template-preview/components/spline-3d-preview')
    .then((m) => m.Spline3DPreview)
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

const Spline3DPreview = dynamic(loadSpline3DPreview, {
  ssr: false,
  loading: () => <SplineHeroLoading />,
})

function SplineHeroLoading() {
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

interface ExperienceV3HeroMediaProps {
  image1: string | null
  image2: string | null
  /** Full Shopify product used to build gallery slides when mode is gallery (must include images/media when possible). */
  galleryProduct: ShopifyProduct | null
  rotateToSide: 'A' | 'B' | null
  rotateTrigger: number
  resetTrigger: number
  onFrontSideSettled?: (side: 'A' | 'B') => void
}

function imageSlidesOnly(slides: ProductCarouselSlide[]) {
  return splitProductCarouselMediaSlides(slides).imageSlides.filter((s) => s.type === 'image')
}

export function ExperienceV3HeroMedia({
  image1,
  image2,
  galleryProduct,
  rotateToSide,
  rotateTrigger,
  resetTrigger,
  onFrontSideSettled,
}: ExperienceV3HeroMediaProps) {
  const { theme } = useExperienceTheme()
  const lampVariant = theme === 'light' ? 'light' : 'dark'
  const [mode, setMode] = useState<ExperienceV3MainMediaMode>(() => readExperienceV3MainMediaMode() ?? 'spline')
  const [splineReady, setSplineReady] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [previewQuarterTurns] = useState(0)

  useEffect(() => {
    const schedule = (cb: () => void) =>
      typeof requestIdleCallback !== 'undefined'
        ? requestIdleCallback(cb, { timeout: 3000 })
        : (setTimeout(cb, 3000) as unknown as number)
    const cancel = (id: number) =>
      typeof cancelIdleCallback !== 'undefined' ? cancelIdleCallback(id) : clearTimeout(id)
    const id = schedule(() => setSplineReady(true))
    return () => cancel(id)
  }, [])

  const slides = useMemo(() => {
    if (!galleryProduct) return []
    return imageSlidesOnly(buildProductCarouselSlides(galleryProduct))
  }, [galleryProduct])

  useEffect(() => {
    setGalleryIndex(0)
  }, [galleryProduct?.id])

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('experience-selector-settled'))
  }, [])

  const persistMode = useCallback((m: ExperienceV3MainMediaMode) => {
    setMode(m)
    writeExperienceV3MainMediaMode(m)
  }, [])

  const thumbSrc = slides[galleryIndex] ? getCarouselSlideThumbnailUrl(slides[galleryIndex]) : image1 ?? image2

  const [imageScale, setImageScale] = useState(DEFAULT_SIDE_POSITION.scale)
  const [imageOffsetX, setImageOffsetX] = useState(DEFAULT_SIDE_POSITION.offsetX)
  const [imageOffsetY, setImageOffsetY] = useState(DEFAULT_SIDE_POSITION.offsetY)
  const [imageScaleX, setImageScaleX] = useState(DEFAULT_SIDE_POSITION.scaleX)
  const [imageScaleY, setImageScaleY] = useState(DEFAULT_SIDE_POSITION.scaleY)
  const [imageScaleB, setImageScaleB] = useState(DEFAULT_SIDE_B_POSITION.scale)
  const [imageOffsetXB, setImageOffsetXB] = useState(DEFAULT_SIDE_B_POSITION.offsetX)
  const [imageOffsetYB, setImageOffsetYB] = useState(DEFAULT_SIDE_B_POSITION.offsetY)
  const [imageScaleXB, setImageScaleXB] = useState(DEFAULT_SIDE_B_POSITION.scaleX)
  const [imageScaleYB, setImageScaleYB] = useState(DEFAULT_SIDE_B_POSITION.scaleY)

  useEffect(() => {
    const saved = loadImagePosition()
    if (!saved) return
    setImageScale(saved.sideA.scale)
    setImageOffsetX(saved.sideA.offsetX)
    setImageOffsetY(saved.sideA.offsetY)
    setImageScaleX(saved.sideA.scaleX)
    setImageScaleY(saved.sideA.scaleY)
    setImageScaleB(saved.sideB.scale)
    setImageOffsetXB(saved.sideB.offsetX)
    setImageOffsetYB(saved.sideB.offsetY)
    setImageScaleXB(saved.sideB.scaleX)
    setImageScaleYB(saved.sideB.scaleY)
  }, [])

  const showGalleryChrome = slides.length > 0
  const facadeSrc = image1 ?? image2 ?? SPLINE_FACADE_SRC

  const stepGallery = (dir: -1 | 1) => {
    if (slides.length === 0) return
    setGalleryIndex((i) => (i + dir + slides.length) % slides.length)
  }

  const currentSlide = slides[galleryIndex]

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col">
      <div className="relative flex min-h-[min(72svh,720px)] flex-1 rounded-xl bg-neutral-100 dark:bg-[#1a1616]">
        {/* Chevrons (gallery only) */}
        {mode === 'gallery' && slides.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => stepGallery(-1)}
              className="absolute left-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-md transition hover:bg-black/50 md:left-3"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => stepGallery(1)}
              className="absolute right-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-md transition hover:bg-black/50 md:right-3"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        ) : null}

        {mode === 'spline' ? (
          !splineReady ? (
            <button
              type="button"
              onClick={() => setSplineReady(true)}
              aria-label="Load 3D preview"
              className="absolute inset-0 flex cursor-pointer items-center justify-center focus:outline-none"
            >
              <Image src={facadeSrc} alt="Street Lamp preview" fill className="object-contain" sizes="100vw" priority unoptimized={!!image1 || !!image2} />
            </button>
          ) : (
            <ComponentErrorBoundary
              componentName="Spline3DPreview"
              fallback={
                <div className="relative h-full w-full">
                  {facadeSrc ? (
                    <Image src={facadeSrc} alt="Art preview" fill className="object-contain" sizes="100vw" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-neutral-500">Preview unavailable</div>
                  )}
                </div>
              }
            >
              <Spline3DPreview
                image1={image1}
                image2={image2}
                lampVariant={lampVariant}
                previewTheme={theme}
                side1ObjectId="2de1e7d2-4b53-4738-a749-be197641fa9a"
                side2ObjectId="2e33392b-21d8-441d-87b0-11527f3a8b70"
                minimal
                parentScrollMode="isolate"
                animate
                interactive={false}
                idleSpinEnabled
                className="relative h-full w-full min-h-0 min-w-0"
                swapLampSides
                flipForSide="B"
                flipForSideB="horizontal"
                imageScale={imageScale}
                imageOffsetX={imageOffsetX}
                imageOffsetY={imageOffsetY}
                imageScaleX={imageScaleX}
                imageScaleY={imageScaleY}
                imageScaleB={imageScaleB}
                imageOffsetXB={imageOffsetXB}
                imageOffsetYB={imageOffsetYB}
                imageScaleXB={imageScaleXB}
                imageScaleYB={imageScaleYB}
                resetTrigger={resetTrigger}
                rotateToSide={rotateToSide}
                rotateTrigger={rotateTrigger}
                onFrontSideSettled={onFrontSideSettled}
                previewQuarterTurns={previewQuarterTurns}
              />
            </ComponentErrorBoundary>
          )
        ) : currentSlide && currentSlide.type === 'image' ? (
          <div className="relative h-full w-full">
            <Image
              key={currentSlide.image.url}
              src={currentSlide.image.url}
              alt={currentSlide.image.altText || 'Artwork'}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 55vw"
              unoptimized
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-neutral-500">
            Loading photos…
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-shrink-0 items-center justify-center gap-2">
        <button
          type="button"
          aria-pressed={mode === 'spline'}
          aria-label="3D lamp view"
          onClick={() => persistMode('spline')}
          title="3D lamp"
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg border backdrop-blur-sm transition-colors',
            mode === 'spline'
              ? 'border-orange-400/90 bg-white/20 text-white'
              : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
          )}
        >
          <RotateCw className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-pressed={mode === 'gallery'}
          aria-label="Photo gallery"
          disabled={!showGalleryChrome}
          onClick={() => showGalleryChrome && persistMode('gallery')}
          title="Gallery"
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg border backdrop-blur-sm transition-colors',
            !showGalleryChrome && 'cursor-not-allowed opacity-40',
            mode === 'gallery' && showGalleryChrome
              ? 'border-orange-400/90 bg-white/20 text-white'
              : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
          )}
        >
          <Images className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Gallery index"
          disabled={slides.length === 0}
          onClick={() => {
            if (slides.length === 0) return
            persistMode('gallery')
          }}
          className={cn(
            'flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border transition-colors',
            mode === 'gallery' && slides.length > 0
              ? 'border-orange-400/90 ring-1 ring-orange-400/50'
              : 'border-white/15 opacity-80 hover:opacity-100'
          )}
        >
          {thumbSrc ? (
            <Image src={thumbSrc} alt="" width={40} height={40} className="h-full w-full object-cover" unoptimized />
          ) : (
            <CircleDot className="h-5 w-5 text-white/60" />
          )}
        </button>
      </div>
    </div>
  )
}
