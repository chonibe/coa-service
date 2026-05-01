'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import styles from '../landing.module.css'
import { homeV2LandingContent } from '@/content/home-v2-landing'
import { useLandingScrollReveal } from '../hooks/useLandingScrollReveal'

function ArtistsCarouselVideo({ src }: { src: string }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const video = videoRef.current
    if (!wrap || !video) return

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            video.play().catch(() => {})
          } else {
            video.pause()
          }
        }
      },
      { root: null, threshold: 0.45 }
    )
    obs.observe(wrap)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={wrapRef} className={styles.artistsVideoSlide} data-artists-slide>
      <video
        ref={videoRef}
        className={styles.artistsVideoEl}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden
      >
        <source src={src} type="video/mp4" />
      </video>
    </div>
  )
}

export function ArtistsWall() {
  const { artistsWall, urls } = homeV2LandingContent
  const reveal = useLandingScrollReveal({ rootMargin: '0px 0px -8% 0px' })
  const trackRef = useRef<HTMLDivElement>(null)

  const scrollCarousel = useCallback((dir: -1 | 1) => {
    const track = trackRef.current
    if (!track) return
    const slide = track.querySelector<HTMLElement>('[data-artists-slide]')
    const gap = 12
    const step = (slide?.offsetWidth ?? Math.min(track.clientWidth * 0.82, 380)) + gap
    track.scrollBy({ left: dir * step, behavior: 'smooth' })
  }, [])

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
        <div className={styles.artistsCarouselWrap}>
          <p id="artists-carousel-label" className="sr-only">
            Swipe or use arrows to browse short films from artists in the collection.
          </p>
          <button
            type="button"
            className={`${styles.artistsCarouselBtn} ${styles.artistsCarouselBtnPrev}`}
            aria-controls="artists-carousel-track"
            aria-label="Previous artist video"
            onClick={() => scrollCarousel(-1)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div
            ref={trackRef}
            id="artists-carousel-track"
            className={styles.artistsCarouselTrack}
            role="region"
            aria-labelledby="artists-carousel-label"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') {
                e.preventDefault()
                scrollCarousel(-1)
              }
              if (e.key === 'ArrowRight') {
                e.preventDefault()
                scrollCarousel(1)
              }
            }}
          >
            {videos.map((src) => (
              <ArtistsCarouselVideo key={src} src={src} />
            ))}
          </div>
          <button
            type="button"
            className={`${styles.artistsCarouselBtn} ${styles.artistsCarouselBtnNext}`}
            aria-controls="artists-carousel-track"
            aria-label="Next artist video"
            onClick={() => scrollCarousel(1)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      ) : null}

      <div className={styles.wallGrid}>
        {artistsWall.tiles.map((t, idx) => {
          const span2 = idx === 0 || idx === 3 || idx === 7
          return (
            <div className={`${styles.tile} ${span2 ? styles.tileSpan2 : ''}`} key={`${t.name}-${idx}`}>
              <Image
                src={t.imageUrl}
                alt={t.name}
                fill
                sizes="(max-width: 960px) 25vw, (max-width: 1440px) 16vw, 220px"
                style={{ objectFit: 'cover' }}
                loading="lazy"
              />
              <div className={styles.tileName}>{t.name}</div>
            </div>
          )
        })}

        <Link href={urls.exploreArtists} className={styles.tileMore}>
          <span className={styles.tileMoreN}>100+</span>
          <span className={styles.tileMoreL}>{artistsWall.ctaLabel}</span>
        </Link>
      </div>
    </section>
  )
}
