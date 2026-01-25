"use client"

import { useState, useEffect } from "react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

import { Bell, Check, CheckCheck, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { EmptyState } from "./empty-state"
import { usePolling } from "@/hooks/use-polling"
import Link from "next/link"

import { Button, Badge } from "@/components/ui"
interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  metadata: Record<string, any> | null
  is_read: boolean
  created_at: string
}

interface NotificationCenterProps {
  className?: string
}

/**
 * Notification center component with bell icon and dropdown
 * Shows unread notifications and allows marking as read
 */
export function NotificationCenter({ className }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  const { data, isLoading, error, refetch } = usePolling<{
    notifications: Notification[]
    unreadCount: number
  }>(
    async () => {
      const response = await fetch("/api/vendor/notifications?unread_only=false&limit=20", {
        credentials: "include",
      })
      if (!response.ok) throw new Error("Failed to fetch notifications")
      return response.json()
    },
    { interval: 30000, enabled: true }
  )

  const notifications = data?.notifications || []
  const unreadCount = data?.unreadCount || 0

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/vendor/notifications/${id}/read`, {
        method: "PUT",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to mark as read")
      }

      refetch()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark notification as read",
      })
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch("/api/vendor/notifications/read-all", {
        method: "PUT",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to mark all as read")
      }

      toast({
        title: "All notifications marked as read",
      })
      refetch()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark all as read",
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_order":
        return "📦"
      case "payout_processed":
        return "💰"
      case "product_status_change":
        return "📝"
      case "system_announcement":
        return "📢"
      case "message_received":
        return "💬"
      default:
        return "🔔"
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "new_order":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "payout_processed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "product_status_change":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "system_announcement":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
      case "message_received":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("relative min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)}
          aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
          aria-expanded={isOpen}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
              aria-label={`${unreadCount} unread`}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-8 text-xs"
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-sm text-destructive">
              Failed to load notifications
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No notifications"
              description="You're all caught up! New notifications will appear here."
              className="py-8"
            />
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-accent transition-colors",
                    !notification.is_read && "bg-accent/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm",
                        getNotificationColor(notification.type)
                      )}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(notification.created_at), "MMM d, h:mm a")}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      {notification.link && (
                        <Link
                          href={notification.link}
                          className="text-xs text-primary hover:underline mt-2 inline-block"
                          onClick={() => setIsOpen(false)}
                        >
                          View details →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="border-t p-2">
            <Link
              href="/vendor/dashboard/notifications"
              className="block text-center text-sm text-primary hover:underline"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

