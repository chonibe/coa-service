'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useExperienceTheme } from '../../experience-v2/ExperienceThemeContext'
import {
  loadImagePosition,
  DEFAULT_SIDE_POSITION,
  DEFAULT_SIDE_B_POSITION,
} from '@/lib/experience-image-position'
import { ComponentErrorBoundary } from '@/components/error-boundaries'
import { cn } from '@/lib/utils'

const SPLINE_FACADE_SRC = '/internal.webp'

const loadSpline3DPreview = () =>
  import('@/app/template-preview/components/spline-3d-preview').then((m) => m.Spline3DPreview)

const Spline3DPreview = dynamic(loadSpline3DPreview, {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-transparent">
      <div
        className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-400/50 border-t-neutral-700 dark:border-white/25 dark:border-t-white/90"
        aria-hidden
      />
    </div>
  ),
})

export interface CarouselStripLampSplineProps {
  image1: string | null
  image2: string | null
  /** Caller parity with main reel; does not gate idle yaw sway. */
  lampPreviewCount: number
  /** Caller parity with main reel; does not gate idle yaw sway. */
  collectionArtworkCount: number
  resetTrigger: number
  rotateToSide: 'A' | 'B' | null
  rotateTrigger: number
  onFrontSideSettled?: (side: 'A' | 'B') => void
  className?: string
}

/**
 * Same `Spline3DPreview` scene + panel object IDs as `SplineFullScreen`, scaled into the collection-strip thumb
 * (second WebGL instance, staggered load).
 */
export function CarouselStripLampSpline({
  image1,
  image2,
  lampPreviewCount: _lampPreviewCount,
  collectionArtworkCount: _collectionArtworkCount,
  resetTrigger,
  rotateToSide,
  rotateTrigger,
  onFrontSideSettled,
  className,
}: CarouselStripLampSplineProps) {
  const { theme } = useExperienceTheme()
  const [splineReady, setSplineReady] = useState(false)
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
    if (saved) {
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
    }
  }, [])

  /** Stagger after main reel Spline (idle ≤3s) so LCP + first scene load stay prioritized. */
  useEffect(() => {
    const schedule = (cb: () => void) =>
      typeof requestIdleCallback !== 'undefined'
        ? requestIdleCallback(cb, { timeout: 5500 })
        : (setTimeout(cb, 5500) as unknown as number)
    const cancel = (id: number) =>
      typeof cancelIdleCallback !== 'undefined' ? cancelIdleCallback(id) : clearTimeout(id)
    const id = schedule(() => setSplineReady(true))
    return () => cancel(id as number)
  }, [])

  const lampVariant = theme === 'light' ? 'light' : 'dark'

  const facadeSrc = image1 ?? image2 ?? SPLINE_FACADE_SRC

  const errorFallback = useMemo(
    () => (
      <div className="relative h-full w-full bg-transparent">
        <Image src={facadeSrc} alt="" fill className="object-contain" sizes="80px" unoptimized />
      </div>
    ),
    [facadeSrc]
  )

  if (!splineReady) {
    return (
      <div className={cn('relative h-full w-full bg-transparent', className)}>
        <Image src={facadeSrc} alt="" fill className="object-contain" sizes="80px" unoptimized />
      </div>
    )
  }

  return (
    <div className={cn('pointer-events-none relative h-full w-full bg-transparent', className)}>
      <ComponentErrorBoundary componentName="CarouselStripLampSpline" fallback={errorFallback}>
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
          cameraFeedMode
          cameraFeedCssBackdrop={theme === 'light' ? '#F5F5F5' : '#171515'}
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
          previewQuarterTurns={0}
        />
      </ComponentErrorBoundary>
    </div>
  )
}
