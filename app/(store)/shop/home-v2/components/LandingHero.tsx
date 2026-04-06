'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import styles from '../landing.module.css'
import { homeV2LandingContent } from '@/content/home-v2-landing'

function formatCounter(value: number): string {
  if (value >= 1000) {
    // match the original: 3000 -> "3,000"
    return `${Math.round(value / 1000)},000`
  }
  return String(value)
}

export function LandingHero() {
  const { hero } = homeV2LandingContent
  const [animated, setAnimated] = useState(false)
  const [values, setValues] = useState<number[]>(() =>
    hero.stats.map((s) => (s.target ? 0 : 0))
  )

  const statTargets = useMemo(
    () => hero.stats.map((s) => s.target ?? null),
    [hero.stats]
  )

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
          if (!target) {
            obs.unobserve(e.target)
            continue
          }
          const start = performance.now()
          const step = (now: number) => {
            const p = Math.min((now - start) / duration, 1)
            const ease = 1 - Math.pow(1 - p, 3)
            const val = Math.round(ease * target)
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
  }, [animated, statTargets])

  return (
    <section className={styles.hero} aria-label="Hero">
      <div className={styles.heroMedia} aria-hidden>
        <video autoPlay muted loop playsInline preload="auto">
          <source src={hero.videoUrl} type="video/mp4" />
        </video>
      </div>

      <div className={styles.heroContent}>
        <div className={styles.heroEyebrow}>{hero.eyebrow}</div>
        <h1
          className={styles.heroH1}
          // HTML is authored content (from the original file), used only for <br> + <em>
          dangerouslySetInnerHTML={{ __html: hero.headlineHtml }}
        />
        <p className={styles.heroDesc}>{hero.description}</p>
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
          {hero.stats.map((s, i) => {
            const text = s.fixedText
              ? s.fixedText
              : s.target
                ? `${formatCounter(values[i])}${s.suffix ?? ''}`
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
    </section>
  )
}

