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
  const [i0, i1, i2] = testimonials.images
  const [t0, t1, t2, t3] = testimonials.texts

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

      <div className={styles.socialProofGrid}>
        {testimonials.videos.map((v, idx) => (
          <div key={`${v.author}-${idx}`} className={styles.tVidCard}>
            <LazyTestimonialVideo src={v.videoUrl} />
            <div className={styles.tVidOverlay}>
              <div className={styles.tVidName}>{v.author}</div>
              <div className={styles.tVidQuote}>&quot;{v.quote}&quot;</div>
            </div>
          </div>
        ))}

        <div className={cn(styles.tProductCard, styles.socialProofProduct)}>
          <Image
            src={testimonials.productImageUrl}
            alt="Street Collector Lamp"
            fill
            sizes="(max-width: 520px) 100vw, 920px"
            style={{ objectFit: 'contain', padding: 20 }}
            loading="lazy"
          />
        </div>

        {i0 ? (
          <div className={styles.tImgCard} key={i0.imageUrl}>
            <Image
              src={i0.imageUrl}
              alt={i0.author}
              fill
              sizes="(max-width: 520px) 100vw, 440px"
              style={{ objectFit: 'cover' }}
              loading="lazy"
            />
            <div className={styles.tImgOverlay}>
              <div className={styles.tImgName}>{i0.author}</div>
              <div className={styles.tImgQuote}>&quot;{i0.quote}&quot;</div>
            </div>
          </div>
        ) : null}

        {t0 ? (
          <div className={styles.tTextCard} key={t0.author}>
            <div className={styles.tStars}>★★★★★</div>
            <p className={styles.tQuote}>&quot;{t0.quote}&quot;</p>
            <div className={styles.tAuthor}>— {t0.author}</div>
          </div>
        ) : null}

        {t1 ? (
          <div className={styles.tTextCard} key={t1.author}>
            <div className={styles.tStars}>★★★★★</div>
            <p className={styles.tQuote}>&quot;{t1.quote}&quot;</p>
            <div className={styles.tAuthor}>— {t1.author}</div>
          </div>
        ) : null}

        {t2 ? (
          <div className={styles.tTextCard} key={t2.author}>
            <div className={styles.tStars}>★★★★★</div>
            <p className={styles.tQuote}>&quot;{t2.quote}&quot;</p>
            <div className={styles.tAuthor}>— {t2.author}</div>
          </div>
        ) : null}

        {i1 ? (
          <div className={styles.tImgCard} key={i1.imageUrl}>
            <Image
              src={i1.imageUrl}
              alt={i1.author}
              fill
              sizes="(max-width: 520px) 100vw, 440px"
              style={{ objectFit: 'cover' }}
              loading="lazy"
            />
            <div className={styles.tImgOverlay}>
              <div className={styles.tImgName}>{i1.author}</div>
              <div className={styles.tImgQuote}>&quot;{i1.quote}&quot;</div>
            </div>
          </div>
        ) : null}

        {i2 ? (
          <div className={styles.tImgCard} key={i2.imageUrl}>
            <Image
              src={i2.imageUrl}
              alt={i2.author}
              fill
              sizes="(max-width: 520px) 100vw, 440px"
              style={{ objectFit: 'cover' }}
              loading="lazy"
            />
            <div className={styles.tImgOverlay}>
              <div className={styles.tImgName}>{i2.author}</div>
              <div className={styles.tImgQuote}>&quot;{i2.quote}&quot;</div>
            </div>
          </div>
        ) : null}

        {t3 ? (
          <div className={cn(styles.tTextCard, styles.socialProofQuoteSolo)} key={t3.author}>
            <div className={styles.tStars}>★★★★★</div>
            <p className={styles.tQuote}>&quot;{t3.quote}&quot;</p>
            <div className={styles.tAuthor}>— {t3.author}</div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
