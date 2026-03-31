"use client"

import Link from 'next/link'
import styles from '../landing.module.css'
import { homeV2LandingContent } from '@/content/home-v2-landing'

export function FinalCta() {
  const { finalCta, urls } = homeV2LandingContent
  return (
    <section className={styles.final} aria-label="Final call to action">
      <div className={styles.finalBg} aria-hidden>
        {finalCta.backgroundImages.map((src, idx) => (
          // eslint-disable-next-line @next/next/no-img-element -- match source HTML behavior
          <img key={`${src}-${idx}`} src={src} alt="" />
        ))}
      </div>

      <div className={styles.finalInner}>
        <h2 className={styles.finalTitle}>
          Your room deserves
          <br />
          <em>{finalCta.titleEmphasis}</em>
        </h2>
        <p className={styles.finalSub}>{finalCta.subtitle}</p>
        <div className={styles.finalBtns}>
          <Link href={urls.experience} className={styles.btnPrimary} style={{ marginBottom: 0 }}>
            {finalCta.primaryCta}
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
          <Link href={urls.experience} className={styles.btnOutline}>
            {finalCta.secondaryCta}
          </Link>
        </div>
      </div>
    </section>
  )
}

