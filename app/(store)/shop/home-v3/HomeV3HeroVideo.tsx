'use client'

type HomeV3HeroVideoProps = {
  src: string
  poster?: string
}

function forceMuted(el: HTMLVideoElement) {
  el.muted = true
  el.defaultMuted = true
  el.volume = 0
}

/** Client-only muted autoplay hero — keeps event handlers off the server page. */
export function HomeV3HeroVideo({ src, poster }: HomeV3HeroVideoProps) {
  return (
    <video
      autoPlay
      muted
      defaultMuted
      loop
      playsInline
      preload="metadata"
      poster={poster}
      onLoadedMetadata={(e) => forceMuted(e.currentTarget)}
      onPlay={(e) => forceMuted(e.currentTarget)}
    >
      <source src={src} type="video/mp4" />
    </video>
  )
}
