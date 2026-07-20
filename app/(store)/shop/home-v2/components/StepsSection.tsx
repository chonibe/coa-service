'use client'

import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import styles from '../landing.module.css'
import { getStorePageContent } from '@/lib/content/site-content'
import { useLandingScrollReveal } from '../hooks/useLandingScrollReveal'
import { useSectionInView } from '@/lib/shop/use-section-in-view'

const homeV2LandingContent = getStorePageContent('homeV2')

export function StepsSection() {
  const { steps } = homeV2LandingContent
  const [activeIndex, setActiveIndex] = useState(0)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const barRef = useRef<HTMLDivElement | null>(null)
  const sectionRef = useRef<HTMLElement | null>(null)
  const inView = useSectionInView(sectionRef, { rootMargin: '120px 0px', threshold: 0.12 })

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
    if (!video || !bar || !inView) return
    bar.style.width = '0%'
    video.load()
    video.play().catch(() => {})
  }, [active.videoUrl, inView])

  const onVideoEnded = () => {
    setActiveIndex((i) => (i + 1) % steps.items.length)
  }

  const reveal = useLandingScrollReveal({ mode: 'stagger', rootMargin: '0px 0px -10% 0px' })

  return (
    <section
      ref={(node) => {
        sectionRef.current = node
        reveal.ref.current = node
      }}
      className={cn(styles.section, reveal.className)}
      id="how-it-works"
      aria-label="How it works"
    >
      <div
        className={cn(styles.sectionHeader, styles.stepsHeader, styles.landingStagger)}
        style={{ '--stagger': 0 } as CSSProperties}
      >
        <div className={styles.eyebrow}>{steps.eyebrow}</div>
        <h2 className={styles.sectionTitle}>
          Real art,
          <br />
          <em>{steps.titleEmphasis}</em>
        </h2>
      </div>

      <div className={styles.stepsGrid}>
        <div
          className={cn(styles.stepsVideoWrap, styles.landingStagger)}
          style={{ '--stagger': 1 } as CSSProperties}
          id="home-v2-step-panel"
          role="tabpanel"
          aria-labelledby={`home-v2-step-tab-${activeIndex}`}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            defaultMuted
            playsInline
            preload="metadata"
            onEnded={onVideoEnded}
            onLoadedMetadata={(e) => {
              const el = e.currentTarget
              el.muted = true
              el.defaultMuted = true
              el.volume = 0
            }}
          >
            {inView ? <source src={active.videoUrl} type="video/mp4" /> : null}
          </video>
          <div className={styles.vidProgressWrap} aria-hidden>
            <div ref={barRef} className={styles.vidProgressBar} />
          </div>
        </div>

        <div
          className={cn(styles.stepsList, styles.landingStagger)}
          style={{ '--stagger': 2 } as CSSProperties}
        >
          <div id="home-v2-step-slide" aria-live="polite">
            <div
              key={activeIndex}
              className={styles.stepsSlide}
              role="group"
              aria-roledescription="slide"
              aria-label={`Step ${activeIndex + 1} of ${steps.items.length}`}
            >
              <span className={styles.stepsSlideNum}>{activeIndex + 1}</span>
              <span className={styles.stepsSlideText}>
                <span className={styles.stepsSlideTitle}>
                  {active.bodyTitle}
                  {active.bodyTitleEmphasis ? (
                    <>
                      {' '}
                      <em>{active.bodyTitleEmphasis}</em>
                    </>
                  ) : null}
                </span>
                <span className={styles.stepsSlideSubtitle}>{active.bodyText}</span>
              </span>
            </div>
          </div>

          <div className={styles.stepsDots} role="tablist" aria-label="Steps">
            {steps.items.map((s, idx) => (
              <button
                key={s.tabTitle}
                type="button"
                id={`home-v2-step-tab-${idx}`}
                role="tab"
                aria-selected={idx === activeIndex}
                aria-controls="home-v2-step-panel home-v2-step-slide"
                aria-label={`Show step ${idx + 1}: ${s.bodyTitle}`}
                className={cn(styles.stepDotBtn, idx === activeIndex && styles.stepDotBtnActive)}
                onClick={() => setActiveIndex(idx)}
              >
                <span className={styles.stepDotIndicator} aria-hidden />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}