'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import Image from 'next/image'
import { useVirtualizer } from '@tanstack/react-virtual'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Eye, Heart, Info, Package } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import { useWishlist } from '@/lib/shop/WishlistContext'
import { cn } from '@/lib/utils'
import { ScarcityBadge } from './ScarcityBadge'

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
      animate={tickGrow ? { scale: [1, 1.35, 1] } : { scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Check className="w-2.5 h-2.5 text-[#047AFF]" strokeWidth={2.5} />
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
  /** When true, user already owns this artwork (from past orders) */
  isCollected?: boolean
  /** When true, artwork is part of the current artist spotlight "New Drop" */
  isNewDrop?: boolean
  onPreview: (index: number) => void
  onLampSelect: (product: ShopifyProduct) => void
  onAddToCart: (product: ShopifyProduct) => void
  onViewDetail: (product: ShopifyProduct) => void
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
  isCollected = false,
  isNewDrop = false,
  onPreview,
  onLampSelect,
  onAddToCart,
  onViewDetail,
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
    onViewDetail(product)
  }

  const isMerged = isInCart && (mergeWithLeft || mergeWithRight)
  const roundLeft = !isMerged || mergeWithRight
  const roundRight = !isMerged || mergeWithLeft

  return (
    <motion.div
      data-product-id={product.id}
      data-wizard-first-card={isFirstCard ? '' : undefined}
      className={cn(
        'relative overflow-hidden transition-all duration-200 origin-center',
        roundLeft && roundRight && 'rounded-xl',
        roundLeft && !roundRight && 'rounded-l-xl',
        !roundLeft && roundRight && 'rounded-r-xl',
        isInCart && 'overflow-visible',
        isInCart && 'bg-[#e8f4ff] dark:bg-neutral-900',
        isInCart && !isMerged && 'scale-[0.95]',
      )}
    >
      <div
        className={cn(
          'aspect-[4/5] relative overflow-hidden cursor-pointer touch-manipulation select-none',
          roundLeft && roundRight && 'rounded-t-xl',
          roundLeft && !roundRight && 'rounded-tl-xl',
          !roundLeft && roundRight && 'rounded-tr-xl',
          isInCart ? 'bg-[#e8f4ff] dark:bg-neutral-950' : 'bg-neutral-100 dark:bg-neutral-800'
        )}
        onClick={handleImageClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleLampSelect(); onViewDetail(product) } }}
        title="Tap for details + lamp preview"
      >
        {imageUrl ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 bg-neutral-200/80 dark:bg-neutral-700/50 animate-pulse" />
            )}
            <Image
              src={getShopifyImageUrl(imageUrl, 500) ?? imageUrl}
              alt={product.title}
              fill
              className={cn('object-cover transition-opacity duration-200', imageLoaded ? 'opacity-100' : 'opacity-0')}
              sizes="(max-width: 768px) 52vw, 28vw"
              priority={priorityLoad}
              loading={priorityLoad ? 'eager' : 'lazy'}
              onLoad={() => setImageLoaded(true)}
            />
          </>
        ) : (
          <div className={cn(
            'w-full h-full flex items-center justify-center text-xs',
            isInCart ? 'text-neutral-500' : 'text-neutral-300 dark:text-neutral-500'
          )}>
            No image
          </div>
        )}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-xs font-semibold text-white bg-black/60 px-2 py-1 rounded-full">
              Sold Out
            </span>
          </div>
        )}
        {isCollected && !isSoldOut && (
          <div
            className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/90 text-white backdrop-blur-sm"
            title="Already in your collection"
          >
            <Package className="w-3 h-3" strokeWidth={2} />
            <span className="text-[10px] font-medium">Collected</span>
          </div>
        )}
        {isNewDrop && !isSoldOut && !isCollected && (
          <div
            className="absolute top-1.5 right-10 z-10 px-1.5 py-0.5 rounded-md bg-amber-500/95 text-white text-[10px] font-semibold backdrop-blur-sm"
            title="New drop from spotlight artist"
          >
            New Drop
          </div>
        )}
        {!isSoldOut && (
          <div className="absolute bottom-1.5 left-1.5">
            <ScarcityBadge
              availableForSale={product.availableForSale}
              variant="compact"
            />
          </div>
        )}
        <button
          data-wizard-info-btn={isFirstCard ? '' : undefined}
          type="button"
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onViewDetail(product) }}
          className="absolute top-0.5 right-0.5 z-10 w-5 h-5 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          aria-label="View artwork details"
        >
          <Info className="w-3.5 h-3.5" />
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
      </div>

      <div
        className={cn(
          'px-2 py-1.5 flex items-center gap-1 border-t transition-colors overflow-hidden cursor-pointer',
          roundLeft && roundRight && 'rounded-b-xl',
          roundLeft && !roundRight && 'rounded-bl-xl',
          !roundLeft && roundRight && 'rounded-br-xl',
          isInCart
            ? 'border-blue-200/60 dark:border-white/20 bg-[#e8f4ff]/95 dark:bg-neutral-900/80 backdrop-blur-xl backdrop-saturate-150'
            : 'border-white/40 dark:border-white/10 bg-white/60 dark:bg-neutral-800/80 backdrop-blur-xl backdrop-saturate-150'
        )}
        style={{ backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)' }}
        onClick={(e) => {
          if (isSoldOut) return
          if ((e.target as HTMLElement).closest('button')) return
          handleLampSelect()
        }}
      >
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-xs font-medium truncate',
            isInCart ? 'text-neutral-800 dark:text-white' : 'text-neutral-800 dark:text-neutral-100'
          )}>{product.title}</p>
          <p className={cn(
            'text-xs',
            isInCart ? 'text-neutral-600 dark:text-neutral-300' : 'text-neutral-500 dark:text-neutral-400'
          )}>{formatPrice(product)}</p>
          {crewCount > 0 && (
            <p className={cn(
              'text-[10px] mt-0.5',
              isInCart ? 'text-neutral-500 dark:text-neutral-400' : 'text-neutral-500 dark:text-neutral-400'
            )}>
              {crewCount} in your crew
            </p>
          )}
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleLampSelect() }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className={cn(
              'w-5 h-5 flex items-center justify-center rounded-full transition-colors',
              isLampSelection
                ? 'text-blue-500'
                : isInCart
                  ? 'hover:bg-blue-200/40 dark:hover:bg-white/10 text-blue-700 dark:text-white/80 hover:text-blue-800 dark:hover:text-white'
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400 dark:text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
            )}
            title={isLampSelection ? `Side ${lampPosition} on lamp` : 'Preview on lamp'}
            aria-label={isLampSelection ? `Side ${lampPosition} on lamp preview` : 'Preview on lamp'}
          >
            {isLampSelection ? (
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-green-600 text-white text-[11px] font-bold tabular-nums">
                {lampPosition}
              </span>
            ) : (
              <Eye className="w-3 h-3" />
            )}
          </button>
          <button
            data-wizard-add-btn={isFirstCard ? '' : undefined}
            type="button"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onAddToCart(product) }}
            disabled={isSoldOut}
            title={isInCart ? 'Remove from order' : 'Add artwork to order'}
            className={cn(
              'flex items-center justify-center transition-colors shrink-0 overflow-visible',
              isInCart
                ? 'h-6 w-6 p-0 text-[#047AFF]'
                : 'h-6 px-2.5 rounded-md border border-white/40 dark:border-white/10 bg-white/60 dark:bg-neutral-700/80 backdrop-blur-xl text-neutral-600 dark:text-neutral-200 hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-white/80 dark:hover:bg-neutral-600/90',
              isSoldOut && 'opacity-40 cursor-not-allowed'
            )}
            style={!isInCart && !isSoldOut ? { backdropFilter: 'blur(12px) saturate(180%)', WebkitBackdropFilter: 'blur(12px) saturate(180%)' } : undefined}
            aria-label={isInCart ? 'Remove from order' : 'Add artwork to order'}
          >
            {isInCart ? (
              <SparkleCheck justAdded={justAdded} />
            ) : (
              <span className="text-xs font-medium">Add</span>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

/** Fallback estimate; actual height measured via measureElement */
const ROW_HEIGHT_ESTIMATE = 320

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
}

function formatPrice(product: ShopifyProduct): string {
  const amount = product.priceRange?.minVariantPrice?.amount
  if (!amount) return ''
  return `$${parseFloat(amount).toFixed(2)}`
}

const SENTINEL_HEIGHT = 80

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
  onPrefetchProduct,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  collectedProductIds,
  newDropProductIds,
}: ArtworkStripProps) {
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
  const rowCount = Math.ceil(products.length / 2)
  const totalRows = rowCount + (hasMore ? 1 : 0)

  const rowVirtualizer = useVirtualizer({
    count: totalRows,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => (index >= rowCount ? SENTINEL_HEIGHT : ROW_HEIGHT_ESTIMATE),
    overscan: 3,
  })

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
  }, [hasMore, onLoadMore, isLoadingMore])

  useEffect(() => {
    if (!scrollToProductId) return
    const idx = products.findIndex((p) => p.id === scrollToProductId)
    if (idx >= 0) {
      const rowIdx = Math.floor(idx / 2)
      rowVirtualizer.scrollToIndex(rowIdx, { align: 'center', behavior: 'smooth' })
    }
  }, [scrollToProductId, products, rowVirtualizer])

  // Prefetch full product data when cards enter the virtualized view
  const virtualRows = rowVirtualizer.getVirtualItems()
  useEffect(() => {
    if (!onPrefetchProduct) return
    virtualRows.forEach((vr) => {
      if (vr.index >= rowCount) return
      const p1 = products[vr.index * 2]
      const p2 = products[vr.index * 2 + 1]
      if (p1?.handle) onPrefetchProduct(p1)
      if (p2?.handle) onPrefetchProduct(p2)
    })
  }, [virtualRows, products, rowCount, onPrefetchProduct])

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
        const startIdx = virtualRow.index * 2
        const product1 = products[startIdx]
        const product2 = products[startIdx + 1]
        const p1InCart = product1 && cartOrder.includes(product1.id)
        const p2InCart = product2 && cartOrder.includes(product2.id)
        const bothInCart = !!(p1InCart && p2InCart)
        const sameVendor = !!(product1 && product2 && product1.vendor === product2.vendor)
        const shouldMerge = bothInCart && sameVendor
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
              shouldMerge ? 'py-2 md:py-2' : 'pb-2 md:pb-3'
            )}
            style={{
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <div className={cn(
              'relative',
              shouldMerge ? 'flex rounded-xl border-2 border-blue-300 dark:border-[#047AFF] overflow-hidden bg-[#e8f4ff] dark:bg-neutral-900' : 'grid grid-cols-2 gap-x-2 md:gap-x-3'
            )}>
              {shouldMerge && <MergeConfetti active={justMerged} />}
              {product1 && (
                <div className={shouldMerge ? 'flex-1 min-w-0' : undefined}>
                  <ArtworkCard
                    key={product1.id}
                    product={product1}
                    globalIdx={startIdx}
                    isPreviewed={startIdx === previewIndex}
                    isInCart={p1InCart}
                    justAdded={product1.id === lastAddedProductId}
                    isFirstCard={startIdx === 0}
                    priorityLoad={startIdx < 6}
                    lampPosition={getLampPosition(product1.id)}
                    isSoldOut={!product1.availableForSale}
                    imageUrl={product1.featuredImage?.url ?? product1.images?.edges?.[0]?.node?.url}
                    showWishlistHearts={showWishlistHearts}
                    crewCount={crewCountMap?.[product1.id]}
                    mergeWithRight={shouldMerge}
                    isCollected={isProductCollected(product1.id)}
                    isNewDrop={isProductNewDrop(product1.id)}
                    onPreview={onPreview}
                    onLampSelect={onLampSelect}
                    onAddToCart={onAddToCart}
                    onViewDetail={onViewDetail}
                  />
                </div>
              )}
              {shouldMerge && product1 && (
                <div className="shrink-0 flex flex-col items-center justify-center bg-[#e8f4ff] dark:bg-neutral-900 px-1.5 border-l border-r border-blue-200/60 dark:border-white/20">
                  <span className="text-[10px] font-semibold text-neutral-700 dark:text-white/90 uppercase tracking-widest whitespace-nowrap [writing-mode:vertical-rl] rotate-180 py-2">
                    {product1.vendor}
                  </span>
                </div>
              )}
              {product2 && (
                <div className={shouldMerge ? 'flex-1 min-w-0' : undefined}>
                  <ArtworkCard
                    key={product2.id}
                    product={product2}
                    globalIdx={startIdx + 1}
                    isPreviewed={startIdx + 1 === previewIndex}
                    isInCart={p2InCart}
                    justAdded={product2.id === lastAddedProductId}
                    priorityLoad={startIdx + 1 < 6}
                    lampPosition={getLampPosition(product2.id)}
                    isSoldOut={!product2.availableForSale}
                    imageUrl={product2.featuredImage?.url ?? product2.images?.edges?.[0]?.node?.url}
                    showWishlistHearts={showWishlistHearts}
                    crewCount={crewCountMap?.[product2.id]}
                    mergeWithLeft={shouldMerge}
                    isCollected={isProductCollected(product2.id)}
                    isNewDrop={isProductNewDrop(product2.id)}
                    onPreview={onPreview}
                    onLampSelect={onLampSelect}
                    onAddToCart={onAddToCart}
                    onViewDetail={onViewDetail}
                  />
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
