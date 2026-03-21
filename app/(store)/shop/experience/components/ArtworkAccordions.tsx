'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { ImageIcon, Package, List, Lamp, Ruler, Cable, Plug, BookOpen, Magnet, Gift, ShoppingBag, Scale, Box, Sun, Battery, Zap } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { useExperienceTheme } from '../../experience-v2/ExperienceThemeContext'
import {
  ArtistSpotlightBanner,
  SpotlightCollectionGif,
  type SpotlightData,
} from '../../experience-v2/components/ArtistSpotlightBanner'
import { ScarcityBadge } from '../../experience-v2/components/ScarcityBadge'
import { EditionBadgeForProduct } from '../../experience-v2/components/EditionBadge'
import { ArtworkEditionUnifiedSection } from '../../experience-v2/components/ArtworkEditionUnifiedSection'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'

interface ArtistData {
  name: string
  slug: string
  bio?: string
  image?: string
  instagram?: string
}

export type ArtworkAccordionsVariant = 'full' | 'editionOnly' | 'contentOnly'

interface ArtworkAccordionsProps {
  product: ShopifyProduct
  productIncludes?: { label: string; icon: 'lamp' | 'ruler' | 'cable' | 'plug' | 'book' | 'magnet' | 'package' | 'gift' | 'bag' }[]
  productSpecs?: { title: string; icon?: 'ruler' | 'scale' | 'box' | 'sun' | 'battery' | 'zap'; items: string[] }[]
  /** Override slug for artist fetch — use spotlight's vendorSlug when available so artist bio matches selector */
  artistSlugOverride?: string
  /** When provided, use this spotlight data directly (includes gifUrl) — same as selector, no fetch needed */
  spotlightDataOverride?: SpotlightData | null
  /** `editionOnly` / `contentOnly`: split reel with edition above Spline in SplineFullScreen */
  variant?: ArtworkAccordionsVariant
}

const artistCache = new Map<string, ArtistData | null>()
type SpotlightWithProducts = SpotlightData & { products?: ShopifyProduct[] }
const spotlightCache = new Map<string, SpotlightWithProducts | null>()

export function ArtworkAccordions({
  product,
  productIncludes,
  productSpecs,
  artistSlugOverride,
  spotlightDataOverride,
  variant = 'full',
}: ArtworkAccordionsProps) {
  useExperienceTheme() // ensures we're in theme context for dark: classes
  const [artistData, setArtistData] = useState<ArtistData | null>(null)
  const [spotlightData, setSpotlightData] = useState<SpotlightData | null>(null)
  const [artistLoading, setArtistLoading] = useState(false)

  const isLamp = !!(productIncludes && productIncludes.length > 0)
  const artist = product.vendor || ''
  const slugFromVendor = artist.toLowerCase().replace(/\s+/g, '-')
  const slug = artistSlugOverride || slugFromVendor
  const firstImage = product.featuredImage ?? product.images?.edges?.[0]?.node
  const detailArtistName = (
    artistData?.name ||
    spotlightDataOverride?.vendorName ||
    spotlightData?.vendorName ||
    artist
  ).trim()

  const spotlightGifUrl = spotlightDataOverride?.gifUrl ?? spotlightData?.gifUrl

  const spotlightSlugsToTry = useMemo(() => {
    const base = slug.replace(/\./g, '')
    const withJc = base.replace(/-j-c-/g, '-jc-')
    const withJC = base.replace(/-jc-/g, '-j-c-')
    return [...new Set([slug, base, withJc, withJC].filter(Boolean))]
  }, [slug])

  useEffect(() => {
    if (!artist && !artistSlugOverride) return
    if (artistCache.has(slug)) {
      setArtistData(artistCache.get(slug) ?? null)
      setSpotlightData(spotlightCache.get(slug) ?? null)
      return
    }
    let cancelled = false
    setArtistLoading(true)

    async function fetchSpotlight(): Promise<SpotlightWithProducts | null> {
      for (const s of spotlightSlugsToTry) {
        const r = await fetch(`/api/shop/artist-spotlight?artist=${encodeURIComponent(s)}`)
        const data = r.ok ? await r.json() : null
        if (data?.vendorName && (data.bio || data.image || data.instagram || data.gifUrl)) return data
      }
      return null
    }

    fetchSpotlight()
      .then(async (spot) => {
        if (cancelled) return
        let spotToUse = spot
        if (spot?.vendorName && !spot.bio?.trim()) {
          try {
            const r = await fetch(`/api/shop/artists/${slug}?vendor=${encodeURIComponent(artist)}`)
            const data = r.ok ? await r.json() : null
            const a = data && !data.error ? data : null
            const extraBio = a?.bio?.trim()
            if (extraBio) {
              spotToUse = { ...spot, bio: extraBio }
            }
          } catch {
            /* keep spot without merged bio */
          }
        }
        if (
          spotToUse &&
          (spotToUse.vendorName ||
            spotToUse.bio ||
            spotToUse.image ||
            spotToUse.instagram ||
            spotToUse.gifUrl)
        ) {
          const d = {
            name: spotToUse.vendorName ?? artist,
            slug: spotToUse.vendorSlug ?? slug,
            bio: spotToUse.bio,
            image: spotToUse.image,
            instagram: spotToUse.instagram,
          }
          artistCache.set(slug, d)
          spotlightCache.set(slug, spotToUse)
          setArtistData(d)
          setSpotlightData(spotToUse)
        } else {
          const r = await fetch(`/api/shop/artists/${slug}?vendor=${encodeURIComponent(artist)}`)
          const data = r.ok ? await r.json() : null
          const a = data && !data.error ? data : null
          if (a && !cancelled) {
            artistCache.set(slug, a)
            spotlightCache.set(slug, null)
            setArtistData(a)
            setSpotlightData(null)
          } else {
            artistCache.set(slug, null)
            spotlightCache.set(slug, null)
            setArtistData(null)
            setSpotlightData(null)
          }
        }
        if (!cancelled) setArtistLoading(false)
      })
      .catch(async () => {
        if (cancelled) return
        try {
          const r = await fetch(`/api/shop/artists/${slug}?vendor=${encodeURIComponent(artist)}`)
          const data = r.ok ? await r.json() : null
          const a = data && !data.error ? data : null
          if (a && !cancelled) {
            artistCache.set(slug, a)
            spotlightCache.set(slug, null)
            setArtistData(a)
            setSpotlightData(null)
          } else {
            artistCache.set(slug, null)
            spotlightCache.set(slug, null)
            setArtistData(null)
            setSpotlightData(null)
          }
        } catch {
          artistCache.set(slug, null)
          spotlightCache.set(slug, null)
          setArtistData(null)
          setSpotlightData(null)
        }
        if (!cancelled) setArtistLoading(false)
      })

    return () => { cancelled = true }
  }, [artist, slug, artistSlugOverride, spotlightSlugsToTry])

  const iconMap = {
    lamp: Lamp,
    ruler: Ruler,
    cable: Cable,
    plug: Plug,
    book: BookOpen,
    magnet: Magnet,
    package: Package,
    gift: Gift,
    bag: ShoppingBag,
  }

  const specIconMap = {
    ruler: Ruler,
    scale: Scale,
    box: Box,
    sun: Sun,
    battery: Battery,
    zap: Zap,
  }

  const iconCls = 'w-8 h-8 rounded-full bg-neutral-100 dark:bg-[#201c1c] flex items-center justify-center'
  const labelCls = 'text-base font-medium text-neutral-700 dark:text-[#d4b8b8]'
  const editionSize = (() => {
    const m = product.metafields?.find(
      (x) => x && x.namespace === 'custom' && x.key === 'edition_size'
    )
    return m?.value ? parseInt(m.value, 10) : null
  })()

  if (variant === 'editionOnly') {
    if (isLamp) return null
    return (
      <div className="w-full max-w-[min(92vw,360px)] md:max-w-[min(65vh,520px)] mx-auto px-4 pt-4 pb-2 md:pb-3">
        <ArtworkEditionUnifiedSection className="w-full">
          <EditionBadgeForProduct
            product={product}
            artistName={detailArtistName || undefined}
            unifiedSection
            className="w-full"
          />
        </ArtworkEditionUnifiedSection>
      </div>
    )
  }

  const showEditionInBody = !isLamp && variant === 'full'

  return (
    <div className="w-full max-w-[min(92vw,360px)] md:max-w-[min(65vh,520px)] mx-auto px-4 py-4 space-y-5">
      {/* Collection GIF — outside spotlight card, above edition / scarcity */}
      {!isLamp && spotlightGifUrl && (
        <div className="w-full">
          <SpotlightCollectionGif gifUrl={spotlightGifUrl} />
        </div>
      )}

      {/* Edition story + availability — before artwork card + artist spotlight (omitted when rendered above Spline) */}
      {showEditionInBody && (
        <ArtworkEditionUnifiedSection className="w-full">
          <EditionBadgeForProduct
            product={product}
            artistName={detailArtistName || undefined}
            unifiedSection
            className="w-full"
          />
        </ArtworkEditionUnifiedSection>
      )}

      {/* Artwork Details — image, title, scarcity (before About the Artist) */}
      {!isLamp && (firstImage?.url || product.title) && (
        <div className="rounded-xl border border-neutral-100 dark:border-white/10 bg-neutral-50/50 dark:bg-[#201c1c]/50 overflow-hidden">
          {firstImage?.url && (
            <div className="relative w-full aspect-[4/5] overflow-hidden">
              <Image
                src={getShopifyImageUrl(firstImage.url, 800) ?? firstImage.url}
                alt={product.title || 'Artwork'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 92vw, 520px"
              />
            </div>
          )}
          <div className="p-4 sm:p-5 text-center">
            <div className="mb-4">
              {detailArtistName && (
                <p className="text-[11px] font-medium text-neutral-500 dark:text-[#c4a0a0] uppercase tracking-widest">
                  {detailArtistName}
                </p>
              )}
              {product.title && (
                <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-white mt-0.5">
                  {product.title}
                </h2>
              )}
            </div>
            {editionSize != null && editionSize > 0 && (
              <div className="px-4 pb-4 sm:px-5 sm:pb-5 border-t border-neutral-100 dark:border-white/10 pt-4">
                <ScarcityBadge
                  quantityAvailable={
                    typeof product.variants?.edges?.[0]?.node?.quantityAvailable === 'number'
                      ? product.variants.edges[0].node.quantityAvailable
                      : undefined
                  }
                  editionSize={editionSize}
                  availableForSale={product.availableForSale ?? true}
                  variant="bar"
                  productId={product.id}
                  productImage={firstImage?.url ?? null}
                  productTitle={product.title ?? undefined}
                  unifiedSection
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* About the Artist — spotlight card */}
      {artist && !isLamp && (
        <div>
          {artistLoading ? (
            <div className="py-4 flex justify-center">
              <div className="w-5 h-5 border-2 border-neutral-200 dark:border-[#3e3838] border-t-neutral-500 dark:border-t-white rounded-full animate-spin" />
            </div>
          ) : (() => {
            const spotlight: SpotlightData | null = spotlightDataOverride ?? spotlightData ?? (artistData ? {
              vendorName: artistData.name,
              vendorSlug: artistData.slug,
              bio: artistData.bio,
              image: artistData.image,
              instagram: artistData.instagram,
              productIds: [product.id.replace(/^gid:\/\/shopify\/Product\//i, '') || product.id],
            } : null)
            const spotlightProducts = (spotlightDataOverride as SpotlightWithProducts | null)?.products ?? (spotlightData as SpotlightWithProducts | null)?.products ?? [product]
            return spotlight ? (
              <ArtistSpotlightBanner
                spotlight={{ ...spotlight, gifUrl: undefined }}
                spotlightProducts={spotlightProducts}
              />
            ) : null
          })()}
        </div>
      )}

      {/* Lamp details — image only, no Shopify description */}
      {isLamp && firstImage?.url && (
        <div className="rounded-xl border border-neutral-100 dark:border-white/10 bg-neutral-50/50 dark:bg-[#201c1c]/50 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={iconCls}>
              <ImageIcon className="w-4 h-4 text-neutral-400 dark:text-[#d4b8b8]" />
            </div>
            <span className={labelCls}>About the Street Lamp</span>
          </div>
          <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden">
            <Image
              src={getShopifyImageUrl(firstImage.url, 800) ?? firstImage.url}
              alt={product.title || 'Lamp'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 92vw, 520px"
            />
          </div>
        </div>
      )}

      {/* What's included — always open */}
      {productIncludes && productIncludes.length > 0 && (
        <div className="rounded-xl border border-neutral-100 dark:border-white/10 bg-neutral-50/50 dark:bg-[#201c1c]/50 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={iconCls}>
              <Package className="w-4 h-4 text-neutral-400 dark:text-[#d4b8b8]" />
            </div>
            <span className={labelCls}>What&apos;s Included</span>
          </div>
          <div className="flex flex-wrap gap-2 justify-start">
            {productIncludes.map((item, i) => {
              const Icon = iconMap[item.icon]
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-[#2a2424] text-neutral-700 dark:text-[#d4b8b8] text-sm font-medium"
                >
                  <Icon className="w-3.5 h-3.5 text-neutral-500 dark:text-[#c4a0a0] flex-shrink-0" />
                  {item.label}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Specifications — always open */}
      {productSpecs && productSpecs.length > 0 && (
        <div className="rounded-xl border border-neutral-100 dark:border-white/10 bg-neutral-50/50 dark:bg-[#201c1c]/50 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={iconCls}>
              <List className="w-4 h-4 text-neutral-400 dark:text-[#d4b8b8]" />
            </div>
            <span className={labelCls}>Specifications</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {productSpecs.map((spec, i) => {
              const SpecIcon = spec.icon ? specIconMap[spec.icon] : List
              const isSingleValue = spec.items.length === 1
              return (
                <div
                  key={i}
                  className="rounded-lg bg-neutral-100/50 dark:bg-[#2a2424]/50 px-3 py-2"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <SpecIcon className="w-3.5 h-3.5 text-neutral-400 dark:text-[#d4b8b8] flex-shrink-0" />
                    <h4 className="text-xs font-semibold text-neutral-500 dark:text-[#FFBA94] uppercase tracking-wider">
                      {spec.title}
                    </h4>
                  </div>
                  {isSingleValue ? (
                    <p className="text-base text-neutral-700 dark:text-[#d4b8b8] leading-snug">{spec.items[0]}</p>
                  ) : (
                    <ul className="space-y-1">
                      {spec.items.map((item, j) => (
                        <li key={j} className="text-base text-neutral-700 dark:text-[#d4b8b8] leading-relaxed flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-neutral-400 dark:bg-[#5c0000] mt-1.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
