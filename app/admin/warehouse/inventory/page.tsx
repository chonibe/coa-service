'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  AlertCircle, 
  Package, 
  RefreshCw,
  Warehouse,
  TrendingUp,
  BarChart3,
  Search,
  Filter,
  Pin,
  PinOff,
  X
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface VendorInventory {
  vendorName: string
  vendorId: number
  skus: Array<{
    sku: string
    quantity: number
    productName?: string
  }>
  totalQuantity: number
}

interface InventoryData {
  vendors: VendorInventory[]
  coreProducts: {
    streetlamp001: number
    streetlamp002: number
    total: number
  }
  totalSkus: number
  totalQuantity: number
}

interface PinnedItem {
  type: 'sku' | 'vendor'
  id: string
  name: string
  quantity?: number
}

export default function WarehouseInventoryPage() {
  const [inventory, setInventory] = useState<InventoryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [vendorFilter, setVendorFilter] = useState<string>('all')
  const [quantityFilter, setQuantityFilter] = useState<string>('all')
  const [coreProductsOnly, setCoreProductsOnly] = useState(false)
  const [pinnedItems, setPinnedItems] = useState<PinnedItem[]>([])

  // Load pinned items from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('warehouse-inventory-pinned')
    if (saved) {
      try {
        setPinnedItems(JSON.parse(saved))
      } catch (e) {
        console.error('Error loading pinned items:', e)
      }
    }
  }, [])

  // Save pinned items to localStorage whenever they change
  useEffect(() => {
    if (pinnedItems.length > 0) {
      localStorage.setItem('warehouse-inventory-pinned', JSON.stringify(pinnedItems))
    } else {
      localStorage.removeItem('warehouse-inventory-pinned')
    }
  }, [pinnedItems])

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/warehouse/inventory')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch inventory')
      }

      setInventory(data)
    } catch (err: any) {
      console.error('Error fetching inventory:', err)
      setError(err.message || 'Failed to load inventory')
    } finally {
      setIsLoading(false)
    }
  }

  // Get all SKUs flattened for search and filtering
  const allSkus = useMemo(() => {
    if (!inventory) return []
    const skus: Array<{
      sku: string
      quantity: number
      productName: string
      vendorName: string
      vendorId: number
    }> = []
    
    inventory.vendors.forEach(vendor => {
      vendor.skus.forEach(skuItem => {
        skus.push({
          sku: skuItem.sku,
          quantity: skuItem.quantity,
          productName: skuItem.productName || skuItem.sku,
          vendorName: vendor.vendorName,
          vendorId: vendor.vendorId
        })
      })
    })
    
    return skus
  }, [inventory])

  // Filter and search logic
  const filteredData = useMemo(() => {
    if (!inventory) return { vendors: [], skus: [] }

    let filteredVendors = [...inventory.vendors]
    let filteredSkus = [...allSkus]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filteredVendors = filteredVendors.map(vendor => ({
        ...vendor,
        skus: vendor.skus.filter(sku => 
          sku.sku.toLowerCase().includes(query) ||
          (sku.productName || '').toLowerCase().includes(query) ||
          vendor.vendorName.toLowerCase().includes(query)
        )
      })).filter(vendor => vendor.skus.length > 0)
      
      filteredSkus = filteredSkus.filter(sku =>
        sku.sku.toLowerCase().includes(query) ||
        sku.productName.toLowerCase().includes(query) ||
        sku.vendorName.toLowerCase().includes(query)
      )
    }

    // Vendor filter
    if (vendorFilter !== 'all') {
      const vendorId = parseInt(vendorFilter)
      filteredVendors = filteredVendors.filter(v => v.vendorId === vendorId)
      filteredSkus = filteredSkus.filter(s => s.vendorId === vendorId)
    }

    // Quantity filter
    if (quantityFilter !== 'all') {
      filteredVendors = filteredVendors.map(vendor => ({
        ...vendor,
        skus: vendor.skus.filter(sku => {
          const qty = sku.quantity
          switch (quantityFilter) {
            case 'zero': return qty === 0
            case 'low': return qty > 0 && qty < 10
            case 'medium': return qty >= 10 && qty < 50
            case 'high': return qty >= 50 && qty < 100
            case 'very-high': return qty >= 100
            default: return true
          }
        })
      })).filter(vendor => vendor.skus.length > 0)
      
      filteredSkus = filteredSkus.filter(sku => {
        const qty = sku.quantity
        switch (quantityFilter) {
          case 'zero': return qty === 0
          case 'low': return qty > 0 && qty < 10
          case 'medium': return qty >= 10 && qty < 50
          case 'high': return qty >= 50 && qty < 100
          case 'very-high': return qty >= 100
          default: return true
        }
      })
    }

    // Core products only filter
    if (coreProductsOnly) {
      filteredVendors = filteredVendors.map(vendor => ({
        ...vendor,
        skus: vendor.skus.filter(sku => 
          sku.sku.toLowerCase() === 'streetlamp001' || 
          sku.sku.toLowerCase() === 'streetlamp002'
        )
      })).filter(vendor => vendor.skus.length > 0)
      
      filteredSkus = filteredSkus.filter(sku =>
        sku.sku.toLowerCase() === 'streetlamp001' || 
        sku.sku.toLowerCase() === 'streetlamp002'
      )
    }

    return { vendors: filteredVendors, skus: filteredSkus }
  }, [inventory, searchQuery, vendorFilter, quantityFilter, coreProductsOnly, allSkus])

  // Get pinned items data
  const pinnedItemsData = useMemo(() => {
    if (!inventory) return []
    
    return pinnedItems.map(pinned => {
      if (pinned.type === 'sku') {
        const sku = allSkus.find(s => s.sku === pinned.id)
        if (sku) {
          return {
            ...pinned,
            quantity: sku.quantity,
            vendorName: sku.vendorName,
            productName: sku.productName
          }
        }
      } else if (pinned.type === 'vendor') {
        const vendor = inventory.vendors.find(v => v.vendorId.toString() === pinned.id)
        if (vendor) {
          return {
            ...pinned,
            quantity: vendor.totalQuantity,
            skuCount: vendor.skus.length
          }
        }
      }
      return null
    }).filter(Boolean) as any[]
  }, [pinnedItems, inventory, allSkus])

  const handlePin = (type: 'sku' | 'vendor', id: string, name: string) => {
    if (pinnedItems.some(p => p.type === type && p.id === id)) {
      // Unpin
      setPinnedItems(prev => prev.filter(p => !(p.type === type && p.id === id)))
    } else {
      // Pin
      setPinnedItems(prev => [...prev, { type, id, name }])
    }
  }

  const isPinned = (type: 'sku' | 'vendor', id: string) => {
    return pinnedItems.some(p => p.type === type && p.id === id)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setVendorFilter('all')
    setQuantityFilter('all')
    setCoreProductsOnly(false)
  }

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Warehouse Inventory
          </h1>
          <p className="text-muted-foreground mt-1">
            Track SKU inventory by vendor from ChinaDivision warehouse
          </p>
        </div>
        <Button onClick={fetchInventory} disabled={isLoading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Core Products Summary */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : inventory ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  StreetLamp001
                </CardTitle>
                <CardDescription>Core Product Inventory</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {inventory.coreProducts.streetlamp001.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-indigo-600" />
                  StreetLamp002
                </CardTitle>
                <CardDescription>Core Product Inventory</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-indigo-600">
                  {inventory.coreProducts.streetlamp002.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Total Core Products
                </CardTitle>
                <CardDescription>Combined Inventory</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {inventory.coreProducts.total.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pinned Items Dashboard */}
          {pinnedItemsData.length > 0 && (
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-lg border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Pin className="h-5 w-5 text-blue-500" />
                    Pinned Items
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPinnedItems([])}
                    className="text-xs"
                  >
                    Clear All
                  </Button>
                </div>
                <CardDescription>Quick access to frequently viewed items</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pinnedItemsData.map((item, idx) => (
                    <Card key={idx} className="border">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-sm font-medium">{item.name}</CardTitle>
                            <CardDescription className="text-xs">
                              {item.type === 'sku' ? item.vendorName : `${item.skuCount} SKUs`}
                            </CardDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handlePin(item.type, item.id, item.name)}
                          >
                            <PinOff className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                          {item.quantity?.toLocaleString() || 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.type === 'sku' ? 'Units' : 'Total Units'}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Overall Stats */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Warehouse className="h-5 w-5" />
                  Total SKUs
                </CardTitle>
                <CardDescription>All unique SKUs in warehouse</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {inventory.totalSkus.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Total Quantity
                </CardTitle>
                <CardDescription>All items across all SKUs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {inventory.totalQuantity.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters & Search
                </CardTitle>
                {(searchQuery || vendorFilter !== 'all' || quantityFilter !== 'all' || coreProductsOnly) && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
              <CardDescription>
                Showing {filteredData.vendors.length} vendors, {filteredData.skus.length} SKUs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search SKU, product, vendor..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Vendor</Label>
                  <Select value={vendorFilter} onValueChange={setVendorFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Vendors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Vendors</SelectItem>
                      {inventory.vendors.map(vendor => (
                        <SelectItem key={vendor.vendorId} value={vendor.vendorId.toString()}>
                          {vendor.vendorName} ({vendor.skus.length} SKUs)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantity Range</Label>
                  <Select value={quantityFilter} onValueChange={setQuantityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Quantities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Quantities</SelectItem>
                      <SelectItem value="zero">Zero (0)</SelectItem>
                      <SelectItem value="low">Low (1-9)</SelectItem>
                      <SelectItem value="medium">Medium (10-49)</SelectItem>
                      <SelectItem value="high">High (50-99)</SelectItem>
                      <SelectItem value="very-high">Very High (100+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Options</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="core-products-only"
                      checked={coreProductsOnly}
                      onChange={(e) => setCoreProductsOnly(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="core-products-only" className="text-sm font-normal cursor-pointer">
                      Core Products Only
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vendor Inventory Table */}
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Inventory by Vendor</CardTitle>
              <CardDescription>
                {filteredData.vendors.length === 0 
                  ? 'No vendors match your filters'
                  : `${filteredData.vendors.length} vendor${filteredData.vendors.length === 1 ? '' : 's'} matching filters`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredData.vendors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No vendor inventory data matches your filters
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredData.vendors.map((vendor) => (
                    <Card key={vendor.vendorId} className="border">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div>
                              <CardTitle className="text-lg">{vendor.vendorName}</CardTitle>
                              <CardDescription>
                                {vendor.skus.length} {vendor.skus.length === 1 ? 'SKU' : 'SKUs'}
                              </CardDescription>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handlePin('vendor', vendor.vendorId.toString(), vendor.vendorName)}
                            >
                              {isPinned('vendor', vendor.vendorId.toString()) ? (
                                <Pin className="h-4 w-4 text-blue-500 fill-blue-500" />
                              ) : (
                                <Pin className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <Badge variant="secondary" className="text-lg">
                            {vendor.totalQuantity.toLocaleString()} units
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>SKU</TableHead>
                              <TableHead>Product Name</TableHead>
                              <TableHead className="text-right">Quantity</TableHead>
                              <TableHead className="w-12"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {vendor.skus.map((skuItem, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-mono text-sm">
                                  {skuItem.sku}
                                </TableCell>
                                <TableCell>
                                  {skuItem.productName || skuItem.sku}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {skuItem.quantity.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handlePin('sku', skuItem.sku, skuItem.sku)}
                                  >
                                    {isPinned('sku', skuItem.sku) ? (
                                      <Pin className="h-4 w-4 text-blue-500 fill-blue-500" />
                                    ) : (
                                      <Pin className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
