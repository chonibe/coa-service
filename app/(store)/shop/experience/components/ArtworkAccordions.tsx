'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ImageIcon, Package, List, Lamp, Ruler, Cable, Plug, BookOpen, Magnet, Gift, ShoppingBag, Scale, Box, Sun, Battery, Zap } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { useExperienceTheme } from '../../experience-v2/ExperienceThemeContext'
import { cn } from '@/lib/utils'
import { ArtistSpotlightBanner, type SpotlightData } from '../../experience-v2/components/ArtistSpotlightBanner'

interface ArtistData {
  name: string
  slug: string
  bio?: string
  image?: string
  instagram?: string
}

interface ArtworkAccordionsProps {
  product: ShopifyProduct
  productIncludes?: { label: string; icon: 'lamp' | 'ruler' | 'cable' | 'plug' | 'book' | 'magnet' | 'package' | 'gift' | 'bag' }[]
  productSpecs?: { title: string; icon?: 'ruler' | 'scale' | 'box' | 'sun' | 'battery' | 'zap'; items: string[] }[]
}

const artistCache = new Map<string, ArtistData | null>()
type SpotlightWithProducts = SpotlightData & { products?: ShopifyProduct[] }
const spotlightCache = new Map<string, SpotlightWithProducts | null>()

export function ArtworkAccordions({ product, productIncludes, productSpecs }: ArtworkAccordionsProps) {
  useExperienceTheme() // ensures we're in theme context for dark: classes
  const [showDescription, setShowDescription] = useState(false)
  const [showSpecs, setShowSpecs] = useState(false)
  const [showIncludes, setShowIncludes] = useState(false)
  const [artistData, setArtistData] = useState<ArtistData | null>(null)
  const [spotlightData, setSpotlightData] = useState<SpotlightData | null>(null)
  const [artistLoading, setArtistLoading] = useState(false)

  const descriptionRaw = product.description || product.descriptionHtml || ''
  const description = typeof descriptionRaw === 'string'
    ? descriptionRaw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    : ''
  const isLamp = !!(productIncludes && productIncludes.length > 0)
  const artist = product.vendor || ''
  const slug = artist.toLowerCase().replace(/\s+/g, '-')
  const firstImage = product.featuredImage ?? product.images?.edges?.[0]?.node

  useEffect(() => {
    setShowDescription(false)
    setShowSpecs(false)
    setShowIncludes(false)
  }, [product.id])

  useEffect(() => {
    if (!artist) return
    if (artistCache.has(slug)) {
      setArtistData(artistCache.get(slug) ?? null)
      setSpotlightData(spotlightCache.get(slug) ?? null)
      return
    }
    let cancelled = false
    setArtistLoading(true)
    fetch(`/api/shop/artists/${slug}?vendor=${encodeURIComponent(artist)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(async (data) => {
        if (cancelled) return
        const a = data && !data.error ? data : null
        let bio = a?.bio
        let image = a?.image
        let instagram = a?.instagram
        let spot: SpotlightWithProducts | null = null
        // Spotlight fallback when artists API returns no bio (spotlight has working implementation)
        if ((!bio || !image || !instagram) && slug) {
          try {
            spot = await fetch(`/api/shop/artist-spotlight?artist=${encodeURIComponent(slug)}`).then((r) => (r.ok ? r.json() : null))
            if (spot && !cancelled) {
              if (!bio && spot.bio) bio = spot.bio
              if (!image && spot.image) image = spot.image
              if (!instagram && spot.instagram) instagram = spot.instagram
            }
          } catch {
            // ignore
          }
        }
        // When artists API fails entirely, use artist-spotlight as primary (same source as selector spotlight)
        let d: ArtistData | null = null
        if (a) {
          d = { name: a.name ?? artist, slug: a.slug ?? slug, bio, image, instagram }
        } else if (slug) {
          try {
            spot = spot ?? await fetch(`/api/shop/artist-spotlight?artist=${encodeURIComponent(slug)}`).then((r) => (r.ok ? r.json() : null))
            if (spot && !cancelled && (spot.vendorName || spot.bio || spot.image || spot.instagram)) {
              d = {
                name: spot.vendorName ?? artist,
                slug: spot.vendorSlug ?? slug,
                bio: spot.bio,
                image: spot.image,
                instagram: spot.instagram,
              }
            }
          } catch {
            // ignore
          }
        }
        artistCache.set(slug, d)
        spotlightCache.set(slug, spot)
        setArtistData(d)
        setSpotlightData(spot)
      })
      .catch(async () => {
        if (cancelled) return
        // On artists API error, try artist-spotlight as primary (same source as selector spotlight)
        try {
          const spot = await fetch(`/api/shop/artist-spotlight?artist=${encodeURIComponent(slug)}`).then((r) => (r.ok ? r.json() : null))
          if (spot && !cancelled && (spot.vendorName || spot.bio || spot.image || spot.instagram)) {
            const d = {
              name: spot.vendorName ?? artist,
              slug: spot.vendorSlug ?? slug,
              bio: spot.bio,
              image: spot.image,
              instagram: spot.instagram,
            }
            artistCache.set(slug, d)
            spotlightCache.set(slug, spot)
            setArtistData(d)
            setSpotlightData(spot)
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
      })
      .finally(() => { if (!cancelled) setArtistLoading(false) })
    return () => { cancelled = true }
  }, [artist, slug])

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

  const accordionCls = 'w-full flex items-center justify-between py-3 border-t border-neutral-100 dark:border-white/10 group'
  const iconCls = 'w-8 h-8 rounded-full bg-neutral-100 dark:bg-[#201c1c] flex items-center justify-center'
  const labelCls = 'text-sm font-medium text-neutral-700 dark:text-[#d4b8b8] group-hover:text-neutral-900 dark:group-hover:text-white transition-colors'
  const chevronCls = (open: boolean) => cn('w-4 h-4 text-neutral-400 dark:text-[#d4b8b8] transition-transform', open && 'rotate-180')

  return (
    <div className="w-full max-w-[min(92vw,360px)] md:max-w-[min(65vh,520px)] mx-auto px-4 py-4 space-y-0">
      {/* What's included */}
      {productIncludes && productIncludes.length > 0 && (
        <div className="pb-0">
          <button onClick={() => setShowIncludes(!showIncludes)} className={accordionCls}>
            <div className="flex items-center gap-3">
              <div className={iconCls}>
                <Package className="w-4 h-4 text-neutral-400 dark:text-[#d4b8b8]" />
              </div>
              <span className={labelCls}>What&apos;s included</span>
            </div>
            <ChevronDown className={chevronCls(showIncludes)} />
          </button>
          <AnimatePresence>
            {showIncludes && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 pt-2 pb-3 justify-center">
                  {productIncludes.map((item, i) => {
                    const Icon = iconMap[item.icon]
                    return (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-[#201c1c] text-neutral-700 dark:text-[#d4b8b8] text-xs font-medium"
                      >
                        <Icon className="w-3.5 h-3.5 text-neutral-500 dark:text-[#c4a0a0] flex-shrink-0" />
                        {item.label}
                      </span>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Specifications */}
      {productSpecs && productSpecs.length > 0 && (
        <div className="pb-0">
          <button onClick={() => setShowSpecs(!showSpecs)} className={accordionCls}>
            <div className="flex items-center gap-3">
              <div className={iconCls}>
                <List className="w-4 h-4 text-neutral-400 dark:text-[#d4b8b8]" />
              </div>
              <span className={labelCls}>Specifications</span>
            </div>
            <ChevronDown className={chevronCls(showSpecs)} />
          </button>
          <AnimatePresence>
            {showSpecs && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="grid gap-3 sm:grid-cols-2 pt-2 pb-3">
                  {productSpecs.map((spec, i) => {
                    const SpecIcon = spec.icon ? specIconMap[spec.icon] : List
                    const isSingleValue = spec.items.length === 1
                    return (
                      <div
                        key={i}
                        className="rounded-xl border border-neutral-100 dark:border-white/10 bg-neutral-50/50 dark:bg-[#201c1c]/50 px-4 py-3"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <SpecIcon className="w-4 h-4 text-neutral-400 dark:text-[#d4b8b8] flex-shrink-0" />
                          <h4 className="text-[11px] font-semibold text-neutral-500 dark:text-[#FFBA94] uppercase tracking-wider">
                            {spec.title}
                          </h4>
                        </div>
                        {isSingleValue ? (
                          <p className="text-sm text-neutral-700 dark:text-[#d4b8b8] leading-snug">{spec.items[0]}</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {spec.items.map((item, j) => (
                              <li key={j} className="text-sm text-neutral-700 dark:text-[#d4b8b8] leading-relaxed flex items-start gap-2">
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* About the Artist — spotlight card (same as selector) instead of accordion */}
      {artist && !isLamp && (
        <div className="pb-0">
          {artistLoading ? (
            <div className="py-4 flex justify-center">
              <div className="w-5 h-5 border-2 border-neutral-200 dark:border-[#3e3838] border-t-neutral-500 dark:border-t-white rounded-full animate-spin" />
            </div>
          ) : (() => {
            const spotlight: SpotlightData | null = spotlightData ?? (artistData ? {
              vendorName: artistData.name,
              vendorSlug: artistData.slug,
              bio: artistData.bio,
              image: artistData.image,
              instagram: artistData.instagram,
              productIds: [product.id.replace(/^gid:\/\/shopify\/Product\//i, '') || product.id],
            } : null)
            const spotlightProducts = (spotlightData as SpotlightWithProducts | null)?.products ?? [product]
            return spotlight ? (
              <ArtistSpotlightBanner
                spotlight={spotlight}
                spotlightProducts={spotlightProducts}
              />
            ) : null
          })()}
        </div>
      )}

      {/* Description / Product details */}
      {description && (
        <div className="pb-0">
          <button
            onClick={() => setShowDescription(!showDescription)}
            className={accordionCls}
          >
            <div className="flex items-center gap-3">
              <div className={iconCls}>
                <ImageIcon className="w-4 h-4 text-neutral-400 dark:text-[#d4b8b8]" />
              </div>
              <span className={labelCls}>
                {isLamp ? 'About the Street Lamp' : 'Artwork details'}
              </span>
            </div>
            <ChevronDown className={chevronCls(showDescription)} />
          </button>
          <AnimatePresence>
            {showDescription && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="text-sm text-neutral-600 dark:text-[#c4a0a0] leading-relaxed pb-3">{description}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
