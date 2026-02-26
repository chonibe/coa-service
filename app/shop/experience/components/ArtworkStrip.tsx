'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import Image from 'next/image'
import { useVirtualizer } from '@tanstack/react-virtual'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Eye, Heart } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { useWishlist } from '@/lib/shop/WishlistContext'
import { cn } from '@/lib/utils'
import { ScarcityBadge } from './ScarcityBadge'

const SPARKLE_COUNT = 8
const SPARKLE_COLORS = ['#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#facc15', '#fde047']

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
      <Check className="w-2.5 h-2.5 text-green-500" strokeWidth={2.5} />
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
  showWishlistHearts?: boolean
  /** Crew count (taste-similar collectors who responded). Only shown when > 0. */
  crewCount?: number
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
  showWishlistHearts = false,
  crewCount = 0,
  onPreview,
  onLampSelect,
  onAddToCart,
  onViewDetail,
}: ArtworkCardProps) {
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

  return (
    <motion.div
      data-product-id={product.id}
      className={cn(
        'relative rounded-xl overflow-hidden transition-all duration-200',
        isInCart && 'overflow-visible',
        isInCart && 'bg-neutral-900',
        !isLampSelection && isPreviewed && !isInCart && 'opacity-90',
        !isLampSelection && !isPreviewed && !isInCart && 'opacity-85 hover:opacity-100'
      )}
    >
      <div
        className={cn(
          'aspect-[4/5] relative overflow-hidden cursor-pointer touch-manipulation select-none rounded-t-xl',
          isInCart ? 'bg-neutral-950' : 'bg-neutral-100'
        )}
        onClick={handleImageClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleLampSelect(); onViewDetail(product) } }}
        title="Tap for details + lamp preview"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 52vw, 28vw"
          />
        ) : (
          <div className={cn(
            'w-full h-full flex items-center justify-center text-xs',
            isInCart ? 'text-neutral-500' : 'text-neutral-300'
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
        {!isSoldOut && (
          <div className="absolute bottom-1.5 left-1.5">
            <ScarcityBadge
              availableForSale={product.availableForSale}
              variant="compact"
            />
          </div>
        )}
        {showWishlistHearts && (
          <button
            type="button"
            onClick={handleWishlistToggle}
            className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm touch-manipulation transition-all active:scale-95 hover:scale-105"
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              className={cn('w-4 h-4', inWishlist ? 'fill-rose-500 text-rose-500' : 'text-neutral-400 hover:text-rose-400')}
              strokeWidth={1.5}
            />
          </button>
        )}
      </div>

      <div className={cn(
        'p-2 pt-3 flex items-start gap-1 border-t transition-colors overflow-visible rounded-b-xl',
        isInCart
          ? 'border-white/20 bg-neutral-900/80 backdrop-blur-xl backdrop-saturate-150'
          : 'border-white/40 bg-white/60 backdrop-blur-xl backdrop-saturate-150'
      )}
        style={{ backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)' }}
      >
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-xs font-medium truncate',
            isInCart ? 'text-white' : 'text-neutral-800'
          )}>{product.title}</p>
          <p className={cn(
            'text-xs',
            isInCart ? 'text-neutral-300' : 'text-neutral-500'
          )}>{formatPrice(product)}</p>
          {crewCount > 0 && (
            <p className={cn(
              'text-[10px] mt-0.5',
              isInCart ? 'text-neutral-400' : 'text-neutral-500'
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
                  ? 'hover:bg-white/10 text-white/80 hover:text-white'
                  : 'hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600'
            )}
            title={isLampSelection ? `Side ${lampPosition} on lamp` : 'Preview on lamp'}
            aria-label={isLampSelection ? `Side ${lampPosition} on lamp preview` : 'Preview on lamp'}
          >
            {isLampSelection ? (
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-600 text-white text-[11px] font-bold tabular-nums">
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
            title={isInCart ? 'Remove from order' : 'Add to cart'}
            className={cn(
              'flex items-center justify-center transition-colors shrink-0 overflow-visible',
              isInCart
                ? 'min-w-[28px] min-h-[28px] p-0 text-green-500 hover:text-green-600'
                : 'h-6 px-2.5 rounded-md border border-white/40 bg-white/60 backdrop-blur-xl text-neutral-600 hover:border-neutral-400 hover:bg-white/80',
              isSoldOut && 'opacity-40 cursor-not-allowed'
            )}
            style={!isInCart && !isSoldOut ? { backdropFilter: 'blur(12px) saturate(180%)', WebkitBackdropFilter: 'blur(12px) saturate(180%)' } : undefined}
            aria-label={isInCart ? 'Remove from order' : 'Add to cart'}
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
}

function formatPrice(product: ShopifyProduct): string {
  const amount = product.priceRange?.minVariantPrice?.amount
  if (!amount) return ''
  return `$${parseFloat(amount).toFixed(2)}`
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
}: ArtworkStripProps) {
  const rowCount = Math.ceil(products.length / 2)

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT_ESTIMATE,
    overscan: 3,
  })

  useEffect(() => {
    if (!scrollToProductId) return
    const idx = products.findIndex((p) => p.id === scrollToProductId)
    if (idx >= 0) {
      const rowIdx = Math.floor(idx / 2)
      rowVirtualizer.scrollToIndex(rowIdx, { align: 'center', behavior: 'smooth' })
    }
  }, [scrollToProductId, products, rowVirtualizer])

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

  const virtualRows = rowVirtualizer.getVirtualItems()

  return (
    <div
      data-wizard-artwork-strip
      className="relative max-w-2xl mx-auto"
      style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
    >
      {virtualRows.map((virtualRow) => {
        const startIdx = virtualRow.index * 2
        const product1 = products[startIdx]
        const product2 = products[startIdx + 1]
        return (
          <div
            key={virtualRow.key}
            ref={rowVirtualizer.measureElement}
            data-index={virtualRow.index}
            className="absolute top-0 left-0 w-full"
            style={{
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              {product1 && (
                <ArtworkCard
                  key={product1.id}
                  product={product1}
                  globalIdx={startIdx}
                  isPreviewed={startIdx === previewIndex}
                  isInCart={cartOrder.includes(product1.id)}
                  justAdded={product1.id === lastAddedProductId}
                  isFirstCard={startIdx === 0}
                  lampPosition={getLampPosition(product1.id)}
                  isSoldOut={!product1.availableForSale}
                  imageUrl={product1.featuredImage?.url ?? product1.images?.edges?.[0]?.node?.url}
                  showWishlistHearts={showWishlistHearts}
                  crewCount={crewCountMap?.[product1.id]}
                  onPreview={onPreview}
                  onLampSelect={onLampSelect}
                  onAddToCart={onAddToCart}
                  onViewDetail={onViewDetail}
                />
              )}
              {product2 && (
                <ArtworkCard
                  key={product2.id}
                  product={product2}
                  globalIdx={startIdx + 1}
                  isPreviewed={startIdx + 1 === previewIndex}
                  isInCart={cartOrder.includes(product2.id)}
                  justAdded={product2.id === lastAddedProductId}
                  lampPosition={getLampPosition(product2.id)}
                  isSoldOut={!product2.availableForSale}
                  imageUrl={product2.featuredImage?.url ?? product2.images?.edges?.[0]?.node?.url}
                  showWishlistHearts={showWishlistHearts}
                  crewCount={crewCountMap?.[product2.id]}
                  onPreview={onPreview}
                  onLampSelect={onLampSelect}
                  onAddToCart={onAddToCart}
                  onViewDetail={onViewDetail}
                />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
