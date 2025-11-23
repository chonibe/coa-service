'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  AlertCircle, 
  Package, 
  Truck, 
  MapPin, 
  Calendar, 
  Mail, 
  Phone, 
  RefreshCw, 
  Search,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Copy,
  Check,
  Grid3x3,
  List
} from 'lucide-react'
import type { ChinaDivisionOrderInfo } from '@/lib/chinadivision/client'
import { TrackingTimeline } from '../../admin/warehouse/orders/components/TrackingTimeline'

export default function TrackOrdersPage() {
  const params = useParams()
  const token = params?.token as string
  
  const [title, setTitle] = useState<string>('')
  const [orders, setOrders] = useState<ChinaDivisionOrderInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<ChinaDivisionOrderInfo | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [copied, setCopied] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState<string>('#8217ff')
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')

  useEffect(() => {
    if (token) {
      fetchOrders()
    }
  }, [token])

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/track/${token}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch orders')
      }

      setTitle(data.title || 'Order Tracking')
      setOrders(data.orders || [])
      setLogoUrl(data.logoUrl || null)
      setPrimaryColor(data.primaryColor || '#8217ff')
    } catch (err: any) {
      console.error('Error fetching orders:', err)
      setError(err.message || 'Failed to load orders')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDetails = (order: ChinaDivisionOrderInfo) => {
    setSelectedOrder(order)
    setIsDetailsOpen(true)
  }

  const handleCopyLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

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

    const trackStatusMap: Record<number, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any; useBrandColor?: boolean }> = {
      0: { label: 'To be updated', variant: 'outline', icon: Clock, useBrandColor: true },
      101: { label: 'In Transit', variant: 'default', icon: Truck, useBrandColor: true },
      111: { label: 'Pick Up', variant: 'secondary', icon: Package, useBrandColor: true },
      112: { label: 'Out For Delivery', variant: 'default', icon: Truck, useBrandColor: true },
      121: { label: 'Delivered', variant: 'default', icon: CheckCircle2, useBrandColor: true },
      131: { label: 'Alert', variant: 'destructive', icon: AlertTriangle, useBrandColor: false },
      132: { label: 'Expired', variant: 'destructive', icon: AlertCircle, useBrandColor: false },
    }

    const trackInfo = trackStatus !== undefined ? trackStatusMap[trackStatus] : null
    const label = trackStatusName || trackInfo?.label || `Track ${trackStatus}`
    const Icon = trackInfo?.icon || Truck

    // Use brand color for most track statuses, except destructive ones
    if (trackInfo?.useBrandColor && primaryColor) {
      const palette = generateColorPalette(primaryColor)
      return (
        <Badge 
          className="ml-2 flex items-center gap-1"
          style={{
            backgroundColor: palette.alpha10,
            color: primaryColor,
            borderColor: palette.alpha30,
          }}
        >
          <Icon className="h-3 w-3" />
          {label}
        </Badge>
      )
    }

    return (
      <Badge variant={trackInfo?.variant || 'outline'} className="ml-2 flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    )
  }

  // Filter orders by search query and status
  const filteredOrders = orders.filter((order) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = 
        order.order_id.toLowerCase().includes(query) ||
        order.ship_email?.toLowerCase().includes(query) ||
        order.first_name?.toLowerCase().includes(query) ||
        order.last_name?.toLowerCase().includes(query) ||
        order.tracking_number?.toLowerCase().includes(query) ||
        order.last_mile_tracking?.toLowerCase().includes(query) ||
        `${order.first_name} ${order.last_name}`.toLowerCase().includes(query)
      
      if (!matchesSearch) return false
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'shipped' && order.status !== 3) return false
      if (statusFilter === 'in_transit' && order.track_status !== 101 && order.track_status !== 112) return false
      if (statusFilter === 'delivered' && order.track_status !== 121) return false
      if (statusFilter === 'pending' && (order.status === 3 || order.track_status === 121)) return false
    }

    return true
  })

  // Group orders by delivery status for summary
  const statusCounts = {
    total: orders.length,
    shipped: orders.filter(o => o.status === 3).length,
    in_transit: orders.filter(o => o.track_status === 101 || o.track_status === 112).length,
    delivered: orders.filter(o => o.track_status === 121).length,
    pending: orders.filter(o => o.status !== 3 && o.track_status !== 121).length,
  }

  // Generate color palette from base color
  const generateColorPalette = (baseColor: string) => {
    // Convert hex to RGB
    const hex = baseColor.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)

    // Helper to convert RGB to hex
    const rgbToHex = (r: number, g: number, b: number) => {
      return '#' + [r, g, b].map(x => {
        const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16)
        return hex.length === 1 ? '0' + hex : hex
      }).join('')
    }

    // Generate lighter and darker shades
    const lighten = (amount: number) => {
      return rgbToHex(
        Math.min(255, r + (255 - r) * amount),
        Math.min(255, g + (255 - g) * amount),
        Math.min(255, b + (255 - b) * amount)
      )
    }

    const darken = (amount: number) => {
      return rgbToHex(
        Math.max(0, r * (1 - amount)),
        Math.max(0, g * (1 - amount)),
        Math.max(0, b * (1 - amount))
      )
    }

    // Generate alpha variants
    const withAlpha = (alpha: number) => {
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }

    return {
      base: baseColor,
      light: lighten(0.3),
      lighter: lighten(0.5),
      lightest: lighten(0.8),
      dark: darken(0.2),
      darker: darken(0.4),
      darkest: darken(0.6),
      alpha10: withAlpha(0.1),
      alpha20: withAlpha(0.2),
      alpha30: withAlpha(0.3),
      alpha50: withAlpha(0.5),
      alpha80: withAlpha(0.8),
      // For text on colored backgrounds
      textOnColor: (r * 0.299 + g * 0.587 + b * 0.114) > 186 ? '#000000' : '#ffffff',
    }
  }

  // Apply custom color palette as CSS variables
  useEffect(() => {
    if (primaryColor) {
      const palette = generateColorPalette(primaryColor)
      
      // Set CSS variables for the entire page
      const root = document.documentElement
      root.style.setProperty('--brand-primary', palette.base)
      root.style.setProperty('--brand-primary-light', palette.light)
      root.style.setProperty('--brand-primary-lighter', palette.lighter)
      root.style.setProperty('--brand-primary-lightest', palette.lightest)
      root.style.setProperty('--brand-primary-dark', palette.dark)
      root.style.setProperty('--brand-primary-darker', palette.darker)
      root.style.setProperty('--brand-primary-darkest', palette.darkest)
      root.style.setProperty('--brand-primary-alpha-10', palette.alpha10)
      root.style.setProperty('--brand-primary-alpha-20', palette.alpha20)
      root.style.setProperty('--brand-primary-alpha-30', palette.alpha30)
      root.style.setProperty('--brand-primary-alpha-50', palette.alpha50)
      root.style.setProperty('--brand-primary-alpha-80', palette.alpha80)
      root.style.setProperty('--brand-text-on-color', palette.textOnColor)
    }
  }, [primaryColor])

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-7xl">
      {/* Header with Logo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          {logoUrl && (
            <img 
              src={logoUrl} 
              alt="Company Logo" 
              className="h-10 w-auto sm:h-12 object-contain flex-shrink-0"
              onError={(e) => {
                // Hide logo if it fails to load
                e.currentTarget.style.display = 'none'
              }}
            />
          )}
          <div className="min-w-0 flex-1">
            <h1 
              className="text-2xl sm:text-3xl font-bold tracking-tight truncate"
              style={{ color: primaryColor }}
            >
              {title || 'Order Tracking'}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Track your orders and delivery status
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={handleCopyLink} 
            size="sm"
            className="flex-1 sm:flex-initial"
            style={{
              backgroundColor: primaryColor,
              color: 'var(--brand-text-on-color)',
              borderColor: primaryColor,
            }}
            onMouseEnter={(e) => {
              const palette = generateColorPalette(primaryColor)
              e.currentTarget.style.backgroundColor = palette.dark
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = primaryColor
            }}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Copy Link</span>
              </>
            )}
          </Button>
          <Button 
            onClick={fetchOrders} 
            disabled={isLoading}
            className="flex-1 sm:flex-initial"
            style={{
              backgroundColor: primaryColor,
              color: 'var(--brand-text-on-color)',
              borderColor: primaryColor,
              opacity: isLoading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                const palette = generateColorPalette(primaryColor)
                e.currentTarget.style.backgroundColor = palette.dark
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = primaryColor
            }}
          >
            <RefreshCw className={`h-4 w-4 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        <Card 
          className="border-0 shadow-md hover:shadow-lg transition-all"
          style={{ 
            borderTop: `4px solid ${primaryColor}`,
            backgroundColor: 'var(--brand-primary-alpha-5)',
            borderLeft: `1px solid var(--brand-primary-alpha-20)`,
            borderRight: `1px solid var(--brand-primary-alpha-20)`,
            borderBottom: `1px solid var(--brand-primary-alpha-20)`,
          }}
        >
          <CardContent className="pt-6 pb-4">
            <div className="text-2xl font-bold" style={{ color: primaryColor }}>{statusCounts.total}</div>
            <p className="text-xs mt-1" style={{ color: 'var(--brand-primary-alpha-80)' }}>Total Orders</p>
          </CardContent>
        </Card>
        <Card 
          className="border-0 shadow-md hover:shadow-lg transition-all"
          style={{ 
            borderTop: `4px solid ${primaryColor}`,
            backgroundColor: 'var(--brand-primary-alpha-5)',
            borderLeft: `1px solid var(--brand-primary-alpha-20)`,
            borderRight: `1px solid var(--brand-primary-alpha-20)`,
            borderBottom: `1px solid var(--brand-primary-alpha-20)`,
          }}
        >
          <CardContent className="pt-6 pb-4">
            <div 
              className="text-2xl font-bold" 
              style={{ color: primaryColor }}
            >
              {statusCounts.shipped}
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--brand-primary-alpha-80)' }}>Shipped</p>
          </CardContent>
        </Card>
        <Card 
          className="border-0 shadow-md hover:shadow-lg transition-all"
          style={{ 
            borderTop: `4px solid var(--brand-primary-light)`,
            backgroundColor: 'var(--brand-primary-alpha-5)',
            borderLeft: `1px solid var(--brand-primary-alpha-20)`,
            borderRight: `1px solid var(--brand-primary-alpha-20)`,
            borderBottom: `1px solid var(--brand-primary-alpha-20)`,
          }}
        >
          <CardContent className="pt-6 pb-4">
            <div className="text-2xl font-bold" style={{ color: 'var(--brand-primary-light)' }}>{statusCounts.in_transit}</div>
            <p className="text-xs mt-1" style={{ color: 'var(--brand-primary-alpha-80)' }}>In Transit</p>
          </CardContent>
        </Card>
        <Card 
          className="border-0 shadow-md hover:shadow-lg transition-all"
          style={{ 
            borderTop: `4px solid var(--brand-primary-lighter)`,
            backgroundColor: 'var(--brand-primary-alpha-5)',
            borderLeft: `1px solid var(--brand-primary-alpha-20)`,
            borderRight: `1px solid var(--brand-primary-alpha-20)`,
            borderBottom: `1px solid var(--brand-primary-alpha-20)`,
          }}
        >
          <CardContent className="pt-6 pb-4">
            <div className="text-2xl font-bold" style={{ color: 'var(--brand-primary-lighter)' }}>{statusCounts.delivered}</div>
            <p className="text-xs mt-1" style={{ color: 'var(--brand-primary-alpha-80)' }}>Delivered</p>
          </CardContent>
        </Card>
        <Card 
          className="border-0 shadow-md hover:shadow-lg transition-all"
          style={{ 
            borderTop: `4px solid var(--brand-primary-alpha-50)`,
            backgroundColor: 'var(--brand-primary-alpha-5)',
            borderLeft: `1px solid var(--brand-primary-alpha-20)`,
            borderRight: `1px solid var(--brand-primary-alpha-20)`,
            borderBottom: `1px solid var(--brand-primary-alpha-20)`,
          }}
        >
          <CardContent className="pt-6 pb-4">
            <div className="text-2xl font-bold" style={{ color: 'var(--brand-primary-alpha-80)' }}>{statusCounts.pending}</div>
            <p className="text-xs mt-1" style={{ color: 'var(--brand-primary-alpha-80)' }}>Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card 
        className="border-0 shadow-md"
        style={{ 
          borderLeft: `4px solid ${primaryColor}`,
          backgroundColor: 'var(--brand-primary-alpha-5)',
          borderTop: `1px solid var(--brand-primary-alpha-20)`,
          borderRight: `1px solid var(--brand-primary-alpha-20)`,
          borderBottom: `1px solid var(--brand-primary-alpha-20)`,
        }}
      >
        <CardContent className="pt-4 sm:pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="relative">
              <Search 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" 
                style={{ color: primaryColor }}
              />
              <Input
                type="text"
                placeholder="Search by recipient name, email, order ID, or tracking number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                style={{
                  borderColor: 'var(--brand-primary-alpha-30)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = primaryColor
                  e.currentTarget.style.boxShadow = `0 0 0 2px var(--brand-primary-alpha-20)`
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--brand-primary-alpha-30)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                style={{
                  borderColor: 'var(--brand-primary-alpha-30)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = primaryColor
                  e.currentTarget.style.boxShadow = `0 0 0 2px var(--brand-primary-alpha-20)`
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--brand-primary-alpha-30)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="shipped">Shipped</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Orders List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== 'all'
                ? 'No orders found matching your filters.'
                : 'No orders found.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredOrders.length} of {orders.length} orders
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">View:</span>
              <div className="flex border rounded-md overflow-hidden" style={{ borderColor: 'var(--brand-primary-alpha-30)' }}>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-3 rounded-none ${viewMode === 'card' ? '' : 'opacity-50'}`}
                  style={viewMode === 'card' ? {
                    backgroundColor: 'var(--brand-primary-alpha-10)',
                    color: primaryColor,
                  } : {}}
                  onClick={() => setViewMode('card')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-3 rounded-none ${viewMode === 'list' ? '' : 'opacity-50'}`}
                  style={viewMode === 'list' ? {
                    backgroundColor: 'var(--brand-primary-alpha-10)',
                    color: primaryColor,
                  } : {}}
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          {viewMode === 'card' ? (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredOrders.map((order) => {
              const itemCount = order.info?.length || 0
              const totalQuantity = order.info?.reduce((sum, item) => sum + parseInt(item.quantity || '0'), 0) || 0
              const recipientName = `${order.first_name} ${order.last_name}`

              return (
                <Card
                  key={order.order_id}
                  className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden"
                  style={{ 
                    backgroundColor: 'var(--brand-primary-alpha-5)',
                    borderLeft: `4px solid ${primaryColor}`,
                    borderTop: `1px solid var(--brand-primary-alpha-20)`,
                    borderRight: `1px solid var(--brand-primary-alpha-20)`,
                    borderBottom: `1px solid var(--brand-primary-alpha-20)`,
                  }}
                  onClick={() => handleViewDetails(order)}
                  onMouseEnter={(e) => {
                    const palette = generateColorPalette(primaryColor)
                    e.currentTarget.style.borderLeftWidth = '6px'
                    e.currentTarget.style.backgroundColor = palette.alpha10
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = `0 10px 25px -5px ${palette.alpha30}`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderLeftWidth = '4px'
                    e.currentTarget.style.backgroundColor = 'var(--brand-primary-alpha-5)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <CardHeader 
                    className="pb-3"
                    style={{ 
                      backgroundColor: 'var(--brand-primary-alpha-10)',
                      borderBottom: `1px solid var(--brand-primary-alpha-20)`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle 
                          className="text-lg font-semibold truncate"
                          style={{ color: primaryColor }}
                        >
                          {recipientName}
                        </CardTitle>
                        <CardDescription className="mt-1 text-xs sm:text-sm">
                          Order {order.order_id} • {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {getStatusBadge(order.status, order.status_name)}
                        {getTrackStatusBadge(order.track_status, order.track_status_name)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-4">
                    {/* Recipient Email */}
                    {order.ship_email && (
                      <div className="flex items-center gap-2 text-sm p-2 rounded-md" style={{ backgroundColor: 'var(--brand-primary-alpha-5)' }}>
                        <Mail className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--brand-primary-alpha-80)' }} />
                        <span className="truncate" style={{ color: 'var(--brand-primary-alpha-80)' }}>{order.ship_email}</span>
                      </div>
                    )}

                    {/* Shipping Address */}
                    <div className="flex items-start gap-2 text-sm p-2 rounded-md" style={{ backgroundColor: 'var(--brand-primary-alpha-5)' }}>
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--brand-primary-alpha-80)' }} />
                      <div className="min-w-0">
                        <p className="truncate" style={{ color: 'var(--brand-primary-alpha-80)' }}>
                          {order.ship_city}, {order.ship_state}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--brand-primary-alpha-50)' }}>
                          {order.ship_country}
                        </p>
                      </div>
                    </div>

                    {/* Tracking Info */}
                    {order.tracking_number && (
                      <div className="flex items-center gap-2 text-sm p-2 rounded-md" style={{ backgroundColor: 'var(--brand-primary-alpha-5)' }}>
                        <Truck className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--brand-primary-alpha-80)' }} />
                        <div className="min-w-0">
                          <p className="font-medium truncate" style={{ color: primaryColor }}>{order.tracking_number}</p>
                          {order.carrier && (
                            <p className="text-xs" style={{ color: 'var(--brand-primary-alpha-50)' }}>via {order.carrier}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Order Date */}
                    <div className="flex items-center gap-2 text-sm p-2 rounded-md" style={{ backgroundColor: 'var(--brand-primary-alpha-5)' }}>
                      <Calendar className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--brand-primary-alpha-80)' }} />
                      <span style={{ color: 'var(--brand-primary-alpha-80)' }}>
                        {new Date(order.date_added).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Tracking Timeline - Compact Version */}
                    {order.order_id && (
                      <div className="pt-3 border-t" style={{ borderColor: 'var(--brand-primary-alpha-20)' }}>
                        <TrackingTimeline 
                          orderId={order.order_id}
                          trackingNumber={order.tracking_number}
                          compact={true}
                        />
                      </div>
                    )}

                    <div className="pt-3 border-t" style={{ borderColor: 'var(--brand-primary-alpha-20)' }}>
                      <Button 
                        size="sm" 
                        className="w-full font-medium"
                        style={{
                          backgroundColor: primaryColor,
                          color: 'var(--brand-text-on-color)',
                          borderColor: primaryColor,
                        }}
                        onMouseEnter={(e) => {
                          const palette = generateColorPalette(primaryColor)
                          e.currentTarget.style.backgroundColor = palette.dark
                          e.currentTarget.style.borderColor = palette.dark
                          e.currentTarget.style.transform = 'scale(1.02)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = primaryColor
                          e.currentTarget.style.borderColor = primaryColor
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewDetails(order)
                        }}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const itemCount = order.info?.length || 0
              const recipientName = `${order.first_name} ${order.last_name}`

              return (
                <Card
                  key={order.order_id}
                  className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden"
                  style={{ 
                    backgroundColor: 'var(--brand-primary-alpha-5)',
                    borderLeft: `4px solid ${primaryColor}`,
                    borderTop: `1px solid var(--brand-primary-alpha-20)`,
                    borderRight: `1px solid var(--brand-primary-alpha-20)`,
                    borderBottom: `1px solid var(--brand-primary-alpha-20)`,
                  }}
                  onClick={() => handleViewDetails(order)}
                  onMouseEnter={(e) => {
                    const palette = generateColorPalette(primaryColor)
                    e.currentTarget.style.borderLeftWidth = '6px'
                    e.currentTarget.style.backgroundColor = palette.alpha10
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = `0 10px 25px -5px ${palette.alpha30}`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderLeftWidth = '4px'
                    e.currentTarget.style.backgroundColor = 'var(--brand-primary-alpha-5)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-semibold truncate" style={{ color: primaryColor }}>
                              {recipientName}
                            </h3>
                            <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--brand-primary-alpha-80)' }}>
                              Order {order.order_id} • {itemCount} {itemCount === 1 ? 'item' : 'items'}
                            </p>
                          </div>
                          <div className="flex gap-1 sm:gap-2 flex-wrap">
                            {getStatusBadge(order.status, order.status_name)}
                            {getTrackStatusBadge(order.track_status, order.track_status_name)}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                          {order.ship_email && (
                            <div className="flex items-center gap-1.5 p-1.5 rounded" style={{ backgroundColor: 'var(--brand-primary-alpha-5)' }}>
                              <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" style={{ color: 'var(--brand-primary-alpha-80)' }} />
                              <span className="truncate" style={{ color: 'var(--brand-primary-alpha-80)' }}>{order.ship_email}</span>
                            </div>
                          )}
                          {order.tracking_number && (
                            <div className="flex items-center gap-1.5 p-1.5 rounded" style={{ backgroundColor: 'var(--brand-primary-alpha-5)' }}>
                              <Truck className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" style={{ color: 'var(--brand-primary-alpha-80)' }} />
                              <span className="font-mono truncate" style={{ color: primaryColor }}>{order.tracking_number}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 p-1.5 rounded" style={{ backgroundColor: 'var(--brand-primary-alpha-5)' }}>
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" style={{ color: 'var(--brand-primary-alpha-80)' }} />
                            <span style={{ color: 'var(--brand-primary-alpha-80)' }}>
                              {new Date(order.date_added).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                        
                        {/* Tracking Timeline - Compact Version */}
                        {order.order_id && (
                          <div className="pt-2 border-t w-full" style={{ borderColor: 'var(--brand-primary-alpha-20)' }}>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs font-medium" style={{ color: primaryColor }}>
                                <Truck className="h-3.5 w-3.5" />
                                <span>Latest Tracking</span>
                              </div>
                              <TrackingTimeline 
                                orderId={order.order_id}
                                trackingNumber={order.tracking_number}
                                compact={true}
                                primaryColor={primaryColor}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full sm:w-auto font-medium"
                        style={{
                          backgroundColor: primaryColor,
                          color: 'var(--brand-text-on-color)',
                          borderColor: primaryColor,
                        }}
                        onMouseEnter={(e) => {
                          const palette = generateColorPalette(primaryColor)
                          e.currentTarget.style.backgroundColor = palette.dark
                          e.currentTarget.style.borderColor = palette.dark
                          e.currentTarget.style.transform = 'scale(1.05)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = primaryColor
                          e.currentTarget.style.borderColor = primaryColor
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewDetails(order)
                        }}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          )}
        </>
      )}

      {/* Order Details Dialog - Same as gift-orders page */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full"
          style={{ borderTop: `4px solid ${primaryColor}` }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: primaryColor }}>
              Order Details - {selectedOrder?.first_name} {selectedOrder?.last_name}
            </DialogTitle>
            <DialogDescription>
                      Complete order information and item details
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>Recipient Information</CardTitle>
                      <CardDescription>
                        Order {selectedOrder.order_id} • {selectedOrder.info?.length || 0} items
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(selectedOrder.status, selectedOrder.status_name)}
                      {getTrackStatusBadge(selectedOrder.track_status, selectedOrder.track_status_name)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Recipient Details */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Contact Information
                    </h4>
                    <div className="text-sm space-y-1 pl-6">
                      <p>
                        <span className="font-medium">Name:</span> {selectedOrder.first_name} {selectedOrder.last_name}
                      </p>
                      {selectedOrder.ship_email && (
                        <p>
                          <span className="font-medium">Email:</span> {selectedOrder.ship_email}
                        </p>
                      )}
                      {selectedOrder.ship_phone && (
                        <p>
                          <span className="font-medium">Phone:</span> {selectedOrder.ship_phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Shipping Address
                    </h4>
                    <div className="text-sm text-muted-foreground space-y-1 pl-6">
                      <p>{selectedOrder.ship_address1}</p>
                      {selectedOrder.ship_address2 && <p>{selectedOrder.ship_address2}</p>}
                      <p>
                        {selectedOrder.ship_city}, {selectedOrder.ship_state} {selectedOrder.ship_zip}
                      </p>
                      <p>{selectedOrder.ship_country}</p>
                    </div>
                  </div>

                  {/* Tracking Info */}
                  {(selectedOrder.tracking_number || selectedOrder.last_mile_tracking) && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Tracking Information
                      </h4>
                      <div className="text-sm space-y-1 pl-6">
                        {selectedOrder.tracking_number && (
                          <p>
                            <span className="font-medium">Tracking Number:</span>{' '}
                            <span className="font-mono">{selectedOrder.tracking_number}</span>
                          </p>
                        )}
                        {selectedOrder.last_mile_tracking && (
                          <p>
                            <span className="font-medium">Last Mile Tracking:</span>{' '}
                            <span className="font-mono">{selectedOrder.last_mile_tracking}</span>
                          </p>
                        )}
                        {selectedOrder.carrier && (
                          <p>
                            <span className="font-medium">Carrier:</span> {selectedOrder.carrier}
                          </p>
                        )}
                        {selectedOrder.shipping_method && (
                          <p>
                            <span className="font-medium">Shipping Method:</span> {selectedOrder.shipping_method}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Order Date */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Order Date: {new Date(selectedOrder.date_added).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              {selectedOrder.info && selectedOrder.info.length > 0 && (
                <Card style={{ borderLeft: `4px solid ${primaryColor}` }}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2" style={{ color: primaryColor }}>
                      <Package className="h-5 w-5" style={{ color: primaryColor }} />
                      Order Items ({selectedOrder.info.length})
                    </CardTitle>
                    <CardDescription>
                      Items included in this order
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedOrder.info.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <p className="font-medium">
                                  {item.product_name || item.sku || 'Unknown Product'}
                                </p>
                              </TableCell>
                              <TableCell>
                                <p className="text-sm text-muted-foreground font-mono">
                                  {item.sku || item.sku_code || '-'}
                                </p>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                  {item.color && (
                                    <span className="px-2 py-1 bg-muted rounded">
                                      Color: {item.color}
                                    </span>
                                  )}
                                  {item.size && (
                                    <span className="px-2 py-1 bg-muted rounded">
                                      Size: {item.size}
                                    </span>
                                  )}
                                  {item.category && (
                                    <span className="px-2 py-1 bg-muted rounded">
                                      {item.category}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <p className="font-medium">{item.quantity}</p>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  {getStatusBadge(selectedOrder.status, selectedOrder.status_name)}
                                  {getTrackStatusBadge(selectedOrder.track_status, selectedOrder.track_status_name)}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* STONE3PL Tracking Timeline */}
              {selectedOrder.order_id && (
                <TrackingTimeline
                  orderId={selectedOrder.order_id}
                  trackingNumber={selectedOrder.tracking_number}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

