/**
 * VinylDropZone
 * 
 * A drop target area for dragging artwork cards.
 * Shows visual feedback when items are dragged over.
 */

'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Play, Plus } from 'lucide-react'

export interface VinylDropZoneProps {
  /** Whether the drop zone is active (something being dragged) */
  isActive?: boolean
  /** Whether something is currently over the drop zone */
  isOver?: boolean
  /** Label text */
  label?: string
  /** Icon to display */
  icon?: 'play' | 'plus'
  /** Callback when item is dropped */
  onDrop?: (data: unknown) => void
  /** Additional className */
  className?: string
}

export const VinylDropZone = React.forwardRef<HTMLDivElement, VinylDropZoneProps>(
  (
    {
      isActive = false,
      isOver = false,
      label = 'Drop here to view',
      icon = 'play',
      onDrop,
      className,
    },
    ref
  ) => {
    const IconComponent = icon === 'play' ? Play : Plus

    return (
      <AnimatePresence>
        {isActive && (
          <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'fixed bottom-8 left-1/2 -translate-x-1/2 z-50',
              'px-8 py-6 rounded-[32px]',
              'backdrop-blur-xl',
              'border-2 border-dashed',
              'transition-all duration-300',
              isOver
                ? 'bg-[#f0c417]/20 border-[#f0c417] shadow-2xl scale-105'
                : 'bg-white/90 border-slate-300 shadow-xl',
              className
            )}
          >
            <div className="flex items-center gap-4">
              {/* Vinyl disc animation */}
              <motion.div
                className={cn(
                  'w-14 h-14 rounded-full',
                  'bg-slate-900 relative',
                  'flex items-center justify-center'
                )}
                animate={isOver ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 2, repeat: isOver ? Infinity : 0, ease: 'linear' }}
              >
                {/* Grooves */}
                <div 
                  className="absolute inset-2 rounded-full border border-slate-700 opacity-50"
                />
                <div 
                  className="absolute inset-4 rounded-full border border-slate-700 opacity-50"
                />
                {/* Center label */}
                <div className={cn(
                  'w-5 h-5 rounded-full',
                  isOver ? 'bg-[#f0c417]' : 'bg-slate-600',
                  'transition-colors duration-300'
                )} />
              </motion.div>

              <div>
                <div className="flex items-center gap-2">
                  <IconComponent 
                    className={cn(
                      'w-5 h-5 transition-colors duration-300',
                      isOver ? 'text-[#f0c417]' : 'text-slate-600'
                    )} 
                  />
                  <span className={cn(
                    'font-semibold transition-colors duration-300',
                    isOver ? 'text-[#1a1a1a]' : 'text-slate-600'
                  )}>
                    {label}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {isOver ? 'Release to open' : 'Drag artwork here'}
                </p>
              </div>
            </div>

            {/* Glow effect when over */}
            {isOver && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 -z-10 rounded-[32px] bg-[#f0c417]/30 blur-xl"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    )
  }
)

VinylDropZone.displayName = 'VinylDropZone'
