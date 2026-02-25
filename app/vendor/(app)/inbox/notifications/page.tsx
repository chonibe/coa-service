'use client'

import { useEffect, useState, useCallback } from 'react'
import { SubTabBar, type SubTab } from '@/components/app-shell'
import {
  Bell,
  BellOff,
  Check,
  DollarSign,
  ShieldCheck,
  ShoppingBag,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Vendor Notifications — Phase 2.8
//
// API: /api/vendor/notifications, /api/vendor/notifications/read-all
// Render: Notification list with type icon, message, timestamp, unread indicator
// Old source: Similar to collector notifications
// ============================================================================

const inboxTabs: SubTab[] = [
  { id: 'messages', label: 'Messages', href: '/vendor/inbox' },
  { id: 'notifications', label: 'Notifications', href: '/vendor/inbox/notifications' },
]

interface VendorNotification {
  id: string
  type: string
  title: string
  body?: string
  is_read: boolean
  created_at: string
  action_url?: string
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'sale':
    case 'new_order':
      return <ShoppingBag className="w-4 h-4 text-green-500" />
    case 'payout':
    case 'payout_completed':
      return <DollarSign className="w-4 h-4 text-blue-500" />
    case 'authentication':
    case 'nfc_scan':
      return <ShieldCheck className="w-4 h-4 text-purple-500" />
    case 'alert':
    case 'warning':
      return <AlertCircle className="w-4 h-4 text-amber-500" />
    default:
      return <Bell className="w-4 h-4 text-gray-500" />
  }
}

export default function VendorNotificationsPage() {
  const [notifications, setNotifications] = useState<VendorNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/vendor/notifications', { credentials: 'include' })
      if (res.ok) {
        const json = await res.json()
        setNotifications(json.notifications || [])
        setUnreadCount(
          (json.notifications || []).filter((n: any) => !n.is_read).length
        )
      }
    } catch (err) {
      console.error('[VendorNotifications] Failed to fetch:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/vendor/notifications/read-all', {
        method: 'POST',
        credentials: 'include',
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('[VendorNotifications] Failed to mark all read:', err)
    }
  }

  return (
    <div>
      <SubTabBar tabs={inboxTabs} />

      <div className="px-4 py-4 space-y-3">
        {/* Mark all read */}
        {unreadCount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-body">{unreadCount} unread</span>
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 text-xs font-semibold text-impact-primary font-body"
            >
              <Check className="w-3 h-3" /> Mark all read
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-2 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <BellOff className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-body">No notifications</p>
            <p className="text-xs text-gray-400 font-body mt-1">
              Sales alerts, authentication events, and system updates will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-impact-block-sm transition-colors',
                  notification.is_read ? 'bg-white' : 'bg-blue-50/50'
                )}
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  {getTypeIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-body',
                    notification.is_read ? 'text-gray-600' : 'text-gray-900 font-medium'
                  )}>
                    {notification.title}
                  </p>
                  {notification.body && (
                    <p className="text-xs text-gray-500 font-body line-clamp-2 mt-0.5">{notification.body}</p>
                  )}
                  <p className="text-[10px] text-gray-400 font-body mt-1">
                    {formatRelativeTime(notification.created_at)}
                  </p>
                </div>
                {!notification.is_read && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
