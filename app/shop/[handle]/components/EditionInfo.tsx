'use client'

import { cn } from '@/lib/utils'

/**
 * Edition Info Component
 * 
 * Displays edition size and availability information.
 * Shows limited edition badge and scarcity indicators.
 */

interface EditionInfoProps {
  editionSize: number | null
  totalEditions?: number | null
  soldCount?: number
  className?: string
}

export function EditionInfo({ 
  editionSize, 
  totalEditions,
  soldCount,
  className 
}: EditionInfoProps) {
  // Don't show if no edition data
  if (!editionSize && !totalEditions) {
    return null
  }

  const total = totalEditions || editionSize || 0
  const sold = soldCount || 0
  const remaining = Math.max(0, total - sold)
  const percentageRemaining = total > 0 ? (remaining / total) * 100 : 0
  
  // Determine scarcity level
  const isLowStock = remaining > 0 && remaining <= 5
  const isVeryScarce = remaining > 0 && remaining <= 2
  const isSoldOut = remaining === 0

  return (
    <div className={cn('space-y-3', className)}>
      {/* Edition Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-2 bg-[#1a1a1a]/5 rounded-lg border border-[#1a1a1a]/10">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="2"
          className="flex-shrink-0"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        <div>
          <p className="text-xs font-medium text-[#1a1a1a]/60 uppercase tracking-wider">
            Limited Edition
          </p>
          <p className="text-sm font-semibold text-[#1a1a1a]">
            Edition of {total.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Scarcity Indicator */}
      {!isSoldOut && remaining > 0 && (
        <div className="space-y-2">
          {/* Progress Bar */}
          <div className="relative h-2 bg-[#1a1a1a]/10 rounded-full overflow-hidden">
            <div
              className={cn(
                'absolute inset-y-0 left-0 rounded-full transition-all duration-500',
                isVeryScarce && 'bg-gradient-to-r from-[#f83a3a] to-[#ff6b6b]',
                isLowStock && !isVeryScarce && 'bg-gradient-to-r from-[#f0c417] to-[#ffdd57]',
                !isLowStock && 'bg-gradient-to-r from-[#2c4bce] to-[#4a6cf7]'
              )}
              style={{ width: `${100 - percentageRemaining}%` }}
            />
          </div>

          {/* Availability Message */}
          <div className={cn(
            'flex items-center gap-2 text-sm font-medium',
            isVeryScarce && 'text-[#f83a3a]',
            isLowStock && !isVeryScarce && 'text-[#f0c417]',
            !isLowStock && 'text-[#0a8754]'
          )}>
            {isVeryScarce && (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>Only {remaining} left! Almost sold out</span>
              </>
            )}
            {isLowStock && !isVeryScarce && (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>Low stock - Only {remaining} remaining</span>
              </>
            )}
            {!isLowStock && (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>{remaining} of {total} available</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Sold Out State */}
      {isSoldOut && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#f83a3a]/10 rounded-lg border border-[#f83a3a]/20">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f83a3a" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span className="text-sm font-medium text-[#f83a3a]">
            This edition has sold out
          </span>
        </div>
      )}
    </div>
  )
}
