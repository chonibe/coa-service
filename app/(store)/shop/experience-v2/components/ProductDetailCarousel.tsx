'use client'

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import type { MotionValue } from 'framer-motion'
import { Play, ZoomIn, ZoomOut } from 'lucide-react'
import type { ShopifyVideoSource } from '@/lib/shopify/storefront-client'
import { cn } from '@/lib/utils'
import type { ProductCarouselSlide } from '@/lib/shop/product-carousel-slides'
import {
  getCarouselSlideMotionKey,
  getCarouselSlideThumbnailUrl,
  shopifyHlsPlaylistUrl,
  shopifyProgressiveVideoSources,
  shopifyVideoSourceTypeAttr,
} from '@/lib/shop/product-carousel-slides'

function shopifyVideoMediaKey(sources: ShopifyVideoSource[]): string {
  return sources.map((s) => `${s.url}#${s.mimeType ?? ''}#${s.format ?? ''}`).join('|')
}

/**
 * Video in a plain layer (no Framer on the &lt;video&gt;). Optional transparent drag overlay when embedded in a swipe carousel.
 * MP4: declarative &lt;source&gt; children. HLS: hls.js or native Safari. Muted autoplay + "Tap to play" if the browser blocks it.
 */
function ProductCarouselVideoSlide({
  sources,
  poster,
  ariaLabel,
  onEnded,
  swipeOverlay,
  n,
  imageZoom,
  panX,
  panY,
  dragX,
  handleDragEnd,
}: {
  sources: ShopifyVideoSource[]
  poster?: string
  ariaLabel: string
  onEnded: () => void
  /** When false (intro hero), no drag layer — video is separate from the image carousel. */
  swipeOverlay: boolean
  n: number
  imageZoom: number
  panX: MotionValue<number>
  panY: MotionValue<number>
  dragX: MotionValue<number>
  handleDragEnd: (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<{ destroy: () => void } | null>(null)
  const mediaKey = useMemo(() => shopifyVideoMediaKey(sources), [sources])
  const progressive = useMemo(() => shopifyProgressiveVideoSources(sources), [sources])
  const hlsUrl = useMemo(
    () => (progressive.length === 0 ? shopifyHlsPlaylistUrl(sources) : null),
    [sources, progressive.length]
  )
  const singleFallbackUrl = useMemo(
    () => (progressive.length === 0 && !hlsUrl ? sources[0]?.url ?? null : null),
    [sources, progressive.length, hlsUrl]
  )

  const [showTapToPlay, setShowTapToPlay] = useState(false)

  useEffect(() => {
    const el = videoRef.current
    if (!el || sources.length === 0) return

    el.setAttribute('playsinline', '')
    el.setAttribute('webkit-playsinline', '')

    let cancelled = false
    const clearHintSoon = () => {
      if (!cancelled && !el.paused) setShowTapToPlay(false)
    }

    const tryPlay = () => {
      if (cancelled) return
      el.muted = true
      void el.play().then(clearHintSoon).catch(() => {
        if (!cancelled) setShowTapToPlay(true)
      })
    }

    hlsRef.current?.destroy()
    hlsRef.current = null

    el.addEventListener('playing', clearHintSoon)

    if (progressive.length > 0) {
      tryPlay()
      el.addEventListener('canplay', tryPlay, { once: true })
      const t = window.setTimeout(() => {
        if (!cancelled && el.paused) setShowTapToPlay(true)
      }, 700)
      return () => {
        cancelled = true
        window.clearTimeout(t)
        el.removeEventListener('playing', clearHintSoon)
        el.removeEventListener('canplay', tryPlay)
      }
    }

    const streamUrl = hlsUrl ?? singleFallbackUrl
    if (!streamUrl) {
      return () => {
        cancelled = true
        el.removeEventListener('playing', clearHintSoon)
      }
    }

    const isM3u8 = Boolean(hlsUrl || /\.m3u8/i.test(streamUrl))
    const nativeHls =
      el.canPlayType('application/vnd.apple.mpegurl') !== '' ||
      el.canPlayType('application/x-mpegURL') !== ''

    if (isM3u8 && nativeHls) {
      el.src = streamUrl
      el.load()
      tryPlay()
      el.addEventListener('canplay', tryPlay, { once: true })
    } else if (isM3u8) {
      void import('hls.js').then(({ default: Hls }) => {
        if (cancelled || videoRef.current !== el) return
        if (!Hls.isSupported()) {
          el.src = streamUrl
          el.load()
          tryPlay()
          el.addEventListener('canplay', tryPlay, { once: true })
          return
        }
        const hls = new Hls({
          capLevelToPlayerSize: true,
          startLevel: -1,
          xhrSetup: (xhr) => {
            xhr.withCredentials = false
          },
        })
        hlsRef.current = hls
        hls.loadSource(streamUrl)
        hls.attachMedia(el)
        hls.on(Hls.Events.MANIFEST_PARSED, tryPlay)
      })
    } else {
      el.src = streamUrl
      el.load()
      tryPlay()
      el.addEventListener('canplay', tryPlay, { once: true })
    }

    const t = window.setTimeout(() => {
      if (!cancelled && el.paused) setShowTapToPlay(true)
    }, 900)

    return () => {
      cancelled = true
      window.clearTimeout(t)
      el.removeEventListener('playing', clearHintSoon)
      el.removeEventListener('canplay', tryPlay)
      hlsRef.current?.destroy()
      hlsRef.current = null
      el.pause()
      el.removeAttribute('src')
      while (el.firstChild) el.removeChild(el.firstChild)
    }
  }, [mediaKey, sources.length, progressive.length, hlsUrl, singleFallbackUrl])

  const onTapToPlay = () => {
    const el = videoRef.current
    if (!el) return
    el.muted = true
    void el.play().then(() => setShowTapToPlay(false)).catch(() => setShowTapToPlay(true))
  }

  return (
    <div className="absolute inset-0">
      {progressive.length > 0 ? (
        <video
          ref={videoRef}
          key={`mp4-${mediaKey}`}
          className="absolute inset-0 z-0 h-full w-full object-cover"
          poster={poster}
          muted
          playsInline
          autoPlay
          preload="auto"
          aria-label={ariaLabel}
          onEnded={onEnded}
        >
          {progressive.map((s) => {
            const typeAttr = shopifyVideoSourceTypeAttr(s)
            return <source key={s.url} src={s.url} {...(typeAttr ? { type: typeAttr } : {})} />
          })}
        </video>
      ) : (
        <video
          ref={videoRef}
          key={`stream-${mediaKey}`}
          className="absolute inset-0 z-0 h-full w-full object-cover"
          poster={poster}
          muted
          playsInline
          autoPlay
          preload="auto"
          aria-label={ariaLabel}
          onEnded={onEnded}
        />
      )}

      {showTapToPlay ? (
        <button
          type="button"
          className="absolute bottom-14 left-1/2 z-[5] flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/70 px-4 py-2.5 text-xs font-semibold text-white shadow-lg backdrop-blur-sm"
          onClick={onTapToPlay}
        >
          <Play className="h-4 w-4 shrink-0 fill-current" aria-hidden />
          Tap to play
        </button>
      ) : null}

      {swipeOverlay ? (
        <motion.div
          className="absolute inset-0 z-[1] cursor-grab touch-pan-y active:cursor-grabbing"
          drag={imageZoom > 1 ? true : n > 1 ? 'x' : false}
          dragConstraints={
            imageZoom > 1
              ? { left: -150, right: 150, top: -150, bottom: 150 }
              : { left: -280, right: 280 }
          }
          dragElastic={imageZoom > 1 ? 0.1 : 0.2}
          dragMomentum={false}
          onDragEnd={imageZoom > 1 ? undefined : handleDragEnd}
          style={{
            x: imageZoom > 1 ? panX : dragX,
            y: imageZoom > 1 ? panY : 0,
          }}
          aria-hidden
        />
      ) : null}
    </div>
  )
}

export interface ProductDetailCarouselProps {
  slides: ProductCarouselSlide[]
  slideIndex: number
  goToIndex: (i: number) => void
  constraintsRef: RefObject<HTMLDivElement | null>
  imageZoom: number
  panX: MotionValue<number>
  panY: MotionValue<number>
  dragX: MotionValue<number>
  handleDragEnd: (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void
  handleZoomChange: () => void
  productTitle: string
  frameClassName: string
  sizes: string
}

function CarouselImageOrEmbed({
  slide,
  slideIndexForKey,
  productTitle,
  sizes,
  imageZoom,
  panX,
  panY,
  dragX,
  n,
  handleDragEnd,
}: {
  slide: ProductCarouselSlide
  slideIndexForKey: number
  productTitle: string
  sizes: string
  imageZoom: number
  panX: MotionValue<number>
  panY: MotionValue<number>
  dragX: MotionValue<number>
  n: number
  handleDragEnd: (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void
}) {
  return (
    <motion.div
      key={getCarouselSlideMotionKey(slide, slideIndexForKey)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      drag={imageZoom > 1 ? true : n > 1 ? 'x' : false}
      dragConstraints={
        imageZoom > 1
          ? { left: -150, right: 150, top: -150, bottom: 150 }
          : { left: -280, right: 280 }
      }
      dragElastic={imageZoom > 1 ? 0.1 : 0.2}
      dragMomentum={false}
      onDragEnd={imageZoom > 1 ? undefined : handleDragEnd}
      style={{
        x: imageZoom > 1 ? panX : dragX,
        y: imageZoom > 1 ? panY : 0,
        scale: imageZoom,
      }}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
    >
      {slide.type === 'image' && (
        <Image
          key={slide.image.url}
          src={slide.image.url}
          alt={slide.image.altText || productTitle}
          fill
          className={imageZoom > 1 ? 'object-contain' : 'object-cover'}
          sizes={sizes}
          draggable={false}
          unoptimized
        />
      )}
      {slide.type === 'externalVideo' && (
        <iframe
          key={slide.embedUrl}
          title={slide.alt || productTitle}
          src={slide.embedUrl}
          className="absolute inset-0 h-full w-full border-0 object-cover"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      )}
    </motion.div>
  )
}

/**
 * Hero: optional **split intro** — first native `video` is full-bleed on its own layer; first image sits underneath;
 * on `ended`, intro slides off left (`x: -100%`) and the image carousel continues. Without a leading video, behavior
 * matches the legacy single-stack carousel (including video-in-carousel with swipe overlay when video is not first).
 */
export function ProductDetailCarousel({
  slides,
  slideIndex,
  goToIndex,
  constraintsRef,
  imageZoom,
  panX,
  panY,
  dragX,
  handleDragEnd,
  handleZoomChange,
  productTitle,
  frameClassName,
  sizes,
}: ProductDetailCarouselProps) {
  const n = slides.length
  const introSlide = slides[0]?.type === 'video' ? slides[0] : null
  const hasSplitIntro = Boolean(introSlide)
  const peekSlide = hasSplitIntro ? slides[1] : undefined
  const current = slides[slideIndex]
  const isImageSlide = current?.type === 'image'
  const showIntroLayer = Boolean(hasSplitIntro && slideIndex === 0)
  const showZoom = isImageSlide && !showIntroLayer

  const [introExiting, setIntroExiting] = useState(false)
  const [introOnlyConsumed, setIntroOnlyConsumed] = useState(false)
  const [videoMountKey, setVideoMountKey] = useState(0)
  const exitAnimStartedRef = useRef(false)
  const prevSlideIndexRef = useRef(slideIndex)
  const lastIntroIdRef = useRef<string | null>(null)

  useEffect(() => {
    const prev = prevSlideIndexRef.current
    prevSlideIndexRef.current = slideIndex

    const id = introSlide?.id ?? null
    if (id !== lastIntroIdRef.current) {
      lastIntroIdRef.current = id
      setIntroExiting(false)
      setIntroOnlyConsumed(false)
      exitAnimStartedRef.current = false
      setVideoMountKey((k) => k + 1)
      return
    }

    if (introSlide && slideIndex === 0 && prev !== 0) {
      setIntroExiting(false)
      setIntroOnlyConsumed(false)
      exitAnimStartedRef.current = false
      setVideoMountKey((k) => k + 1)
    }
  }, [slideIndex, introSlide?.id]) // eslint-disable-line react-hooks/exhaustive-deps -- introSlide?.id only

  const onIntroVideoEnded = () => {
    exitAnimStartedRef.current = true
    setIntroExiting(true)
  }

  const onIntroExitComplete = () => {
    if (!exitAnimStartedRef.current) return
    exitAnimStartedRef.current = false
    setIntroExiting(false)
    if (n > 1) goToIndex(1)
    else setIntroOnlyConsumed(true)
  }

  const onNativeVideoEndedInCarousel = () => {
    if (n <= 1) return
    goToIndex((slideIndex + 1) % n)
  }

  return (
    <div ref={constraintsRef} className={frameClassName}>
      {/* Underlay: first post-intro slide while hero video plays or exits (revealed as intro slides left) */}
      {hasSplitIntro && slideIndex === 0 && !introOnlyConsumed && peekSlide ? (
        <div
          className={cn(
            'absolute inset-0 z-0',
            introExiting ? 'pointer-events-auto' : 'pointer-events-none'
          )}
          aria-hidden={!introExiting}
        >
          {peekSlide.type === 'image' ? (
            <Image
              src={peekSlide.image.url}
              alt={peekSlide.image.altText || productTitle}
              fill
              className="object-cover"
              sizes={sizes}
              draggable={false}
              unoptimized
            />
          ) : peekSlide.type === 'externalVideo' ? (
            <iframe
              title={peekSlide.alt || productTitle}
              src={peekSlide.embedUrl}
              className="absolute inset-0 h-full w-full border-0 object-cover"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : peekSlide.type === 'video' && peekSlide.poster?.url ? (
            <Image
              src={peekSlide.poster.url}
              alt={peekSlide.alt || productTitle}
              fill
              className="object-cover"
              sizes={sizes}
              draggable={false}
              unoptimized
            />
          ) : (
            <div className="h-full w-full bg-neutral-900" />
          )}
        </div>
      ) : null}

      {/* Video-only product: after intro, show poster */}
      {hasSplitIntro && slideIndex === 0 && introOnlyConsumed && introSlide.poster?.url ? (
        <div className="absolute inset-0 z-0">
          <Image
            src={introSlide.poster.url}
            alt={introSlide.alt || productTitle}
            fill
            className="object-cover"
            sizes={sizes}
            draggable={false}
            unoptimized
          />
        </div>
      ) : null}

      {/* Main carousel: split mode when past intro, or non-split full stack */}
      {hasSplitIntro && slideIndex > 0 ? (
        <AnimatePresence initial={false} mode="sync">
          {current && current.type !== 'video' ? (
            <CarouselImageOrEmbed
              key={getCarouselSlideMotionKey(current, slideIndex)}
              slide={current}
              productTitle={productTitle}
              sizes={sizes}
              imageZoom={imageZoom}
              panX={panX}
              panY={panY}
              dragX={dragX}
              n={n}
              handleDragEnd={handleDragEnd}
            />
          ) : current?.type === 'video' ? (
            <motion.div
              key={getCarouselSlideMotionKey(current, slideIndex)}
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="absolute inset-0 z-[1]"
            >
              <ProductCarouselVideoSlide
                sources={current.sources}
                poster={current.poster?.url ?? undefined}
                ariaLabel={current.alt || productTitle}
                onEnded={onNativeVideoEndedInCarousel}
                swipeOverlay
                n={n}
                imageZoom={imageZoom}
                panX={panX}
                panY={panY}
                dragX={dragX}
                handleDragEnd={handleDragEnd}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      ) : !hasSplitIntro && current ? (
        <AnimatePresence initial={false} mode="sync">
          {current.type === 'video' ? (
            <motion.div
              key={getCarouselSlideMotionKey(current, slideIndex)}
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="absolute inset-0"
            >
              <ProductCarouselVideoSlide
                sources={current.sources}
                poster={current.poster?.url ?? undefined}
                ariaLabel={current.alt || productTitle}
                onEnded={onNativeVideoEndedInCarousel}
                swipeOverlay
                n={n}
                imageZoom={imageZoom}
                panX={panX}
                panY={panY}
                dragX={dragX}
                handleDragEnd={handleDragEnd}
              />
            </motion.div>
          ) : (
            <CarouselImageOrEmbed
              key={getCarouselSlideMotionKey(current, slideIndex)}
              slide={current}
              slideIndexForKey={slideIndex}
              productTitle={productTitle}
              sizes={sizes}
              imageZoom={imageZoom}
              panX={panX}
              panY={panY}
              dragX={dragX}
              n={n}
              handleDragEnd={handleDragEnd}
            />
          )}
        </AnimatePresence>
      ) : null}

      {/* Intro hero video (slides off left when finished) */}
      {showIntroLayer && !introOnlyConsumed && introSlide ? (
        <motion.div
          key={videoMountKey}
          className="absolute inset-0 z-[2]"
          initial={false}
          animate={{ x: introExiting ? '-100%' : 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          onAnimationComplete={onIntroExitComplete}
        >
          <ProductCarouselVideoSlide
            sources={introSlide.sources}
            poster={introSlide.poster?.url ?? undefined}
            ariaLabel={introSlide.alt || productTitle}
            onEnded={onIntroVideoEnded}
            swipeOverlay={false}
            n={n}
            imageZoom={imageZoom}
            panX={panX}
            panY={panY}
            dragX={dragX}
            handleDragEnd={handleDragEnd}
          />
        </motion.div>
      ) : null}

      {showZoom ? (
        <button
          type="button"
          onClick={handleZoomChange}
          className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
          aria-label={imageZoom > 1 ? 'Zoom out' : 'Zoom in'}
        >
          {imageZoom > 1 ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
        </button>
      ) : null}
      {n > 1 && (
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goToIndex(i)}
              className={cn(
                'w-[4px] h-[4px] min-w-0 min-h-0 p-0 rounded-full transition-all shrink-0',
                i === slideIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/70'
              )}
              style={{ width: 4, height: 4 }}
              aria-label={`Slide ${i + 1} of ${n}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function ProductDetailThumbnailStrip({
  slides,
  slideIndex,
  goToIndex,
  className,
}: {
  slides: ProductCarouselSlide[]
  slideIndex: number
  goToIndex: (i: number) => void
  className?: string
}) {
  if (slides.length === 0) return null
  return (
    <div className={cn('flex flex-wrap gap-2 mt-4 flex-shrink-0', className)}>
      {slides.map((slide, i) => {
        const thumb = getCarouselSlideThumbnailUrl(slide)
        const isVideo = slide.type !== 'image'
        return (
          <button
            key={slide.id}
            type="button"
            onClick={() => goToIndex(i)}
            className={cn(
              'relative w-14 h-14 rounded-md overflow-hidden flex-shrink-0 border-2 transition-colors',
              i === slideIndex ? 'border-neutral-900 dark:border-white' : 'border-transparent opacity-60 hover:opacity-100'
            )}
          >
            {thumb ? (
              <Image
                src={thumb}
                alt={slide.type === 'image' ? slide.image.altText || `Image ${i + 1}` : `Video ${i + 1}`}
                width={56}
                height={56}
                className="h-full w-full object-cover"
                loading="lazy"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-neutral-200 dark:bg-neutral-700">
                <Play className="h-5 w-5 text-neutral-500 dark:text-neutral-300" aria-hidden fill="currentColor" />
              </div>
            )}
            {isVideo && thumb ? (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
                <Play className="h-5 w-5 text-white drop-shadow-md" fill="currentColor" aria-hidden />
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
