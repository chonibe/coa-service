'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Package, Truck, MapPin, Calendar, Mail, Phone, ExternalLink } from 'lucide-react'
import type { ChinaDivisionOrderInfo } from '@/lib/chinadivision/client'

interface WarehouseOrderCardProps {
  order: ChinaDivisionOrderInfo
  onViewDetails?: (orderId: string) => void
}

export function WarehouseOrderCard({ order, onViewDetails }: WarehouseOrderCardProps) {
  const getStatusBadge = (status?: number, statusName?: string) => {
    if (!status && !statusName) return null

    const statusMap: Record<number, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      0: { label: 'Approving', variant: 'outline' },
      10: { label: 'Approved', variant: 'default' },
      11: { label: 'Uploaded', variant: 'default' },
      8: { label: 'Picking', variant: 'secondary' },
      9: { label: 'Packing', variant: 'secondary' },
      5: { label: 'Packaged', variant: 'default' },
      2: { label: 'Awaiting Shipping', variant: 'outline' },
      3: { label: 'Shipped', variant: 'default' },
      4: { label: 'Special Event', variant: 'secondary' },
      24: { label: 'Processing', variant: 'secondary' },
      19: { label: 'Reviewing', variant: 'outline' },
      21: { label: 'Processing', variant: 'secondary' },
      23: { label: 'Canceled', variant: 'destructive' },
    }

    const statusInfo = status !== undefined ? statusMap[status] : null
    const label = statusName || statusInfo?.label || `Status ${status}`

    return (
      <Badge variant={statusInfo?.variant || 'outline'}>
        {label}
      </Badge>
    )
  }

  const getTrackStatusBadge = (trackStatus?: number, trackStatusName?: string) => {
    if (!trackStatus && !trackStatusName) return null

    const trackStatusMap: Record<number, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      0: { label: 'To be updated', variant: 'outline' },
      101: { label: 'In Transit', variant: 'default' },
      111: { label: 'Pick Up', variant: 'secondary' },
      112: { label: 'Out For Delivery', variant: 'default' },
      121: { label: 'Delivered', variant: 'default' },
      131: { label: 'Alert', variant: 'destructive' },
      132: { label: 'Expired', variant: 'destructive' },
    }

    const trackInfo = trackStatus !== undefined ? trackStatusMap[trackStatus] : null
    const label = trackStatusName || trackInfo?.label || `Track ${trackStatus}`

    return (
      <Badge variant={trackInfo?.variant || 'outline'} className="ml-2">
        {label}
      </Badge>
    )
  }

  const packageCount = order.info?.length || 0
  const totalQuantity = order.info?.reduce((sum, item) => sum + parseInt(item.quantity || '0'), 0) || 0

  return (
    <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              Order {order.order_id}
            </CardTitle>
            <CardDescription className="mt-1">
              {packageCount} {packageCount === 1 ? 'package' : 'packages'} • {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {getStatusBadge(order.status, order.status_name)}
            {getTrackStatusBadge(order.track_status, order.track_status_name)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Shipping Address */}
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {order.first_name} {order.last_name}
              </p>
              <p className="text-muted-foreground">
                {order.ship_address1}
                {order.ship_address2 && `, ${order.ship_address2}`}
              </p>
              <p className="text-muted-foreground">
                {order.ship_city}, {order.ship_state} {order.ship_zip}
              </p>
              <p className="text-muted-foreground">{order.ship_country}</p>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="flex flex-wrap gap-4 text-sm">
          {order.ship_email && (
            <div className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{order.ship_email}</span>
            </div>
          )}
          {order.ship_phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{order.ship_phone}</span>
            </div>
          )}
        </div>

        {/* Tracking Info */}
        {(order.tracking_number || order.last_mile_tracking) && (
          <div className="flex items-center gap-2 text-sm">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <div>
              {order.tracking_number && (
                <p className="font-medium">Tracking: {order.tracking_number}</p>
              )}
              {order.last_mile_tracking && (
                <p className="text-muted-foreground">Last Mile: {order.last_mile_tracking}</p>
              )}
              {order.carrier && (
                <p className="text-muted-foreground">Carrier: {order.carrier}</p>
              )}
            </div>
          </div>
        )}

        {/* Order Date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {new Date(order.date_added).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>

        {/* Actions */}
        {onViewDetails && (
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(order.order_id)}
              className="w-full"
            >
              <Package className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

