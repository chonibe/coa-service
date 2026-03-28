'use client'

import { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import Image from 'next/image'
import { useVirtualizer } from '@tanstack/react-virtual'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Eye, Heart, Info, Plus } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import { useWishlist } from '@/lib/shop/WishlistContext'
import { cn, formatPriceCompact } from '@/lib/utils'
import { buildArtworkRowsByArtist, rowIndexForProductId } from '@/lib/shop/experience-artwork-rows'
import {
  experienceArtistRowDefaultClass,
  experienceArtistRowMergeClass,
  getStripArtworkCardSurfaces,
  getStripCardSelectionChrome,
} from '@/lib/shop/experience-artwork-card-surfaces'
import { EditionBadgeForProduct } from './EditionBadge'

const SPARKLE_COUNT = 8
const SPARKLE_COLORS = ['#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#facc15', '#fde047']

const MERGE_CONFETTI_COUNT = 16
const MERGE_CONFETTI_COLORS = ['#047AFF', '#3b82f6', '#60a5fa', '#22c55e', '#4ade80', '#facc15', '#fde047', '#ffffff']

const CONFETTI_DELAY_MS = 320

function SparkleCheck({ justAdded, className }: { justAdded: boolean; className?: string }) {
  const [sparkle, setSparkle] = useState(false)
  const [tickGrow, setTickGrow] = useState(false)
  const prevJustAdded = useRef(false)

  useEffect(() => {
    if (justAdded && !prevJustAdded.current) {
      setTickGrow(true)
      const growDone = setTimeout(() => setTickGrow(false), 400)
      const confettiStart = setTimeout(() => setSparkle(true), CONFETTI_DELAY_MS)
      const confettiDone = setTimeout(() => setSparkle(false), CONFETTI_DELAY_MS + 600)
      return () => {
        clearTimeout(growDone)
        clearTimeout(confettiStart)
        clearTimeout(confettiDone)
      }
    }
    prevJustAdded.current = justAdded
  }, [justAdded])

  return (
    <motion.span
      className={cn('relative inline-flex items-center justify-center overflow-visible', className)}
      initial={false}
      animate={tickGrow ? { scale: [1, 1.12, 1] } : { scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Check className="w-2 h-2 text-[#047AFF]" strokeWidth={2.5} />
      <AnimatePresence>
        {sparkle && (
          <>
            {Array.from({ length: SPARKLE_COUNT }).map((_, i) => {
              const angle = (i / SPARKLE_COUNT) * 360
              const rad = (angle * Math.PI) / 180
              const dist = 12
              const x = Math.cos(rad) * dist
              const y = Math.sin(rad) * dist
              return (
                <motion.span
                  key={i}
                  initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
                  animate={{ opacity: 0, scale: 1.2, x, y }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="absolute left-1/2 top-1/2 w-1 h-1 rounded-full pointer-events-none"
                  style={{
                    backgroundColor: SPARKLE_COLORS[i % SPARKLE_COLORS.length],
                    marginLeft: -2,
                    marginTop: -2,
                  }}
                />
              )
            })}
          </>
        )}
      </AnimatePresence>
    </motion.span>
  )
}

function MergeConfetti({ active }: { active: boolean }) {
  const [sparkle, setSparkle] = useState(false)
  const prevActive = useRef(false)

  useEffect(() => {
    if (active && !prevActive.current) {
      setSparkle(true)
      const t = setTimeout(() => setSparkle(false), 800)
      return () => clearTimeout(t)
    }
    prevActive.current = active
  }, [active])

  return (
    <AnimatePresence>
      {sparkle && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible z-10">
          <div className="relative w-0 h-0">
            {Array.from({ length: MERGE_CONFETTI_COUNT }).map((_, i) => {
              const angle = (i / MERGE_CONFETTI_COUNT) * 360
              const rad = (angle * Math.PI) / 180
              const dist = 50 + (i % 4) * 12
              const x = Math.cos(rad) * dist
              const y = Math.sin(rad) * dist
              return (
                <motion.span
                  key={i}
                  initial={{ opacity: 1, scale: 0.3, x: 0, y: 0 }}
                  animate={{ opacity: 0, scale: 1, x, y }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="absolute left-1/2 top-1/2 w-2 h-2 -ml-1 -mt-1 rounded-full"
                  style={{
                    backgroundColor: MERGE_CONFETTI_COLORS[i % MERGE_CONFETTI_COLORS.length],
                    boxShadow: '0 0 6px 1px rgba(4, 122, 255, 0.4)',
                  }}
                />
              )
            })}
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

interface ArtworkCardProps {
  product: ShopifyProduct
  globalIdx: number
  isPreviewed: boolean
  isInCart: boolean
  justAdded: boolean
  /** 1 = Side A on lamp, 2 = Side B on lamp, null = not in lamp preview */
  lampPosition: 1 | 2 | null
  isSoldOut: boolean
  imageUrl: string | undefined
  isFirstCard?: boolean
  /** When true, use priority loading for faster LCP */
  priorityLoad?: boolean
  showWishlistHearts?: boolean
  /** Crew count (taste-similar collectors who responded). Only shown when > 0. */
  crewCount?: number
  /** When true, this card merges with the one on its left (round only right corners) */
  mergeWithLeft?: boolean
  /** When true, this card merges with the one on its right (round only left corners) */
  mergeWithRight?: boolean
  /** True when in a 2-up artist row with center spine (flush inner corners). */
  spinePairLayout?: boolean
  /** When true, user already owns this artwork (from past orders) */
  isCollected?: boolean
  /** When true, artwork is part of the current artist spotlight "New Drop" */
  isNewDrop?: boolean
  /** When true, spotlight is unlisted (early access); show "Early access" instead of "New Drop" */
  isEarlyAccess?: boolean
  onPreview: (index: number) => void
  onLampSelect: (product: ShopifyProduct) => void
  onAddToCart: (product: ShopifyProduct) => void
  onViewDetail: (product: ShopifyProduct) => void
  /** 0=info, 1=eye, 2=add */
  highlightStep?: number
  showHighlightAnimation?: boolean
  /** Called when user tries a step (Info=0, Eye=1, Add=2) on first card */
  onStepTried?: (step: 0 | 1 | 2) => void
  /** When true, show the looping tap-nudge animation on this card's image */
  showTapNudge?: boolean
  /** Delay in seconds before the nudge loop starts (for staggering across cards) */
  tapNudgeDelay?: number
  /** When true, show an Information button in the bottom bar (next to Add) for mobile */
  isMobile?: boolean
  /** Both artworks in 2-up row in cart — no per-card ring (shared row tint). */
  suppressSelectionRing?: boolean
}

function getFirstImageForWishlist(product: ShopifyProduct | null | undefined): string | null {
  if (!product) return null
  return product.featuredImage?.url ?? product.images?.edges?.[0]?.node?.url ?? null
}

function ArtworkCard({
  product,
  globalIdx,
  isPreviewed,
  isInCart,
  justAdded,
  lampPosition,
  isSoldOut,
  imageUrl,
  isFirstCard,
  priorityLoad = false,
  showWishlistHearts = false,
  crewCount = 0,
  mergeWithLeft = false,
  mergeWithRight = false,
  spinePairLayout = false,
  isCollected = false,
  isNewDrop = false,
  isEarlyAccess = false,
  onPreview,
  onLampSelect,
  onAddToCart,
  onViewDetail,
  highlightStep = 0,
  showHighlightAnimation = false,
  onStepTried,
  showTapNudge = false,
  tapNudgeDelay = 0,
  isMobile = false,
  suppressSelectionRing = false,
}: ArtworkCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const { isInWishlist, addItem, removeItem } = useWishlist()
  const isLampSelection = lampPosition === 1 || lampPosition === 2
  const inWishlist = isInWishlist(product.id)

  const handleWishlistToggle = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (inWishlist) {
        removeItem(product.id)
      } else {
        const variantId = product.variants?.edges?.[0]?.node?.id ?? ''
        const price = parseFloat(product.priceRange?.minVariantPrice?.amount || '0')
        addItem({
          productId: product.id,
          variantId,
          handle: product.handle,
          title: product.title,
          price,
          image: getFirstImageForWishlist(product) ?? undefined,
          artistName: product.vendor ?? undefined,
        })
      }
    },
    [product, inWishlist, addItem, removeItem]
  )

  const handleLampSelect = useCallback(() => {
    if (isSoldOut) return
    onLampSelect(product)
    onPreview(globalIdx)
  }, [isSoldOut, product, onLampSelect, onPreview, globalIdx])

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isSoldOut) return
    handleLampSelect()
  }

  // Unified wizard highlight style for consistent visual affordance
  const wizardHighlightClass = 'ring-1 ring-blue-400/90 shadow-[0_0_24px_rgba(59,130,246,0.95)] animate-pulse'

  const isMerged = isInCart && (mergeWithLeft || mergeWithRight)
  const flushToSpine = isMerged || spinePairLayout
  const roundLeft = !flushToSpine || mergeWithRight
  const roundRight = !flushToSpine || mergeWithLeft
  const surfaces = getStripArtworkCardSurfaces(isMerged, isInCart)
  const selectionChrome = getStripCardSelectionChrome(isInCart, suppressSelectionRing)

  const showTapHint = showTapNudge && !isInCart && !isSoldOut && lampPosition === null

  return (
    <motion.div
      data-product-id={product.id}
      data-highlight-card={isFirstCard ? '' : undefined}
      className={cn(
        'relative box-border origin-center',
        selectionChrome,
        surfaces.shell,
        roundLeft && roundRight && 'rounded-xl',
        roundLeft && !roundRight && 'rounded-l-xl',
        !roundLeft && roundRight && 'rounded-r-xl',
        (isInCart || (isFirstCard && showHighlightAnimation)) ? 'overflow-visible' : 'overflow-hidden'
      )}
    >
      <motion.div
        className={cn(
          'aspect-[4/5] relative overflow-hidden cursor-pointer touch-manipulation select-none',
          surfaces.imageWell,
          roundLeft && roundRight && 'rounded-t-xl',
          roundLeft && !roundRight && 'rounded-tl-xl',
          !roundLeft && roundRight && 'rounded-tr-xl'
        )}
        animate={showTapHint ? {
          scale: [1, 0.955, 1, 0.955, 1],
        } : { scale: 1 }}
        transition={showTapHint ? {
          duration: 1.6,
          repeat: Infinity,
          repeatDelay: 2.4,
          delay: tapNudgeDelay,
          ease: 'easeInOut',
        } : { duration: 0.12, ease: 'easeOut' }}
        whileTap={{ scale: 0.99 }}
        onClick={handleImageClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleLampSelect() } }}
        title="Tap to preview on lamp"
      >
        {imageUrl ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 bg-neutral-200/80 dark:bg-[#262222]/50 animate-pulse" />
            )}
            <Image
              src={getShopifyImageUrl(imageUrl, 500) ?? imageUrl}
              alt={product.title}
              fill
              unoptimized
              className={cn('object-cover transition-opacity duration-200', imageLoaded ? 'opacity-100' : 'opacity-0')}
              sizes="(max-width: 480px) 45vw, (max-width: 768px) 40vw, 200px"
              priority={priorityLoad}
              loading="eager"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)}
            />
          </>
        ) : (
          <div className={cn(
            'w-full h-full flex items-center justify-center text-xs',
            isInCart ? 'text-neutral-500' : 'text-neutral-300 dark:text-[#b89090]'
          )}>
            No image
          </div>
        )}
        {(isNewDrop || isEarlyAccess) && !isSoldOut && !isCollected && (
          <span className={cn(
            'absolute top-2 left-2 z-10 text-[10px] font-semibold px-1.5 py-0.5 rounded',
            isEarlyAccess
              ? 'text-violet-800 dark:text-violet-200 bg-violet-100/95 dark:bg-violet-900/50'
              : 'text-amber-800 dark:text-amber-200 bg-amber-100/95 dark:bg-amber-900/50'
          )}>
            {isEarlyAccess ? 'Early access' : 'New Drop'}
          </span>
        )}
        <button
          data-highlight-btn={isFirstCard ? 'info' : undefined}
          type="button"
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onStepTried?.(1); onViewDetail(product) }}
          className={cn(
            'absolute top-0.5 right-0.5 z-10 flex items-center justify-center transition-all duration-200',
            isFirstCard && showHighlightAnimation && highlightStep === 1
              ? `w-5 h-5 rounded-md ${wizardHighlightClass} text-blue-50 bg-blue-500/70 dark:bg-blue-600/60`
              : 'w-5 h-5 rounded-full bg-white/90 dark:bg-[#171515]/85 backdrop-blur-sm text-neutral-700 dark:text-[#f0e8e8] hover:text-neutral-900 dark:hover:text-[#f0e8e8] hover:bg-white dark:hover:bg-black/70'
          )}
          aria-label="View artwork details"
        >
          {isFirstCard && showHighlightAnimation && highlightStep === 1 ? (
            <motion.span
              animate={{ scale: [1, 1.08, 1], opacity: [1, 0.85, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="flex items-center justify-center"
            >
              <Info className="w-3 h-3" />
            </motion.span>
          ) : (
            <Info className="w-3 h-3" />
          )}
        </button>
        {showWishlistHearts && (
          <button
            type="button"
            onClick={handleWishlistToggle}
            className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm touch-manipulation transition-all active:scale-95 hover:scale-105"
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              className={cn('w-4 h-4', inWishlist ? 'fill-[#047AFF] text-[#047AFF]' : 'text-neutral-400 hover:text-[#0366d6]')}
              strokeWidth={1.5}
            />
          </button>
        )}
        <div
          className={cn(
            'absolute inset-x-0 top-0 z-[8] pointer-events-none flex flex-col justify-start gap-0.5 px-1.5 pt-1',
            (isNewDrop || isEarlyAccess) && !isSoldOut && !isCollected ? 'pt-9' : 'pt-2',
            showWishlistHearts ? 'pr-10' : 'pr-8'
          )}
        >
          <div className="flex w-full min-w-0 justify-center">
            <div
              className={cn(
                'inline-flex max-w-full min-w-0 items-start gap-1.5 rounded-lg px-2 py-1',
                'border border-white/30 dark:border-white/20',
                'bg-black/40 backdrop-blur-md backdrop-saturate-150 dark:bg-black/50',
                'text-white shadow-sm shadow-black/20'
              )}
            >
              {!isInCart && !isSoldOut && (
                <Plus
                  className="h-3.5 w-3.5 shrink-0 mt-0.5 text-white opacity-95"
                  strokeWidth={2.5}
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  'min-w-0 flex-1 text-left text-[10px] font-semibold leading-snug tracking-tight',
                  'line-clamp-2 break-words [overflow-wrap:anywhere]'
                )}
                title={product.title}
              >
                {product.title}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <div
        className={cn(
          'px-2 flex flex-col gap-1 overflow-hidden cursor-pointer',
          surfaces.meta,
          isMerged ? 'pt-0 pb-0.5' : 'pt-0.5 pb-1',
          roundLeft && roundRight && 'rounded-b-xl',
          roundLeft && !roundRight && 'rounded-bl-xl',
          !roundLeft && roundRight && 'rounded-br-xl'
        )}
        style={surfaces.metaStyle}
        onClick={(e) => {
          if (isSoldOut) return
          if ((e.target as HTMLElement).closest('button')) return
          handleLampSelect()
        }}
      >
        <div className="w-full min-w-0 flex flex-col items-center text-center">
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <p className={cn(
              'text-xs transition-colors duration-200 ease-out',
              isInCart ? 'text-neutral-600 dark:text-[#d4b8b8]' : 'text-neutral-500 dark:text-[#c4a0a0]',
              isEarlyAccess && 'text-violet-600 dark:text-violet-400 font-semibold'
            )}>{formatPrice(product, isEarlyAccess)}</p>
            {isEarlyAccess && product.priceRange?.minVariantPrice?.amount && (
              <p className={cn(
                'text-[10px] line-through',
                isInCart ? 'text-neutral-500 dark:text-[#c4a0a0]' : 'text-neutral-400 dark:text-[#a09090]'
              )}>
                ${formatPriceCompact(parseFloat(product.priceRange.minVariantPrice.amount))}
              </p>
            )}
          </div>
          {crewCount > 0 && (
            <p className={cn(
              'text-[10px] mt-0.5',
              isInCart ? 'text-neutral-500 dark:text-[#c4a0a0]' : 'text-neutral-500 dark:text-[#c4a0a0]'
            )}>
              {crewCount} in your crew
            </p>
          )}
          <EditionBadgeForProduct product={product} className="mt-1" chipOnly />
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0 justify-end w-full">
          <button
            data-highlight-btn={isFirstCard ? 'eye' : undefined}
            type="button"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onStepTried?.(0); handleLampSelect() }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className={cn(
              'flex items-center justify-center rounded-full transition-all duration-200',
              isFirstCard && showHighlightAnimation && highlightStep === 0
                ? `w-5 h-5 ${wizardHighlightClass} text-blue-50 bg-blue-500/70`
                : 'w-4 h-4',
              !(isFirstCard && showHighlightAnimation && highlightStep === 0) && (
                isLampSelection
                  ? 'text-blue-500'
                  : isInCart
                    ? 'hover:bg-blue-200/40 dark:hover:bg-white/10 text-blue-700 dark:text-[#f0e8e8]/80 hover:text-blue-800 dark:hover:text-[#f0e8e8]'
                    : 'hover:bg-neutral-100 dark:hover:bg-[#262222] text-neutral-400 dark:text-[#c4a0a0] hover:text-neutral-600 dark:hover:text-[#e8d4d4]'
              )
            )}
            title={isLampSelection ? `Side ${lampPosition} on lamp` : 'Preview on lamp'}
            aria-label={isLampSelection ? `Side ${lampPosition} on lamp preview` : 'Preview on lamp'}
          >
            {isLampSelection ? (
              <span className="w-4 h-4 flex items-center justify-center rounded-full bg-green-600 text-white text-[9px] font-bold tabular-nums leading-none">
                {lampPosition}
              </span>
            ) : isFirstCard && showHighlightAnimation && highlightStep === 0 ? (
              <motion.span
                animate={{ scale: [1, 1.08, 1], opacity: [1, 0.85, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="flex items-center justify-center"
              >
                <Eye className="w-2.5 h-2.5" />
              </motion.span>
            ) : (
              <Eye className="w-2.5 h-2.5" />
            )}
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onStepTried?.(1); onViewDetail(product) }}
            className="flex items-center justify-center w-4 h-4 rounded-full bg-white/90 dark:bg-[#171515]/85 backdrop-blur-sm text-neutral-700 dark:text-[#f0e8e8] hover:text-neutral-900 dark:hover:text-[#f0e8e8] hover:bg-white dark:hover:bg-black/70 transition-all shrink-0"
            title="View artwork details"
            aria-label="View artwork details"
          >
            <Info className="w-3 h-3" />
          </button>
          <button
            data-highlight-btn={isFirstCard ? 'add' : undefined}
            type="button"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onStepTried?.(2); onAddToCart(product) }}
            disabled={isSoldOut}
            title={isInCart ? 'Remove from order' : 'Add artwork to order'}
            className={cn(
              'flex items-center justify-center shrink-0 overflow-visible',
              'transition-[background-color,border-color,color,box-shadow,width,height,padding] duration-200 ease-out',
              isFirstCard && showHighlightAnimation && highlightStep === 2 && `${wizardHighlightClass} text-blue-50 bg-blue-500/70 rounded-md`,
              isInCart && 'h-5 w-5 p-0',
              !isInCart && 'h-5 px-2 rounded-md border border-white/40 dark:border-white/10 bg-white/60 dark:bg-[#262222]/80 backdrop-blur-xl hover:border-neutral-400 dark:hover:border-[#4a4444] hover:bg-white/80 dark:hover:bg-[#2c2828]/90',
              !(isFirstCard && showHighlightAnimation && highlightStep === 2) && isInCart && 'text-[#047AFF]',
              !(isFirstCard && showHighlightAnimation && highlightStep === 2) && !isInCart && 'text-neutral-600 dark:text-[#e8d4d4]',
              isSoldOut && 'opacity-40 cursor-not-allowed'
            )}
            style={!isInCart && !isSoldOut ? { backdropFilter: 'blur(12px) saturate(180%)', WebkitBackdropFilter: 'blur(12px) saturate(180%)' } : undefined}
            aria-label={isInCart ? 'Remove from order' : 'Add artwork to order'}
          >
            {isInCart ? (
              <SparkleCheck justAdded={justAdded} />
            ) : isFirstCard && showHighlightAnimation && highlightStep === 2 ? (
              <motion.span
                animate={{ scale: [1, 1.05, 1], opacity: [1, 0.9, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-[10px] font-medium leading-none"
              >
                Add
              </motion.span>
            ) : (
              <span className="text-[10px] font-medium leading-none">Add</span>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

/** Fallback estimate; actual height measured via measureElement (includes row bottom gap) */
const ROW_HEIGHT_ESTIMATE = 480

interface ArtworkStripProps {
  scrollRef: React.RefObject<HTMLDivElement | null>
  products: ShopifyProduct[]
  previewIndex: number
  lampPreviewOrder: string[]
  cartOrder: string[]
  lastAddedProductId?: string | null
  scrollToProductId?: string | null
  showWishlistHearts?: boolean
  /** Map of productId -> crew count. Used when authenticated and user has enough ratings. */
  crewCountMap?: Record<string, number>
  onPreview: (index: number) => void
  onLampSelect: (product: ShopifyProduct) => void
  onAddToCart: (product: ShopifyProduct) => void
  onViewDetail: (product: ShopifyProduct) => void
  /** 0=info, 1=eye, 2=add — which button to highlight (cycling) */
  highlightStep?: number
  /** When true, show highlight animation on first card */
  showHighlightAnimation?: boolean
  /** Called when user tries a step (Info=0, Eye=1, Add=2) on first card */
  onStepTried?: (step: 0 | 1 | 2) => void
  /** Prefetch full product when card enters view (for instant detail drawer) */
  onPrefetchProduct?: (product: ShopifyProduct) => void
  /** When true, show load-more sentinel and call onLoadMore when it enters viewport */
  hasMore?: boolean
  onLoadMore?: () => void
  isLoadingMore?: boolean
  /** Set of product IDs user already owns (from orders). Used for "Collected" badge. */
  collectedProductIds?: Set<string>
  /** Product IDs in the "New Drop" spotlight series (for badge) */
  newDropProductIds?: Set<string>
  /** When true, spotlight is unlisted; show "Early access" on spotlight artworks instead of "New Drop" */
  spotlightUnlisted?: boolean
  /** When true, show Information button in card bottom bar (mobile) */
  isMobile?: boolean
}

function formatPrice(product: ShopifyProduct, isEarlyAccess = false): string {
  const amount = product.priceRange?.minVariantPrice?.amount
  if (!amount) return ''
  const originalPrice = parseFloat(amount)
  if (isEarlyAccess) {
    const discountedPrice = Math.round(originalPrice * 0.9 * 100) / 100
    return `$${formatPriceCompact(discountedPrice)}`
  }
  return `$${formatPriceCompact(originalPrice)}`
}

const SENTINEL_HEIGHT = 80

// Stable seeded shuffle — always includes both first-row cards (indices 0 & 1) plus
// 3 more random available cards from the rest of the grid.
function seededNudgeIndices(products: ShopifyProduct[]): number[] {
  if (products.length === 0) return []
  // Simple hash from first few product IDs for stability
  let seed = 0
  for (let i = 0; i < Math.min(products.length, 4); i++) {
    const id = products[i].id
    for (let j = 0; j < id.length; j++) seed = (seed * 31 + id.charCodeAt(j)) >>> 0
  }
  // Always start with first-row cards that are available
  const firstRow = [0, 1].filter((i) => i < products.length && products[i].availableForSale)
  const available = products
    .map((_, i) => i)
    .filter((i) => i > 1 && products[i].availableForSale)
  const extra: number[] = []
  let s = seed
  while (extra.length < 3 && available.length > 0) {
    s = (s * 1664525 + 1013904223) >>> 0
    const pick = s % available.length
    extra.push(available[pick])
    available.splice(pick, 1)
  }
  return [...firstRow, ...extra]
}

export function ArtworkStrip({
  scrollRef,
  products,
  previewIndex,
  lampPreviewOrder,
  cartOrder,
  lastAddedProductId,
  scrollToProductId,
  showWishlistHearts = false,
  crewCountMap,
  onPreview,
  onLampSelect,
  onAddToCart,
  onViewDetail,
  highlightStep = 0,
  showHighlightAnimation = false,
  onStepTried,
  onPrefetchProduct,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  collectedProductIds,
  newDropProductIds,
  spotlightUnlisted = false,
  isMobile = false,
}: ArtworkStripProps) {
  // Tap-nudge: pick 4 random card indices, animate them one by one until user taps any card
  const [nudgeDone, setNudgeDone] = useState(false)
  const nudgeIndicesRef = useRef<number[]>([])
  if (nudgeIndicesRef.current.length === 0 && products.length > 0) {
    nudgeIndicesRef.current = seededNudgeIndices(products)
  }
  const nudgeIndices = nudgeIndicesRef.current

  const handleLampSelectWithNudge = useCallback((product: ShopifyProduct) => {
    setNudgeDone(true)
    onLampSelect(product)
  }, [onLampSelect])

  const handleAddToCartWithNudge = useCallback((product: ShopifyProduct) => {
    setNudgeDone(true)
    onAddToCart(product)
  }, [onAddToCart])

  const isProductCollected = useCallback((productId: string) => {
    if (!collectedProductIds?.size) return false
    const numeric = productId.replace(/^gid:\/\/shopify\/Product\//i, '') || productId
    return collectedProductIds.has(productId) || collectedProductIds.has(numeric)
  }, [collectedProductIds])
  const isProductNewDrop = useCallback((productId: string) => {
    if (!newDropProductIds?.size) return false
    const numeric = productId.replace(/^gid:\/\/shopify\/Product\//i, '') || productId
    return newDropProductIds.has(productId) || newDropProductIds.has(numeric)
  }, [newDropProductIds])
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null)
  const rows = useMemo(() => buildArtworkRowsByArtist(products), [products])
  const productIndexById = useMemo(() => {
    const m = new Map<string, number>()
    products.forEach((p, i) => {
      m.set(p.id, i)
    })
    return m
  }, [products])
  const rowCount = rows.length
  const totalRows = rowCount + (hasMore ? 1 : 0)

  const rowVirtualizer = useVirtualizer({
    count: totalRows,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => (index >= rowCount ? SENTINEL_HEIGHT : ROW_HEIGHT_ESTIMATE),
    overscan: 6,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const sentinelInWindow = virtualRows.some((vr) => vr.index >= rowCount)

  useEffect(() => {
    if (!hasMore || !onLoadMore || isLoadingMore) return
    const el = loadMoreSentinelRef.current
    const scrollEl = scrollRef.current
    if (!el || !scrollEl) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore()
      },
      { root: scrollEl, rootMargin: '400px 0px', threshold: 0 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, onLoadMore, isLoadingMore, sentinelInWindow])

  useEffect(() => {
    if (!scrollToProductId) return
    const rowIdx = rowIndexForProductId(rows, scrollToProductId)
    rowVirtualizer.scrollToIndex(rowIdx, { align: 'center', behavior: 'smooth' })
  }, [scrollToProductId, rows, rowVirtualizer])

  // Prefetch full product data when cards enter the virtualized view
  useEffect(() => {
    if (!onPrefetchProduct) return
    virtualRows.forEach((vr) => {
      if (vr.index >= rowCount) return
      const row = rows[vr.index]
      row.forEach((p) => {
        if (p?.handle) onPrefetchProduct(p)
      })
    })
  }, [virtualRows, rows, rowCount, onPrefetchProduct])

  const getLampPosition = (productId: string): 1 | 2 | null => {
    const idx = lampPreviewOrder.indexOf(productId)
    if (idx === 0) return 1
    if (idx === 1) return 2
    return null
  }

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-neutral-400 text-sm">
        No artworks match your search or filters
      </div>
    )
  }

  return (
    <div
      data-wizard-artwork-strip
      className="relative max-w-2xl mx-auto"
      style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
    >
      {virtualRows.map((virtualRow) => {
        if (virtualRow.index >= rowCount) {
          return (
            <div
              key={virtualRow.key}
              ref={(node) => {
                loadMoreSentinelRef.current = node
                rowVirtualizer.measureElement(node)
              }}
              data-index={virtualRow.index}
              className="absolute top-0 left-0 w-full flex items-center justify-center py-6"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
                height: SENTINEL_HEIGHT,
              }}
            >
              {isLoadingMore ? (
                <div className="flex items-center gap-2 text-neutral-400 text-sm">
                  <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-500 rounded-full animate-spin" />
                  Loading more…
                </div>
              ) : null}
            </div>
          )
        }
        const row = rows[virtualRow.index]
        const product1 = row[0]
        const product2 = row[1]
        const g1 = product1 ? (productIndexById.get(product1.id) ?? -1) : -1
        const g2 = product2 ? (productIndexById.get(product2.id) ?? -1) : -1
        const p1InCart = product1 && cartOrder.includes(product1.id)
        const p2InCart = product2 && cartOrder.includes(product2.id)
        const bothInCart = !!(p1InCart && p2InCart)
        const sameVendor = !!(product1 && product2 && product1.vendor === product2.vendor)
        const shouldMerge = bothInCart && sameVendor
        const showArtistSpine = row.length === 2
        const artistLabel = (product1?.vendor || product2?.vendor || 'Artist').trim() || 'Artist'
        const justMerged = shouldMerge && (
          product1?.id === lastAddedProductId ||
          product2?.id === lastAddedProductId
        )
        return (
          <div
            key={virtualRow.key}
            ref={rowVirtualizer.measureElement}
            data-index={virtualRow.index}
            className={cn(
              'absolute top-0 left-0 w-full',
              shouldMerge ? 'py-4 md:py-6' : 'pb-12 md:pb-16',
              virtualRow.index === 0 && showHighlightAnimation && 'z-10'
            )}
            style={{
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {showArtistSpine ? (
              <div
                className={cn(
                  'relative flex items-stretch rounded-xl overflow-hidden',
                  shouldMerge ? experienceArtistRowMergeClass : experienceArtistRowDefaultClass
                )}
              >
                {shouldMerge && <MergeConfetti active={justMerged} />}
                {product1 && g1 >= 0 && (
                  <div className={cn('flex-1 min-w-0', shouldMerge && '-mr-px')}>
                    <ArtworkCard
                      key={product1.id}
                      product={product1}
                      globalIdx={g1}
                      isPreviewed={g1 === previewIndex}
                      isInCart={p1InCart}
                      justAdded={product1.id === lastAddedProductId}
                      isFirstCard={g1 === 0}
                      priorityLoad={g1 < 6}
                      lampPosition={getLampPosition(product1.id)}
                      isSoldOut={!product1.availableForSale}
                      imageUrl={product1.featuredImage?.url ?? product1.images?.edges?.[0]?.node?.url}
                      showWishlistHearts={showWishlistHearts}
                      crewCount={crewCountMap?.[product1.id]}
                      mergeWithRight
                      spinePairLayout
                      isCollected={isProductCollected(product1.id)}
                      isNewDrop={isProductNewDrop(product1.id)}
                      isEarlyAccess={spotlightUnlisted && isProductNewDrop(product1.id)}
                      onPreview={onPreview}
                      onLampSelect={handleLampSelectWithNudge}
                      onAddToCart={handleAddToCartWithNudge}
                      onViewDetail={onViewDetail}
                      highlightStep={highlightStep}
                      showHighlightAnimation={showHighlightAnimation}
                      onStepTried={onStepTried}
                      showTapNudge={!nudgeDone && nudgeIndices.includes(g1)}
                      tapNudgeDelay={nudgeIndices.indexOf(g1) * 1.2}
                      isMobile={isMobile}
                      suppressSelectionRing={shouldMerge}
                    />
                  </div>
                )}
                <div
                  className={cn(
                    'shrink-0 z-[1] self-stretch flex flex-col items-center justify-center bg-transparent',
                    shouldMerge ? 'px-0' : 'px-1.5'
                  )}
                >
                  <span
                    className={cn(
                      'text-[10px] font-semibold text-neutral-700 dark:text-[#f0e8e8]/90 uppercase whitespace-nowrap [writing-mode:vertical-rl] rotate-180',
                      shouldMerge ? 'py-0.5 tracking-wide' : 'py-2 tracking-widest'
                    )}
                  >
                    {artistLabel}
                  </span>
                </div>
                {product2 && g2 >= 0 && (
                  <div className={cn('flex-1 min-w-0', shouldMerge && '-ml-px')}>
                    <ArtworkCard
                      key={product2.id}
                      product={product2}
                      globalIdx={g2}
                      isPreviewed={g2 === previewIndex}
                      isInCart={p2InCart}
                      justAdded={product2.id === lastAddedProductId}
                      isFirstCard={g2 === 0}
                      priorityLoad={g2 < 6}
                      lampPosition={getLampPosition(product2.id)}
                      isSoldOut={!product2.availableForSale}
                      imageUrl={product2.featuredImage?.url ?? product2.images?.edges?.[0]?.node?.url}
                      showWishlistHearts={showWishlistHearts}
                      crewCount={crewCountMap?.[product2.id]}
                      mergeWithLeft
                      spinePairLayout
                      isCollected={isProductCollected(product2.id)}
                      isNewDrop={isProductNewDrop(product2.id)}
                      isEarlyAccess={spotlightUnlisted && isProductNewDrop(product2.id)}
                      onPreview={onPreview}
                      onLampSelect={handleLampSelectWithNudge}
                      onAddToCart={handleAddToCartWithNudge}
                      onViewDetail={onViewDetail}
                      highlightStep={highlightStep}
                      showHighlightAnimation={showHighlightAnimation}
                      onStepTried={onStepTried}
                      showTapNudge={!nudgeDone && nudgeIndices.includes(g2)}
                      tapNudgeDelay={nudgeIndices.indexOf(g2) * 1.2}
                      isMobile={isMobile}
                      suppressSelectionRing={shouldMerge}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="relative flex justify-center">
                {product1 && g1 >= 0 && (
                  <div className="w-[calc(50%-0.25rem)] md:w-[calc(50%-0.375rem)]">
                    <ArtworkCard
                      key={product1.id}
                      product={product1}
                      globalIdx={g1}
                      isPreviewed={g1 === previewIndex}
                      isInCart={!!p1InCart}
                      justAdded={product1.id === lastAddedProductId}
                      isFirstCard={g1 === 0}
                      priorityLoad={g1 < 6}
                      lampPosition={getLampPosition(product1.id)}
                      isSoldOut={!product1.availableForSale}
                      imageUrl={product1.featuredImage?.url ?? product1.images?.edges?.[0]?.node?.url}
                      showWishlistHearts={showWishlistHearts}
                      crewCount={crewCountMap?.[product1.id]}
                      isCollected={isProductCollected(product1.id)}
                      isNewDrop={isProductNewDrop(product1.id)}
                      isEarlyAccess={spotlightUnlisted && isProductNewDrop(product1.id)}
                      onPreview={onPreview}
                      onLampSelect={handleLampSelectWithNudge}
                      onAddToCart={handleAddToCartWithNudge}
                      onViewDetail={onViewDetail}
                      highlightStep={highlightStep}
                      showHighlightAnimation={showHighlightAnimation}
                      onStepTried={onStepTried}
                      showTapNudge={!nudgeDone && nudgeIndices.includes(g1)}
                      tapNudgeDelay={nudgeIndices.indexOf(g1) * 1.2}
                      isMobile={isMobile}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
