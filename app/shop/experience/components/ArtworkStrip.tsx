'use client'

import { useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Check, Eye } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { cn } from '@/lib/utils'
import { ScarcityBadge } from './ScarcityBadge'

interface ArtworkCardProps {
  product: ShopifyProduct
  globalIdx: number
  isPreviewed: boolean
  isInCart: boolean
  /** 1 = Side A on lamp, 2 = Side B on lamp, null = not in lamp preview */
  lampPosition: 1 | 2 | null
  isSoldOut: boolean
  imageUrl: string | undefined
  isFirstCard?: boolean
  onPreview: (index: number) => void
  onLampSelect: (product: ShopifyProduct) => void
  onAddToCart: (product: ShopifyProduct) => void
  onViewDetail: (product: ShopifyProduct) => void
}

function ArtworkCard({
  product,
  globalIdx,
  isPreviewed,
  isInCart,
  lampPosition,
  isSoldOut,
  imageUrl,
  isFirstCard,
  onPreview,
  onLampSelect,
  onAddToCart,
  onViewDetail,
}: ArtworkCardProps) {
  const isLampSelection = lampPosition === 1 || lampPosition === 2

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
      whileHover={!isLampSelection && !isInCart ? { scale: 1.02 } : undefined}
      whileTap={!isLampSelection && !isInCart ? { scale: 0.98 } : undefined}
      className={cn(
        'relative rounded-lg overflow-hidden transition-all duration-200',
        isInCart && 'bg-neutral-900',
        !isLampSelection && isPreviewed && !isInCart && 'opacity-90',
        !isLampSelection && !isPreviewed && !isInCart && 'opacity-85 hover:opacity-100'
      )}
    >
      <div
        className={cn(
          'aspect-square relative overflow-hidden cursor-pointer touch-manipulation select-none',
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
            sizes="(max-width: 768px) 45vw, 18vw"
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
      </div>

      <div className={cn(
        'p-2 pt-3 flex items-start gap-1 border-t transition-colors',
        isInCart ? 'border-neutral-700 bg-neutral-900' : 'border-neutral-100'
      )}>
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-xs font-medium truncate',
            isInCart ? 'text-white' : 'text-neutral-800'
          )}>{product.title}</p>
          <p className={cn(
            'text-xs',
            isInCart ? 'text-neutral-300' : 'text-neutral-500'
          )}>{formatPrice(product)}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
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
            title={isLampSelection ? 'On lamp preview' : 'Preview on lamp'}
            aria-label="Preview on lamp"
          >
            <Eye className="w-3 h-3" />
          </button>
          <button
            data-wizard-add-btn={isFirstCard ? '' : undefined}
            type="button"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onAddToCart(product) }}
            disabled={isSoldOut}
            title={isInCart ? 'Remove from order' : 'Add to cart'}
            className={cn(
              'flex items-center justify-center transition-colors shrink-0',
              isInCart
                ? 'w-5 h-5 rounded-full text-green-500 hover:text-green-600'
                : 'h-6 px-2.5 rounded-md border border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50',
              isSoldOut && 'opacity-40 cursor-not-allowed'
            )}
            aria-label={isInCart ? 'Remove from order' : 'Add to cart'}
          >
            {isInCart ? (
              <Check className="w-2.5 h-2.5 text-green-500" strokeWidth={2.5} />
            ) : (
              <span className="text-xs font-medium">Add</span>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

interface ArtworkStripProps {
  products: ShopifyProduct[]
  previewIndex: number
  lampPreviewOrder: string[]
  cartOrder: string[]
  scrollToProductId?: string | null
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
  products,
  previewIndex,
  lampPreviewOrder,
  cartOrder,
  scrollToProductId,
  onPreview,
  onLampSelect,
  onAddToCart,
  onViewDetail,
}: ArtworkStripProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!scrollToProductId) return
    const el = document.querySelector(`[data-product-id="${scrollToProductId}"]`)
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [scrollToProductId])

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
    <div ref={containerRef} data-wizard-artwork-strip className="grid grid-cols-2 gap-3">
      {products.map((product, index) => (
        <ArtworkCard
          key={product.id}
          product={product}
          globalIdx={index}
          isPreviewed={index === previewIndex}
          isInCart={cartOrder.includes(product.id)}
          isFirstCard={index === 0}
            lampPosition={getLampPosition(product.id)}
            isSoldOut={!product.availableForSale}
            imageUrl={product.featuredImage?.url ?? product.images?.edges?.[0]?.node?.url}
            onPreview={onPreview}
            onLampSelect={onLampSelect}
            onAddToCart={onAddToCart}
            onViewDetail={onViewDetail}
          />
      ))}
    </div>
  )
}
