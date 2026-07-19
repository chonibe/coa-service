'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from '../landing.module.css'
import { homeV2LandingContent } from '@/content/home-v2-landing'
import { formatTrustStatCount } from '@/lib/shop/trust-stat-placeholders'
import type { ReviewRatingSummary } from '@/lib/shop/format-review-rating-label'
import {
  formatReviewCountStatLabel,
  formatReviewStarStat,
} from '@/lib/shop/format-review-rating-label'

function getVideoType(url: string): string {
  return url.toLowerCase().includes('.mov') ? 'video/quicktime' : 'video/mp4'
}

export type LandingHeroProps = {
  reviewSummary?: ReviewRatingSummary | null
}

export function LandingHero({ reviewSummary = null }: LandingHeroProps) {
  const { hero } = homeV2LandingContent
  const [animated, setAnimated] = useState(false)
  const starStat = formatReviewStarStat(reviewSummary)
  const reviewCountLabel = formatReviewCountStatLabel(reviewSummary)

  const stats = hero.stats.map((s) => {
    if (s.label !== 'Rated') return s
    if (starStat && reviewCountLabel) {
      return { ...s, fixedText: starStat, label: reviewCountLabel }
    }
    return s
  })

  const statTargets = stats.map((s) => s.target ?? null)
  const statFloors = stats.map((s) => s.target ?? 0)
  const [values, setValues] = useState<number[]>(() => [...statFloors])

  useEffect(() => {
    if (animated) return
    setAnimated(true)

    const els = document.querySelectorAll('[data-counter]')
    const duration = 1600

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const idx = Number((e.target as HTMLElement).dataset.counterIndex ?? -1)
          const target = statTargets[idx]
          const floor = statFloors[idx] ?? 0
          if (!target) {
            obs.unobserve(e.target)
            continue
          }
          const start = performance.now()
          const step = (now: number) => {
            const p = Math.min((now - start) / duration, 1)
            const ease = 1 - Math.pow(1 - p, 3)
            const val = Math.max(floor, Math.round(ease * target))
            setValues((prev) => {
              const next = [...prev]
              next[idx] = val
              return next
            })
            if (p < 1) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
          obs.unobserve(e.target)
        }
      },
      { threshold: 0.5 }
    )

    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [animated, statFloors, statTargets])

  return (
    <section className={styles.hero} aria-label="Hero">
      <div className={styles.heroContent}>
        <div className={styles.heroEyebrow}>{hero.eyebrow}</div>
        <h1
          className={styles.heroH1}
          // HTML is authored content (from the original file), used only for <br> + <em>
          dangerouslySetInnerHTML={{ __html: hero.headlineHtml }}
        />
        {hero.description.trim() ? (
          <p className={styles.heroDesc}>{hero.description}</p>
        ) : null}
        <p className={styles.heroPricing}>
          Lamp from <strong>{hero.pricingLine.lampFrom}</strong> · Artworks from{' '}
          <strong>{hero.pricingLine.artworksFrom}</strong>
        </p>
        <Link href={homeV2LandingContent.urls.experience} className={styles.btnPrimary}>
          {hero.ctaText}
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>

        <div className={styles.heroStats}>
          {stats.map((s, i) => {
            const text = s.fixedText
              ? s.fixedText
              : s.target
                ? `${formatTrustStatCount(values[i])}${s.suffix ?? ''}`
                : ''
            return (
              <div className={styles.stat} key={`${s.label}-${i}`}>
                <span
                  className={styles.statN}
                  data-counter
                  data-counter-index={i}
                  aria-label={s.label}
                >
                  {text}
                </span>
                <span className={styles.statL}>{s.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className={styles.heroVisual} aria-hidden>
        <video
          className={styles.heroVideo}
          autoPlay
          muted
          defaultMuted
          loop
          playsInline
          preload="metadata"
          poster={hero.videoPosterUrl}
          onLoadedMetadata={(e) => {
            const el = e.currentTarget
            el.muted = true
            el.defaultMuted = true
            el.volume = 0
          }}
        >
          <source src={hero.videoUrl} type={getVideoType(hero.videoUrl)} />
        </video>
      </div>
    </section>
  )
}
