'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
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

      <div className={styles.artistsBadges}>
        {artistsWall.tiles.map((t, idx) => (
          <div className={styles.artistBadge} key={`${t.name}-${idx}`}>
            <div className={styles.artistBadgeAvatar}>
              <Image
                src={t.imageUrl}
                alt={t.name}
                fill
                sizes="56px"
                style={{ objectFit: 'cover' }}
                loading="lazy"
              />
            </div>
            <span className={styles.artistBadgeName}>{t.name}</span>
          </div>
        ))}

        <Link
          href={urls.exploreArtists}
          className={styles.artistsBadgeMore}
          aria-label={`${artistsWall.ctaLabel} — over 100 artists`}
        >
          <span className={styles.artistsBadgeMoreCircle} aria-hidden>
            <span className={styles.artistsBadgeMoreNum}>100+</span>
          </span>
          <span className={styles.artistsBadgeMoreCaption}>{artistsWall.ctaLabel}</span>
        </Link>
      </div>
    </section>
  )
}
