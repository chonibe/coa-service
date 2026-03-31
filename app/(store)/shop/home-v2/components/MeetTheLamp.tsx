'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import styles from '../landing.module.css'
import { homeV2LandingContent } from '@/content/home-v2-landing'

export function MeetTheLamp() {
  const { meetLamp } = homeV2LandingContent
  const [activeIndex, setActiveIndex] = useState(0)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const barRef = useRef<HTMLDivElement | null>(null)

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
    if (!video || !bar) return
    bar.style.width = '0%'
    // force reload on src change
    video.load()
    video.play().catch(() => {})
  }, [active.videoUrl])

  const onVideoEnded = () => {
    setActiveIndex((i) => (i + 1) % meetLamp.features.length)
  }

  return (
    <section className={styles.lampSection} id="meet-the-lamp" aria-label="Meet the lamp">
      <div className={styles.lampHeader}>
        <div className={styles.eyebrow}>{meetLamp.eyebrow}</div>
        <h2 className={styles.sectionTitle}>
          Designed for
          <br />
          <em>{meetLamp.titleEmphasis}</em>
        </h2>
      </div>

      <div className={styles.lampFeature}>
        <div className={styles.lampVideoCol}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={onVideoEnded}
          >
            <source src={active.videoUrl} type="video/mp4" />
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

