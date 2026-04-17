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
      <div className={styles.testimonialsHeader}>
        <div>
          <div className={styles.eyebrow}>{testimonials.eyebrow}</div>
          <h2 className={styles.sectionTitle}>
            Join <em>{testimonials.titleEmphasis}</em>
            <br />
            collectors worldwide.
          </h2>
        </div>
        <div className={styles.ratingWrap}>
          <div className={styles.stars} aria-label="5 stars">
            ★★★★★
          </div>
          <div className={styles.ratingSub}>{testimonials.ratingLabel}</div>
        </div>
      </div>

      <div className={styles.testimonialsGrid}>
        {testimonials.videos.map((v, idx) => (
          <div
            key={`${v.author}-${idx}`}
            className={`${styles.tVidCard} ${idx === 0 ? styles.tVidCardBig : ''}`}
          >
            <LazyTestimonialVideo src={v.videoUrl} />
            <div className={styles.tVidOverlay}>
              <div className={styles.tVidName}>{v.author}</div>
              <div className={styles.tVidQuote}>&quot;{v.quote}&quot;</div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.row2}>
        <div className={styles.tProductCard}>
          <Image
            src={testimonials.productImageUrl}
            alt="Street Collector Lamp"
            fill
            sizes="(max-width: 960px) 50vw, 25vw"
            style={{ objectFit: 'contain', padding: 20 }}
            loading="lazy"
          />
        </div>

        {testimonials.images.slice(0, 1).map((img) => (
          <div className={styles.tImgCard} key={img.imageUrl}>
            <Image
              src={img.imageUrl}
              alt={img.author}
              fill
              sizes="(max-width: 960px) 50vw, 25vw"
              style={{ objectFit: 'cover' }}
              loading="lazy"
            />
            <div className={styles.tImgOverlay}>
              <div className={styles.tImgName}>{img.author}</div>
              <div className={styles.tImgQuote}>&quot;{img.quote}&quot;</div>
            </div>
          </div>
        ))}

        {testimonials.texts.slice(0, 2).map((t) => (
          <div className={styles.tTextCard} key={t.author}>
            <div className={styles.tStars}>★★★★★</div>
            <p className={styles.tQuote}>&quot;{t.quote}&quot;</p>
            <div className={styles.tAuthor}>— {t.author}</div>
          </div>
        ))}
      </div>

      <div className={styles.row2} style={{ marginTop: 3 }}>
        {testimonials.texts.slice(2, 3).map((t) => (
          <div className={styles.tTextCard} key={t.author}>
            <div className={styles.tStars}>★★★★★</div>
            <p className={styles.tQuote}>&quot;{t.quote}&quot;</p>
            <div className={styles.tAuthor}>— {t.author}</div>
          </div>
        ))}

        {testimonials.images.slice(1).map((img) => (
          <div className={styles.tImgCard} key={img.imageUrl}>
            <Image
              src={img.imageUrl}
              alt={img.author}
              fill
              sizes="(max-width: 960px) 50vw, 25vw"
              style={{ objectFit: 'cover' }}
              loading="lazy"
            />
            <div className={styles.tImgOverlay}>
              <div className={styles.tImgName}>{img.author}</div>
              <div className={styles.tImgQuote}>&quot;{img.quote}&quot;</div>
            </div>
          </div>
        ))}

        {testimonials.texts.slice(3, 4).map((t) => (
          <div className={styles.tTextCard} key={t.author}>
            <div className={styles.tStars}>★★★★★</div>
            <p className={styles.tQuote}>&quot;{t.quote}&quot;</p>
            <div className={styles.tAuthor}>— {t.author}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
