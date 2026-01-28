"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { 
  MessageCircle, 
  Sparkles, 
  Bell, 
  Film,
  Megaphone,
  Trash2
} from "lucide-react"
import { formatRelativeTime } from "@/lib/story/types"

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

interface NotificationCardProps {
  notification: Notification
  onDismiss: (id: string) => void
  onRead: (id: string) => void
}

/**
 * NotificationCard - Swipeable notification item
 * 
 * Features:
 * - Swipe to dismiss
 * - Tap to mark as read and navigate
 * - Icon based on type
 */
export function NotificationCard({
  notification,
  onDismiss,
  onRead,
}: NotificationCardProps) {
  const [swipeX, setSwipeX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const startX = useRef(0)
  const cardRef = useRef<HTMLDivElement>(null)

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    setIsSwiping(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return
    const currentX = e.touches[0].clientX
    const diff = currentX - startX.current
    // Only allow left swipe
    if (diff < 0) {
      setSwipeX(Math.max(diff, -100))
    }
  }

  const handleTouchEnd = () => {
    if (swipeX < -60) {
      // Animate out and dismiss
      setSwipeX(-200)
      setTimeout(() => onDismiss(notification.id), 200)
    } else {
      setSwipeX(0)
    }
    setIsSwiping(false)
  }

  const handleClick = () => {
    if (!notification.is_read) {
      onRead(notification.id)
    }
  }

  // Get icon based on type
  const getIcon = () => {
    switch (notification.notification_type) {
      case 'artist_reply':
        return <MessageCircle className="w-5 h-5 text-blue-500" />
      case 'new_story_post':
        return <Sparkles className="w-5 h-5 text-purple-500" />
      case 'artwork_update':
        return <Bell className="w-5 h-5 text-green-500" />
      case 'new_slide':
        return <Film className="w-5 h-5 text-pink-500" />
      case 'announcement':
        return <Megaphone className="w-5 h-5 text-amber-500" />
      default:
        return <Bell className="w-5 h-5 text-zinc-500" />
    }
  }

  const content = (
    <div
      ref={cardRef}
      className={`relative flex items-start gap-3 p-4 transition-all ${
        notification.is_read 
          ? 'bg-white dark:bg-zinc-900' 
          : 'bg-blue-50/50 dark:bg-blue-900/10'
      }`}
      style={{ 
        transform: `translateX(${swipeX}px)`,
        transition: isSwiping ? 'none' : 'transform 0.2s ease-out',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      {/* Avatar or icon */}
      <div className="relative flex-shrink-0">
        {notification.sender_avatar_url ? (
          <Image
            src={notification.sender_avatar_url}
            alt={notification.sender_name || ''}
            width={44}
            height={44}
            className="rounded-full object-cover"
          />
        ) : notification.thumbnail_url ? (
          <Image
            src={notification.thumbnail_url}
            alt=""
            width={44}
            height={44}
            className="rounded-lg object-cover"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            {getIcon()}
          </div>
        )}
        
        {/* Type indicator badge */}
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center shadow-sm">
          {getIcon()}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${
          notification.is_read 
            ? 'text-zinc-600 dark:text-zinc-400' 
            : 'text-zinc-900 dark:text-white font-medium'
        }`}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-sm text-zinc-500 dark:text-zinc-500 line-clamp-2 mt-0.5">
            {notification.body}
          </p>
        )}
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
          {formatRelativeTime(notification.created_at)}
        </p>
      </div>

      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
      )}
    </div>
  )

  // Delete button behind swipe
  return (
    <div className="relative overflow-hidden">
      {/* Delete button (revealed on swipe) */}
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-red-500 flex items-center justify-center">
        <Trash2 className="w-6 h-6 text-white" />
      </div>

      {/* Card content */}
      {notification.action_url ? (
        <Link href={notification.action_url}>
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  )
}

export default NotificationCard
