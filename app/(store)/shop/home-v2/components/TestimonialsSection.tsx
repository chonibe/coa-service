'use client'

import styles from '../landing.module.css'
import { homeV2LandingContent } from '@/content/home-v2-landing'

export function TestimonialsSection() {
  const { testimonials } = homeV2LandingContent

  return (
    <section className={styles.testimonialsSection} aria-label="Testimonials">
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
            <video autoPlay muted loop playsInline preload="none">
              <source src={v.videoUrl} type="video/mp4" />
            </video>
            <div className={styles.tVidOverlay}>
              <div className={styles.tVidName}>{v.author}</div>
              <div className={styles.tVidQuote}>&quot;{v.quote}&quot;</div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.row2}>
        <div className={styles.tProductCard}>
          {/* eslint-disable-next-line @next/next/no-img-element -- match source HTML behavior */}
          <img src={testimonials.productImageUrl} alt="Street Collector Lamp" loading="lazy" />
        </div>

        {testimonials.images.slice(0, 1).map((img) => (
          <div className={styles.tImgCard} key={img.imageUrl}>
            {/* eslint-disable-next-line @next/next/no-img-element -- match source HTML behavior */}
            <img src={img.imageUrl} alt={img.author} loading="lazy" />
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
            {/* eslint-disable-next-line @next/next/no-img-element -- match source HTML behavior */}
            <img src={img.imageUrl} alt={img.author} loading="lazy" />
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

