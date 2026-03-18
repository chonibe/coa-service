/**
 * Loads Material Symbols font asynchronously so it does not block first paint.
 * Uses media="print" + inline script to switch to "all" when loaded — server component
 * to avoid ChunkLoadError from client chunk in root layout.
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
        data-async-font="material-symbols"
        suppressHydrationWarning
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){function r(){var l=document.querySelector('link[data-async-font="material-symbols"]');if(!l)return;if(l.sheet){l.media='all';return}l.onload=function(){l.media='all';l.onload=null};l.onerror=function(){l.media='all'}}if(document.readyState==='complete')setTimeout(r,0);else window.addEventListener('load',r)})();`,
        }}
      />
      <noscript>
        <link rel="stylesheet" href={FONT_URL} />
      </noscript>
    </>
  )
}
