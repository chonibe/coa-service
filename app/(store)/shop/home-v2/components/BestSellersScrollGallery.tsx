'use client'

import { useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { Gem } from 'lucide-react'
import { cn, formatPriceCompact } from '@/lib/utils'
import { buildExperienceUrl } from '@/lib/shop/collector-route-helpers'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import styles from '../landing.module.css'
import { getStorePageContent } from '@/lib/content/site-content'
import { useLandingScrollReveal } from '../hooks/useLandingScrollReveal'

const homeV2LandingContent = getStorePageContent('homeV2')

export type BestSellerGalleryItem = {
  product: ShopifyProduct
  artistSlug: string | null
  priceUsd: number
  nextEditionNumber: number | null
  editionTotal: number | null
}

type BestSellersScrollGalleryProps = {
  items: BestSellerGalleryItem[]
}

export function BestSellersScrollGallery({ items }: BestSellersScrollGalleryProps) {
  const { bestSellers } = homeV2LandingContent
  const reveal = useLandingScrollReveal({ rootMargin: '0px 0px -8% 0px' })
  const scrollRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const didDragRef = useRef(false)
  const pointerIdRef = useRef<number | null>(null)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)

  const scrollByDir = useCallback((dir: -1 | 1) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.72), behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const clearDrag = () => {
      if (isDraggingRef.current) {
        window.setTimeout(() => {
          didDragRef.current = false
        }, 0)
      }
      isDraggingRef.current = false
      pointerIdRef.current = null
    }

    const onPointerUp = () => {
      clearDrag()
    }

    const onPointerCancel = () => {
      clearDrag()
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current || !scrollRef.current) return
      if (pointerIdRef.current !== e.pointerId) return
      if (Math.abs(e.clientX - startXRef.current) > 5) didDragRef.current = true
      e.preventDefault()
      const walk = (e.clientX - startXRef.current) * 1.2
      scrollRef.current.scrollLeft = scrollLeftRef.current - walk
    }

    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerCancel)
    window.addEventListener('pointermove', onPointerMove, { passive: false })

    return () => {
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerCancel)
      window.removeEventListener('pointermove', onPointerMove)
    }
  }, [])

  if (items.length === 0) return null

  return (
    <section
      ref={reveal.ref}
      className={cn(styles.bestSellersSection, reveal.className)}
      aria-labelledby="home-best-sellers-heading"
    >
      <div className={styles.bestSellersHeader}>
        <div>
          <div className={styles.eyebrow}>{bestSellers.eyebrow}</div>
          <h2 id="home-best-sellers-heading" className={styles.sectionTitle} style={{ marginBottom: 12 }}>
            {bestSellers.title}.
            <br />
            <em>{bestSellers.titleEmphasis}</em>
          </h2>
        </div>
        <div className={styles.bestSellersHeaderActions}>
          <Link href={bestSellers.viewAllHref} className={styles.btnOutline}>
            {bestSellers.viewAllLabel}
          </Link>
          <div className={styles.bestSellersScrollControls} aria-hidden>
            <button
              type="button"
              className={styles.bestSellersScrollBtn}
              onClick={() => scrollByDir(-1)}
              aria-label="Scroll artworks left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={styles.bestSellersScrollBtn}
              onClick={() => scrollByDir(1)}
              aria-label="Scroll artworks right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className={styles.bestSellersScroll}
        role="list"
        aria-label="Best selling artworks"
        onPointerDown={(e) => {
          if (!scrollRef.current) return
          if (e.pointerType === 'touch') return
          isDraggingRef.current = true
          didDragRef.current = false
          pointerIdRef.current = e.pointerId
          startXRef.current = e.clientX
          scrollLeftRef.current = scrollRef.current.scrollLeft
          scrollRef.current.setPointerCapture?.(e.pointerId)
        }}
        onPointerUp={(e) => {
          if (pointerIdRef.current !== e.pointerId) return
          scrollRef.current?.releasePointerCapture?.(e.pointerId)
        }}
        onPointerCancel={(e) => {
          if (pointerIdRef.current !== e.pointerId) return
          scrollRef.current?.releasePointerCapture?.(e.pointerId)
        }}
        onClickCapture={(e) => {
          if (didDragRef.current) {
            e.preventDefault()
            e.stopPropagation()
          }
        }}
      >
        {items.map((item) => {
          const { product } = item
          const href = buildExperienceUrl({
            artistSlug: item.artistSlug,
            artworkHandle: product.handle,
          })
          const imageEdges = product.images?.edges?.map((e) => e.node) ?? []
          const primaryUrl =
            product.featuredImage?.url ?? imageEdges[0]?.url ?? null
          const secondUrl =
            imageEdges.find((n) => n.url && n.url !== primaryUrl)?.url ??
            imageEdges[1]?.url ??
            null
          const img = getShopifyImageUrl(primaryUrl ?? undefined, 500) ?? primaryUrl
          const secondImg = secondUrl
            ? getShopifyImageUrl(secondUrl, 500) ?? secondUrl
            : null
          const vendor = product.vendor?.trim() || null

          return (
            <Link
              key={product.id}
              href={href}
              className={styles.bestSellersCard}
              role="listitem"
              aria-label={`${product.title}${vendor ? ` by ${vendor}` : ''} — preview on lamp`}
            >
              <div className={styles.bestSellersCardImage}>
                {img ? (
                  <>
                    <Image
                      src={img}
                      alt={product.title}
                      fill
                      className={cn(
                        styles.bestSellersCardImg,
                        secondImg && styles.bestSellersCardImgPrimary
                      )}
                      sizes="(max-width: 480px) 42vw, 200px"
                      unoptimized
                    />
                    {secondImg ? (
                      <Image
                        src={secondImg}
                        alt=""
                        fill
                        aria-hidden
                        className={styles.bestSellersCardImgHover}
                        sizes="(max-width: 480px) 42vw, 200px"
                        unoptimized
                      />
                    ) : null}
                  </>
                ) : (
                  <div className={styles.bestSellersCardPlaceholder}>No image</div>
                )}
                {!product.availableForSale ? (
                  <span className={styles.bestSellersSoldOut}>Sold out</span>
                ) : null}
                <div className={styles.bestSellersCardTitleChip}>
                  <span className={styles.bestSellersCardTitle}>{product.title}</span>
                </div>
              </div>
              <div className={styles.bestSellersCardMeta}>
                {vendor ? <p className={styles.bestSellersCardVendor}>{vendor}</p> : null}
                {item.priceUsd > 0 ? (
                  <p className={styles.bestSellersCardPrice}>${formatPriceCompact(item.priceUsd)}</p>
                ) : null}
                {item.nextEditionNumber != null && item.editionTotal != null ? (
                  <div className={styles.bestSellersEditionLine}>
                    <Gem className={styles.bestSellersEditionIcon} aria-hidden />
                    <span className={styles.bestSellersEditionText}>
                      #{item.nextEditionNumber}/{item.editionTotal}
                    </span>
                  </div>
                ) : null}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
