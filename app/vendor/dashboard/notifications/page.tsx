"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, CheckCircle, XCircle, AlertCircle, DollarSign } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  metadata: Record<string, any>
  is_read: boolean
  created_at: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/vendor/notifications")
      if (!response.ok) throw new Error("Failed to fetch notifications")
      const data = await response.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unread_count || 0)
    } catch (error: any) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/vendor/notifications/${id}/read`, {
        method: "POST",
      })
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/vendor/notifications/read-all", {
        method: "POST",
      })
      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error("Error marking all as read:", error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "payout_processed":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "payout_failed":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "payout_pending":
        return <DollarSign className="h-5 w-5 text-yellow-600" />
      case "refund_deduction":
        return <AlertCircle className="h-5 w-5 text-purple-600" />
      default:
        return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case "payout_processed":
        return <Badge className="bg-green-100 text-green-800">Payout</Badge>
      case "payout_failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      case "payout_pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "refund_deduction":
        return <Badge className="bg-purple-100 text-purple-800">Refund</Badge>
      default:
        return <Badge variant="outline">System</Badge>
    }
  }

  if (loading) {
    return <div className="p-6">Loading notifications...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-muted-foreground text-lg mt-1">
            {unreadCount > 0 ? `You have ${unreadCount} new notification${unreadCount !== 1 ? "s" : ""}` : "All caught up! No new notifications."}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button 
            onClick={markAllAsRead} 
            variant="outline"
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
          >
            Mark All Read
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
            <CardContent className="py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">You're all caught up! No notifications right now.</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl ${notification.is_read ? "opacity-75" : "border-l-4 border-l-blue-600"}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{notification.title}</h3>
                          {getNotificationBadge(notification.type)}
                          {!notification.is_read && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(notification.created_at), "PPp")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm"
                          >
                            Mark Read
                          </Button>
                        )}
                        {notification.link && (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={notification.link}>View</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

