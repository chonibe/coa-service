"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  RefreshCw, 
  Check, 
  Bell, 
  BellOff 
} from "lucide-react"
import { NotificationCard } from "./components/NotificationCard"

interface Notification {
  id: string
  notification_type: string
  product_id?: string
  title: string
  body?: string
  thumbnail_url?: string
  action_url?: string
  sender_name?: string
  sender_avatar_url?: string
  is_read: boolean
  created_at: string
}

/**
 * Notifications Page
 * 
 * Features:
 * - Pull-to-refresh
 * - Swipe to dismiss
 * - Mark all as read
 * - Empty state
 */
export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Pull-to-refresh state
  const containerRef = useRef<HTMLDivElement>(null)
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const startY = useRef(0)

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      const response = await fetch('/api/collector/notifications', {
        credentials: 'include',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch notifications')
      }

      setNotifications(data.notifications || [])
      setUnreadCount(data.unread_count || 0)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY
      setIsPulling(true)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling) return
    const currentY = e.touches[0].clientY
    const diff = currentY - startY.current
    if (diff > 0 && diff < 150) {
      setPullDistance(diff)
    }
  }

  const handleTouchEnd = () => {
    if (pullDistance > 80) {
      fetchNotifications(true)
    }
    setPullDistance(0)
    setIsPulling(false)
  }

  // Mark as read
  const handleRead = async (id: string) => {
    try {
      await fetch('/api/collector/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notification_ids: [id] }),
      })

      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/collector/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mark_all_read: true }),
      })

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  // Dismiss notification
  const handleDismiss = async (id: string) => {
    try {
      // Optimistic update
      setNotifications(prev => prev.filter(n => n.id !== id))

      await fetch(`/api/collector/notifications?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
    } catch (err) {
      console.error('Failed to dismiss:', err)
      // Refetch on error
      fetchNotifications()
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
          </button>

          <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>

          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="p-2 -mr-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <Check className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
          </button>
        </div>
      </header>

      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div 
          className="flex items-center justify-center"
          style={{ height: pullDistance }}
        >
          <RefreshCw 
            className={`w-5 h-5 text-zinc-400 ${pullDistance > 80 ? 'text-blue-500' : ''}`}
            style={{ transform: `rotate(${pullDistance * 2}deg)` }}
          />
        </div>
      )}

      {/* Refreshing indicator */}
      {isRefreshing && (
        <div className="py-3 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
        </div>
      )}

      {/* Content */}
      <div
        ref={containerRef}
        className="pb-safe"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateY(${pullDistance / 3}px)` }}
      >
        {/* Loading state */}
        {isLoading && (
          <div className="py-12 text-center">
            <RefreshCw className="w-6 h-6 text-zinc-400 animate-spin mx-auto" />
            <p className="text-sm text-zinc-500 mt-2">Loading notifications...</p>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="py-12 text-center px-4">
            <p className="text-sm text-red-500">{error}</p>
            <button
              onClick={() => fetchNotifications()}
              className="mt-2 text-sm text-blue-500 hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && notifications.length === 0 && (
          <div className="py-16 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <BellOff className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">
              No notifications
            </h3>
            <p className="text-sm text-zinc-500 max-w-xs mx-auto">
              When artists reply to your posts or update their artworks, you'll see it here.
            </p>
          </div>
        )}

        {/* Notifications list */}
        {!isLoading && notifications.length > 0 && (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onDismiss={handleDismiss}
                onRead={handleRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
