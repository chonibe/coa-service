/**
 * VinylCrateDividers Component
 * 
 * Category dividers for organizing artworks in a vinyl crate, similar to
 * alphabetical or genre dividers found in record store crates.
 * 
 * Features:
 * - Tab-style dividers that stick up above the crate
 * - Custom labels (artist name, series, category)
 * - Click to jump to section
 * - Visual indicator for current section
 */

'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface CrateDivider {
  id: string
  label: string
  /** Number of items in this section */
  count?: number
  /** Icon or emoji for the divider */
  icon?: React.ReactNode
  /** Color accent for the divider tab */
  color?: string
}

export interface VinylCrateDividersProps {
  /** Array of divider definitions */
  dividers: CrateDivider[]
  /** Currently active divider ID */
  activeId?: string
  /** Handler when divider is clicked */
  onDividerClick?: (id: string) => void
  /** Orientation: horizontal tabs or vertical stack */
  orientation?: 'horizontal' | 'vertical'
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Additional class names */
  className?: string
}

const sizeStyles = {
  sm: {
    tab: 'h-8 px-3 text-xs',
    indicator: 'h-0.5',
  },
  md: {
    tab: 'h-10 px-4 text-sm',
    indicator: 'h-1',
  },
  lg: {
    tab: 'h-12 px-5 text-base',
    indicator: 'h-1.5',
  },
}

export function VinylCrateDividers({
  dividers,
  activeId,
  onDividerClick,
  orientation = 'horizontal',
  size = 'md',
  className,
}: VinylCrateDividersProps) {
  const styles = sizeStyles[size]

  if (orientation === 'vertical') {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        {dividers.map((divider, index) => (
          <VerticalDividerTab
            key={divider.id}
            divider={divider}
            isActive={activeId === divider.id}
            onClick={() => onDividerClick?.(divider.id)}
            index={index}
            size={size}
          />
        ))}
      </div>
    )
  }

  return (
    <div 
      className={cn(
        'flex items-end gap-0.5 overflow-x-auto scrollbar-hide',
        className
      )}
      role="tablist"
      aria-label="Crate sections"
    >
      {dividers.map((divider, index) => (
        <HorizontalDividerTab
          key={divider.id}
          divider={divider}
          isActive={activeId === divider.id}
          onClick={() => onDividerClick?.(divider.id)}
          index={index}
          styles={styles}
        />
      ))}
    </div>
  )
}

interface DividerTabProps {
  divider: CrateDivider
  isActive: boolean
  onClick: () => void
  index: number
}

function HorizontalDividerTab({
  divider,
  isActive,
  onClick,
  index,
  styles,
}: DividerTabProps & { styles: typeof sizeStyles.md }) {
  const defaultColors = [
    'from-amber-500 to-orange-500',
    'from-emerald-500 to-teal-500',
    'from-violet-500 to-purple-500',
    'from-rose-500 to-pink-500',
    'from-sky-500 to-blue-500',
    'from-lime-500 to-green-500',
  ]
  
  const colorClass = divider.color || defaultColors[index % defaultColors.length]

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      role="tab"
      aria-selected={isActive}
      className={cn(
        'relative flex items-center gap-2 rounded-t-lg transition-all',
        styles.tab,
        isActive 
          ? 'bg-zinc-800 text-white' 
          : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
      )}
    >
      {/* Color indicator - like a vinyl label peeking out */}
      <div 
        className={cn(
          'absolute top-0 left-0 right-0 rounded-t-lg bg-gradient-to-r transition-all',
          styles.indicator,
          colorClass,
          isActive ? 'opacity-100' : 'opacity-40'
        )}
      />
      
      {/* Icon */}
      {divider.icon && (
        <span className="flex-shrink-0">
          {divider.icon}
        </span>
      )}
      
      {/* Label */}
      <span className="font-medium whitespace-nowrap">
        {divider.label}
      </span>
      
      {/* Count badge */}
      {divider.count !== undefined && (
        <span className={cn(
          'flex-shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-bold',
          isActive 
            ? 'bg-white/20 text-white' 
            : 'bg-zinc-800 text-zinc-500'
        )}>
          {divider.count}
        </span>
      )}
      
      {/* Active indicator dot */}
      {isActive && (
        <motion.div
          layoutId="active-divider"
          className={cn(
            'absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gradient-to-r',
            colorClass
          )}
        />
      )}
    </motion.button>
  )
}

function VerticalDividerTab({
  divider,
  isActive,
  onClick,
  index,
  size,
}: DividerTabProps & { size: 'sm' | 'md' | 'lg' }) {
  const defaultColors = [
    'from-amber-500 to-orange-500',
    'from-emerald-500 to-teal-500',
    'from-violet-500 to-purple-500',
    'from-rose-500 to-pink-500',
    'from-sky-500 to-blue-500',
  ]
  
  const colorClass = divider.color || defaultColors[index % defaultColors.length]
  
  const paddingClass = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  }[size]

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-3 rounded-lg transition-all text-left',
        paddingClass,
        isActive
          ? 'bg-zinc-800 text-white'
          : 'bg-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
      )}
    >
      {/* Side color indicator - like vinyl spine */}
      <div 
        className={cn(
          'absolute left-0 top-2 bottom-2 w-1 rounded-full bg-gradient-to-b transition-opacity',
          colorClass,
          isActive ? 'opacity-100' : 'opacity-30'
        )}
      />
      
      {/* Icon */}
      {divider.icon && (
        <span className={cn(
          'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
          isActive ? 'bg-white/10' : 'bg-zinc-800/50'
        )}>
          {divider.icon}
        </span>
      )}
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <span className="font-medium block truncate">
          {divider.label}
        </span>
        {divider.count !== undefined && (
          <span className="text-xs text-zinc-500">
            {divider.count} {divider.count === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>
      
      {/* Arrow indicator */}
      {isActive && (
        <motion.svg
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="flex-shrink-0 text-zinc-500"
        >
          <path
            d="M6 4l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      )}
    </motion.button>
  )
}

/**
 * Preset dividers for common use cases
 */
export const presetDividers = {
  /** Alphabetical A-Z dividers */
  alphabetical: (): CrateDivider[] => 
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => ({
      id: letter.toLowerCase(),
      label: letter,
    })),
    
  /** Genre-based dividers */
  genres: [
    { id: 'street-art', label: 'Street Art', icon: '🎨' },
    { id: 'photography', label: 'Photography', icon: '📷' },
    { id: 'digital', label: 'Digital', icon: '💻' },
    { id: 'mixed-media', label: 'Mixed Media', icon: '🖼️' },
    { id: 'prints', label: 'Prints', icon: '🖨️' },
  ] as CrateDivider[],
  
  /** Collection status dividers */
  status: [
    { id: 'owned', label: 'Owned', icon: '✓', color: 'from-emerald-500 to-teal-500' },
    { id: 'wishlist', label: 'Wishlist', icon: '♥', color: 'from-rose-500 to-pink-500' },
    { id: 'available', label: 'Available', icon: '○', color: 'from-sky-500 to-blue-500' },
  ] as CrateDivider[],
  
  /** Price range dividers */
  priceRanges: [
    { id: 'under-100', label: 'Under $100' },
    { id: '100-500', label: '$100 - $500' },
    { id: '500-1000', label: '$500 - $1,000' },
    { id: 'over-1000', label: 'Over $1,000' },
  ] as CrateDivider[],
}
