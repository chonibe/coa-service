'use client'

import { useState, useCallback, useEffect, useLayoutEffect, useRef, useMemo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Star, Heart, Info, RotateCcw } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { useWishlist } from '@/lib/shop/WishlistContext'
import {
  setRating,
  getRating,
  clearRating,
  getRatingStats,
  getUnratedProductIds,
  getRatedProductIds,
} from '@/lib/experience-artwork-ratings'
import { cn } from '@/lib/utils'

const TUTORIAL_STORAGE_KEY = 'swiper-tutorial-seen'
const PX_PER_STAR = 40
const SKIP_THRESHOLD = 40
const DEAD_ZONE = 20
const CONFIRM_DELAY_MS = 300
const UNDO_HIDE_MS = 5000
const MAX_UNDO_HISTORY = 10

const SPARKLE_COUNT = 8
const SPARKLE_COLORS = ['#facc15', '#fde047', '#fef08a', '#fef9c3', '#fbbf24', '#f59e0b']

function triggerHaptic() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(50)
  }
}

type Phase = 'setup' | 'rating' | 'summary'
type RatingMode = 'unrated' | 'all' | 'rerate' | 'artist'

interface UndoEntry {
  productId: string
  product: ShopifyProduct
  previousRating: number
  index: number
}

interface SessionRating {
  productId: string
  product: ShopifyProduct
  rating: number
}

function getFirstImage(product: ShopifyProduct | null | undefined): string | null {
  if (!product) return null
  return product.featuredImage?.url ?? product.images?.edges?.[0]?.node?.url ?? null
}

function getFirstTags(product: ShopifyProduct, max = 3): string[] {
  const tags = product.tags ?? []
  return tags.slice(0, max)
}

function parsePrice(product: ShopifyProduct): number {
  const amount = product.priceRange?.minVariantPrice?.amount
  return amount ? parseFloat(amount) : 0
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function xToRating(x: number): number {
  if (x <= -SKIP_THRESHOLD) return 0
  if (x < DEAD_ZONE) return 0
  const star = Math.min(5, Math.floor((x - DEAD_ZONE) / PX_PER_STAR) + 1)
  return Math.max(0, star)
}

function SparkleBurst({ active, onComplete }: { active: boolean; onComplete?: () => void }) {
  useEffect(() => {
    if (active && onComplete) {
      const t = setTimeout(onComplete, 600)
      return () => clearTimeout(t)
    }
  }, [active, onComplete])

  if (!active) return null
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {Array.from({ length: SPARKLE_COUNT }).map((_, i) => {
        const angle = (i / SPARKLE_COUNT) * 360
        const rad = (angle * Math.PI) / 180
        const dist = 24
        const dx = Math.cos(rad) * dist
        const dy = Math.sin(rad) * dist
        return (
          <motion.span
            key={i}
            initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
            animate={{ opacity: 0, scale: 1.2, x: dx, y: dy }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute w-2 h-2 rounded-full"
            style={{
              backgroundColor: SPARKLE_COLORS[i % SPARKLE_COLORS.length],
            }}
          />
        )
      })}
    </div>
  )
}

interface WishlistSwiperSheetProps {
  isOpen: boolean
  onClose: () => void
  products: ShopifyProduct[]
  /** On desktop, overlay only the selector body (not full screen). On mobile, full screen. */
  isMobile?: boolean
  /** Ref to selector body for desktop overlay positioning */
  selectorBodyRef?: React.RefObject<HTMLDivElement | null>
  onRatingChange?: () => void
  onSelectProduct?: (product: ShopifyProduct) => void
  /** Opens artwork detail without closing the swiper (e.g. from Info button) */
  onViewProductDetail?: (product: ShopifyProduct) => void
  onApplyStarFilter?: (minStars: number) => void
}

export function WishlistSwiperSheet({
  isOpen,
  onClose,
  products,
  isMobile = true,
  selectorBodyRef,
  onRatingChange,
  onSelectProduct,
  onViewProductDetail,
  onApplyStarFilter,
}: WishlistSwiperSheetProps) {
  const { addItem, isInWishlist } = useWishlist()
  const [phase, setPhase] = useState<Phase>('setup')
  const [ratingMode, setRatingMode] = useState<RatingMode>('unrated')
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null)
  const [displayProducts, setDisplayProducts] = useState<ShopifyProduct[]>([])
  const [index, setIndex] = useState(0)
  const [showTutorial, setShowTutorial] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [liveRating, setLiveRating] = useState(0)
  const [hoverStar, setHoverStar] = useState<number>(0)
  const [isSkipZone, setIsSkipZone] = useState(false)
  const [showSparkle, setShowSparkle] = useState(false)
  const [sessionRatings, setSessionRatings] = useState<SessionRating[]>([])
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([])
  const [showUndo, setShowUndo] = useState(false)
  const [sessionWishlistCount, setSessionWishlistCount] = useState(0)
  const [exitDirection, setExitDirection] = useState<-1 | 1>(1)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [overlayBounds, setOverlayBounds] = useState<{ top: number; left: number; width: number; height: number } | null>(null)

  const isDesktop = !isMobile && selectorBodyRef
  useLayoutEffect(() => {
    if (!isOpen || !isDesktop || !selectorBodyRef?.current) {
      setOverlayBounds(null)
      return
    }
    const el = selectorBodyRef.current
    const update = () => {
      const rect = el.getBoundingClientRect()
      setOverlayBounds({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener('scroll', update, { capture: true })
    return () => {
      ro.disconnect()
      window.removeEventListener('scroll', update, { capture: true })
    }
  }, [isOpen, isDesktop, selectorBodyRef])

  const product = displayProducts[index] ?? null
  const totalCount = displayProducts.length
  const inWishlist = product ? isInWishlist(product.id) : false

  const productIds = products.map((p) => p.id)
  const unratedIds = getUnratedProductIds(productIds)
  const ratedIds = getRatedProductIds(productIds)
  const unratedProducts = products.filter((p) => unratedIds.includes(p.id))
  const ratedProducts = products.filter((p) => ratedIds.includes(p.id))

  const artists = useMemo(() => {
    const seen = new Set<string>()
    for (const p of products) {
      if (p.vendor?.trim()) seen.add(p.vendor)
    }
    return Array.from(seen).sort()
  }, [products])

  useEffect(() => {
    if (!isOpen) return
    setIndex(0)
    setHoverStar(0)
    setSessionRatings([])
    setUndoStack([])
    setShowUndo(false)
    setSessionWishlistCount(0)
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current)
      undoTimerRef.current = null
    }
    // Skip setup – go straight to rating cards (default: unrated first)
    const unrated = getUnratedProductIds(products.map((p) => p.id))
    const unratedList = products.filter((p) => unrated.includes(p.id))
    const shuffled = shuffleArray(unratedList.length > 0 ? unratedList : products)
    setDisplayProducts(shuffled)
    setPhase(shuffled.length > 0 ? 'rating' : 'summary')
    setShowTutorial(false)
    localStorage.setItem(TUTORIAL_STORAGE_KEY, '1')
  }, [isOpen, products])

  const applyFilterAndStart = useCallback(() => {
    let filtered: ShopifyProduct[] = []
    if (ratingMode === 'unrated') {
      filtered = unratedProducts
    } else if (ratingMode === 'all') {
      filtered = [...products]
    } else if (ratingMode === 'rerate') {
      filtered = ratedProducts
    } else if (ratingMode === 'artist' && selectedArtist) {
      filtered = products.filter((p) => p.vendor === selectedArtist)
    } else {
      filtered = unratedProducts
    }
    const shuffled = shuffleArray(filtered)
    setDisplayProducts(shuffled)
    setPhase(shuffled.length > 0 ? 'rating' : 'summary')
    setIndex(0)
    setShowTutorial(false)
    localStorage.setItem(TUTORIAL_STORAGE_KEY, '1')
  }, [ratingMode, selectedArtist, products, unratedProducts, ratedProducts])

  const handleAddToWishlist = useCallback(() => {
    if (!product || inWishlist) return
    const variantId = product.variants?.edges?.[0]?.node?.id ?? ''
    const price = parsePrice(product)
    addItem({
      productId: product.id,
      variantId,
      handle: product.handle,
      title: product.title,
      price,
      image: getFirstImage(product) ?? undefined,
      artistName: product.vendor ?? undefined,
    })
    setSessionWishlistCount((c) => c + 1)
    onRatingChange?.()
  }, [product, inWishlist, addItem, onRatingChange])

  const commitRating = useCallback(
    (rating: number, prevRating: number) => {
      if (!product) return
      if (rating === 0) {
        clearRating(product.id)
      } else {
        setRating(product.id, rating)
      }
      setSessionRatings((prev) => [...prev, { productId: product.id, product, rating }])
      if (undoStack.length < MAX_UNDO_HISTORY) {
        setUndoStack((s) => [...s, { productId: product.id, product, previousRating: prevRating, index }])
        setShowUndo(true)
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
        undoTimerRef.current = setTimeout(() => setShowUndo(false), UNDO_HIDE_MS)
      }
      if (rating >= 4 && !inWishlist) handleAddToWishlist()
      if (rating === 5) setShowSparkle(true)
      onRatingChange?.()
    },
    [product, index, undoStack.length, inWishlist, handleAddToWishlist, onRatingChange]
  )

  const advanceCard = useCallback(() => {
    if (index < displayProducts.length - 1) {
      setIndex((i) => i + 1)
      setLiveRating(0)
      setHoverStar(0)
      setIsSkipZone(false)
    } else {
      setPhase('summary')
    }
  }, [index, displayProducts.length])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!product) return
      pointerStartRef.current = { x: e.clientX, y: e.clientY }
      setIsDragging(true)
      setLiveRating(getRating(product.id))
    },
    [product]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!pointerStartRef.current || !isDragging) return
      const deltaX = e.clientX - pointerStartRef.current.x
      if (deltaX <= -SKIP_THRESHOLD) {
        setIsSkipZone(true)
        setLiveRating(0)
      } else {
        setIsSkipZone(false)
        setLiveRating(xToRating(deltaX))
      }
    },
    [isDragging]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!product || !pointerStartRef.current) return
      setIsDragging(false)
      const deltaX = e.clientX - pointerStartRef.current.x
      pointerStartRef.current = null

      if (deltaX <= -SKIP_THRESHOLD) {
        setExitDirection(-1)
        const prev = getRating(product.id)
        commitRating(0, prev)
        setTimeout(advanceCard, 150)
        return
      }
      if (Math.abs(deltaX) < DEAD_ZONE) return
      const rating = xToRating(deltaX)
      if (rating >= 1) {
        setExitDirection(1)
        const prev = getRating(product.id)
        commitRating(rating, prev)
        setTimeout(advanceCard, 150)
      }
    },
    [product, commitRating, advanceCard]
  )

  const handlePointerCancel = useCallback(() => {
    pointerStartRef.current = null
    setIsDragging(false)
    setIsSkipZone(false)
    setLiveRating(0)
  }, [])

  const handleStarTap = useCallback(
    (stars: number) => {
      if (!product) return
      setExitDirection(1)
      const prev = getRating(product.id)
      commitRating(stars, prev)
      setTimeout(advanceCard, CONFIRM_DELAY_MS)
    },
    [product, commitRating, advanceCard]
  )

  const handleUndo = useCallback(() => {
    const entry = undoStack[undoStack.length - 1]
    if (!entry) return
    setUndoStack((s) => s.slice(0, -1))
    setShowUndo(false)
    setIndex(entry.index)
    if (entry.previousRating > 0) {
      setRating(entry.productId, entry.previousRating)
    } else {
      clearRating(entry.productId)
    }
    setSessionRatings((prev) => {
      const last = prev.length - 1
      if (last >= 0 && prev[last].productId === entry.productId) return prev.slice(0, -1)
      return prev
    })
    onRatingChange?.()
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current)
      undoTimerRef.current = null
    }
  }, [undoStack, onRatingChange])

  useEffect(() => {
    if (!isOpen || phase !== 'rating') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === '?') setShowTutorial((v) => !v)
      if (!product) return
      if (e.key >= '1' && e.key <= '5') {
        const stars = parseInt(e.key, 10)
        handleStarTap(stars)
      }
      if (e.key === '0' || e.key === 'Backspace') {
        e.preventDefault()
        const prev = getRating(product.id)
        commitRating(0, prev)
        setTimeout(advanceCard, 100)
      }
      if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleUndo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, phase, product, onClose, handleStarTap, commitRating, advanceCard, handleUndo])

  const displayRating = isDragging ? liveRating : (product ? getRating(product.id) : 0)

  const prevDisplayRating = useRef(displayRating)
  useEffect(() => {
    if (displayRating > prevDisplayRating.current && displayRating >= 1) {
      triggerHaptic()
    }
    prevDisplayRating.current = displayRating
  }, [displayRating])

  const progressPct = totalCount > 0 ? ((index + 1) / totalCount) * 100 : 0

  const sessionStats = (() => {
    const rated = sessionRatings.filter((r) => r.rating >= 1)
    const total = rated.length
    const sum = rated.reduce((a, r) => a + r.rating, 0)
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>
    for (const r of rated) {
      if (r.rating >= 1 && r.rating <= 5) distribution[r.rating as 1 | 2 | 3 | 4 | 5]++
    }
    return {
      total,
      average: total > 0 ? sum / total : 0,
      distribution,
      fiveStars: sessionRatings.filter((r) => r.rating === 5).map((r) => r.product),
    }
  })()

  if (!isOpen) return null

  const desktopOverlay = isDesktop && overlayBounds
  const positionStyle = desktopOverlay
    ? {
        position: 'fixed' as const,
        top: overlayBounds!.top,
        left: overlayBounds!.left,
        width: overlayBounds!.width,
        height: overlayBounds!.height,
        borderRadius: 0,
      }
    : undefined

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          'fixed z-[70] flex flex-col bg-white',
          desktopOverlay ? '' : 'inset-0'
        )}
        style={positionStyle}
        role="dialog"
        aria-modal="true"
        aria-label="Rate artworks and add to wishlist"
      >
        {/* Tutorial overlay */}
        <AnimatePresence>
          {showTutorial && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[80] bg-black/50 flex items-center justify-center p-6"
              onClick={() => setShowTutorial(false)}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 max-w-sm shadow-xl space-y-4"
              >
                <h3 className="text-lg font-semibold text-neutral-900">How to rate</h3>
                <ul className="space-y-3 text-sm text-neutral-600">
                  <li className="flex items-center gap-3">
                    <span className="text-2xl">👉</span>
                    <span>Drag right to rate higher (1–5 stars)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-2xl">👈</span>
                    <span>Swipe left to skip</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-amber-500">★</span>
                    <span>Or tap a star directly</span>
                  </li>
                </ul>
                <button
                  type="button"
                  onClick={() => setShowTutorial(false)}
                  className="w-full py-2.5 rounded-lg bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800"
                >
                  Got it
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {phase === 'setup' && (
          <div className="flex-1 flex flex-col p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-neutral-900">Rate artworks</h2>
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-600"
                aria-label="Back"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-neutral-600 mb-4">What would you like to rate?</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setRatingMode('unrated')}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors',
                  ratingMode === 'unrated' ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:bg-neutral-50'
                )}
              >
                <span className="font-medium text-neutral-900">Unrated artworks</span>
                <span className="text-sm text-neutral-500">({unratedProducts.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setRatingMode('all')}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors',
                  ratingMode === 'all' ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:bg-neutral-50'
                )}
              >
                <span className="font-medium text-neutral-900">All artworks</span>
                <span className="text-sm text-neutral-500">({products.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setRatingMode('rerate')}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors',
                  ratingMode === 'rerate' ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:bg-neutral-50'
                )}
              >
                <span className="font-medium text-neutral-900">Re-rate</span>
                <span className="text-sm text-neutral-500">({ratedProducts.length})</span>
              </button>
              {artists.length > 0 && (
                <div className="pt-2">
                  <label className="block text-xs font-medium text-neutral-500 mb-1">By artist</label>
                  <select
                    value={selectedArtist ?? ''}
                    onChange={(e) => {
                      const v = e.target.value
                      setSelectedArtist(v || null)
                      setRatingMode('artist')
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-neutral-900 bg-white"
                  >
                    <option value="">Select artist</option>
                    {artists.map((a) => (
                      <option key={a} value={a}>
                        {a} ({products.filter((p) => p.vendor === a).length})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="mt-auto pt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setRatingMode('unrated')
                  setSelectedArtist(null)
                  applyFilterAndStart()
                }}
                className="flex-1 py-3 rounded-xl border border-neutral-200 text-neutral-700 font-medium hover:bg-neutral-50"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={applyFilterAndStart}
                className="flex-1 py-3 rounded-xl bg-neutral-900 text-white font-semibold hover:bg-neutral-800"
              >
                Start Rating
              </button>
            </div>
          </div>
        )}

        {phase === 'summary' && (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-neutral-900">
                {sessionStats.total > 0 ? `${sessionStats.total} artworks rated` : 'All done!'}
              </h2>
              <button type="button" onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100" aria-label="Back">
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
            {sessionStats.total > 0 && (
              <>
                <div className="flex gap-4 mb-6 text-sm">
                  <span className="text-neutral-600">Avg: {sessionStats.average.toFixed(1)} ★</span>
                  <span className="text-neutral-600">{sessionWishlistCount} added to wishlist</span>
                </div>
                <div className="mb-6">
                  <p className="text-xs font-medium text-neutral-500 mb-2">Rating breakdown</p>
                  <div className="flex gap-1 h-6">
                    {([5, 4, 3, 2, 1] as const).map((s) => (
                      <div key={s} className="flex-1 flex items-center gap-1">
                        <span className="text-xs text-neutral-600 w-3">{s}</span>
                        <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${sessionStats.total > 0 ? (sessionStats.distribution[s] / sessionStats.total) * 100 : 0}%`,
                            }}
                            transition={{ duration: 0.4 }}
                            className="h-full rounded-full bg-amber-400"
                          />
                        </div>
                        <span className="text-xs text-neutral-500 w-5">{sessionStats.distribution[s]}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {sessionStats.fiveStars.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs font-medium text-neutral-500 mb-2">Top picks (5★)</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {sessionStats.fiveStars.slice(0, 8).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => onSelectProduct?.(p)}
                          className="flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden bg-neutral-100 relative"
                        >
                          {getFirstImage(p) && (
                            <Image src={getFirstImage(p)!} alt={p.title} fill className="object-cover" sizes="64px" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="mt-auto pt-4 space-y-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl border border-neutral-200 font-medium hover:bg-neutral-50"
              >
                View Wishlist
              </button>
              {onApplyStarFilter && sessionStats.total > 0 && (
                <button
                  type="button"
                  onClick={() => onApplyStarFilter(4)}
                  className="w-full py-3 rounded-xl border border-neutral-200 font-medium hover:bg-neutral-50"
                >
                  Filter by 4+ stars
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setPhase('setup')
                  setRatingMode('unrated')
                  setSessionRatings([])
                  setSessionWishlistCount(0)
                }}
                className="w-full py-3 rounded-xl border border-neutral-200 font-medium hover:bg-neutral-50"
              >
                Rate More
              </button>
              <button type="button" onClick={onClose} className="w-full py-3 rounded-xl bg-neutral-900 text-white font-semibold">
                Close
              </button>
            </div>
          </div>
        )}

        {phase === 'rating' && (
          <>
            {/* Progress bar + header — on desktop match selector bar (px-4 py-2.5, border-b) */}
            <div className={cn(
              'flex-shrink-0 border-b border-neutral-100',
              desktopOverlay && 'flex flex-col'
            )}>
              <div className="h-1 bg-neutral-100">
                <motion.div
                  className="h-full bg-neutral-900"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              </div>
              <div className={cn(
                'flex items-center justify-between',
                desktopOverlay ? 'px-4 py-2.5' : 'px-4 py-3'
              )}>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-600"
                  aria-label="Back"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-medium text-neutral-600">
                  {index + 1} / {totalCount}
                </span>
                <button
                  type="button"
                  onClick={() => product && (onViewProductDetail ?? onSelectProduct)?.(product)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-600"
                  aria-label="View artwork details"
                >
                  <Info className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Card area */}
            <div
              className={cn(
                'flex-1 overflow-hidden flex flex-col items-center min-h-0 relative',
                desktopOverlay ? 'justify-start pt-4 pb-4 px-4' : 'justify-center p-6'
              )}
              style={{
                background: `linear-gradient(180deg, ${isSkipZone ? '#f0f0f0' : displayRating >= 4 ? 'rgb(255,251,235)' : displayRating >= 1 ? 'rgb(255,250,240)' : '#fafafa'} 0%, #fff 100%)`,
              }}
            >
              {!product ? (
                <div className="text-center">
                  <p className="text-sm text-neutral-400">No artworks to rate</p>
                  <button type="button" onClick={onClose} className="mt-4 px-4 py-2 rounded-lg bg-neutral-100 text-neutral-700 text-sm font-medium hover:bg-neutral-200">
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <AnimatePresence>
                    <motion.div
                      key={product.id}
                      initial={{ scale: 0.95, opacity: 0.8 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ x: exitDirection * 400, opacity: 0, transition: { duration: 0.2 } }}
                      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                      className={cn(
                        'w-full max-w-md flex flex-col relative select-none',
                        desktopOverlay ? 'gap-2' : 'gap-4'
                      )}
                      style={{ touchAction: 'none' }}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerLeave={handlePointerCancel}
                      onPointerCancel={handlePointerCancel}
                    >
                      {isSkipZone && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 flex items-center justify-center bg-neutral-900/30 rounded-2xl z-10 pointer-events-none"
                        >
                          <span className="text-2xl font-bold text-white drop-shadow-lg">SKIP</span>
                        </motion.div>
                      )}

                      <SparkleBurst active={showSparkle} onComplete={() => setShowSparkle(false)} />

                      <div className={cn('text-center min-w-0', desktopOverlay ? 'pb-1' : 'pb-2')}>
                        <p className="text-base font-semibold text-neutral-900 truncate">{product.title}</p>
                        {product.vendor && <p className="text-sm text-neutral-500 truncate">{product.vendor}</p>}
                        {getFirstTags(product).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1 justify-center">
                            {getFirstTags(product).map((t) => (
                              <span key={t} className="px-1.5 py-0.5 rounded bg-neutral-100 text-xs text-neutral-600">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className={cn(
                        'relative rounded-2xl overflow-hidden',
                        desktopOverlay ? 'aspect-[3/4] max-h-[50vh]' : 'aspect-[4/5]'
                      )}>
                        {getFirstImage(product) && (
                          <Image
                            src={getFirstImage(product)!}
                            alt={product.title}
                            fill
                            className="object-cover"
                            sizes="400px"
                            priority
                            draggable={false}
                          />
                        )}
                        {inWishlist && (
                          <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                            <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                          </div>
                        )}
                      </div>

                      <div
                        className={cn(
                          'flex justify-center gap-2 flex-shrink-0',
                          desktopOverlay ? '-mt-1' : '-mt-2'
                        )}
                        onMouseLeave={() => setHoverStar(0)}
                      >
                        {([1, 2, 3, 4, 5] as const).map((s) => {
                          const fillUpTo = hoverStar > 0 ? hoverStar : displayRating
                          const isFilled = fillUpTo >= s
                          return (
                            <motion.button
                              key={s}
                              type="button"
                              onClick={() => { triggerHaptic(); handleStarTap(s) }}
                              onMouseEnter={() => setHoverStar(s)}
                              whileTap={{ scale: 1.15 }}
                              transition={{ type: 'spring', damping: 15, stiffness: 400 }}
                              className={cn(
                                'w-12 h-12 flex items-center justify-center rounded-full transition-colors touch-manipulation',
                                isFilled ? 'text-amber-500 bg-amber-50' : 'text-neutral-300 hover:text-amber-400 hover:bg-neutral-50'
                              )}
                              aria-label={`Rate ${s} star${s > 1 ? 's' : ''}`}
                              aria-pressed={displayRating >= s}
                            >
                              <Star className={cn('w-7 h-7', isFilled && 'fill-current')} strokeWidth={1.5} />
                            </motion.button>
                          )
                        })}
                      </div>
                      {displayRating >= 4 && !inWishlist && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center justify-center gap-1.5 text-green-600 text-sm"
                        >
                          <Heart className="w-4 h-4 fill-current" />
                          <span>Added to wishlist</span>
                        </motion.div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </>
              )}
            </div>

            {/* Undo button */}
            <AnimatePresence>
              {showUndo && undoStack.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-24 left-4 z-[75]"
                >
                  <button
                    type="button"
                    onClick={handleUndo}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium shadow-lg hover:bg-neutral-800"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Undo
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
