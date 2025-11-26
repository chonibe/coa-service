'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TruckIcon, ClockIcon, CheckCircleIcon, ExclamationCircleIcon, ArrowPathIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'

interface TrackingTimelineProps {
  orderId: string
  trackingNumber?: string
  compact?: boolean
  primaryColor?: string
  carrier?: string
  lastMileTracking?: string
}

interface TrackingEvent {
  timestamp: string
  description: string
  location?: string
  city?: string
  country?: string
  state?: string
  facility?: string
  status?: string
  parsedTime?: {
    date: string
    time: string
    relative: string
    full: string
    stone3plFormat?: string
  }
}

interface TrackingData {
  tracking_number?: string
  track_list?: Array<[string, string]>
  track_status?: number
  track_status_name?: string
  error_code?: number
  error_msg?: string
  carrier?: string
  last_mile_tracking?: string
  timeline?: {
    events: TrackingEvent[]
    currentStatus: {
      code: number
      name: string
      description: string
      isDelivered: boolean
      isInTransit: boolean
      isException: boolean
    }
    hasError: boolean
    errorMessage?: string
  }
  parsed_events?: TrackingEvent[]
  status_info?: {
    code: number
    name: string
    description: string
    isDelivered: boolean
    isInTransit: boolean
    isException: boolean
  }
}

export function TrackingTimeline({ orderId, trackingNumber, compact = false, primaryColor, carrier, lastMileTracking }: TrackingTimelineProps) {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTracking = async () => {
    if (!orderId) return

    try {
      setIsLoading(true)
      setError(null)

      // Include tracking number if available for better lookup
      const url = trackingNumber 
        ? `/api/tracking/stone3pl?order_id=${encodeURIComponent(orderId)}&tracking_number=${encodeURIComponent(trackingNumber)}`
        : `/api/tracking/stone3pl?order_id=${encodeURIComponent(orderId)}`
      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        // Handle 404 gracefully - tracking might not be available yet
        if (response.status === 404 || response.status === 500) {
          setError(null) // Don't show error for missing tracking
          setTrackingData(null)
          return
        }
        throw new Error(data.message || 'Failed to fetch tracking')
      }

      // Merge carrier and last_mile_tracking from props if available
      setTrackingData({
        ...data.tracking,
        carrier: data.tracking?.carrier || carrier,
        last_mile_tracking: data.tracking?.last_mile_tracking || lastMileTracking,
      })
    } catch (err: any) {
      console.error('Error fetching tracking:', err)
      // Don't show error for 404s - tracking might not be available yet
      if (err.message?.includes('404') || err.message?.includes('not found')) {
        setError(null)
        setTrackingData(null)
      } else {
        setError(err.message || 'Failed to load tracking information')
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (orderId) {
      fetchTracking()
    }
  }, [orderId])

  if (isLoading) {
    if (compact) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )
    }
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon size="md"><TruckIcon className="h-5 w-5" /></Icon>
            Tracking Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon size="md"><TruckIcon className="h-5 w-5" /></Icon>
            Tracking Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <Icon size="sm"><ExclamationCircleIcon className="h-4 w-4" /></Icon>
            <AlertDescription>
              {error}
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={fetchTracking}
              >
                <Icon size="sm"><ArrowPathIcon className="h-4 w-4 mr-2" /></Icon>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!trackingData) {
    if (compact) {
      return (
        <div className="text-xs text-center text-muted-foreground py-2">
          <Icon size="sm"><ClockIcon className="h-4 w-4 mx-auto mb-1 opacity-50" /></Icon>
          <p>Tracking not available yet</p>
        </div>
      )
    }
    return null
  }

  const events = trackingData.parsed_events || trackingData.timeline?.events || []
  const statusInfo = trackingData.status_info || trackingData.timeline?.currentStatus

  const getStatusIcon = (statusCode?: number) => {
    if (!statusCode) return <Icon size="sm"><ClockIcon className="h-4 w-4" /></Icon>
    if (statusCode === 121) return <Icon size="sm"><CheckCircleIcon className="h-4 w-4 text-green-500" /></Icon>
    if (statusCode === 131 || statusCode === 132) return <Icon size="sm"><ExclamationCircleIcon className="h-4 w-4 text-red-500" /></Icon>
    return <Icon size="sm"><TruckIcon className="h-4 w-4 text-blue-500" /></Icon>
  }

  const getStatusBadge = (statusCode?: number) => {
    if (!statusCode) return <Badge variant="outline">Pending</Badge>
    if (statusCode === 121) return <Badge variant="default" className="bg-green-500">Delivered</Badge>
    if (statusCode === 131) return <Badge variant="destructive">Alert</Badge>
    if (statusCode === 132) return <Badge variant="destructive">Expired</Badge>
    if (statusCode === 101 || statusCode === 111 || statusCode === 112) {
      return <Badge variant="default">In Transit</Badge>
    }
    return <Badge variant="outline">{trackingData.track_status_name || 'Unknown'}</Badge>
  }

  // Compact version for cards - STONE3PL style
  if (compact) {
    const latestEvent = events[0]
    
    // Extract location from latest event (format: "City State" or "Country")
    const getLocationString = (event: TrackingEvent) => {
      // STONE3PL format: "City State" (e.g., "Needham MA")
      if (event.city && event.state) {
        return `${event.city} ${event.state}`
      }
      if (event.city && event.country) {
        return `${event.city}, ${event.country}`
      }
      if (event.location) return event.location
      if (event.city) return event.city
      if (event.country) return event.country
      return 'Unknown location'
    }
    
    // Extract status from description
    const getStatusFromDescription = (description: string) => {
      const lowerDesc = description.toLowerCase()
      if (lowerDesc.includes('delivered')) return 'Delivered'
      if (lowerDesc.includes('out for delivery')) return 'Out for delivery'
      if (lowerDesc.includes('arrival scan') || lowerDesc.includes('arrived')) return 'Arrival scan'
      if (lowerDesc.includes('transit out')) return 'Gateway transit out'
      if (lowerDesc.includes('transit in')) return 'Gateway transit in'
      if (lowerDesc.includes('ready for hand over')) return 'Parcel is ready for hand over to distributor'
      if (lowerDesc.includes('departure') || lowerDesc.includes('departed')) return 'Parcel departure in Sorting Centre'
      if (lowerDesc.includes('received at') || lowerDesc.includes('arrived at')) return 'Parcel received at Sorting Centre'
      if (lowerDesc.includes('picked up') || lowerDesc.includes('pick up')) return 'Parcel picked up'
      if (lowerDesc.includes('data received') || lowerDesc.includes('information received')) return 'Parcel Data Received'
      return description
    }
    
    // Check if latest event is a last mile event
    const isLatestLastMile = latestEvent && (() => {
      const desc = latestEvent.description.toLowerCase()
      return desc.includes('out for delivery') || 
             desc.includes('delivered') || 
             desc.includes('delivery') ||
             (latestEvent.country && latestEvent.country !== 'China' && latestEvent.country !== 'CN')
    })()
    
    return (
      <div className="space-y-2">
        {/* Latest Event - STONE3PL Style */}
        {latestEvent && (
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-2 text-xs">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold truncate" style={{ color: primaryColor || 'inherit' }}>
                    {getLocationString(latestEvent)}
                  </span>
                  <span className="font-medium truncate">
                    {getStatusFromDescription(latestEvent.description)}
                  </span>
                </div>
                {latestEvent.parsedTime?.stone3plFormat && (
                  <div className="text-muted-foreground mt-0.5">
                    {latestEvent.parsedTime.stone3plFormat}
                  </div>
                )}
                {/* Last Mile Courier Info for Latest Event */}
                {isLatestLastMile && trackingData && (trackingData.carrier || trackingData.last_mile_tracking) && (
                  <div className="mt-1.5 pt-1.5 border-t space-y-0.5" style={{ borderColor: 'var(--brand-primary-alpha-20)' }}>
                    {trackingData.carrier && (
                      <div className="text-[10px]">
                        <span className="text-muted-foreground">Courier: </span>
                        <span className="font-semibold">{trackingData.carrier}</span>
                      </div>
                    )}
                    {trackingData.last_mile_tracking && (
                      <div className="text-[10px]">
                        <span className="text-muted-foreground">Tracking: </span>
                        <span className="font-mono">{trackingData.last_mile_tracking}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Timeline Events - STONE3PL Style (up to 3 most recent) */}
        {events.length > 0 && (
          <div className="relative pt-2 border-t" style={{ borderColor: 'var(--brand-primary-alpha-20)' }}>
            <div className="space-y-2">
              {events.slice(0, 3).map((event, index) => {
                const locationStr = getLocationString(event)
                const statusStr = getStatusFromDescription(event.description)
                const desc = event.description.toLowerCase()
                const isLastMileEvent = desc.includes('out for delivery') || 
                                       desc.includes('delivered') || 
                                       desc.includes('delivery') ||
                                       (event.country && event.country !== 'China' && event.country !== 'CN')
                
                return (
                  <div key={index} className="flex items-start gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-current mt-1.5 flex-shrink-0" style={{ color: 'var(--brand-primary-alpha-50)' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{locationStr}</span>
                        <span className="text-muted-foreground truncate">{statusStr}</span>
                      </div>
                      {event.parsedTime?.stone3plFormat && (
                        <div className="text-muted-foreground mt-0.5 text-xs">
                          {event.parsedTime.stone3plFormat}
                        </div>
                      )}
                      {/* Last Mile Courier Info in Compact View */}
                      {isLastMileEvent && index === 0 && (trackingData.carrier || trackingData.last_mile_tracking) && (
                        <div className="mt-1.5 pt-1.5 border-t space-y-0.5" style={{ borderColor: 'var(--brand-primary-alpha-20)' }}>
                          {trackingData.carrier && (
                            <div className="text-[10px]">
                              <span className="text-muted-foreground">Courier: </span>
                              <span className="font-semibold">{trackingData.carrier}</span>
                            </div>
                          )}
                          {trackingData.last_mile_tracking && (
                            <div className="text-[10px]">
                              <span className="text-muted-foreground">Tracking: </span>
                              <span className="font-mono">{trackingData.last_mile_tracking}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              {events.length > 3 && (
                <div className="text-xs text-center text-muted-foreground pt-1">
                  +{events.length - 3} more updates
                </div>
              )}
            </div>
          </div>
        )}
        
        {events.length === 0 && (
          <div className="text-xs text-center text-muted-foreground py-2">
            <Icon size="sm"><ClockIcon className="h-4 w-4 mx-auto mb-1 opacity-50" /></Icon>
            <p>No tracking updates yet</p>
          </div>
        )}
      </div>
    )
  }

  // Full version for dialog
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Icon size="md"><TruckIcon className="h-5 w-5" /></Icon>
              STONE3PL Tracking Timeline
            </CardTitle>
            <CardDescription>
              Real-time tracking updates for this order
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTracking}
            disabled={isLoading}
          >
              <Icon size="sm"><ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /></Icon>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Last Checkpoint - STONE3PL Style */}
        {events.length > 0 && (
          <div className="mb-6 p-4 bg-muted rounded-lg border-2" style={{ borderColor: primaryColor || 'var(--primary)' }}>
            <div className="flex items-start gap-3">
              {getStatusIcon(statusInfo?.code)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-muted-foreground">Last Event:</span>
                  {getStatusBadge(statusInfo?.code)}
                </div>
                {(() => {
                  const lastEvent = events[0]
                  const getLocationString = (event: TrackingEvent) => {
                    if (event.city && event.state) {
                      return `${event.city} ${event.state}`
                    }
                    if (event.city && event.country) {
                      return `${event.city}, ${event.country}`
                    }
                    if (event.location) return event.location
                    if (event.city) return event.city
                    if (event.country) return event.country
                    return 'Unknown location'
                  }
                  
                  const getStatusFromDescription = (description: string) => {
                    const lowerDesc = description.toLowerCase()
                    if (lowerDesc.includes('delivered')) return 'Delivered'
                    if (lowerDesc.includes('out for delivery')) return 'Out for delivery'
                    if (lowerDesc.includes('arrival scan') || lowerDesc.includes('arrived')) return 'Arrival scan'
                    if (lowerDesc.includes('transit out')) return 'Gateway transit out'
                    if (lowerDesc.includes('transit in')) return 'Gateway transit in'
                    if (lowerDesc.includes('ready for hand over')) return 'Parcel is ready for hand over to distributor'
                    if (lowerDesc.includes('departure') || lowerDesc.includes('departed')) return 'Parcel departure in Sorting Centre'
                    if (lowerDesc.includes('received at') || lowerDesc.includes('arrived at')) return 'Parcel received at Sorting Centre'
                    if (lowerDesc.includes('picked up') || lowerDesc.includes('pick up')) return 'Parcel picked up'
                    if (lowerDesc.includes('data received') || lowerDesc.includes('information received')) return 'Parcel Data Received'
                    return description
                  }
                  
                  return (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-base">
                          {getLocationString(lastEvent)}
                        </span>
                        <span className="font-medium text-base">
                          {getStatusFromDescription(lastEvent.description)}
                        </span>
                      </div>
                      {lastEvent.parsedTime?.stone3plFormat && (
                        <div className="text-sm text-muted-foreground">
                          {lastEvent.parsedTime.stone3plFormat}
                        </div>
                      )}
                      {lastEvent.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {lastEvent.description}
                        </p>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Current Status (if no events yet) */}
        {events.length === 0 && statusInfo && (
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon(statusInfo.code)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">Current Status:</span>
                  {getStatusBadge(statusInfo.code)}
                </div>
                <p className="text-sm text-muted-foreground">{statusInfo.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tracking Number */}
        {trackingData.tracking_number && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Tracking Number:</span>
              <span className="font-mono">{trackingData.tracking_number}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {trackingData.timeline?.hasError && trackingData.timeline.errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <Icon size="sm"><ExclamationCircleIcon className="h-4 w-4" /></Icon>
            <AlertDescription>{trackingData.timeline.errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Timeline Events */}
        {events.length > 0 ? (
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Detailed Tracking History</h4>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
              
              <div className="space-y-6">
                {events.map((event, index) => {
                  const isFirst = index === 0
                  const isLast = index === events.length - 1
                  
                  // Detect if this is a last mile event
                  const isLastMileEvent = (() => {
                    const desc = event.description.toLowerCase()
                    return desc.includes('out for delivery') || 
                           desc.includes('delivered') || 
                           desc.includes('delivery') ||
                           (event.country && event.country !== 'China' && event.country !== 'CN')
                  })()
                  
                  return (
                    <div key={index} className="relative pl-12">
                      {/* Timeline dot */}
                      <div 
                        className={`absolute left-0 top-1.5 w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                          isFirst 
                            ? 'bg-primary border-primary text-primary-foreground' 
                            : 'bg-background border-muted-foreground'
                        }`}
                      >
                        {isFirst ? (
                          <Icon size="md"><TruckIcon className="h-5 w-5" /></Icon>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-current" />
                        )}
                      </div>
                      
                      <div className="space-y-2 pb-4 border-b last:border-b-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-relaxed">{event.description}</p>
                            
                            {/* Location Information */}
                            {(event.location || event.city || event.country || event.facility) && (
                              <div className="mt-2 space-y-1">
                                {event.location && (
                                  <div className="flex items-start gap-1.5 text-xs">
                                    <Icon size="xs"><MapPinIcon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-muted-foreground" /></Icon>
                                    <div className="flex-1">
                                      <span className="font-medium text-muted-foreground">Location: </span>
                                      <span className="text-foreground">
                                        {event.city && event.country 
                                          ? `${event.city}, ${event.country}`
                                          : event.location}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {event.facility && (
                                  <div className="flex items-start gap-1.5 text-xs">
                                    <Icon size="xs"><TruckIcon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-muted-foreground" /></Icon>
                                    <div className="flex-1">
                                      <span className="font-medium text-muted-foreground">Facility: </span>
                                      <span className="text-foreground">{event.facility}</span>
                                    </div>
                                  </div>
                                )}
                                {event.city && !event.location && (
                                  <div className="flex items-start gap-1.5 text-xs">
                                    <Icon size="xs"><MapPinIcon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-muted-foreground" /></Icon>
                                    <span className="text-foreground">{event.city}</span>
                                    {event.country && <span className="text-muted-foreground">, {event.country}</span>}
                                  </div>
                                )}
                                
                                {/* Last Mile Courier Information */}
                                {isLastMileEvent && (trackingData.carrier || trackingData.last_mile_tracking) && (
                                  <div className="mt-2 pt-2 border-t space-y-1">
                                    {trackingData.carrier && (
                                      <div className="flex items-start gap-1.5 text-xs">
                                        <Icon size="xs"><TruckIcon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-muted-foreground" /></Icon>
                                        <div className="flex-1">
                                          <span className="font-medium text-muted-foreground">Last Mile Courier: </span>
                                          <span className="text-foreground font-semibold">{trackingData.carrier}</span>
                                        </div>
                                      </div>
                                    )}
                                    {trackingData.last_mile_tracking && (
                                      <div className="flex items-start gap-1.5 text-xs">
                                        <Icon size="xs"><TruckIcon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-muted-foreground" /></Icon>
                                        <div className="flex-1">
                                          <span className="font-medium text-muted-foreground">Last Mile Tracking: </span>
                                          <span className="text-foreground font-mono">{trackingData.last_mile_tracking}</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Time Information */}
                          <div className="text-right flex-shrink-0">
                            {event.parsedTime ? (
                              <div className="space-y-0.5">
                                <div className="text-xs font-medium text-foreground">
                                  {event.parsedTime.date}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {event.parsedTime.time}
                                </div>
                                <div className="text-xs text-muted-foreground italic">
                                  {event.parsedTime.relative}
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(event.timestamp).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Icon size="xl"><TruckIcon className="h-12 w-12 mx-auto mb-4 opacity-50" /></Icon>
            <p>No tracking events available yet</p>
            <p className="text-xs mt-2">Tracking information will appear here once the package is in transit</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

