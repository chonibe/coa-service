'use client'

import type { CSSProperties } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import styles from '../landing.module.css'
import { getStorePageContent } from '@/lib/content/site-content'
import { useLandingScrollReveal } from '../hooks/useLandingScrollReveal'
import { useSectionInView } from '@/lib/shop/use-section-in-view'

const homeV2LandingContent = getStorePageContent('homeV2')

export function MeetTheLamp() {
  const { meetLamp } = homeV2LandingContent
  const [activeIndex, setActiveIndex] = useState(0)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const barRef = useRef<HTMLDivElement | null>(null)
  const sectionRef = useRef<HTMLElement | null>(null)
  const inView = useSectionInView(sectionRef, { rootMargin: '120px 0px', threshold: 0.12 })

  const active = useMemo(() => meetLamp.features[activeIndex] ?? meetLamp.features[0], [meetLamp.features, activeIndex])

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
    setActiveIndex((i) => (i + 1) % meetLamp.features.length)
  }

  const reveal = useLandingScrollReveal({ mode: 'stagger', rootMargin: '0px 0px -12% 0px' })

  return (
    <section
      ref={(node) => {
        sectionRef.current = node
        reveal.ref.current = node
      }}
      className={cn(styles.lampSection, reveal.className)}
      id="meet-the-lamp"
      aria-label="Meet the lamp"
    >
      <div
        className={cn(styles.lampHeader, styles.landingStagger)}
        style={{ '--stagger': 0 } as CSSProperties}
      >
        <div className={styles.eyebrow}>{meetLamp.eyebrow}</div>
        <h2 className={styles.sectionTitle}>
          Built to live
          <br />
          <em>{meetLamp.titleEmphasis}</em>
        </h2>
      </div>

      <div
        className={cn(styles.lampFeature, styles.landingStagger)}
        style={{ '--stagger': 1 } as CSSProperties}
      >
        <div className={styles.lampVideoCol}>
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

        <div className={styles.lampListCol}>
          {meetLamp.features.map((f, idx) => (
            <button
              key={f.title}
              type="button"
              className={`${styles.lampItem} ${idx === activeIndex ? styles.lampItemActive : ''}`}
              onClick={() => setActiveIndex(idx)}
            >
              <span className={styles.lampItemNum}>{String(idx + 1).padStart(2, '0')}</span>
              <span className={styles.lampItemTitle}>{f.title}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
