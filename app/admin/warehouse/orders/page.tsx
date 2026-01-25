'use client'

import { useState, useEffect } from 'react'





import { Skeleton } from "@/components/ui"

import { WarehouseOrderCard } from './components/WarehouseOrderCard'
import { PackageTracker } from './components/PackageTracker'
import { TrackingTimeline } from './components/TrackingTimeline'
import { AlertCircle, Calendar, Search, RefreshCw, Share2, Check, Copy, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'




import type { ChinaDivisionOrderInfo } from '@/lib/chinadivision/client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Alert, AlertDescription, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Checkbox, Tabs, TabsList, TabsTrigger, TabsContent, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, PageHeader } from "@/components/ui"
export default function WarehouseOrdersPage() {
  const [orders, setOrders] = useState<ChinaDivisionOrderInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<ChinaDivisionOrderInfo | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set())
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set())
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(200)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrev, setHasPrev] = useState(false)
  
  // Sorting state
  const [sortField, setSortField] = useState<'tag' | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  
  // Date range filters - Default to last 365 days to capture all orders including shipped
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 365) // Default to last 365 days to see all orders including shipped
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })

  // Search filter
  const [searchQuery, setSearchQuery] = useState('')
  
  // Status filter
  const [statusFilter, setStatusFilter] = useState<string>('all')
  // Tag filter
  const [tagFilter, setTagFilter] = useState<string>('all')

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams({
        start: startDate,
        end: endDate,
      })

      console.log('[Warehouse Orders Page] Fetching orders with params:', { start: startDate, end: endDate })
      const response = await fetch(`/api/warehouse/orders?${params.toString()}`)
      const data = await response.json()

      console.log('[Warehouse Orders Page] API response:', { 
        ok: response.ok, 
        status: response.status,
        success: data.success,
        count: data.count,
        ordersLength: data.orders?.length 
      })

      if (!response.ok) {
        console.error('[Warehouse Orders Page] API error:', data)
        throw new Error(data.message || 'Failed to fetch orders')
      }

      // Ensure orders is always an array
      const ordersData = data.orders
      const ordersArray = Array.isArray(ordersData) ? ordersData : []
      
      // Log status distribution for debugging
      const statusCounts = {
        total: ordersArray.length,
        status0: ordersArray.filter(o => o.status === 0).length,
        status3: ordersArray.filter(o => o.status === 3).length,
        status11: ordersArray.filter(o => o.status === 11).length,
        status23: ordersArray.filter(o => o.status === 23).length,
        other: ordersArray.filter(o => o.status !== 0 && o.status !== 3 && o.status !== 11 && o.status !== 23).length,
        withTracking: ordersArray.filter(o => o.tracking_number).length,
      }
      console.log('[Warehouse Orders Page] Status distribution:', statusCounts)
      console.log('[Warehouse Orders Page] Setting orders:', ordersArray.length)
      setOrders(ordersArray)
      
      // Update total count
      setTotalCount(data.totalCount || ordersArray.length)
    } catch (err: any) {
      console.error('Error fetching orders:', err)
      setError(err.message || 'Failed to load orders')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [startDate, endDate])
  
  // Reset to page 1 when date range or filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [startDate, endDate, searchQuery, statusFilter])

  const handleViewDetails = async (order: ChinaDivisionOrderInfo | string) => {
    try {
      // If we already have the order object, use it directly (faster)
      if (typeof order !== 'string') {
        setSelectedOrder(order)
        setIsDetailsOpen(true)
        // Optionally refresh from API in the background for latest data
        try {
          const orderId = order.order_id || order.sys_order_id || ''
          if (orderId) {
            const response = await fetch(`/api/warehouse/orders/${encodeURIComponent(orderId)}`)
            const data = await response.json()
            if (response.ok && data.order) {
              setSelectedOrder(data.order)
            }
          }
        } catch (refreshError) {
          // Silently fail - we already have the order data
          console.warn('Could not refresh order details:', refreshError)
        }
        return
      }

      // If we only have an ID, fetch from API
      const orderId = order
      if (!orderId || orderId.trim() === '') {
        setError('Order ID is required')
        return
      }

      const response = await fetch(`/api/warehouse/orders/${encodeURIComponent(orderId.trim())}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch order details')
      }

      setSelectedOrder(data.order)
      setIsDetailsOpen(true)
    } catch (err: any) {
      console.error('Error fetching order details:', err)
      setError(err.message || 'Failed to load order details')
    }
  }

  const handleToggleOrderSelection = (order: ChinaDivisionOrderInfo) => {
    const uniqueId = order.sys_order_id || order.order_id || ''
    const newSelection = new Set(selectedOrderIds)
    if (newSelection.has(uniqueId)) {
      newSelection.delete(uniqueId)
    } else {
      newSelection.add(uniqueId)
    }
    setSelectedOrderIds(newSelection)
  }

  const handleSelectAll = () => {
    const ordersToFilter = Array.isArray(orders) ? orders : []
    const currentFiltered = ordersToFilter.filter((order) => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        order.order_id?.toLowerCase().includes(query) ||
        order.ship_email?.toLowerCase().includes(query) ||
        order.first_name?.toLowerCase().includes(query) ||
        order.last_name?.toLowerCase().includes(query) ||
        order.tracking_number?.toLowerCase().includes(query) ||
        order.last_mile_tracking?.toLowerCase().includes(query)
      )
    })
    
    if (selectedOrderIds.size === currentFiltered.length && currentFiltered.length > 0) {
      setSelectedOrderIds(new Set())
    } else {
      setSelectedOrderIds(new Set(currentFiltered.map(o => o.sys_order_id || o.order_id || '').filter(Boolean)))
    }
  }

  const handleGenerateLink = async () => {
    if (selectedOrderIds.size === 0) {
      setError('Please select at least one order')
      return
    }

    try {
      setIsGeneratingLink(true)
      setError(null)

      const title = prompt('Enter a title for this tracking link (optional):') || undefined
      const expiresInDays = prompt('Enter expiration in days (leave empty for no expiration):')
      const expiresIn = expiresInDays ? parseInt(expiresInDays) : undefined

      const response = await fetch('/api/admin/warehouse-orders/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderIds: Array.from(selectedOrderIds),
          title,
          expiresInDays: expiresIn,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate link')
      }

      setGeneratedLink(data.link.url)
      setSelectedOrderIds(new Set()) // Clear selection
    } catch (err: any) {
      console.error('Error generating link:', err)
      setError(err.message || 'Failed to generate tracking link')
    } finally {
      setIsGeneratingLink(false)
    }
  }

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink).then(() => {
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2000)
      })
    }
  }

  // Helper function to get last event tag for an order
  const getLastEventTag = (order: ChinaDivisionOrderInfo): string => {
    // Use track_status_name if available (e.g., "Delivered", "In Transit", etc.)
    if (order.track_status_name) {
      return order.track_status_name
    }
    
    // Map track_status codes to tag names
    const tagMap: Record<number, string> = {
      0: 'To be updated',
      101: 'In Transit',
      111: 'Pick Up',
      112: 'Out For Delivery',
      121: 'Delivered',
      131: 'Alert',
      132: 'Expired',
    }
    
    if (order.track_status !== undefined && tagMap[order.track_status]) {
      return tagMap[order.track_status]
    }
    
    // Fallback to status name or default
    return order.status_name || 'Pending'
  }

  // Calculate status counts
  const statusCounts = {
    all: orders.length,
    approving: orders.filter(o => o.status === 0 || o.order_detail_status === '0').length,
    error: orders.filter(o => o.track_status === 131 || o.track_status === 132).length,
    uploaded: orders.filter(o => o.status === 11).length,
    shipped: orders.filter(o => o.status === 3 || o.track_status === 121 || (o.track_status && o.track_status >= 101 && o.track_status <= 121)).length,
    canceled: orders.filter(o => o.status === 23).length,
    in_transit: orders.filter(o => getLastEventTag(o) === 'In Transit').length,
  }

  // Filter orders by search query and status
  const allFilteredOrders = (Array.isArray(orders) ? orders : []).filter((order) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = (
        order.sys_order_id?.toLowerCase().includes(query) ||
        order.order_id?.toLowerCase().includes(query) ||
        order.ship_email?.toLowerCase().includes(query) ||
        order.first_name?.toLowerCase().includes(query) ||
        order.last_name?.toLowerCase().includes(query) ||
        order.tracking_number?.toLowerCase().includes(query) ||
        order.last_mile_tracking?.toLowerCase().includes(query)
      )
      if (!matchesSearch) return false
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'approving' && !(order.status === 0 || order.order_detail_status === '0')) return false
      if (statusFilter === 'error' && !(order.track_status === 131 || order.track_status === 132)) return false
      if (statusFilter === 'uploaded' && order.status !== 11) return false
      if (statusFilter === 'shipped' && !(order.status === 3 || order.track_status === 121 || (order.track_status && order.track_status >= 101 && order.track_status <= 121))) return false
      if (statusFilter === 'canceled' && order.status !== 23) return false
      if (statusFilter === 'in_transit' && getLastEventTag(order) !== 'In Transit') return false
    }

    // Tag filter
    if (tagFilter !== 'all') {
      const orderTag = getLastEventTag(order)
      if (orderTag.toLowerCase() !== tagFilter.toLowerCase()) return false
    }
    
    return true
  })

  // Sort orders by tag if sorting is enabled
  const sortedFilteredOrders = [...allFilteredOrders].sort((a, b) => {
    if (sortField === 'tag') {
      const tagA = getLastEventTag(a).toLowerCase()
      const tagB = getLastEventTag(b).toLowerCase()
      
      if (sortDirection === 'asc') {
        return tagA.localeCompare(tagB)
      } else {
        return tagB.localeCompare(tagA)
      }
    }
    return 0
  })

  // Apply client-side pagination to filtered results
  const filteredTotalPages = Math.ceil(sortedFilteredOrders.length / pageSize)
  const filteredStartIndex = (currentPage - 1) * pageSize
  const filteredEndIndex = filteredStartIndex + pageSize
  const filteredOrders = sortedFilteredOrders.slice(filteredStartIndex, filteredEndIndex)
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, tagFilter, sortField, sortDirection])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouse Orders"
        description="Track orders from ChinaDivision warehouse"
        actions={
          <>
            {selectedOrderIds.size > 0 && (
              <Button
                onClick={handleGenerateLink}
                disabled={isGeneratingLink}
                variant="default"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Generate Link ({selectedOrderIds.size})
              </Button>
            )}
            <Button onClick={fetchOrders} disabled={isLoading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </>
        }
      />

      {/* Status Tabs */}
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-lg">
        <CardContent className="pt-6">
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
            <TabsList className="grid w-full grid-cols-7 bg-muted">
              <TabsTrigger value="all" className="flex items-center gap-2">
                All Orders
                <Badge variant="secondary" className="ml-1">
                  {statusCounts.all}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="approving" className="flex items-center gap-2">
                Approving
                <Badge variant="secondary" className="ml-1">
                  {statusCounts.approving}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="error" className="flex items-center gap-2">
                Error
                <Badge variant="destructive" className="ml-1">
                  {statusCounts.error}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="uploaded" className="flex items-center gap-2">
                Uploaded
                <Badge variant="secondary" className="ml-1">
                  {statusCounts.uploaded}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="shipped" className="flex items-center gap-2">
                Shipped
                <Badge variant="default" className="ml-1">
                  {statusCounts.shipped}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="in_transit" className="flex items-center gap-2">
                In Transit
                <Badge variant="default" className="ml-1">
                  {statusCounts.in_transit}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="canceled" className="flex items-center gap-2">
                Canceled
                <Badge variant="destructive" className="ml-1">
                  {statusCounts.canceled}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter orders by date range and search</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tag-filter">Last Event Tag</Label>
              <select
                id="tag-filter"
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-md border bg-background text-sm"
              >
                <option value="all">All Tags</option>
                {Array.from(
                  new Set(
                    orders.map(order => getLastEventTag(order))
                  )
                ).sort().map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Search by order ID, email, name, or tracking number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated Link Alert */}
      {generatedLink && (
        <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <AlertDescription className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium text-green-900 dark:text-green-100 mb-1">Tracking link generated!</p>
              <p className="text-sm text-green-700 dark:text-green-300 break-all">{generatedLink}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="ml-4"
            >
              {linkCopied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Orders List */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? 'No orders found matching your search.' : 'No orders found for the selected date range.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Orders</CardTitle>
                <CardDescription>
                  Showing {filteredOrders.length} of {allFilteredOrders.length} filtered orders (Page {currentPage} of {filteredTotalPages || 1}, {totalCount} total)
                </CardDescription>
              </div>
              {filteredOrders.length > 0 && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedOrderIds.size === filteredOrders.length && filteredOrders.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label className="text-sm">
                    Select All ({selectedOrderIds.size} selected)
                  </Label>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedOrderIds.size === filteredOrders.length && filteredOrders.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>System Order ID</TableHead>
                    <TableHead>Platform Order No.</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 -ml-2"
                        onClick={() => {
                          if (sortField === 'tag') {
                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                          } else {
                            setSortField('tag')
                            setSortDirection('asc')
                          }
                        }}
                      >
                        Last Event Tag
                        {sortField === 'tag' ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                          ) : (
                            <ArrowDown className="ml-2 h-4 w-4" />
                          )
                        ) : (
                          <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>Tracking</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const getStatusBadge = () => {
                      if (order.status === 0 || order.order_detail_status === '0') {
                        return <Badge variant="outline">Approving</Badge>
                      }
                      if (order.status === 11) {
                        return <Badge variant="default">Uploaded</Badge>
                      }
                      if (order.status === 3) {
                        return <Badge variant="default">Shipped</Badge>
                      }
                      if (order.status === 23) {
                        return <Badge variant="destructive">Canceled</Badge>
                      }
                      if (order.track_status === 131 || order.track_status === 132) {
                        return <Badge variant="destructive">Error</Badge>
                      }
                      return <Badge variant="secondary">Unknown</Badge>
                    }

                    const uniqueId = order.sys_order_id || order.order_id || ''
                    // Use Platform Order No. (order_id) for API calls, fallback to sys_order_id
                    const apiOrderId = order.order_id || order.sys_order_id || ''
                    const isExpanded = expandedOrderIds.has(uniqueId)
                    
                    return (
                      <>
                      <TableRow 
                        key={uniqueId}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          if (isExpanded) {
                            setExpandedOrderIds(prev => {
                              const next = new Set(prev)
                              next.delete(uniqueId)
                              return next
                            })
                          } else {
                            setExpandedOrderIds(prev => new Set(prev).add(uniqueId))
                          }
                        }}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedOrderIds.has(uniqueId)}
                            onCheckedChange={() => handleToggleOrderSelection(order)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {order.sys_order_id || 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {order.order_id || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {order.first_name} {order.last_name}
                            </div>
                            {order.ship_phone && (
                              <div className="text-xs text-muted-foreground">{order.ship_phone}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{order.ship_email || 'N/A'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{order.ship_city}, {order.ship_state}</div>
                            <div className="text-xs text-muted-foreground">{order.ship_country}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {getStatusBadge()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {getLastEventTag(order)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {order.tracking_number ? (
                            <div className="text-sm">
                              <div className="font-medium">{order.tracking_number}</div>
                              {order.last_mile_tracking && (
                                <div className="text-xs text-muted-foreground">{order.last_mile_tracking}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No tracking</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {order.date_added ? new Date(order.date_added).toLocaleDateString() : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(order)}
                          >
                            View
                          </Button>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (isExpanded) {
                                setExpandedOrderIds(prev => {
                                  const next = new Set(prev)
                                  next.delete(uniqueId)
                                  return next
                                })
                              } else {
                                setExpandedOrderIds(prev => new Set(prev).add(uniqueId))
                              }
                            }}
                            className="h-8 w-8 p-0"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {/* Expanded Timeline Row */}
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={11} className="p-0 bg-muted/30">
                            <div className="p-4">
                              <TrackingTimeline 
                                orderId={apiOrderId}
                                trackingNumber={order.tracking_number}
                                carrier={order.carrier}
                                lastMileTracking={order.last_mile_tracking}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                      </>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination Controls */}
            {filteredTotalPages > 1 && (
              <div className="flex items-center justify-between border-t pt-4 mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {filteredTotalPages} • {allFilteredOrders.length} filtered orders ({totalCount} total)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, filteredTotalPages) }, (_, i) => {
                      let pageNum: number
                      if (filteredTotalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= filteredTotalPages - 2) {
                        pageNum = filteredTotalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          disabled={isLoading}
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(filteredTotalPages, prev + 1))}
                    disabled={currentPage >= filteredTotalPages || isLoading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.sys_order_id || selectedOrder?.order_id}</DialogTitle>
            <DialogDescription>
              Complete order information and package tracking
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <WarehouseOrderCard order={selectedOrder} />
              {selectedOrder.order_id && (
                <TrackingTimeline
                  orderId={selectedOrder.order_id}
                  trackingNumber={selectedOrder.tracking_number}
                  carrier={selectedOrder.carrier}
                  lastMileTracking={selectedOrder.last_mile_tracking}
                />
              )}
              {selectedOrder.info && selectedOrder.info.length > 0 && (
                <PackageTracker
                  packages={selectedOrder.info}
                  orderId={selectedOrder.order_id}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

