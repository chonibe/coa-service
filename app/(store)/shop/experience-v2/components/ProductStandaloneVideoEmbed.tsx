'use client'

import { useEffect, useRef, useState } from 'react'
import type { ShopifyVideo, ShopifyVideoSource } from '@/lib/shopify/storefront-client'
import { cn } from '@/lib/utils'
import type { ProductCarouselSlide } from '@/lib/shop/product-carousel-slides'
import {
  pickVideoSourceUrl,
  shopifyMimeTypeForPlaybackUrl,
  shopifyVideoPlaybackUrl,
} from '@/lib/shop/product-carousel-slides'

/** Same defer + `preload="none"` + typed `<source>` pattern as `components/sections/VideoPlayer.tsx` for Shopify file URLs. */
function HomeStyleProgressiveVideo({
  url,
  sources,
  poster,
  ariaLabel,
  className,
  deferLoadMs = 250,
}: {
  url: string
  sources: ShopifyVideo['sources']
  poster?: string
  ariaLabel: string
  className?: string
  /** Match hero `VideoPlayer` poster-first behavior; use `0` to attach `src` immediately. */
  deferLoadMs?: number
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoLoadStarted, setVideoLoadStarted] = useState(deferLoadMs <= 0)

  useEffect(() => {
    if (deferLoadMs <= 0) {
      setVideoLoadStarted(true)
      return
    }
    setVideoLoadStarted(false)
    const t = setTimeout(() => {
      setVideoLoadStarted(true)
      videoRef.current?.load?.()
    }, deferLoadMs)
    return () => clearTimeout(t)
  }, [deferLoadMs, url])

  const mime = shopifyMimeTypeForPlaybackUrl(sources, url)

  return (
    <video
      ref={videoRef}
      className={className}
      src={videoLoadStarted ? url : undefined}
      poster={poster}
      controls
      playsInline
      preload="none"
      aria-label={ariaLabel}
    >
      {videoLoadStarted && <source src={url} type={mime} />}
    </video>
  )
}

function isPlaybackUrlHls(url: string): boolean {
  return /\.m3u8(\?|$)/i.test(url) || (url.includes('m3u8') && !/\.mp4(\?|$)/i.test(url))
}

function HlsOrSingleUrlVideo({
  sources,
  poster,
  ariaLabel,
  className,
}: {
  sources: ShopifyVideoSource[]
  poster?: string
  ariaLabel: string
  className?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<{ destroy: () => void } | null>(null)
  const url = pickVideoSourceUrl(sources as ShopifyVideo['sources'])

  useEffect(() => {
    const el = videoRef.current
    if (!el || !url) return

    let cancelled = false
    hlsRef.current?.destroy()
    hlsRef.current = null

    const isM3u8 =
      /\.m3u8(\?|$)/i.test(url) || (url.includes('m3u8') && !/\.mp4(\?|$)/i.test(url))
    const nativeHls =
      el.canPlayType('application/vnd.apple.mpegurl') !== '' ||
      el.canPlayType('application/x-mpegURL') !== ''

    if (isM3u8 && nativeHls) {
      el.src = url
      el.load()
    } else if (isM3u8) {
      void import('hls.js').then(({ default: Hls }) => {
        if (cancelled || videoRef.current !== el) return
        if (!Hls.isSupported()) {
          el.src = url
          el.load()
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
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal || cancelled || videoRef.current !== el) return
          try {
            hls.destroy()
          } catch {
            /* ignore */
          }
          hlsRef.current = null
          el.src = url
          el.load()
        })
        hls.loadSource(url)
        hls.attachMedia(el)
      })
    } else {
      el.src = url
      el.load()
    }

    return () => {
      cancelled = true
      hlsRef.current?.destroy()
      hlsRef.current = null
      el.pause()
      el.removeAttribute('src')
      while (el.firstChild) el.removeChild(el.firstChild)
      el.load()
    }
  }, [url])

  if (!url) return null

  return (
    <video
      ref={videoRef}
      className={cn('w-full max-h-[min(50dvh,460px)] bg-black object-contain', className)}
      controls
      playsInline
      preload="metadata"
      poster={poster}
      aria-label={ariaLabel}
    />
  )
}

/**
 * Product video **outside** the swipe carousel: plain &lt;video&gt; / iframe only (browser handles playback).
 */
export function ProductStandaloneVideoEmbed({
  videoSlides,
  productTitle,
  className,
}: {
  videoSlides: ProductCarouselSlide[]
  productTitle: string
  className?: string
}) {
  if (videoSlides.length === 0) return null

  return (
    <div className={cn('flex w-full flex-col gap-3', className)}>
      {videoSlides.map((slide) => {
        if (slide.type === 'video') {
          const label = slide.alt || productTitle
          const playbackUrl = shopifyVideoPlaybackUrl(slide.sources)
          if (!playbackUrl) return null
          return (
            <div
              key={`${slide.id}-${playbackUrl}`}
              className="overflow-hidden rounded-xl bg-black shadow-inner ring-1 ring-black/10 dark:ring-white/10"
            >
              {isPlaybackUrlHls(playbackUrl) ? (
                <HlsOrSingleUrlVideo
                  sources={slide.sources}
                  poster={slide.poster?.url ?? undefined}
                  ariaLabel={label}
                  className="mx-auto block"
                />
              ) : (
                <HomeStyleProgressiveVideo
                  url={playbackUrl}
                  sources={slide.sources}
                  poster={slide.poster?.url ?? undefined}
                  ariaLabel={label}
                  className="mx-auto block w-full max-h-[min(50dvh,460px)] object-contain"
                />
              )}
            </div>
          )
        }
        if (slide.type === 'externalVideo') {
          return (
            <div
              key={slide.id}
              className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-inner ring-1 ring-black/10 dark:ring-white/10"
            >
              <iframe
                title={slide.alt || productTitle}
                src={slide.embedUrl}
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          )
        }
        return null
      })}
    </div>
  )
}
