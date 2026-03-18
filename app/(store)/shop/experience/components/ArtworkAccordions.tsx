'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, User, ImageIcon, Package, List, Lamp, Ruler, Cable, Plug, BookOpen, Magnet, Gift, ShoppingBag, Scale, Box, Sun, Battery, Zap, Instagram } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { useExperienceTheme } from '../../experience-v2/ExperienceThemeContext'
import { cn } from '@/lib/utils'

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

export function ArtworkAccordions({ product, productIncludes, productSpecs }: ArtworkAccordionsProps) {
  useExperienceTheme() // ensures we're in theme context for dark: classes
  const [showDescription, setShowDescription] = useState(false)
  const [showArtistBio, setShowArtistBio] = useState(false)
  const [showSpecs, setShowSpecs] = useState(false)
  const [showIncludes, setShowIncludes] = useState(false)
  const [artistData, setArtistData] = useState<ArtistData | null>(null)
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
    setShowArtistBio(false)
    setShowSpecs(false)
    setShowIncludes(false)
  }, [product.id])

  useEffect(() => {
    if (!artist) return
    if (artistCache.has(slug)) {
      setArtistData(artistCache.get(slug) ?? null)
      return
    }
    let cancelled = false
    setArtistLoading(true)
    fetch(`/api/shop/artists/${slug}?vendor=${encodeURIComponent(artist)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return
        const a = data && !data.error ? data : null
        const d = a ? { name: a.name ?? artist, slug: a.slug ?? slug, bio: a.bio, image: a.image, instagram: a.instagram } : null
        artistCache.set(slug, d)
        setArtistData(d)
      })
      .catch(() => { if (!cancelled) setArtistData(null) })
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

      {/* About the Artist — before Artwork details, large image when opened */}
      {artist && !isLamp && (
        <div className="pb-0">
          <button
            onClick={() => {
              setShowArtistBio(!showArtistBio)
              if (!showArtistBio) setShowDescription(false)
            }}
            className={accordionCls}
          >
            <div className="flex items-center gap-3">
              {artistData?.image || firstImage?.url ? (
                <Image
                  src={artistData?.image || firstImage!.url}
                  alt={artistData?.name || artist}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-lg object-cover"
                />
              ) : (
                <div className={iconCls}>
                  <User className="w-4 h-4 text-neutral-400 dark:text-[#d4b8b8]" />
                </div>
              )}
              <span className={labelCls}>About {artistData?.name || artist}</span>
            </div>
            <ChevronDown className={chevronCls(showArtistBio)} />
          </button>
          <AnimatePresence>
            {showArtistBio && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {artistLoading ? (
                  <div className="py-4 flex justify-center">
                    <div className="w-5 h-5 border-2 border-neutral-200 dark:border-[#3e3838] border-t-neutral-500 dark:border-t-white rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="pb-3 space-y-4">
                    {(artistData?.image || firstImage?.url) && (
                      <div className="relative w-full aspect-square max-w-[min(80vw,280px)] mx-auto rounded-2xl overflow-hidden">
                        <Image
                          src={artistData?.image || firstImage!.url}
                          alt={artistData?.name || artist}
                          fill
                          className="object-cover"
                          sizes="(max-width: 480px) 80vw, 280px"
                        />
                      </div>
                    )}
                    <div className="space-y-3">
                      {artistData?.bio && (
                        <p className="text-sm text-neutral-600 dark:text-[#c4a0a0] leading-relaxed">{artistData.bio}</p>
                      )}
                      {artistData?.instagram && (
                        <a
                          href={`https://instagram.com/${artistData.instagram.replace(/^@/, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-[#c4a0a0] hover:text-neutral-900 dark:hover:text-[#f0e8e8] transition-colors"
                        >
                          <Instagram className="w-4 h-4" />
                          @{artistData.instagram.replace(/^@/, '')}
                        </a>
                      )}
                      {!artistData?.bio && !artistData?.instagram && (
                        <p className="text-sm text-neutral-400 dark:text-[#b89090]">No bio available for this artist.</p>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
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
