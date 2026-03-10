'use client'

/**
 * Loads Material Symbols font asynchronously so it does not block first paint.
 * Uses media="print" + onload to switch to "all" so the font loads async without
 * preload (avoids "preloaded but not used" warning when icons are below the fold).
 */
const FONT_URL =
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap'

export function AsyncMaterialSymbolsFont() {
  return (
    <>
      <link
        rel="stylesheet"
        href={FONT_URL}
        media="print"
        // @ts-expect-error - onLoad exists for async stylesheet pattern
        onLoad={(e: React.SyntheticEvent<HTMLLinkElement>) => {
          const link = e.currentTarget
          link.onload = null
          link.media = 'all'
        }}
      />
      <noscript>
        <link rel="stylesheet" href={FONT_URL} />
      </noscript>
    </>
  )
}
