'use client'

import Link from 'next/link'
import styles from '../landing.module.css'
import { homeV2LandingContent } from '@/content/home-v2-landing'

export function ArtistsWall() {
  const { artistsWall, urls } = homeV2LandingContent
  return (
    <section className={styles.artistsSection} aria-label="Artists wall">
      <div className={styles.artistsHeader}>
        <div className={styles.eyebrow}>{artistsWall.eyebrow}</div>
        <h2 className={styles.sectionTitle} style={{ marginBottom: 12 }}>
          100+ Artists.
          <br />
          <em>{artistsWall.titleEmphasis}</em>
        </h2>
      </div>

      <div className={styles.wallGrid}>
        {artistsWall.tiles.map((t, idx) => {
          const span2 = idx === 0 || idx === 3 || idx === 7
          return (
            <div className={`${styles.tile} ${span2 ? styles.tileSpan2 : ''}`} key={`${t.name}-${idx}`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- match source HTML behavior */}
              <img src={t.imageUrl} alt={t.name} loading="lazy" />
              <div className={styles.tileName}>{t.name}</div>
            </div>
          )
        })}

        <Link href={urls.experience} className={styles.tileMore}>
          <span className={styles.tileMoreN}>100+</span>
          <span className={styles.tileMoreL}>{artistsWall.ctaLabel}</span>
        </Link>
      </div>
    </section>
  )
}

