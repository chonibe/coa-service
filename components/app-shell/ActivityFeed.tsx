'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  ShoppingBag,
  Shield,
  Award,
  TrendingUp,
  Sparkles,
  Gift,
  Bell,
  Palette,
  Tag,
  Gem,
} from 'lucide-react'

// ============================================================================
// Activity Feed
//
// Live feed of collector events for the Inbox > Activity tab.
// Shows purchases, NFC scans, certificates, series progress,
// level-ups, perk unlocks, new drops, and price drops.
// Styled like Instagram's activity/notification feed.
// ============================================================================

export type ActivityEventType =
  | 'purchase'
  | 'nfc_scan'
  | 'certificate_ready'
  | 'series_progress'
  | 'level_up'
  | 'perk_unlocked'
  | 'new_drop'
  | 'price_drop'
  | 'credits_earned'

export interface ActivityEvent {
  id: string
  type: ActivityEventType
  title: string
  description: string
  timestamp: string
  /** Optional image (artwork thumbnail) */
  imageUrl?: string
  /** Optional action button */
  action?: {
    label: string
    href: string
  }
  /** Whether this event has been seen */
  seen?: boolean
}

const eventConfig: Record<ActivityEventType, { icon: React.ReactNode; color: string; bgColor: string }> = {
  purchase: {
    icon: <ShoppingBag className="w-4 h-4" />,
    color: 'text-impact-primary',
    bgColor: 'bg-blue-50',
  },
  nfc_scan: {
    icon: <Shield className="w-4 h-4" />,
    color: 'text-impact-success',
    bgColor: 'bg-emerald-50',
  },
  certificate_ready: {
    icon: <Award className="w-4 h-4" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  series_progress: {
    icon: <TrendingUp className="w-4 h-4" />,
    color: 'text-impact-primary',
    bgColor: 'bg-blue-50',
  },
  level_up: {
    icon: <Sparkles className="w-4 h-4" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  perk_unlocked: {
    icon: <Gift className="w-4 h-4" />,
    color: 'text-impact-secondary-text',
    bgColor: 'bg-yellow-50',
  },
  new_drop: {
    icon: <Palette className="w-4 h-4" />,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
  },
  price_drop: {
    icon: <Tag className="w-4 h-4" />,
    color: 'text-impact-error',
    bgColor: 'bg-red-50',
  },
  credits_earned: {
    icon: <Gem className="w-4 h-4" />,
    color: 'text-impact-secondary-text',
    bgColor: 'bg-yellow-50',
  },
}

export interface ActivityFeedProps {
  events: ActivityEvent[]
  loading?: boolean
  className?: string
}

export function ActivityFeed({ events, loading = false, className }: ActivityFeedProps) {
  if (loading) {
    return (
      <div className={cn('space-y-3 px-4 py-4', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-100 rounded w-3/4" />
              <div className="h-2.5 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className={cn('text-center py-16 px-4', className)}>
        <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-500 font-body">No activity yet</p>
        <p className="text-xs text-gray-400 font-body mt-1">
          Your purchases, authentications, and rewards will show up here
        </p>
      </div>
    )
  }

  return (
    <div className={cn('divide-y divide-gray-50', className)}>
      {events.map((event) => {
        const config = eventConfig[event.type]
        return (
          <div
            key={event.id}
            className={cn(
              'flex items-start gap-3 px-4 py-3.5',
              'transition-colors duration-200',
              !event.seen && 'bg-blue-50/30'
            )}
          >
            {/* Event icon */}
            <div
              className={cn(
                'flex items-center justify-center shrink-0',
                'w-10 h-10 rounded-full',
                config.bgColor,
                config.color
              )}
            >
              {config.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 font-body leading-snug">
                {event.title}
              </p>
              <p className="text-xs text-gray-500 font-body mt-0.5">
                {event.description}
              </p>

              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-[11px] text-gray-400 font-body">
                  {formatTimeAgo(event.timestamp)}
                </span>
                {event.action && (
                  <a
                    href={event.action.href}
                    className="text-[11px] font-semibold text-impact-primary font-body hover:underline"
                  >
                    {event.action.label}
                  </a>
                )}
              </div>
            </div>

            {/* Optional thumbnail */}
            {event.imageUrl && (
              <img
                src={event.imageUrl}
                alt=""
                className="w-11 h-11 rounded-impact-block-xs object-cover shrink-0"
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/** Simple relative time formatter */
function formatTimeAgo(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diffMs = now - then

  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`

  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`

  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}w ago`

  return new Date(timestamp).toLocaleDateString()
}
