'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Truck, CheckCircle2, Clock, AlertCircle, MapPin } from 'lucide-react'
import type { OrderTrackListItem } from '@/lib/chinadivision/client'

interface TrackingTimelineProps {
  trackingData: OrderTrackListItem
}

export function TrackingTimeline({ trackingData }: TrackingTimelineProps) {
  const getTrackStatusBadge = (trackStatus: number, trackStatusName: string) => {
    const trackStatusMap: Record<number, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      0: { label: 'To be updated', variant: 'outline' },
      101: { label: 'In Transit', variant: 'default' },
      111: { label: 'Pick Up', variant: 'secondary' },
      112: { label: 'Out For Delivery', variant: 'default' },
      121: { label: 'Delivered', variant: 'default' },
      131: { label: 'Alert', variant: 'destructive' },
      132: { label: 'Expired', variant: 'destructive' },
    }

    const trackInfo = trackStatusMap[trackStatus] || { label: trackStatusName, variant: 'outline' as const }
    return (
      <Badge variant={trackInfo.variant}>
        {trackInfo.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  const getStatusIcon = (index: number, total: number) => {
    if (index === 0) {
      return trackingData.track_status === 121 ? CheckCircle2 : Truck
    }
    return Clock
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Tracking Timeline
            </CardTitle>
            <CardDescription>
              Order {trackingData.order_id}
            </CardDescription>
          </div>
          {getTrackStatusBadge(trackingData.track_status, trackingData.track_status_name)}
        </div>
      </CardHeader>
      <CardContent>
        {trackingData.error_code !== 0 && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Error: {trackingData.error_msg}</span>
            </div>
          </div>
        )}

        {trackingData.tracking_number && (
          <div className="mb-4 p-3 bg-muted/50 rounded-md">
            <p className="text-sm font-medium mb-1">Tracking Number</p>
            <p className="text-muted-foreground font-mono text-sm">{trackingData.tracking_number}</p>
          </div>
        )}

        {trackingData.track_list && trackingData.track_list.length > 0 ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

              <div className="space-y-6">
                {trackingData.track_list.map((trackItem, index) => {
                  const [timestamp, statusMessage] = trackItem
                  const StatusIcon = getStatusIcon(index, trackingData.track_list.length)
                  const isLatest = index === 0

                  return (
                    <div key={index} className="relative flex items-start gap-4">
                      {/* Timeline dot */}
                      <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${
                        isLatest 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted border-2 border-background'
                      }`}>
                        <StatusIcon className="h-4 w-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 pt-1">
                        <div className="flex items-start justify-between gap-4 mb-1">
                          <p className="text-sm font-medium text-foreground">
                            {statusMessage}
                          </p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No tracking updates available</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
