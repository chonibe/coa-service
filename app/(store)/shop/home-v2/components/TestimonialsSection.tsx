'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import styles from '../landing.module.css'
import { homeV2LandingContent } from '@/content/home-v2-landing'
import { useLandingScrollReveal } from '../hooks/useLandingScrollReveal'

type LazyTestimonialVideoProps = {
  src: string
  poster?: string
  className?: string
  preferPlay?: boolean
}

/**
 * Mounts a muted autoplay video only when close to the viewport.
 * Pauses when it scrolls away so we don't have 5 decoders running
 * simultaneously on mobile.
 */
function LazyTestimonialVideo({ src, poster, className, preferPlay = true }: LazyTestimonialVideoProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) setInView(e.isIntersecting)
      },
      { rootMargin: '200px 0px', threshold: 0.01 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (inView && preferPlay) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [inView, preferPlay])

  return (
    <div ref={containerRef} className={className} style={{ width: '100%', height: '100%' }}>
      {inView ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        >
          <source src={src} type="video/mp4" />
        </video>
      ) : poster ? (
        // eslint-disable-next-line @next/next/no-img-element -- placeholder poster while video is not mounted
        <img src={poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : null}
    </div>
  )
}

export function TestimonialsSection() {
  const { testimonials } = homeV2LandingContent
  const reveal = useLandingScrollReveal({ rootMargin: '0px 0px -6% 0px' })

  return (
    <section
      ref={reveal.ref}
      className={cn(styles.testimonialsSection, reveal.className)}
      aria-label="Testimonials"
    >
      <div className={styles.tmoInner}>
        <div className={styles.testimonialsHeader}>
          <div>
            <div className={styles.eyebrow}>{testimonials.eyebrow}</div>
            <h2 className={styles.sectionTitle}>
              Join <em>{testimonials.titleEmphasis}</em>
              <br />
              collectors worldwide.
            </h2>
          </div>
          <div
            className={styles.tmoTrustPill}
            aria-label={`5 out of 5 stars. ${testimonials.ratingLabel}`}
          >
            <div className={styles.tmoTrustStars} aria-hidden>
              ★★★★★
            </div>
            <div className={styles.tmoTrustSub}>{testimonials.ratingLabel}</div>
          </div>
        </div>

        <div className={styles.tmoVideoRail} role="list">
          {testimonials.videos.map((v, idx) => (
            <article key={`${v.author}-${idx}`} className={styles.tmoVideoCell} role="listitem">
              <div className={styles.tmoVideoFrame}>
                <LazyTestimonialVideo src={v.videoUrl} className={styles.tmoVideoMedia} />
              </div>
              <div className={styles.tmoVideoCaption}>
                <div className={styles.tmoVideoAuthor}>{v.author}</div>
                <p className={styles.tmoVideoQuote}>&quot;{v.quote}&quot;</p>
              </div>
            </article>
          ))}
        </div>

        <div className={styles.tmoProductBand}>
          <div className={styles.tmoProductVisual}>
            <Image
              src={testimonials.productImageUrl}
              alt="Street Collector Lamp"
              fill
              sizes="(max-width: 520px) 90vw, 420px"
              style={{ objectFit: 'contain', padding: '12px 16px' }}
              loading="lazy"
            />
          </div>
        </div>

        <div className={styles.tmoSplit}>
          <div className={styles.tmoReviewsCol}>
            {testimonials.texts.map((t) => (
              <blockquote key={t.author} className={styles.tmoReviewCard}>
                <div className={styles.tmoReviewStars} aria-hidden>
                  ★★★★★
                </div>
                <p className={styles.tmoReviewBody}>&quot;{t.quote}&quot;</p>
                <footer className={styles.tmoReviewByline}>— {t.author}</footer>
              </blockquote>
            ))}
          </div>

          <div className={styles.tmoPhotosCol}>
            {testimonials.images.map((img) => (
              <figure key={img.imageUrl} className={styles.tmoPhotoCard}>
                <Image
                  src={img.imageUrl}
                  alt={`Collector photo — ${img.author}`}
                  fill
                  sizes="(max-width: 900px) 100vw, 520px"
                  style={{ objectFit: 'cover' }}
                  loading="lazy"
                />
                <figcaption className={styles.tmoPhotoCaption}>
                  <span className={styles.tmoPhotoAuthor}>{img.author}</span>
                  <span className={styles.tmoPhotoQuote}>&quot;{img.quote}&quot;</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
