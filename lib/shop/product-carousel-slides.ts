import type {
  ShopifyImage,
  ShopifyMedia,
  ShopifyProduct,
  ShopifyVideo,
  ShopifyVideoSource,
} from '@/lib/shopify/storefront-client'

/** Fixed intro clip for Street Lamp product detail carousel (Shopify CDN). */
export const STREET_LAMP_DETAIL_VIDEO_MP4 =
  'https://cdn.shopify.com/videos/c/o/v/31c5dad6392e4b9ca171bd093c1f1074.mp4'

const STREET_LAMP_INTRO_VIDEO_SOURCE: ShopifyVideoSource = {
  url: STREET_LAMP_DETAIL_VIDEO_MP4,
  mimeType: 'video/mp4',
  format: 'mp4',
  width: 1920,
  height: 1080,
}

/** First carousel slide for experience lamp detail: muted autoplay loop (rendered in {@link ProductDetailCarousel}). */
export function buildStreetLampIntroCarouselSlide(productTitle: string): ProductCarouselSlide {
  return {
    type: 'video',
    id: 'street-lamp-detail-intro',
    sources: [STREET_LAMP_INTRO_VIDEO_SOURCE],
    poster: null,
    alt: `${productTitle.trim() || 'Street Lamp'} preview`,
  }
}

export type ProductCarouselSlide =
  | { type: 'image'; id: string; image: ShopifyImage }
  | { type: 'video'; id: string; sources: ShopifyVideoSource[]; poster: ShopifyImage | null; alt: string }
  | { type: 'externalVideo'; id: string; embedUrl: string; poster: ShopifyImage | null; alt: string }

function isMp4LikeSource(s: ShopifyVideoSource): boolean {
  const f = (s.format || '').toLowerCase()
  if (f === 'mov' || f === 'webm') return true
  return (
    /mp4/i.test(s.mimeType || '') ||
    /mp4/i.test(s.format || '') ||
    /\.mp4(\?|$)/i.test(s.url) ||
    /\.mov(\?|$)/i.test(s.url) ||
    /\.webm(\?|$)/i.test(s.url) ||
    /quicktime/i.test(s.mimeType || '') ||
    /webm/i.test(s.mimeType || '')
  )
}

function isHlsLikeSource(s: ShopifyVideoSource): boolean {
  return (
    /\.m3u8(\?|$)/i.test(s.url) ||
    /mpegurl|m3u8|hls/i.test(s.mimeType || '') ||
    /m3u8|hls/i.test(s.format || '')
  )
}

function isDefinitelyShopifyHls(s: ShopifyVideoSource): boolean {
  const f = (s.format || '').toLowerCase()
  return f === 'm3u8' || /\.m3u8(\?|$)/i.test(s.url)
}

/** MOV/QuickTime often fails in Chrome/Firefox `<video>`; prefer MP4/WebM when Shopify ships both. */
function isMovLikeSource(s: ShopifyVideoSource): boolean {
  const f = (s.format || '').toLowerCase()
  if (f === 'mov') return true
  if (/\.mov(\?|$)/i.test(s.url)) return true
  if (/quicktime/i.test(s.mimeType || '')) return true
  return false
}

/**
 * Shopify-hosted `Video.sources`: `format` is typically `mp4`, `m3u8`, or `mov`.
 * Use these in `<video><source/></video>` (widest first). Never mix m3u8 into this list.
 */
export function shopifyProgressiveVideoSources(sources: ShopifyVideoSource[]): ShopifyVideoSource[] {
  const formatRank = (s: ShopifyVideoSource) => {
    const f = (s.format || '').toLowerCase()
    if (f === 'mp4') return 3
    if (f === 'webm') return 2
    if (f === 'mov') return 1
    return 0
  }
  return sources
    .filter((s) => !isDefinitelyShopifyHls(s))
    .filter((s) => {
      const f = (s.format || '').toLowerCase()
      if (f === 'mp4' || f === 'mov' || f === 'webm') return true
      return isMp4LikeSource(s)
    })
    .sort((a, b) => {
      const w = (b.width || 0) - (a.width || 0)
      if (w !== 0) return w
      return formatRank(b) - formatRank(a)
    })
}

/** Widest HLS playlist when Shopify only/aditionally ships `format: m3u8`. */
export function shopifyHlsPlaylistUrl(sources: ShopifyVideoSource[]): string | null {
  const candidates = sources.filter((s) => isDefinitelyShopifyHls(s) || isHlsLikeSource(s))
  return candidates.sort((a, b) => (b.width || 0) - (a.width || 0))[0]?.url ?? null
}

/** `type` for `<source>` — avoid wrong types that make the browser skip the URL. */
export function shopifyVideoSourceTypeAttr(s: ShopifyVideoSource): string | undefined {
  const mime = s.mimeType?.trim()
  if (mime) return mime
  const f = (s.format || '').toLowerCase()
  if (f === 'mp4') return 'video/mp4'
  if (f === 'mov') return 'video/quicktime'
  if (f === 'webm') return 'video/webm'
  return undefined
}

/** Prefer widest progressive URL, else HLS playlist, else any source. */
export function pickVideoSourceUrl(sources: ShopifyVideo['sources']): string | null {
  if (!sources?.length) return null
  const progressive = shopifyProgressiveVideoSources(sources)
  if (progressive[0]?.url) return progressive[0].url
  const hls = shopifyHlsPlaylistUrl(sources)
  if (hls) return hls
  const byWidth = [...sources].sort((a, b) => (b.width || 0) - (a.width || 0))
  return byWidth[0]?.url ?? null
}

/**
 * Storefront `Video.sources` entry used for playback (same rules as {@link shopifyVideoPlaybackUrl}).
 * Use for intrinsic width/height → CSS `aspect-ratio` in the experience reel.
 */
export function shopifyPlaybackVideoSource(sources: ShopifyVideo['sources']): ShopifyVideoSource | null {
  if (!sources?.length) return null
  const progressive = shopifyProgressiveVideoSources(sources)
  if (progressive.length > 0) {
    const webFriendly = progressive.filter((s) => !isMovLikeSource(s))
    const pool = webFriendly.length > 0 ? webFriendly : progressive
    return pool.reduce((a, b) => ((b.height || 0) > (a.height || 0) ? b : a), pool[0])
  }
  const url = pickVideoSourceUrl(sources)
  if (!url) return null
  const exact = sources.find((s) => s.url === url)
  if (exact) return exact
  return [...sources].sort((a, b) => (b.width || 0) - (a.width || 0))[0] ?? null
}

/**
 * Same idea as PDP `ProductGallery` native video: pick **one** progressive file by **tallest height**
 * (not width-sorted `<source>` lists). If there is no MP4/MOV/WebM, fall back to HLS / `pickVideoSourceUrl`.
 */
export function shopifyVideoPlaybackUrl(sources: ShopifyVideo['sources']): string | null {
  return shopifyPlaybackVideoSource(sources)?.url ?? null
}

/**
 * Progressive file URLs to try in order (tallest height first). Same pool as {@link shopifyPlaybackVideoSource}
 * (prefers non-MOV when Shopify lists both). Use when the first URL fails decode or network in strict browsers.
 */
export function shopifyProgressivePlaybackCandidateUrls(sources: ShopifyVideo['sources']): string[] {
  if (!sources?.length) return []
  const progressive = shopifyProgressiveVideoSources(sources)
  if (!progressive.length) return []
  const webFriendly = progressive.filter((s) => !isMovLikeSource(s))
  const pool = webFriendly.length > 0 ? webFriendly : progressive
  const sorted = [...pool].sort((a, b) => (b.height || 0) - (a.height || 0))
  const seen = new Set<string>()
  const out: string[] = []
  for (const s of sorted) {
    const u = s.url
    if (!u || seen.has(u)) continue
    seen.add(u)
    out.push(u)
  }
  return out
}

/** MIME for a Shopify CDN file URL when Storefront did not send `mimeType` (home `VideoPlayer` uses the same idea for `<source type>`). */
export function shopifyProgressiveVideoMimeTypeFromUrl(url: string): string {
  const path = url.split(/[?#]/)[0]?.toLowerCase() ?? ''
  if (path.endsWith('.webm')) return 'video/webm'
  if (path.endsWith('.mov')) return 'video/quicktime'
  return 'video/mp4'
}

/** Prefer Storefront `mimeType` / `format` for the chosen URL; else infer from file extension. */
export function shopifyMimeTypeForPlaybackUrl(
  sources: ShopifyVideo['sources'],
  playbackUrl: string
): string {
  const match = sources.find((s) => s.url === playbackUrl)
  const fromMeta = match ? shopifyVideoSourceTypeAttr(match) : undefined
  if (fromMeta) return fromMeta
  return shopifyProgressiveVideoMimeTypeFromUrl(playbackUrl)
}

function appendAutoplayToExternalEmbed(url: string): string {
  try {
    const absolute = url.startsWith('//') ? `https:${url}` : url
    const u = new URL(absolute)
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      if (!u.searchParams.has('autoplay')) u.searchParams.set('autoplay', '1')
      u.searchParams.set('mute', '1')
      u.searchParams.set('playsinline', '1')
      return u.toString()
    }
    if (u.hostname.includes('vimeo.com')) {
      if (!u.searchParams.has('autoplay')) u.searchParams.set('autoplay', '1')
      if (!u.searchParams.has('muted')) u.searchParams.set('muted', '1')
      return u.toString()
    }
  } catch {
    /* ignore */
  }
  return url
}

export function getExternalEmbedUrlForCarousel(url: string): string {
  return appendAutoplayToExternalEmbed(url)
}

/** Thumbnail for strip / dots context (poster for video). */
export function getCarouselSlideThumbnailUrl(slide: ProductCarouselSlide): string | null {
  if (slide.type === 'image') return slide.image.url
  return slide.poster?.url ?? null
}

export function getCarouselSlideMotionKey(slide: ProductCarouselSlide, slideIndex: number): string {
  if (slide.type === 'image') return `${slideIndex}-${slide.image.url}`
  if (slide.type === 'video')
    return `${slideIndex}-v-${slide.id}-${slide.sources.map((s) => s.url).join('|')}`
  return `${slideIndex}-ev-${slide.embedUrl}`
}

/** Native / external video slides first, then images; order within each group follows Shopify media order. */
function prioritizeVideoSlidesFirst(slides: ProductCarouselSlide[]): ProductCarouselSlide[] {
  const videos: ProductCarouselSlide[] = []
  const images: ProductCarouselSlide[] = []
  for (const s of slides) {
    if (s.type === 'image') images.push(s)
    else videos.push(s)
  }
  return [...videos, ...images]
}

/**
 * Prefer `product.media` (images + native / external video). Video slides are ordered before images.
 * Falls back to `images` + featured.
 */
export function buildProductCarouselSlides(product: ShopifyProduct): ProductCarouselSlide[] {
  const title = product.title || 'Product'
  const mediaEdges = product.media?.edges

  if (mediaEdges && mediaEdges.length > 0) {
    const out: ProductCarouselSlide[] = []
    for (const edge of mediaEdges) {
      const node = edge?.node as ShopifyMedia | undefined
      if (!node) continue

      if (node.mediaContentType === 'IMAGE' && 'image' in node && node.image?.url) {
        out.push({ type: 'image', id: node.id, image: node.image })
        continue
      }
      if (node.mediaContentType === 'VIDEO' && 'sources' in node) {
        if (node.sources?.length) {
          out.push({
            type: 'video',
            id: node.id,
            sources: node.sources,
            poster: node.previewImage ?? null,
            alt: node.previewImage?.altText || title,
          })
        } else if (node.previewImage?.url) {
          out.push({ type: 'image', id: node.id, image: node.previewImage })
        }
        continue
      }
      if (node.mediaContentType === 'EXTERNAL_VIDEO') {
        const ev = node
        const raw = ev.embedUrl?.trim() || ev.embeddedUrl?.trim() || ''
        if (raw) {
          out.push({
            type: 'externalVideo',
            id: node.id,
            embedUrl: getExternalEmbedUrlForCarousel(raw),
            poster: node.previewImage ?? null,
            alt: node.previewImage?.altText || title,
          })
        }
        continue
      }
      if (
        node.mediaContentType === 'MODEL_3D' &&
        'previewImage' in node &&
        node.previewImage?.url
      ) {
        out.push({ type: 'image', id: node.id, image: node.previewImage })
      }
    }
    if (out.length > 0) return prioritizeVideoSlidesFirst(out)
  }

  const fromImages = product.images?.edges?.map((e) => e.node).filter(Boolean) as ShopifyImage[] | undefined
  const list =
    fromImages && fromImages.length > 0
      ? fromImages
      : product.featuredImage
        ? [product.featuredImage]
        : []
  return list.map((image, i) => ({
    type: 'image' as const,
    id: `fallback-img-${i}-${image.url}`,
    image,
  }))
}

export function carouselSlideIsNonImage(slide: ProductCarouselSlide | undefined): boolean {
  return Boolean(slide && slide.type !== 'image')
}

/** Split Shopify carousel slides so video (native + external embed) can live outside the image swipe carousel. */
export function splitProductCarouselMediaSlides(slides: ProductCarouselSlide[]): {
  videoSlides: ProductCarouselSlide[]
  imageSlides: ProductCarouselSlide[]
} {
  const videoSlides: ProductCarouselSlide[] = []
  const imageSlides: ProductCarouselSlide[] = []
  for (const s of slides) {
    if (s.type === 'image') imageSlides.push(s)
    else videoSlides.push(s)
  }
  return { videoSlides, imageSlides }
}
