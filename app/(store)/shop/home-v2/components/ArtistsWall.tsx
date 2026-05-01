'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
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

/** Golden-angle spiral — each cell “flies in” from an outer ring toward its slot (hive settle-in). */
function hiveCellStyle(index: number): CSSProperties {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  const theta = index * goldenAngle
  const r = 52 + Math.sqrt(index + 1) * 26
  const tx = Math.round(Math.cos(theta) * r)
  const ty = Math.round(Math.sin(theta) * r)
  return {
    '--hive-tx': `${tx}px`,
    '--hive-ty': `${ty}px`,
    '--hive-i': index,
  } as CSSProperties
}

export function ArtistsWall() {
  const { artistsWall, urls } = homeV2LandingContent
  const reveal = useLandingScrollReveal({ rootMargin: '0px 0px -8% 0px' })
  const hiveRootRef = useRef<HTMLDivElement>(null)
  const [hiveVisible, setHiveVisible] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  const videos = [...new Set(artistsWall.carouselVideos ?? [])]

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReducedMotion(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (reducedMotion) {
      setHiveVisible(true)
      return
    }
    const el = hiveRootRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          setHiveVisible(true)
          obs.unobserve(e.target)
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [reducedMotion])

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

      <div
        ref={hiveRootRef}
        className={cn(
          styles.artistsBadges,
          styles.artistsHiveRoot,
          hiveVisible && styles.artistsHiveVisible,
          reducedMotion && styles.artistsHiveInstant
        )}
      >
        {artistsWall.tiles.map((t, idx) => (
          <div
            className={cn(styles.artistBadge, styles.artistBadgeHive)}
            key={`${t.name}-${idx}`}
            style={hiveCellStyle(idx)}
          >
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
          className={cn(styles.artistsBadgeMore, styles.artistBadgeHive)}
          style={hiveCellStyle(artistsWall.tiles.length)}
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
