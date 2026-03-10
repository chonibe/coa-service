'use client'

/**
 * Loads Material Symbols font asynchronously so it does not block first paint.
 * Uses rel="preload" as="style" with onload to apply — fully non-render-blocking.
 */
const FONT_URL =
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap'

export function AsyncMaterialSymbolsFont() {
  return (
    <>
      <link
        rel="preload"
        href={FONT_URL}
        as="style"
        // @ts-expect-error - onLoad exists on link for this pattern
        onLoad={(e: React.SyntheticEvent<HTMLLinkElement>) => {
          const link = e.currentTarget
          link.onload = null
          link.rel = 'stylesheet'
        }}
      />
      <noscript>
        <link rel="stylesheet" href={FONT_URL} />
      </noscript>
    </>
  )
}
