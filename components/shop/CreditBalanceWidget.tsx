'use client'

/**
 * Credit Balance Widget
 * 
 * Shows credit balance in header for members.
 * Displays as a compact badge with tooltip/dropdown for details.
 */

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useShopAuthContext } from '@/lib/shop/ShopAuthContext'
import { Coins, ChevronDown, TrendingUp, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CreditBalanceWidgetProps {
  className?: string
  compact?: boolean
}

export function CreditBalanceWidget({ 
  className,
  compact = false 
}: CreditBalanceWidgetProps) {
  const { user, loading, isAuthenticated } = useShopAuthContext()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Don't show for non-authenticated or non-members
  if (loading || !isAuthenticated || !user?.isMember) {
    return null
  }

  const creditBalance = user.creditBalance || 0
  const creditValue = user.creditBalanceValue || 0
  const tierName = user.membershipTier || 'Member'

  // Format credit display
  const formatCredits = (credits: number): string => {
    if (credits >= 10000) {
      return `${(credits / 1000).toFixed(1)}k`
    }
    return credits.toLocaleString()
  }

  if (compact) {
    return (
      <Link
        href="/collector/membership"
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-full',
          'bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors',
          'text-sm font-medium',
          className
        )}
      >
        <Coins className="w-4 h-4" />
        <span>{formatCredits(creditBalance)}</span>
      </Link>
    )
  }

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg',
          'bg-gradient-to-r from-amber-100 to-amber-50',
          'border border-amber-200',
          'hover:from-amber-200 hover:to-amber-100',
          'transition-all duration-200',
          isOpen && 'ring-2 ring-amber-300'
        )}
      >
        <Coins className="w-4 h-4 text-amber-600" />
        <span className="font-semibold text-amber-900">
          {formatCredits(creditBalance)}
        </span>
        <ChevronDown 
          className={cn(
            'w-4 h-4 text-amber-600 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div 
          className={cn(
            'absolute right-0 top-full mt-2 w-64',
            'bg-white rounded-lg shadow-lg border border-slate-200',
            'z-50 overflow-hidden',
            'animate-in fade-in slide-in-from-top-2 duration-200'
          )}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-white border-b border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Your Credits</span>
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full font-medium',
                tierName === 'founding' ? 'bg-amber-200 text-amber-900' :
                tierName === 'curator' ? 'bg-violet-100 text-violet-800' :
                'bg-indigo-100 text-indigo-800'
              )}>
                {tierName.charAt(0).toUpperCase() + tierName.slice(1)}
              </span>
            </div>
            <div className="mt-1">
              <span className="text-2xl font-bold text-slate-900">
                {creditBalance.toLocaleString()}
              </span>
              <span className="text-sm text-slate-500 ml-2">
                (${creditValue.toFixed(2)} value)
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Credits appreciate over time
                </p>
                <p className="text-xs text-slate-500">
                  Hold them longer for up to 20% bonus value
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Use at checkout
                </p>
                <p className="text-xs text-slate-500">
                  10 credits = $1 towards any purchase
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 space-y-2">
            <Link
              href="/collector/membership"
              className="block w-full text-center px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              View Membership
            </Link>
            <Link
              href="/shop"
              className="block w-full text-center px-4 py-2 text-slate-600 hover:text-slate-900 text-sm"
              onClick={() => setIsOpen(false)}
            >
              Shop Now
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default CreditBalanceWidget
