import { describe, expect, it } from 'vitest'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import {
  buildProductCarouselSlides,
  carouselSlideIsNonImage,
  pickVideoSourceUrl,
  shopifyProgressiveVideoSources,
  shopifyVideoPlaybackUrl,
} from './product-carousel-slides'

describe('pickVideoSourceUrl', () => {
  it('at same width prefers mp4 over mov', () => {
    const url = pickVideoSourceUrl([
      { url: 'https://cdn/a.mov', mimeType: 'video/quicktime', width: 1080, height: 1920, format: 'mov' },
      { url: 'https://cdn/b.mp4', mimeType: 'video/mp4', width: 1080, height: 1920, format: 'mp4' },
    ])
    expect(url).toBe('https://cdn/b.mp4')
  })

  it('falls back to widest source when no mp4 mime match', () => {
    const url = pickVideoSourceUrl([
      { url: 'https://cdn/small', mimeType: 'video/quicktime', width: 360, height: 640, format: 'mov' },
      { url: 'https://cdn/large', mimeType: 'video/quicktime', width: 1080, height: 1920, format: 'mov' },
    ])
    expect(url).toBe('https://cdn/large')
  })
})

describe('shopifyVideoPlaybackUrl', () => {
  it('picks tallest progressive rendition (height beats width ordering)', () => {
    const url = shopifyVideoPlaybackUrl([
      {
        url: 'https://cdn/wide.mp4',
        mimeType: 'video/mp4',
        width: 1920,
        height: 1080,
        format: 'mp4',
      },
      {
        url: 'https://cdn/tall.mp4',
        mimeType: 'video/mp4',
        width: 1080,
        height: 1920,
        format: 'mp4',
      },
    ])
    expect(url).toBe('https://cdn/tall.mp4')
  })

  it('falls back to HLS when no progressive sources', () => {
    const url = shopifyVideoPlaybackUrl([
      {
        url: 'https://cdn/master.m3u8',
        mimeType: 'application/vnd.apple.mpegurl',
        width: 1920,
        height: 1080,
        format: 'm3u8',
      },
    ])
    expect(url).toBe('https://cdn/master.m3u8')
  })
})

describe('shopifyProgressiveVideoSources', () => {
  it('drops m3u8 and keeps mp4 sorted by width', () => {
    const progressive = shopifyProgressiveVideoSources([
      {
        url: 'https://cdn/playlist.m3u8',
        format: 'm3u8',
        mimeType: 'application/vnd.apple.mpegurl',
        width: 1920,
        height: 1080,
      },
      {
        url: 'https://cdn/small.mp4',
        format: 'mp4',
        mimeType: 'video/mp4',
        width: 720,
        height: 1280,
      },
      {
        url: 'https://cdn/large.mp4',
        format: 'mp4',
        mimeType: 'video/mp4',
        width: 1080,
        height: 1920,
      },
    ])
    expect(progressive.map((s) => s.url)).toEqual(['https://cdn/large.mp4', 'https://cdn/small.mp4'])
  })
})

describe('buildProductCarouselSlides', () => {
  it('orders VIDEO before IMAGE when building from media', () => {
    const product = {
      title: 'Lamp',
      media: {
        edges: [
          {
            node: {
              id: 'm1',
              mediaContentType: 'IMAGE' as const,
              image: { url: 'https://img/1.jpg', altText: 'one' },
            },
          },
          {
            node: {
              id: 'm2',
              mediaContentType: 'VIDEO' as const,
              sources: [{ url: 'https://vid/a.mp4', mimeType: 'video/mp4', width: 1080, format: 'mp4' }],
              previewImage: { url: 'https://poster.jpg', altText: 'vid' },
            },
          },
        ],
      },
    } as unknown as ShopifyProduct

    const slides = buildProductCarouselSlides(product)
    expect(slides).toHaveLength(2)
    expect(slides[0]).toMatchObject({
      type: 'video',
      id: 'm2',
      sources: [{ url: 'https://vid/a.mp4', mimeType: 'video/mp4', width: 1080, format: 'mp4' }],
    })
    expect(slides[1]).toMatchObject({ type: 'image', id: 'm1' })
  })

  it('builds external video from embedUrl when embeddedUrl is absent (Storefront API)', () => {
    const product = {
      title: 'Clip',
      media: {
        edges: [
          {
            node: {
              id: 'ev1',
              mediaContentType: 'EXTERNAL_VIDEO' as const,
              host: 'YOUTUBE',
              embedUrl: 'https://www.youtube.com/embed/abc123',
              embeddedUrl: null,
              previewImage: { url: 'https://poster.jpg', altText: 'thumb' },
            },
          },
        ],
      },
    } as unknown as ShopifyProduct

    const slides = buildProductCarouselSlides(product)
    expect(slides).toHaveLength(1)
    expect(slides[0]).toMatchObject({
      type: 'externalVideo',
      id: 'ev1',
    })
    expect((slides[0] as { type: 'externalVideo' }).embedUrl).toContain('youtube.com/embed')
  })

  it('falls back to images when media is empty', () => {
    const product = {
      title: 'Print',
      media: { edges: [] },
      images: {
        edges: [{ node: { url: 'https://only.jpg', altText: 'x' } }],
      },
    } as unknown as ShopifyProduct

    const slides = buildProductCarouselSlides(product)
    expect(slides).toHaveLength(1)
    expect(slides[0]).toMatchObject({ type: 'image' })
    expect((slides[0] as { type: 'image' }).image.url).toBe('https://only.jpg')
  })
})

describe('carouselSlideIsNonImage', () => {
  it('is true for video slides', () => {
    expect(
      carouselSlideIsNonImage({
        type: 'video',
        id: 'v',
        sources: [{ url: 'https://x.mp4', mimeType: 'video/mp4', width: 720, format: 'mp4', height: 1280 }],
        poster: null,
        alt: '',
      })
    ).toBe(true)
  })

  it('is false for image slides', () => {
    expect(
      carouselSlideIsNonImage({
        type: 'image',
        id: 'i',
        image: { url: 'https://x.jpg', altText: '' },
      })
    ).toBe(false)
  })
})
