/**
 * VinylCrateStack
 * 
 * A stacked card visualization for displaying multiple items.
 * Cards are stacked at an angle like records in a crate.
 * 
 * @example
 * ```tsx
 * <VinylCrateStack
 *   items={artworks}
 *   onExpand={(items) => setExpandedItems(items)}
 * />
 * ```
 */

'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface VinylCrateStackProps<T> {
  /** Array of items */
  items: T[]
  /** Render the visible card */
  renderItem: (item: T, index: number) => React.ReactNode
  /** Maximum items to show in stack preview */
  maxStackPreview?: number
  /** Callback when stack is expanded */
  onExpand?: (items: T[]) => void
  /** Callback when item is selected */
  onItemSelect?: (item: T, index: number) => void
  /** Additional className */
  className?: string
}

export function VinylCrateStack<T>({
  items,
  renderItem,
  maxStackPreview = 3,
  onExpand,
  onItemSelect,
  className,
}: VinylCrateStackProps<T>) {
  const [activeIndex, setActiveIndex] = React.useState(0)
  const count = items.length
  const hasMultiple = count > 1

  const cycleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setActiveIndex((prev) => (prev + 1) % count)
  }

  const cyclePrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setActiveIndex((prev) => (prev - 1 + count) % count)
  }

  const handleClick = () => {
    if (hasMultiple && onExpand) {
      onExpand(items)
    } else if (onItemSelect) {
      onItemSelect(items[activeIndex], activeIndex)
    }
  }

  const activeItem = items[activeIndex]

  return (
    <motion.div
      className={cn('relative group', className)}
      whileHover="hover"
      initial="initial"
      onClick={handleClick}
    >
      {/* Stack Layers */}
      {hasMultiple && (
        <AnimatePresence>
          {/* Third card (deepest) */}
          {count >= 3 && (
            <motion.div
              className="absolute inset-0 bg-slate-100 border border-slate-200 rounded-[24px] shadow-sm"
              style={{ zIndex: 1 }}
              variants={{
                initial: { x: 12, y: -6, rotate: 3, opacity: 0.6 },
                hover: { x: 30, y: -15, rotate: 8, opacity: 1 },
              }}
              transition={{ type: 'spring', stiffness: 250, damping: 20 }}
            />
          )}

          {/* Second card (middle) */}
          <motion.div
            className="absolute inset-0 bg-slate-50 border border-slate-200 rounded-[24px] shadow-md"
            style={{ zIndex: 2 }}
            variants={{
              initial: { x: 6, y: -3, rotate: 1.5, opacity: 0.8 },
              hover: { x: 15, y: -8, rotate: 4, opacity: 1 },
            }}
            transition={{ type: 'spring', stiffness: 250, damping: 20 }}
          />

          {/* Count Badge */}
          <motion.div
            className="absolute -top-3 -right-3 z-[60] h-10 w-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-xl border-4 border-white"
            variants={{
              initial: { scale: 1 },
              hover: { scale: 1.2, rotate: 12, x: 5, y: -5 },
            }}
          >
            {count}
          </motion.div>

          {/* Navigation Arrows */}
          <div className="absolute inset-y-0 -left-6 -right-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-[70] pointer-events-none">
            <button
              type="button"
              className="h-10 w-10 rounded-full bg-white shadow-lg flex items-center justify-center pointer-events-auto hover:scale-110 transition-transform"
              onClick={cyclePrev}
            >
              <ChevronLeft className="h-5 w-5 text-slate-700" />
            </button>
            <button
              type="button"
              className="h-10 w-10 rounded-full bg-white shadow-lg flex items-center justify-center pointer-events-auto hover:scale-110 transition-transform"
              onClick={cycleNext}
            >
              <ChevronRight className="h-5 w-5 text-slate-700" />
            </button>
          </div>
        </AnimatePresence>
      )}

      {/* Main Card */}
      <motion.div
        className="relative w-full"
        style={{ zIndex: 10 }}
        variants={{
          initial: { y: 0 },
          hover: { y: -5 },
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {renderItem(activeItem, activeIndex)}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Page Indicators */}
      {hasMultiple && (
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {items.slice(0, Math.min(count, 5)).map((_, i) => (
            <button
              key={i}
              type="button"
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-all duration-200',
                i === activeIndex % 5
                  ? 'bg-slate-900 w-4'
                  : 'bg-slate-300 hover:bg-slate-400'
              )}
              onClick={(e) => {
                e.stopPropagation()
                setActiveIndex(i)
              }}
            />
          ))}
          {count > 5 && (
            <span className="text-[10px] text-slate-400 ml-1">
              +{count - 5}
            </span>
          )}
        </div>
      )}
    </motion.div>
  )
}
