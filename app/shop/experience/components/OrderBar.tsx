'use client'

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, X, ChevronDown, ChevronUp, Percent, Info } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { cn } from '@/lib/utils'

interface OrderBarProps {
  lamp: ShopifyProduct
  selectedArtworks: ShopifyProduct[]
  lampQuantity: number
  onLampQuantityChange: (qty: number) => void
  onRemoveArtwork: (id: string) => void
  onSelectArtwork?: (product: ShopifyProduct) => void
  /** Called when user taps info on the lamp row — opens lamp detail drawer */
  onViewLampDetail?: (product: ShopifyProduct) => void
  isGift: boolean
  /** Rendered at the top of the mobile fixed panel — used for the collapsed Artworks bar */
  mobileTopSlot?: React.ReactNode
}

export interface OrderBarRef {
  testZeroOrder: () => Promise<void>
}

function parsePrice(product: ShopifyProduct): number {
  const amount = product.priceRange?.minVariantPrice?.amount
  return amount ? parseFloat(amount) : 0
}

function getVariantId(product: ShopifyProduct): string {
  const gid = product.variants?.edges?.[0]?.node?.id ?? ''
  return gid.replace('gid://shopify/ProductVariant/', '')
}

const SPARKLE_COUNT = 8
const SPARKLE_COLORS = ['#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#facc15', '#fde047']

function SparkleDiscount({ discountPercent, className }: { discountPercent: number; className?: string }) {
  const [sparkle, setSparkle] = useState(false)
  const prevPercent = useRef(discountPercent)
  const isFirstMount = useRef(true)

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      prevPercent.current = discountPercent
      return
    }
    if (discountPercent > prevPercent.current && discountPercent > 0) {
      setSparkle(true)
      const t = setTimeout(() => setSparkle(false), 600)
      return () => clearTimeout(t)
    }
    prevPercent.current = discountPercent
  }, [discountPercent])

  return (
    <motion.span
      className={cn('relative inline-flex items-center overflow-visible', className)}
      animate={sparkle ? { scale: [1, 1.15, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      <span className="text-[10px] text-green-600 font-medium">-{discountPercent}%</span>
      <AnimatePresence>
        {sparkle && (
          <>
            {Array.from({ length: SPARKLE_COUNT }).map((_, i) => {
              const angle = (i / SPARKLE_COUNT) * 360
              const rad = (angle * Math.PI) / 180
              const dist = 14
              const x = Math.cos(rad) * dist
              const y = Math.sin(rad) * dist
              return (
                <motion.span
                  key={i}
                  initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
                  animate={{ opacity: 0, scale: 1.2, x, y }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full pointer-events-none"
                  style={{
                    backgroundColor: SPARKLE_COLORS[i % SPARKLE_COLORS.length],
                    marginLeft: -3,
                    marginTop: -3,
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

export const OrderBar = forwardRef<OrderBarRef, OrderBarProps>(function OrderBar({
  lamp,
  selectedArtworks,
  lampQuantity,
  onLampQuantityChange,
  onRemoveArtwork,
  onSelectArtwork,
  onViewLampDetail,
  isGift,
  mobileTopSlot,
}, ref) {
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [giftNote, setGiftNote] = useState('')
  const [showGiftNote, setShowGiftNote] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState(false)
  const [desktopCartExpanded, setDesktopCartExpanded] = useState(false)

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

  const handleTestZeroOrder = async () => {
    setError(null)
    setIsCheckingOut(true)
    try {
      const response = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            productId: lamp.id.replace('gid://shopify/Product/', ''),
            variantId: getVariantId(lamp),
            variantGid: lamp.variants?.edges?.[0]?.node?.id ?? '',
            handle: lamp.handle,
            title: `${lamp.title} (Test $0)`,
            price: 0,
            quantity: 1,
            image: lamp.featuredImage?.url ?? undefined,
          }],
          cancelUrl: typeof window !== 'undefined' ? `${window.location.origin}/shop/experience` : undefined,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to create checkout')
      if (data.type === 'zero_dollar' || data.type === 'credit_only') {
        window.location.href = data.completeUrl
        return
      }
      if (data.url) window.location.href = data.url
    } catch (err: any) {
      setError(err.message || 'Something went wrong.')
      setIsCheckingOut(false)
    }
  }

  useImperativeHandle(ref, () => ({ testZeroOrder: handleTestZeroOrder }), [handleTestZeroOrder])

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
      if (data.type === 'credit_only' || data.type === 'zero_dollar') {
        window.location.href = data.completeUrl
        return
      }
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
      <div className="flex items-center gap-3 min-h-[44px] min-w-0 pb-3 transition-opacity duration-200">
        <div
          className={cn(
            'flex items-center gap-3 flex-1 min-w-0',
            lampQuantity === 0 && 'opacity-50'
          )}
        >
        <div className="w-6 h-6 rounded bg-neutral-200/80 flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-neutral-700" stroke="currentColor" strokeWidth={1.5}>
            <path d="M9 21h6M12 3v1M18.36 5.64l-.71.71M21 12h-1M4 12H3M5.64 5.64l.71.71" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 14a4 4 0 118 0c0 1.1-.6 2.1-1.5 2.6L14 18H10l-.5-1.4A3.96 3.96 0 018 14z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="flex-1 min-w-0 text-sm font-medium text-neutral-950 truncate">{lamp.title}</span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {lampQuantity > 0 && lampSavings > 0 && (
            <span className="text-xs text-neutral-500 line-through tabular-nums">${(lampQuantity * lampPrice).toFixed(2)}</span>
          )}
          <span className={cn(
            'text-sm tabular-nums',
            lampQuantity === 0 && 'line-through text-neutral-500',
            lampQuantity > 0 && lampSavings > 0 && 'text-green-700 font-medium'
          )}>
            {lampQuantity > 0
              ? lampTotal === 0
                ? 'FREE'
                : `$${lampTotal.toFixed(2)}${lampQuantity > 1 ? ' total' : ''}`
              : `$${lampPrice.toFixed(2)}`}
          </span>
        </div>
        </div>
        {onViewLampDetail && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onViewLampDetail(lamp) }}
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            aria-label="View lamp details"
          >
            <Info className="w-4 h-4" />
          </button>
        )}
        {lampQuantity === 0 ? (
          <button
            type="button"
            onClick={() => onLampQuantityChange(1)}
            className="w-10 h-10 text-center text-sm font-medium rounded border border-white/40 bg-white/60 backdrop-blur-xl backdrop-saturate-150 text-neutral-800 hover:bg-black hover:text-white hover:border-black transition-colors flex-shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
            style={{ backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)' }}
            aria-label="Add lamp"
          >
            Add
          </button>
        ) : (
          <div
            className="w-10 h-8 rounded border border-white/40 bg-white/60 backdrop-blur-xl backdrop-saturate-150 flex items-center justify-center flex-shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
            style={{ backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)' }}
          >
            <input
              type="number"
              min={0}
              max={99}
              value={lampQuantity}
              onChange={(e) => {
                const v = e.target.value
                if (v === '') {
                  onLampQuantityChange(0)
                  return
                }
                const n = parseInt(v, 10)
                if (!Number.isNaN(n)) onLampQuantityChange(Math.max(0, Math.min(99, n)))
              }}
              onBlur={(e) => {
                const v = e.target.value
                if (v === '' || Number.isNaN(parseInt(v, 10))) onLampQuantityChange(0)
              }}
              className="w-full h-full text-center text-sm font-medium tabular-nums bg-transparent text-neutral-900 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              aria-label="Lamp quantity"
            />
          </div>
        )}
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
                <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0 bg-neutral-200/80 ring-1 ring-neutral-200/80">
                  {artImage ? (
                    <Image src={artImage} alt={art.title} width={24} height={24} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-neutral-200" />
                  )}
                </div>
                <span className={cn('flex-1 min-w-0 text-sm font-medium text-neutral-950 truncate', isSoldOut && 'line-through text-neutral-500')}>
                  {art.title}
                </span>
                <span className="text-sm font-medium tabular-nums text-neutral-950">${artPrice.toFixed(2)}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveArtwork(art.id) }}
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 transition-colors flex-shrink-0"
                  aria-label="Remove artwork"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Divider + total */}
      <div className="flex items-center justify-between pt-3 border-t border-neutral-300 mt-2">
        <span className="text-sm font-semibold text-neutral-950">
          Total ({itemCount} {itemCount === 1 ? 'item' : 'items'})
        </span>
        <span className="text-base font-semibold text-neutral-950">
          <AnimatedPrice value={total} />
        </span>
      </div>
      <p className="text-xs text-neutral-600 mt-0.5">Free shipping</p>

      {/* Gift note */}
      {isGift && (
        <div className="mt-3">
          <button
            onClick={() => setShowGiftNote(!showGiftNote)}
            className="flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
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
                <p className="text-[10px] text-neutral-600 text-right mt-0.5">{giftNote.length}/500</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop order bar — liquid glass */}
      <div
        data-wizard-order-bar
        className="hidden md:block min-w-0 overflow-x-hidden bg-white/90 backdrop-blur-2xl backdrop-saturate-150 border-t border-white/60 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-6 py-4"
        style={{ backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)' }}
      >
        {desktopCartExpanded && (
          <div className="max-h-[40vh] overflow-y-auto overflow-x-hidden pb-3 mb-3 border-b border-neutral-200/80 bg-white/70 rounded-lg px-3 -mx-1">
            {lineItemsContent}
          </div>
        )}

        <div className="flex items-center gap-3 bg-white/65 rounded-lg py-1 -mx-1 px-1">
          {!desktopCartExpanded ? (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => setDesktopCartExpanded(true)}
                className="flex items-center justify-center w-10 h-10 text-neutral-600 hover:text-neutral-900 transition-colors"
                aria-label="Expand cart"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
              <button
                onClick={() => setDesktopCartExpanded(true)}
                className="flex items-center gap-1.5 text-sm font-semibold text-neutral-950 min-w-0"
              >
                <span className="bg-neutral-950 text-white text-xs font-semibold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">{itemCount}</span>
                {!(itemCount > 0 && !hasUnavailable) && (
                  <>
                    <AnimatedPrice value={total} />
                    {discountPercent > 0 && (
                      <SparkleDiscount discountPercent={discountPercent} />
                    )}
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => setDesktopCartExpanded(false)}
                className="flex items-center justify-center w-10 h-10 text-neutral-600 hover:text-neutral-900 transition-colors"
                aria-label="Collapse cart"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          )}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleCheckout}
            disabled={isCheckingOut || itemCount === 0 || !allAvailable}
            className={cn(
              'flex-1 h-12 rounded-lg text-sm font-semibold transition-colors',
              itemCount === 0 || !allAvailable
                ? 'bg-neutral-200 text-neutral-600 cursor-not-allowed'
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
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-500 text-center mt-2"
          >
            {error}
          </motion.p>
        )}
      </div>

      {/* Mobile bottom sheet — fixed at bottom, always in view */}
      <div data-wizard-order-bar className="md:hidden fixed bottom-0 left-0 right-0 z-[70]">
        <AnimatePresence>
          {mobileExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileExpanded(false)}
              className="fixed inset-0 bg-black/20 z-[68]"
            />
          )}
        </AnimatePresence>

        <motion.div
          className="relative z-[70] min-w-0 overflow-x-hidden bg-white/90 backdrop-blur-2xl backdrop-saturate-150 border-t border-white/60 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] rounded-t-2xl pb-[env(safe-area-inset-bottom,0px)]"
          style={{ backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)' }}
        >
          {mobileTopSlot}
          {mobileExpanded && (
            <div className="px-4 pt-3 pb-1 max-h-[60dvh] overflow-y-auto overflow-x-hidden bg-white/70 mx-2 rounded-lg -mt-1">
              {lineItemsContent}
            </div>
          )}

          <div className="px-4 py-3 space-y-1 bg-white/65 rounded-lg mx-2">
            <div className="flex items-center gap-3">
              {!mobileExpanded && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setMobileExpanded(true)}
                    className="flex items-center justify-center w-10 h-10 text-neutral-600 hover:text-neutral-900 transition-colors"
                    aria-label="Expand cart"
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setMobileExpanded(true)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-neutral-950 min-w-0"
                  >
                    <span className="bg-neutral-950 text-white text-xs font-semibold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">{itemCount}</span>
                  {!(itemCount > 0 && !hasUnavailable) && (
                    <>
                      <AnimatedPrice value={total} />
                      {discountPercent > 0 && (
                        <SparkleDiscount discountPercent={discountPercent} />
                      )}
                    </>
                  )}
                  </button>
                </div>
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
          </div>

          {error && (
            <p className="text-xs text-red-500 text-center pb-2 px-4">{error}</p>
          )}
        </motion.div>
      </div>
    </>
  )
})
