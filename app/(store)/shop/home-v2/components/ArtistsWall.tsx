'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import styles from '../landing.module.css'
import { getStorePageContent } from '@/lib/content/site-content'
import { useLandingScrollReveal } from '../hooks/useLandingScrollReveal'

const homeV2LandingContent = getStorePageContent('homeV2')

function forceVideoMuted(el: HTMLVideoElement) {
  el.defaultMuted = true
  el.muted = true
  el.volume = 0
}

/**
 * Muted in-view autoplay for the artists marquee.
 * iOS/Safari only autoplays when muted + playsInline; React's `muted` attr alone
 * is not enough — we set properties before play() and retry on canplay.
 */
function ArtistsCarouselVideo({ src }: { src: string }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const inViewRef = useRef(false)
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const video = videoRef.current
    if (!wrap || !video) return

    forceVideoMuted(video)
    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', '')

    const clearPauseTimer = () => {
      if (pauseTimerRef.current == null) return
      clearTimeout(pauseTimerRef.current)
      pauseTimerRef.current = null
    }

    const tryMutedPlay = () => {
      if (!inViewRef.current) return
      forceVideoMuted(video)
      if (!video.paused) return
      const attempt = () => {
        if (!inViewRef.current || !video.paused) return
        forceVideoMuted(video)
        void video.play().catch(() => {})
      }
      attempt()
      requestAnimationFrame(attempt)
    }

    const onVolumeChange = () => forceVideoMuted(video)
    const onReady = () => tryMutedPlay()

    video.addEventListener('volumechange', onVolumeChange)
    video.addEventListener('loadeddata', onReady)
    video.addEventListener('canplay', onReady)

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          inViewRef.current = e.isIntersecting
          if (e.isIntersecting) {
            // Marquee transform can briefly dip below threshold; cancel pending pause.
            clearPauseTimer()
            tryMutedPlay()
          } else {
            // Debounce pause so play() isn't aborted mid-start on mobile.
            clearPauseTimer()
            pauseTimerRef.current = setTimeout(() => {
              if (!inViewRef.current) video.pause()
            }, 180)
          }
        }
      },
      { root: null, threshold: 0.15, rootMargin: '64px 0px' }
    )
    obs.observe(wrap)

    return () => {
      clearPauseTimer()
      obs.disconnect()
      video.removeEventListener('volumechange', onVolumeChange)
      video.removeEventListener('loadeddata', onReady)
      video.removeEventListener('canplay', onReady)
    }
  }, [])

  return (
    <div ref={wrapRef} className={styles.artistsVideoSlide} data-artists-slide>
      <video
        ref={videoRef}
        className={styles.artistsVideoEl}
        autoPlay
        muted
        defaultMuted
        loop
        playsInline
        preload="metadata"
        aria-hidden
        onLoadedMetadata={(e) => forceVideoMuted(e.currentTarget)}
        onLoadedData={(e) => {
          const el = e.currentTarget
          forceVideoMuted(el)
          if (inViewRef.current && el.paused) {
            void el.play().catch(() => {})
          }
        }}
        onCanPlay={(e) => {
          const el = e.currentTarget
          forceVideoMuted(el)
          if (inViewRef.current && el.paused) {
            void el.play().catch(() => {})
          }
        }}
      >
        <source src={src} type="video/mp4" />
      </video>
    </div>
  )
}

export function ArtistsWall() {
  const { artistsWall, urls } = homeV2LandingContent
  const reveal = useLandingScrollReveal({ rootMargin: '0px 0px -8% 0px' })

  const videos = [...new Set(artistsWall.carouselVideos ?? [])]

  return (
    <section ref={reveal.ref} className={cn(styles.artistsSection, reveal.className)} aria-label="Artists wall">
      <div className={styles.artistsHeader}>
        <div className={styles.eyebrow}>{artistsWall.eyebrow}</div>
        <h2 className={styles.sectionTitle} style={{ marginBottom: 12 }}>
          100+ Artists.
          <br />
          <em>{artistsWall.titleEmphasis}</em>
        </h2>
      </div>

      {videos.length > 0 ? (
        <div
          className={styles.artistsCarouselWrap}
          role="region"
          aria-labelledby="artists-carousel-label"
        >
          <p id="artists-carousel-label" className="sr-only">
            Short films from artists in the collection glide by automatically; hover over the ribbon to pause.
          </p>
          <div className={styles.artistsCarouselMarquee}>
            <div className={styles.artistsCarouselMarqueeTrack}>
              {videos.map((src, idx) => (
                <ArtistsCarouselVideo key={`a-${idx}-${src.slice(-24)}`} src={src} />
              ))}
              {videos.map((src, idx) => (
                <ArtistsCarouselVideo key={`b-${idx}-${src.slice(-24)}`} src={src} />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className={styles.artistsCtaRow}>
        <Link href={urls.exploreArtists} className={styles.btnOutline}>
          {artistsWall.ctaLabel}
        </Link>
      </div>
    </section>
  )
}
