'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import styles from '../landing.module.css'
import { homeV2LandingContent } from '@/content/home-v2-landing'
import { useLandingScrollReveal } from '../hooks/useLandingScrollReveal'

export function ArtistsWall() {
  const { artistsWall, urls } = homeV2LandingContent
  const reveal = useLandingScrollReveal({ rootMargin: '0px 0px -8% 0px' })

  return (
    <section ref={reveal.ref} className={cn(styles.artistsSection, reveal.className)} aria-label="Artists wall">
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
              <Image
                src={t.imageUrl}
                alt={t.name}
                fill
                sizes="(max-width: 960px) 25vw, (max-width: 1440px) 16vw, 220px"
                style={{ objectFit: 'cover' }}
                loading="lazy"
              />
              <div className={styles.tileName}>{t.name}</div>
            </div>
          )
        })}

        <Link href={urls.exploreArtists} className={styles.tileMore}>
          <span className={styles.tileMoreN}>100+</span>
          <span className={styles.tileMoreL}>{artistsWall.ctaLabel}</span>
        </Link>
      </div>
    </section>
  )
}

