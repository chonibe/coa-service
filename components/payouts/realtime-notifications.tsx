"use client"

import { useEffect, useState, useRef } from "react"
import { useToast } from "@/components/ui/use-toast"

import { Bell, X } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"

import { Badge, Button } from "@/components/ui"
interface Notification {
  id: string
  type: "payout_status" | "balance_update" | "new_payout" | "error"
  title: string
  message: string
  timestamp: Date
  read: boolean
  payoutId?: string
  vendorName?: string
}

interface RealtimeNotificationsProps {
  vendorName?: string
  isAdmin?: boolean
  onPayoutUpdate?: (payoutId: string) => void
}

export function RealtimeNotifications({
  vendorName,
  isAdmin = false,
  onPayoutUpdate,
}: RealtimeNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Initialize Server-Sent Events connection
    const url = isAdmin
      ? "/api/payouts/notifications/stream"
      : `/api/payouts/notifications/stream?vendorName=${encodeURIComponent(vendorName || "")}`

    const eventSource = new EventSource(url, { withCredentials: true })
    eventSourceRef.current = eventSource

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        handleNotification(data)
      } catch (error) {
        console.error("Error parsing notification:", error)
      }
    }

    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error)
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (eventSourceRef.current) {
          eventSourceRef.current.close()
          eventSourceRef.current = new EventSource(url, { withCredentials: true })
        }
      }, 5000)
    }

    return () => {
      eventSource.close()
    }
  }, [vendorName, isAdmin])

  const handleNotification = (data: any) => {
    const notification: Notification = {
      id: data.id || `notif-${Date.now()}-${Math.random()}`,
      type: data.type || "payout_status",
      title: data.title || "Payout Update",
      message: data.message || "",
      timestamp: new Date(data.timestamp || Date.now()),
      read: false,
      payoutId: data.payoutId,
      vendorName: data.vendorName,
    }

    setNotifications((prev) => [notification, ...prev])
    setUnreadCount((prev) => prev + 1)

    // Show toast notification
    toast({
      title: notification.title,
      description: notification.message,
    })

    // Trigger callback if payout update
    if (notification.type === "payout_status" && notification.payoutId && onPayoutUpdate) {
      onPayoutUpdate(notification.payoutId)
    }
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const clearNotifications = () => {
    setNotifications([])
    setUnreadCount(0)
  }

  const unreadNotifications = notifications.filter((n) => !n.read)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={clearNotifications}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No notifications
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                    !notification.read ? "bg-primary/5" : ""
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{notification.title}</p>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(notification.timestamp, "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}



