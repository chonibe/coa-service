'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface StockIndicatorProps {
  productId: string
  productImage: string | null
  productTitle: string
  editionSize: number | null
  availableForSale: boolean
}

const STEP_COUNT = 5
const HIGH_STOCK = 70
const MEDIUM_STOCK = 30

export function StockIndicator({
  productId,
  productImage,
  productTitle,
  editionSize,
  availableForSale,
}: StockIndicatorProps) {
  const [quantityAvailable, setQuantityAvailable] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const encodedId = encodeURIComponent(productId)
    fetch(`/api/shop/products/by-id/${encodedId}/quantity`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.quantityAvailable != null) {
          setQuantityAvailable(data.quantityAvailable)
        } else if (!cancelled) {
          setQuantityAvailable(null)
        }
      })
      .catch(() => {
        if (!cancelled) setQuantityAvailable(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [productId])

  const totalStock = editionSize && editionSize > 0 ? editionSize : 90
  // When API returns null but product is available, assume full stock (avoid false "Sold out")
  const available = !availableForSale ? 0 : (quantityAvailable ?? totalStock)
  const availablePercentage = totalStock > 0 ? Math.round((available / totalStock) * 100) : 100
  const stepSize = Math.floor(100 / STEP_COUNT)
  const steppedPercentage = Math.min(100, Math.max(0, Math.round(availablePercentage / stepSize) * stepSize))

  const subtitle =
    available === 0
      ? "This edition is sold out."
      : steppedPercentage >= HIGH_STOCK
        ? "🔥 Limited Edition: In stock and ready for immediate dispatch."
        : steppedPercentage >= MEDIUM_STOCK
          ? "Don't miss out—get yours today."
          : "🔥 Final units remaining. Once they're gone, they're gone for good!"

  if (loading && quantityAvailable === null && availableForSale) {
    return (
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <div className="w-4 h-4 rounded-full border-2 border-neutral-200 border-t-neutral-500 animate-spin" />
        <span>Checking availability…</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5 w-full max-w-[280px]">
      <div>
        <p className="text-sm font-semibold text-[#390000]">Still Available</p>
        <p className="text-[13px] text-neutral-500 mt-0.5">{subtitle}</p>
      </div>

      <div className="relative pt-8">
        {/* Slider with product image */}
        {productImage && (
          <motion.div
            className="absolute top-0 left-0 w-11 h-11 rounded-full overflow-hidden border-2 border-white shadow-md z-10"
            initial={{ left: '100%', opacity: 0 }}
            animate={{
              left: `${steppedPercentage}%`,
              opacity: 1,
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{ transform: 'translateX(-50%)' }}
          >
            <Image
              src={productImage}
              alt={productTitle}
              width={44}
              height={44}
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}

        {/* Progress bar */}
        <div className="h-1.5 bg-[#e6e6e6] rounded-lg overflow-hidden">
          <motion.div
            className="h-full bg-[#760000] rounded-lg"
            initial={{ width: '100%' }}
            animate={{ width: `${steppedPercentage}%` }}
            transition={{ duration: 0.6, ease: [0.2, 0.9, 0.2, 1] }}
          />
        </div>
      </div>

      <p
        className={`text-base font-semibold ${available === 0 ? 'text-[#f83a3a]' : 'text-[#390000]'}`}
      >
        {available === 0
          ? 'Sold Out'
          : `${available} of ${totalStock} available`}
      </p>
    </div>
  )
}
