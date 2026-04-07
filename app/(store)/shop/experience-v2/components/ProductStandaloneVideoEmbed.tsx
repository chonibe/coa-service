'use client'

import { useEffect, useRef, useState } from 'react'
import type { ShopifyVideo, ShopifyVideoSource } from '@/lib/shopify/storefront-client'
import { cn } from '@/lib/utils'
import type { ProductCarouselSlide } from '@/lib/shop/product-carousel-slides'
import { shopifyMimeTypeForPlaybackUrl, shopifyVideoPlaybackUrl } from '@/lib/shop/product-carousel-slides'

/** Same defer + `preload` pattern as `components/sections/VideoPlayer.tsx` for Shopify file URLs. */
function HomeStyleProgressiveVideo({
  url,
  poster,
  ariaLabel,
  className,
  deferLoadMs = 250,
  reelMutedAutoplay = false,
}: {
  url: string
  poster?: string
  ariaLabel: string
  className?: string
  /** Match hero `VideoPlayer` poster-first behavior; use `0` to attach `src` immediately. */
  deferLoadMs?: number
  /** Experience reel: muted + loop; programmatic play when visible (no `pause()` fight). */
  reelMutedAutoplay?: boolean
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

  useEffect(() => {
    if (!reelMutedAutoplay || !videoLoadStarted) return
    const el = videoRef.current
    if (!el) return
    const tryPlay = () => void el.play().catch(() => {})
    el.addEventListener('canplay', tryPlay)
    /**
     * Do not `pause()` when `isIntersecting` is false with a high threshold: the video can be
     * on-screen but below the ratio (e.g. 15% visible), which fights `play()` and leaves controls stuck at 0:00.
     * Only nudge playback when a meaningful portion is visible; never auto-pause (user / page scroll handles it).
     */
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.08) tryPlay()
        }
      },
      { threshold: [0, 0.08, 0.15, 0.35] }
    )
    io.observe(el)
    tryPlay()
    return () => {
      io.disconnect()
      el.removeEventListener('canplay', tryPlay)
    }
  }, [reelMutedAutoplay, videoLoadStarted, url])

  return (
    <video
      ref={videoRef}
      className={className}
      src={videoLoadStarted ? url : undefined}
      poster={poster}
      controls
      playsInline
      muted={reelMutedAutoplay}
      loop={reelMutedAutoplay}
      preload={deferLoadMs <= 0 ? (reelMutedAutoplay ? 'auto' : 'metadata') : 'none'}
      aria-label={ariaLabel}
    />
  )
}

function isPlaybackUrlHls(url: string): boolean {
  return /\.m3u8(\?|$)/i.test(url) || (url.includes('m3u8') && !/\.mp4(\?|$)/i.test(url))
}

/** Matches `components/sections/VideoPlayer.tsx`: defer src, `preload="none"`, `onLoadedData` + muted `play()`, force-mute on `volumechange`. No IntersectionObserver. */
const REEL_GALLERY_DEFER_MS = 250

function ReelGalleryProgressiveVideo({
  sources,
  playbackUrl,
  posterUrl,
  ariaLabel,
  className,
}: {
  sources: ShopifyVideo['sources']
  playbackUrl: string
  posterUrl?: string | null
  ariaLabel: string
  className?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const sourceType = shopifyMimeTypeForPlaybackUrl(sources, playbackUrl)

  const [videoLoadStarted, setVideoLoadStarted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setVideoLoadStarted(true)
      videoRef.current?.load?.()
    }, REEL_GALLERY_DEFER_MS)
    return () => clearTimeout(t)
  }, [playbackUrl])

  useEffect(() => {
    const el = videoRef.current
    if (!el || !videoLoadStarted) return
    el.muted = true
    const forceMute = () => {
      el.muted = true
    }
    el.addEventListener('volumechange', forceMute)
    return () => el.removeEventListener('volumechange', forceMute)
  }, [videoLoadStarted])

  return (
    <video
      ref={videoRef}
      className={cn('bg-black', className)}
      src={videoLoadStarted ? playbackUrl : undefined}
      poster={posterUrl ?? undefined}
      preload="none"
      autoPlay
      loop
      muted
      playsInline
      controls
      disablePictureInPicture
      controlsList="nodownload nofullscreen noremoteplayback"
      aria-label={ariaLabel}
      onLoadedData={(e) => {
        const el = e.currentTarget
        el.muted = true
        void el.play().catch(() => {})
      }}
    >
      {videoLoadStarted && <source src={playbackUrl} type={sourceType} />}
    </video>
  )
}

/** HLS for reel: same attach logic as {@link HlsOrSingleUrlVideo} but home-style play (no IO). */
function ReelGalleryHlsVideo({
  playbackUrl,
  poster,
  ariaLabel,
  className,
}: {
  playbackUrl: string
  poster?: string
  ariaLabel: string
  className?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<{ destroy: () => void } | null>(null)
  const url = playbackUrl

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
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!cancelled && videoRef.current === el) {
            el.muted = true
            void el.play().catch(() => {})
          }
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

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    el.muted = true
    const forceMute = () => {
      el.muted = true
    }
    el.addEventListener('volumechange', forceMute)
    return () => el.removeEventListener('volumechange', forceMute)
  }, [url])

  if (!url) return null

  return (
    <video
      ref={videoRef}
      className={cn('bg-black', className)}
      poster={poster}
      preload="metadata"
      autoPlay
      loop
      muted
      playsInline
      controls
      disablePictureInPicture
      controlsList="nodownload nofullscreen noremoteplayback"
      aria-label={ariaLabel}
      onLoadedData={(e) => {
        const el = e.currentTarget
        el.muted = true
        void el.play().catch(() => {})
      }}
    />
  )
}

/**
 * Experience vertical reel only: mirrors `VideoPlayer` loading/playback (defer, `onLoadedData`, muted autoplay).
 * Use instead of `ShopifyInlineVideo` there so stacking and scroll observers do not fight native controls.
 */
export function ExperienceReelGalleryVideo({
  sources,
  posterUrl,
  ariaLabel,
  className,
}: {
  sources: ShopifyVideo['sources']
  posterUrl?: string | null
  ariaLabel: string
  className?: string
}) {
  const playbackUrl = shopifyVideoPlaybackUrl(sources)
  if (!playbackUrl) return null
  if (isPlaybackUrlHls(playbackUrl)) {
    return (
      <ReelGalleryHlsVideo
        playbackUrl={playbackUrl}
        poster={posterUrl ?? undefined}
        ariaLabel={ariaLabel}
        className={className}
      />
    )
  }
  return (
    <ReelGalleryProgressiveVideo
      sources={sources}
      playbackUrl={playbackUrl}
      posterUrl={posterUrl}
      ariaLabel={ariaLabel}
      className={className}
    />
  )
}

function HlsOrSingleUrlVideo({
  sources: _sources,
  poster,
  ariaLabel,
  className,
  reelMutedAutoplay = false,
  /** Must match the URL chosen by {@link shopifyVideoPlaybackUrl} (same branch as parent). */
  playbackUrl,
}: {
  sources: ShopifyVideoSource[]
  poster?: string
  ariaLabel: string
  className?: string
  reelMutedAutoplay?: boolean
  playbackUrl: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<{ destroy: () => void } | null>(null)
  const url = playbackUrl

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
        if (reelMutedAutoplay) {
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (!cancelled && videoRef.current === el) void el.play().catch(() => {})
          })
        }
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
  }, [url, reelMutedAutoplay])

  useEffect(() => {
    if (!reelMutedAutoplay) return
    const el = videoRef.current
    if (!el) return
    const tryPlay = () => void el.play().catch(() => {})
    el.addEventListener('canplay', tryPlay)
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.08) tryPlay()
        }
      },
      { threshold: [0, 0.08, 0.15, 0.35] }
    )
    io.observe(el)
    return () => {
      io.disconnect()
      el.removeEventListener('canplay', tryPlay)
    }
  }, [reelMutedAutoplay, url])

  if (!url) return null

  return (
    <video
      ref={videoRef}
      className={cn('w-full max-h-[min(50dvh,460px)] bg-black object-contain', className)}
      controls
      playsInline
      muted={reelMutedAutoplay}
      loop={reelMutedAutoplay}
      preload={reelMutedAutoplay ? 'auto' : 'metadata'}
      poster={poster}
      aria-label={ariaLabel}
    />
  )
}

function youtubeEmbedUrl(raw: string): string | null {
  try {
    const absolute = raw.startsWith('//') ? `https:${raw}` : raw.startsWith('http') ? raw : `https://${raw}`
    const u = new URL(absolute)
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('/')[0]
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v) return `https://www.youtube.com/embed/${v}`
      const m = u.pathname.match(/^\/embed\/([^/?]+)/)
      if (m) return `https://www.youtube.com/embed/${m[1]}`
      const shorts = u.pathname.match(/^\/shorts\/([^/?]+)/)
      if (shorts) return `https://www.youtube.com/embed/${shorts[1]}`
    }
  } catch {
    /* ignore */
  }
  return null
}

function vimeoEmbedUrl(raw: string): string | null {
  try {
    const absolute = raw.startsWith('//') ? `https:${raw}` : raw.startsWith('http') ? raw : `https://${raw}`
    const u = new URL(absolute)
    if (!u.hostname.includes('vimeo.com')) return null
    const m = u.pathname.match(/\/(?:video\/)?(\d+)/)
    return m ? `https://player.vimeo.com/video/${m[1]}` : null
  } catch {
    return null
  }
}

/**
 * Shopify native video for inline `<video>`: full `sources` (HLS via hls.js / Safari, progressive MP4/MOV/WebM).
 * Prefer this over passing a single URL into {@link ArtistCollectionVideoEmbed} so reel / PDP match playback behavior.
 */
export function ShopifyInlineVideo({
  sources,
  posterUrl,
  ariaLabel,
  className,
  variant = 'default',
}: {
  sources: ShopifyVideo['sources']
  posterUrl?: string | null
  ariaLabel: string
  className?: string
  /** `reelMutedAutoplay`: experience vertical reel — muted loop autoplay + in-view play. */
  variant?: 'default' | 'reelMutedAutoplay'
}) {
  const playbackUrl = shopifyVideoPlaybackUrl(sources)
  if (!playbackUrl) return null
  const reelMutedAutoplay = variant === 'reelMutedAutoplay'
  if (isPlaybackUrlHls(playbackUrl)) {
    return (
      <HlsOrSingleUrlVideo
        sources={sources}
        playbackUrl={playbackUrl}
        poster={posterUrl ?? undefined}
        ariaLabel={ariaLabel}
        className={className}
        reelMutedAutoplay={reelMutedAutoplay}
      />
    )
  }
  return (
    <HomeStyleProgressiveVideo
      url={playbackUrl}
      poster={posterUrl ?? undefined}
      ariaLabel={ariaLabel}
      deferLoadMs={0}
      className={className}
      reelMutedAutoplay={reelMutedAutoplay}
    />
  )
}

/**
 * Collection metafield `custom.video`: YouTube/Vimeo → iframe; Shopify/direct file → &lt;video&gt; (incl. HLS when needed).
 */
export function ArtistCollectionVideoEmbed({
  url,
  title,
  className,
}: {
  url: string
  title: string
  className?: string
}) {
  const trimmed = url.trim()
  if (!trimmed) return null

  const yt = youtubeEmbedUrl(trimmed)
  if (yt) {
    return (
      <div
        className={cn(
          'aspect-video w-full overflow-hidden rounded-xl bg-black shadow-inner ring-1 ring-black/10 dark:ring-white/10',
          className
        )}
      >
        <iframe
          title={title}
          src={yt}
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    )
  }

  const vm = vimeoEmbedUrl(trimmed)
  if (vm) {
    return (
      <div
        className={cn(
          'aspect-video w-full overflow-hidden rounded-xl bg-black shadow-inner ring-1 ring-black/10 dark:ring-white/10',
          className
        )}
      >
        <iframe
          title={title}
          src={vm}
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    )
  }

  const syntheticSources = [{ url: trimmed, format: isPlaybackUrlHls(trimmed) ? 'm3u8' : 'mp4' }] as ShopifyVideo['sources']

  return (
    <div
      className={cn(
        'aspect-video w-full overflow-hidden rounded-xl bg-black shadow-inner ring-1 ring-black/10 dark:ring-white/10',
        className
      )}
    >
      <ShopifyInlineVideo
        sources={syntheticSources}
        ariaLabel={title}
        className="h-full w-full object-contain"
      />
    </div>
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
              <ShopifyInlineVideo
                sources={slide.sources}
                posterUrl={slide.poster?.url}
                ariaLabel={label}
                className="mx-auto block w-full max-h-[min(50dvh,460px)] object-contain"
              />
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
