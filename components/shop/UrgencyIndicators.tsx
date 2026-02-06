'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import gsap from 'gsap'

/**
 * Urgency Indicators
 * 
 * Components to create urgency and drive conversions:
 * - Stock level indicators
 * - "X people viewing" counter
 * - Edition countdown timers
 * - Limited time offers
 */

// Stock Level Indicator
export interface StockIndicatorProps {
  quantity: number
  threshold?: number
  className?: string
}

export function StockIndicator({ quantity, threshold = 10, className }: StockIndicatorProps) {
  const isLow = quantity <= threshold && quantity > 0
  const isCritical = quantity <= 3 && quantity > 0
  const ref = React.useRef<HTMLDivElement>(null)
  
  React.useEffect(() => {
    if (isCritical && ref.current) {
      // Pulse animation for critical stock
      gsap.to(ref.current, {
        scale: 1.05,
        duration: 0.5,
        yoyo: true,
        repeat: -1,
        ease: 'power1.inOut',
      })
    }
  }, [isCritical])
  
  if (quantity <= 0) {
    return (
      <div className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full',
        'bg-[#1a1a1a]/5 text-[#1a1a1a]/60 text-sm font-medium',
        className
      )}>
        <span className="inline-block w-2 h-2 rounded-full bg-[#1a1a1a]/30" />
        Out of stock
      </div>
    )
  }
  
  if (!isLow) return null
  
  return (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full',
        'text-sm font-medium',
        isCritical
          ? 'bg-[#f83a3a]/10 text-[#f83a3a]'
          : 'bg-[#f0c417]/10 text-[#d4a615]',
        className
      )}
    >
      <span className={cn(
        'inline-block w-2 h-2 rounded-full',
        isCritical ? 'bg-[#f83a3a] animate-pulse' : 'bg-[#f0c417]'
      )} />
      Only {quantity} left
    </div>
  )
}

// Viewers Counter
export interface ViewersCounterProps {
  productId: string
  className?: string
}

export function ViewersCounter({ productId, className }: ViewersCounterProps) {
  const [count, setCount] = React.useState(0)
  const ref = React.useRef<HTMLDivElement>(null)
  
  React.useEffect(() => {
    // Generate a realistic-looking view count (between 1-15)
    // In production, this would come from analytics/real-time data
    const baseCount = Math.floor(Math.random() * 12) + 1
    setCount(baseCount)
    
    // Animate in
    if (ref.current) {
      gsap.from(ref.current, {
        opacity: 0,
        y: -10,
        duration: 0.4,
        ease: 'power2.out',
      })
    }
    
    // Randomly update count every 30-60 seconds
    const interval = setInterval(() => {
      const change = Math.floor(Math.random() * 5) - 2 // -2 to +2
      setCount(prev => Math.max(1, Math.min(15, prev + change)))
    }, Math.random() * 30000 + 30000)
    
    return () => clearInterval(interval)
  }, [productId])
  
  if (count === 0) return null
  
  return (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full',
        'bg-[#2c4bce]/10 text-[#2c4bce] text-sm font-medium',
        className
      )}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-current">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
        <path d="M4 20c0-3 3-6 8-6s8 3 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {count} viewing
    </div>
  )
}

// Edition Countdown Timer
export interface EditionCountdownProps {
  releaseDate: Date | string
  className?: string
}

export function EditionCountdown({ releaseDate, className }: EditionCountdownProps) {
  const [timeLeft, setTimeLeft] = React.useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)
  
  React.useEffect(() => {
    const targetDate = new Date(releaseDate).getTime()
    
    const updateTimer = () => {
      const now = Date.now()
      const diff = targetDate - now
      
      if (diff <= 0) {
        setTimeLeft(null)
        return
      }
      
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      })
    }
    
    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    
    return () => clearInterval(interval)
  }, [releaseDate])
  
  if (!timeLeft) return null
  
  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-4 py-2 rounded-full',
      'bg-gradient-to-r from-[#f0c417]/10 to-[#f83a3a]/10',
      'border border-[#f0c417]/30',
      className
    )}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#f0c417]">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div className="flex items-center gap-1 text-sm font-semibold text-[#1a1a1a]">
        {timeLeft.days > 0 && (
          <span>{timeLeft.days}d</span>
        )}
        <span>{String(timeLeft.hours).padStart(2, '0')}h</span>
        <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>
        <span>{String(timeLeft.seconds).padStart(2, '0')}s</span>
      </div>
    </div>
  )
}

// Recently Purchased Badge
export function RecentlyPurchased({ className }: { className?: string }) {
  const [visible, setVisible] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  
  React.useEffect(() => {
    // Show after random delay (simulate real purchase)
    const delay = Math.random() * 10000 + 5000
    const timeout = setTimeout(() => {
      setVisible(true)
      
      if (ref.current) {
        gsap.from(ref.current, {
          opacity: 0,
          x: 50,
          duration: 0.5,
          ease: 'back.out(1.7)',
        })
      }
      
      // Hide after 5 seconds
      setTimeout(() => {
        if (ref.current) {
          gsap.to(ref.current, {
            opacity: 0,
            x: 50,
            duration: 0.3,
            onComplete: () => setVisible(false),
          })
        }
      }, 5000)
    }, delay)
    
    return () => clearTimeout(timeout)
  }, [])
  
  if (!visible) return null
  
  return (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 rounded-lg',
        'bg-white shadow-lg border border-[#1a1a1a]/10',
        className
      )}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#0a8754]/10">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#0a8754]">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-[#1a1a1a]">Just purchased</p>
        <p className="text-xs text-[#1a1a1a]/60">Someone in New York</p>
      </div>
    </div>
  )
}

// Limited Edition Badge
export interface LimitedEditionProps {
  edition: number
  total: number
  className?: string
}

export function LimitedEdition({ edition, total, className }: LimitedEditionProps) {
  const percentage = (edition / total) * 100
  
  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
      'bg-[#1a1a1a] text-white text-sm font-medium',
      className
    )}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#f0c417]">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" />
      </svg>
      Edition {edition}/{total}
      <div className="h-1 w-12 bg-white/20 rounded-full overflow-hidden">
        <div 
          className="h-full bg-[#f0c417] rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
