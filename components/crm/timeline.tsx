"use client"

import { useEffect, useState } from "react"


import { Loader2, Mail, Phone, Calendar, FileText, ShoppingBag, MessageSquare, Instagram, Facebook } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

import { Card, CardContent, Badge } from "@/components/ui"
interface Activity {
  id: string
  activity_type: string
  title: string
  description: string | null
  created_at: string
  platform: string | null
  metadata?: any
}

interface TimelineProps {
  customerId?: string
  companyId?: string
  conversationId?: string
  limit?: number
}

const activityIcons: Record<string, any> = {
  email: Mail,
  call: Phone,
  meeting: Calendar,
  note: FileText,
  task: FileText,
  order: ShoppingBag,
  message: MessageSquare,
  instagram_message: Instagram,
  facebook_message: Facebook,
  whatsapp_message: MessageSquare,
  shopify_order: ShoppingBag,
}

export function Timeline({ customerId, companyId, conversationId, limit = 50 }: TimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchActivities() {
      try {
        setIsLoading(true)
        setError(null)

        let url = `/api/crm/activities?limit=${limit}`
        if (customerId) url += `&customer_id=${customerId}`
        if (companyId) url += `&company_id=${companyId}`
        if (conversationId) url += `&conversation_id=${conversationId}`

        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to fetch activities: ${response.statusText}`)
        }

        const data = await response.json()
        setActivities(data.activities || [])
      } catch (err: any) {
        console.error("Error fetching activities:", err)
        setError(err.message || "Failed to load timeline")
      } finally {
        setIsLoading(false)
      }
    }

    if (customerId || companyId || conversationId) {
      fetchActivities()
    }
  }, [customerId, companyId, conversationId, limit])

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-destructive text-sm">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No activities found
      </div>
    )
  }

  // Group activities by date
  const grouped = activities.reduce((acc, activity) => {
    const date = new Date(activity.created_at).toLocaleDateString()
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(activity)
    return acc
  }, {} as Record<string, Activity[]>)

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, dateActivities]) => (
        <div key={date}>
          <div className="text-xs font-medium text-muted-foreground mb-3 sticky top-0 bg-background py-1">
            {date}
          </div>
          <div className="space-y-4">
            {dateActivities.map((activity) => {
              const Icon = activityIcons[activity.activity_type] || FileText
              return (
                <div key={activity.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="p-2 rounded-full bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="w-px h-full bg-border min-h-[2rem]" />
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {activity.activity_type.replace("_", " ")}
                      </Badge>
                      {activity.platform && (
                        <Badge variant="secondary" className="text-xs">
                          {activity.platform}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <h4 className="font-medium text-sm mb-1">{activity.title}</h4>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

