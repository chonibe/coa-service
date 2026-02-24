'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, X, ChevronDown, ChevronUp, Percent } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { cn } from '@/lib/utils'

interface OrderBarProps {
  lamp: ShopifyProduct
  selectedArtworks: ShopifyProduct[]
  lampQuantity: number
  onLampQuantityChange: (qty: number) => void
  onRemoveArtwork: (id: string) => void
  onSelectArtwork?: (product: ShopifyProduct) => void
  isGift: boolean
}

function parsePrice(product: ShopifyProduct): number {
  const amount = product.priceRange?.minVariantPrice?.amount
  return amount ? parseFloat(amount) : 0
}

function getVariantId(product: ShopifyProduct): string {
  const gid = product.variants?.edges?.[0]?.node?.id ?? ''
  return gid.replace('gid://shopify/ProductVariant/', '')
}

function AnimatedPrice({ value }: { value: number }) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)

  useEffect(() => {
    const from = prev.current
    const to = value
    prev.current = value
    if (from === to) return

    const duration = 300
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(from + (to - from) * eased)
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value])

  return <span className="tabular-nums">${display.toFixed(2)}</span>
}

export function OrderBar({
  lamp,
  selectedArtworks,
  lampQuantity,
  onLampQuantityChange,
  onRemoveArtwork,
  onSelectArtwork,
  isGift,
}: OrderBarProps) {
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [giftNote, setGiftNote] = useState('')
  const [showGiftNote, setShowGiftNote] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState(false)
  const [desktopCartExpanded, setDesktopCartExpanded] = useState(true)

  const ARTWORKS_PER_FREE_LAMP = 14 // 7.5% each = 100%
  const DISCOUNT_PER_ARTWORK = 7.5

  const lampPrice = parsePrice(lamp)
  const artworkCount = selectedArtworks.length
  const includeLamp = lampQuantity > 0
  // Artworks allocated per lamp: lamp 1 uses 1-14, lamp 2 uses 15-28, etc.
  const lampPrices: number[] = []
  const lampProgress: number[] = [] // 0-100% fill per lamp for milestone bar
  for (let k = 1; k <= lampQuantity; k++) {
    const start = (k - 1) * ARTWORKS_PER_FREE_LAMP
    const end = k * ARTWORKS_PER_FREE_LAMP
    const allocated = Math.max(0, Math.min(artworkCount, end) - start)
    const discountPct = Math.min(allocated * DISCOUNT_PER_ARTWORK, 100)
    lampPrices.push(lampPrice * Math.max(0, 1 - discountPct / 100))
    lampProgress.push(Math.min(100, (allocated / ARTWORKS_PER_FREE_LAMP) * 100))
  }
  const lampTotal = lampPrices.reduce((a, b) => a + b, 0)
  const lampSavings = lampQuantity > 0 ? lampQuantity * lampPrice - lampTotal : 0
  const artworksTotal = selectedArtworks.reduce((sum, p) => sum + parsePrice(p), 0)
  const firstLampAllocated = Math.min(artworkCount, ARTWORKS_PER_FREE_LAMP)
  const discountPercent = includeLamp ? Math.min(firstLampAllocated * DISCOUNT_PER_ARTWORK, 100) : 0
  const total = lampTotal + artworksTotal
  const hasUnavailable = selectedArtworks.some((p) => !p.availableForSale)
  const allAvailable = selectedArtworks.every((p) => p.availableForSale)
  const itemCount = selectedArtworks.length + lampQuantity

  const handleCheckout = async () => {
    if (itemCount === 0) return
    if (!allAvailable) return
    setError(null)
    setIsCheckingOut(true)

    try {
      const items: Array<{
        productId: string
        variantId: string
        variantGid: string
        handle: string
        title: string
        price: number
        quantity: number
        image?: string
      }> = []

      if (lampQuantity > 0) {
        // One line item per lamp, each at its own discounted price (20 artworks per lamp for 100% off)
        for (const price of lampPrices) {
          items.push({
            productId: lamp.id.replace('gid://shopify/Product/', ''),
            variantId: getVariantId(lamp),
            variantGid: lamp.variants?.edges?.[0]?.node?.id ?? '',
            handle: lamp.handle,
            title: lamp.title,
            price,
            quantity: 1,
            image: lamp.featuredImage?.url ?? undefined,
          })
        }
      }

      for (const art of selectedArtworks) {
        if (!art.availableForSale) continue
        items.push({
          productId: art.id.replace('gid://shopify/Product/', ''),
          variantId: getVariantId(art),
          variantGid: art.variants?.edges?.[0]?.node?.id ?? '',
          handle: art.handle,
          title: art.title,
          price: parsePrice(art),
          quantity: 1,
          image: art.featuredImage?.url ?? undefined,
        })
      }

      const response = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          lampDiscountPercent: discountPercent > 0 ? discountPercent : undefined,
          orderNotes: giftNote?.trim()?.slice(0, 500) || undefined,
          cancelUrl: typeof window !== 'undefined' ? `${window.location.origin}/shop/experience` : undefined,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to create checkout')
      if (data.url) window.location.href = data.url
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Try again.')
      setTimeout(() => setError(null), 4000)
      setIsCheckingOut(false)
    }
  }

  // Summary for discount bar: free count, artworks needed for next free lamp
  const freeLampCount = lampPrices.filter((p) => p === 0).length
  const nextLampArtworks = lampQuantity > 0
    ? (artworkCount % ARTWORKS_PER_FREE_LAMP === 0 ? ARTWORKS_PER_FREE_LAMP : ARTWORKS_PER_FREE_LAMP - (artworkCount % ARTWORKS_PER_FREE_LAMP))
    : ARTWORKS_PER_FREE_LAMP
  const discountBarLabel =
    freeLampCount === lampQuantity && lampQuantity > 0
      ? lampQuantity === 1 ? 'Lamp is FREE!' : `All ${lampQuantity} lamps FREE!`
      : freeLampCount > 0
        ? `${freeLampCount} FREE · add ${nextLampArtworks} for next free`
        : `Add ${nextLampArtworks} more artworks for free lamp`

  const discountBar = includeLamp && artworkCount > 0 && (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Percent className="w-3 h-3 text-green-600" />
          <span className="text-xs font-medium text-green-700">{discountBarLabel}</span>
        </div>
        {lampSavings > 0 && (
          <span className="text-xs font-semibold text-green-700">-${lampSavings.toFixed(2)}</span>
        )}
      </div>
      <div className="relative h-1.5 rounded-full overflow-hidden flex bg-neutral-200">
        {Array.from({ length: lampQuantity }).map((_, i) => (
          <div key={i} className="flex-1 min-w-0 h-full overflow-hidden relative">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-400"
              initial={false}
              animate={{ width: `${lampProgress[i] ?? 0}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>
        ))}
      </div>
      <p className="text-[10px] text-neutral-400 mt-1">{ARTWORKS_PER_FREE_LAMP} artworks per lamp for 100% off (7.5% each)</p>
    </div>
  )

  const lineItemsContent = (
    <div className="space-y-0 min-w-0 overflow-x-hidden">
      {/* Lamp row */}
      <div
        className={cn(
          'flex items-center gap-3 h-11 min-w-0 transition-opacity duration-200',
          lampQuantity === 0 && 'opacity-50'
        )}
      >
        <div className="w-6 h-6 rounded bg-neutral-100 flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-neutral-500" stroke="currentColor" strokeWidth={1.5}>
            <path d="M9 21h6M12 3v1M18.36 5.64l-.71.71M21 12h-1M4 12H3M5.64 5.64l.71.71" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 14a4 4 0 118 0c0 1.1-.6 2.1-1.5 2.6L14 18H10l-.5-1.4A3.96 3.96 0 018 14z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="flex-1 min-w-0 text-sm text-neutral-800 truncate">{lamp.title}</span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {lampQuantity > 0 && lampSavings > 0 && (
            <span className="text-xs text-neutral-400 line-through tabular-nums">${(lampQuantity * lampPrice).toFixed(2)}</span>
          )}
          <span className={cn(
            'text-sm tabular-nums',
            lampQuantity === 0 && 'line-through text-neutral-400',
            lampQuantity > 0 && lampSavings > 0 && 'text-green-700 font-medium'
          )}>
            {lampQuantity > 0
              ? lampTotal === 0
                ? 'FREE'
                : `$${lampTotal.toFixed(2)}${lampQuantity > 1 ? ' total' : ''}`
              : `$${lampPrice.toFixed(2)}`}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => onLampQuantityChange(Math.max(0, lampQuantity - 1))}
            className="w-7 h-7 flex items-center justify-center rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={lampQuantity === 0}
            aria-label="Decrease lamp quantity"
          >
            <span className="text-sm font-medium">−</span>
          </button>
          <span className="w-6 text-center text-sm font-medium tabular-nums">{lampQuantity}</span>
          <button
            type="button"
            onClick={() => onLampQuantityChange(Math.min(99, lampQuantity + 1))}
            className="w-7 h-7 flex items-center justify-center rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={lampQuantity >= 99}
            aria-label="Increase lamp quantity"
          >
            <span className="text-sm font-medium">+</span>
          </button>
        </div>
      </div>

      {/* Discount progress bar */}
      {discountBar}

      {/* Artwork rows -- scrollable */}
      <div className="max-h-[30vh] overflow-y-auto overflow-x-hidden">
        <AnimatePresence>
          {selectedArtworks.map((art) => {
            const artPrice = parsePrice(art)
            const artImage = art.featuredImage?.url
            const isSoldOut = !art.availableForSale
            return (
              <motion.div
                key={art.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 44 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => onSelectArtwork?.(art)}
                className={cn(
                  'flex items-center gap-3 min-w-0 overflow-hidden',
                  onSelectArtwork && 'cursor-pointer hover:bg-neutral-50 transition-colors -mx-2 px-2 rounded'
                )}
              >
                <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0 bg-neutral-100">
                  {artImage ? (
                    <Image src={artImage} alt={art.title} width={24} height={24} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-neutral-200" />
                  )}
                </div>
                <span className={cn('flex-1 min-w-0 text-sm text-neutral-800 truncate', isSoldOut && 'line-through text-neutral-400')}>
                  {art.title}
                </span>
                <span className="text-sm tabular-nums">${artPrice.toFixed(2)}</span>
                {selectedArtworks.length > 1 ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemoveArtwork(art.id) }}
                    className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors flex-shrink-0"
                    aria-label="Remove artwork"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="w-6 flex-shrink-0" />
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Divider + total */}
      <div className="flex items-center justify-between pt-3 border-t border-neutral-200 mt-2">
        <span className="text-sm font-semibold text-neutral-900">
          Total ({itemCount} {itemCount === 1 ? 'item' : 'items'})
        </span>
        <span className="text-base font-semibold text-neutral-900">
          <AnimatedPrice value={total} />
        </span>
      </div>
      <p className="text-xs text-neutral-400 mt-0.5">Free shipping</p>

      {/* Gift note */}
      {isGift && (
        <div className="mt-3">
          <button
            onClick={() => setShowGiftNote(!showGiftNote)}
            className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            Add a gift note
            {showGiftNote ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <AnimatePresence>
            {showGiftNote && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <textarea
                  value={giftNote}
                  onChange={(e) => setGiftNote(e.target.value.slice(0, 500))}
                  placeholder="Write a personal message..."
                  rows={3}
                  className="w-full mt-2 px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-400 resize-none"
                />
                <p className="text-[10px] text-neutral-400 text-right mt-0.5">{giftNote.length}/500</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop order bar */}
      <div
        data-wizard-order-bar
        className="hidden md:block min-w-0 overflow-x-hidden bg-white border-t border-neutral-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-6 py-4"
      >
        {desktopCartExpanded ? (
          <>
            <div className="flex items-center justify-center mb-2 relative">
              <button
                onClick={() => setDesktopCartExpanded(false)}
                className="absolute right-0 p-2 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors flex items-center justify-center"
                aria-label="Minimize cart"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
              <span className="text-xs font-medium text-neutral-500">Cart</span>
            </div>
            {lineItemsContent}
          </>
        ) : (
          <button
            onClick={() => setDesktopCartExpanded(true)}
            className="w-full flex items-center justify-center gap-3 py-2 rounded-lg hover:bg-neutral-50 transition-colors"
            aria-label="Expand cart"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
              <span className="bg-neutral-900 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{itemCount}</span>
              <AnimatedPrice value={total} />
              {discountPercent > 0 && (
                <span className="text-[10px] text-green-600 font-medium">-{discountPercent}%</span>
              )}
            </span>
            <span className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
              <ChevronUp className="w-4 h-4 text-neutral-600" />
            </span>
          </button>
        )}

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleCheckout}
          disabled={isCheckingOut || itemCount === 0 || !allAvailable}
          className={cn(
            'w-full mt-4 h-12 rounded-lg text-sm font-semibold transition-colors',
            itemCount === 0 || !allAvailable
              ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              : 'bg-neutral-950 text-white hover:bg-neutral-800'
          )}
        >
          {isCheckingOut ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Preparing checkout...
            </span>
          ) : itemCount === 0 ? (
            'Add items to checkout'
          ) : hasUnavailable ? (
            'Some items unavailable'
          ) : (
            <>Checkout &mdash; <AnimatedPrice value={total} /></>
          )}
        </motion.button>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-500 text-center mt-2"
          >
            {error}
          </motion.p>
        )}
      </div>

      {/* Mobile bottom sheet */}
      <div data-wizard-order-bar className="md:hidden fixed bottom-0 left-0 right-0 z-[65]">
        <AnimatePresence>
          {mobileExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileExpanded(false)}
              className="fixed inset-0 bg-black/20 z-[64]"
            />
          )}
        </AnimatePresence>

        <motion.div className="relative z-[65] min-w-0 overflow-x-hidden bg-white border-t border-neutral-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] rounded-t-2xl">
          {mobileExpanded && (
            <div className="px-4 pt-3 pb-1 max-h-[60dvh] overflow-y-auto overflow-x-hidden">
              <div
                onClick={() => setMobileExpanded(false)}
                className="w-10 h-1 bg-neutral-300 rounded-full mx-auto mb-3 cursor-pointer"
              />
              {lineItemsContent}
            </div>
          )}

          <div className="px-4 py-3 flex items-center gap-3">
            {!mobileExpanded && (
              <button
                onClick={() => setMobileExpanded(true)}
                className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900"
              >
                <span className="bg-neutral-900 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{itemCount}</span>
                <AnimatedPrice value={total} />
                {discountPercent > 0 && (
                  <span className="text-[10px] text-green-600 font-medium">-{discountPercent}%</span>
                )}
                <ChevronUp className="w-4 h-4 text-neutral-400" />
              </button>
            )}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleCheckout}
              disabled={isCheckingOut || itemCount === 0 || !allAvailable}
              className={cn(
                'flex-1 h-12 rounded-lg text-sm font-semibold transition-colors',
                itemCount === 0 || !allAvailable
                  ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  : 'bg-neutral-950 text-white hover:bg-neutral-800'
              )}
            >
              {isCheckingOut ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </span>
              ) : itemCount === 0 ? (
                'Add items to checkout'
              ) : hasUnavailable ? (
                'Some items unavailable'
              ) : (
                <>Checkout &mdash; <AnimatedPrice value={total} /></>
              )}
            </motion.button>
          </div>

          {error && (
            <p className="text-xs text-red-500 text-center pb-2 px-4">{error}</p>
          )}
        </motion.div>
      </div>
    </>
  )
}
