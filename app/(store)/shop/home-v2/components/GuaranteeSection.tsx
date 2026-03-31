'use client'

import styles from '../landing.module.css'
import { homeV2LandingContent } from '@/content/home-v2-landing'

export function GuaranteeSection() {
  return (
    <div className={styles.guarantee} role="region" aria-label="Guarantee">
      {homeV2LandingContent.guarantee.map((g) => (
        <div className={styles.gItem} key={g.title}>
          <span className={styles.gIcon} aria-hidden>
            {g.icon}
          </span>
          <h3 className={styles.gTitle}>{g.title}</h3>
          <p className={styles.gBody}>{g.body}</p>
        </div>
      ))}
    </div>
  )
}

