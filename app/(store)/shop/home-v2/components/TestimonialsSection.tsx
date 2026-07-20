'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import styles from '../landing.module.css'
import { getStorePageContent } from '@/lib/content/site-content'
import type { ReviewRatingSummary } from '@/lib/shop/format-review-rating-label'
import { formatReviewRatingLabel } from '@/lib/shop/format-review-rating-label'
import { useLandingScrollReveal } from '../hooks/useLandingScrollReveal'

const homeV2LandingContent = getStorePageContent('homeV2')

/** Tighter on mobile so Lighthouse scroll does not prefetch every reel. */
function testimonialRootMargin(): string {
  if (typeof window === 'undefined') return '0px'
  return window.matchMedia('(max-width: 767px)').matches ? '0px 0px' : '80px 0px'
}

type LazyTestimonialVideoProps = {
  src: string
  poster?: string
  className?: string
  preferPlay?: boolean
}

/**
 * Mounts a muted autoplay video only when close to the viewport.
 * Pauses when it scrolls away so we don't have 5 decoders running
 * simultaneously on mobile. Poster is optional progressive enhancement.
 */
function LazyTestimonialVideo({ src, poster, className, preferPlay = true }: LazyTestimonialVideoProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [inView, setInView] = useState(false)
  const [rootMargin, setRootMargin] = useState('0px 0px')

  useEffect(() => {
    setRootMargin(testimonialRootMargin())
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) setInView(e.isIntersecting)
      },
      { rootMargin, threshold: 0.01 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [rootMargin])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = true
    video.defaultMuted = true
    video.volume = 0
    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', '')
    if (inView && preferPlay) {
      const attempt = () => {
        if (video.paused) void video.play().catch(() => {})
      }
      attempt()
      requestAnimationFrame(attempt)
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
          defaultMuted
          loop
          playsInline
          preload="metadata"
          poster={poster}
          onLoadedMetadata={(e) => {
            const el = e.currentTarget
            el.muted = true
            el.defaultMuted = true
            el.volume = 0
          }}
          onLoadedData={(e) => {
            const el = e.currentTarget
            el.muted = true
            if (preferPlay && el.paused) void el.play().catch(() => {})
          }}
          onCanPlay={(e) => {
            const el = e.currentTarget
            el.muted = true
            if (preferPlay && el.paused) void el.play().catch(() => {})
          }}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        >
          <source src={src} type="video/mp4" />
        </video>
      ) : poster ? (
        // eslint-disable-next-line @next/next/no-img-element -- lightweight poster until video mounts
        <img src={poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div
          aria-hidden
          style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(145deg, #1a1818 0%, #2a2424 100%)',
          }}
        />
      )}
    </div>
  )
}

export type TestimonialsSectionProps = {
  reviewSummary?: ReviewRatingSummary | null
}

export function TestimonialsSection({ reviewSummary = null }: TestimonialsSectionProps) {
  const { testimonials } = homeV2LandingContent
  const reveal = useLandingScrollReveal({ rootMargin: '0px 0px -6% 0px' })
  const featuredImage = testimonials.images.find((img) => img.featured)
  const photoGridImages = testimonials.images.filter((img) => !img.featured)
  const ratingLabel = formatReviewRatingLabel(reviewSummary) ?? testimonials.ratingLabel
  const ariaRating = formatReviewRatingLabel(reviewSummary)
    ? ratingLabel
    : `Collector reviews. ${testimonials.ratingLabel}`

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
              Seen in <em>{testimonials.titleEmphasis}</em>
              <br />
              collector homes.
            </h2>
          </div>
          <div className={styles.tmoTrustPill} aria-label={ariaRating}>
            <div className={styles.tmoTrustStars} aria-hidden>
              ★★★★★
            </div>
            <div className={styles.tmoTrustSub}>{ratingLabel}</div>
          </div>
        </div>

        <div className={styles.tmoVideoRail} role="list">
          {testimonials.videos.map((v, idx) => (
            <article key={`${v.author}-${idx}`} className={styles.tmoVideoCell} role="listitem">
              <div className={styles.tmoVideoFrame}>
                <LazyTestimonialVideo
                  src={v.videoUrl}
                  poster={v.posterUrl}
                  className={styles.tmoVideoMedia}
                />
              </div>
              <div className={styles.tmoVideoCaption}>
                <div className={styles.tmoVideoAuthor}>{v.author}</div>
                <p className={styles.tmoVideoQuote}>&quot;{v.quote}&quot;</p>
              </div>
            </article>
          ))}
        </div>

        {featuredImage ? (
          <aside className={styles.tmoFeaturedStory}>
            <h3 id="tmo-featured-quote-heading" className="sr-only">
              Featured collector note — {featuredImage.author}
            </h3>
            <figure className={styles.tmoFeaturedPhoto}>
              <Image
                src={featuredImage.imageUrl}
                alt={`Photo shared by collector ${featuredImage.author}`}
                fill
                sizes="(max-width: 900px) 100vw, 420px"
                style={{ objectFit: 'cover' }}
                loading="lazy"
              />
            </figure>
            <blockquote className={styles.tmoFeaturedBlockquote}>
              <p className={styles.tmoFeaturedQuoteText}>&ldquo;{featuredImage.quote}&rdquo;</p>
              <footer className={styles.tmoFeaturedByline}>— {featuredImage.author}</footer>
            </blockquote>
          </aside>
        ) : null}

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
            {photoGridImages.map((img) => (
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
