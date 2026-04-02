'use client'

import styles from './artist-profile.module.css'

type Props = {
  handle: string
  profileUrl: string
}

/**
 * Instagram profile “preview” via the official profile embed URL.
 * Meta may show a login wall or a simplified grid depending on cookies and account settings;
 * there is no supported server-side API for a full in-page profile without Instagram Login.
 */
export function InstagramProfileEmbed({ handle, profileUrl }: Props) {
  const embedSrc = `https://www.instagram.com/${encodeURIComponent(handle)}/embed/`

  return (
    <div className={styles.igEmbedWrap}>
      <iframe
        title={`Instagram profile @${handle}`}
        src={embedSrc}
        className={styles.igEmbedFrame}
        loading="lazy"
        allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <p className={styles.igEmbedFootnote}>
        Can&apos;t see the feed?{' '}
        <a href={profileUrl} target="_blank" rel="noopener noreferrer">
          Open @{handle} on Instagram
        </a>
        {' '}— Instagram may ask you to log in inside the preview.
      </p>
    </div>
  )
}
