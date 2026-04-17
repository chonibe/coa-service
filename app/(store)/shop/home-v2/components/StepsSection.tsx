'use client'

import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import styles from '../landing.module.css'
import { homeV2LandingContent } from '@/content/home-v2-landing'
import { useLandingScrollReveal } from '../hooks/useLandingScrollReveal'

export function StepsSection() {
  const { steps } = homeV2LandingContent
  const [activeIndex, setActiveIndex] = useState(0)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const barRef = useRef<HTMLDivElement | null>(null)

  const active = steps.items[activeIndex] ?? steps.items[0]

  useEffect(() => {
    const video = videoRef.current
    const bar = barRef.current
    if (!video || !bar) return

    const onTime = () => {
      if (!video.duration || !Number.isFinite(video.duration)) return
      bar.style.width = `${(video.currentTime / video.duration) * 100}%`
    }

    const onLoaded = () => {
      bar.style.width = '0%'
    }

    video.addEventListener('timeupdate', onTime)
    video.addEventListener('loadedmetadata', onLoaded)
    return () => {
      video.removeEventListener('timeupdate', onTime)
      video.removeEventListener('loadedmetadata', onLoaded)
    }
  }, [activeIndex])

  useEffect(() => {
    const video = videoRef.current
    const bar = barRef.current
    if (!video || !bar) return
    bar.style.width = '0%'
    video.load()
    video.play().catch(() => {})
  }, [active.videoUrl])

  const onVideoEnded = () => {
    setActiveIndex((i) => (i + 1) % steps.items.length)
  }

  const reveal = useLandingScrollReveal({ mode: 'stagger', rootMargin: '0px 0px -10% 0px' })

  return (
    <section
      ref={reveal.ref}
      className={cn(styles.section, reveal.className)}
      id="how-it-works"
      aria-label="How it works"
    >
      <div
        className={cn(styles.sectionHeader, styles.landingStagger)}
        style={{ '--stagger': 0 } as CSSProperties}
      >
        <div className={styles.eyebrow}>{steps.eyebrow}</div>
        <h2 className={styles.sectionTitle}>
          Bringing art into
          <br />
          <em>{steps.titleEmphasis}</em>
        </h2>
      </div>

      <div
        className={cn(styles.stepsTabs, styles.landingStagger)}
        style={{ '--stagger': 1 } as CSSProperties}
        role="tablist"
        aria-label="Steps"
      >
        {steps.items.map((s, idx) => (
          <button
            key={s.tabTitle}
            type="button"
            id={`home-v2-step-tab-${idx}`}
            role="tab"
            aria-selected={idx === activeIndex}
            aria-controls="home-v2-step-panel"
            className={`${styles.stepTab} ${idx === activeIndex ? styles.stepTabActive : ''}`}
            onClick={() => setActiveIndex(idx)}
          >
            <div className={styles.stepTabHeader}>
              <span className={styles.stepNum}>{idx + 1}</span>
              <span className={styles.stepTitle}>{s.tabTitle}</span>
            </div>
          </button>
        ))}
      </div>

      <div
        className={cn(styles.stepContent, styles.landingStagger)}
        style={{ '--stagger': 2 } as CSSProperties}
        role="tabpanel"
        id="home-v2-step-panel"
        aria-labelledby={`home-v2-step-tab-${activeIndex}`}
      >
        <div className={styles.stepVideoWrap}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            preload="none"
            onEnded={onVideoEnded}
          >
            <source src={active.videoUrl} type="video/mp4" />
          </video>
          <div className={styles.vidProgressWrap} aria-hidden>
            <div ref={barRef} className={styles.vidProgressBar} />
          </div>
        </div>

        <div className={styles.stepTextWrap}>
          <h3 className={styles.stepBodyTitle}>
            {active.bodyTitle}
            {active.bodyTitleEmphasis ? (
              <>
                <br />
                <em>{active.bodyTitleEmphasis}</em>
              </>
            ) : null}
          </h3>
          <p className={styles.stepBodyText}>{active.bodyText}</p>
          {active.details.map((d) => (
            <div className={styles.stepDetail} key={d.text}>
              <div className={styles.stepDot} aria-hidden />
              <span style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
                {d.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

