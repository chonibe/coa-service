"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { User, LogIn, ImageIcon, AlertCircle, RefreshCcw, MoreVertical, Check, X, FolderSyncIcon as Sync, BadgeIcon as Certificate } from 'lucide-react'
import { useEditionInfo } from "@/hooks/use-edition-info"
import { supabase } from "@/lib/supabase"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { mockOrders, mockResponseData } from "@/lib/mock-data"

interface OrderItem {
  id: string
  line_item_id: string
  product_id: string
  title: string
  quantity: number
  price: string
  total: string
  vendor: string
  image?: string
  imageAlt?: string
  tags: string[]
  fulfillable: boolean
  refunded: boolean
  restocked: boolean
  removed?: boolean
  inventory_quantity?: number
  is_limited_edition?: boolean
  total_inventory?: string
  rarity?: string
  commitment_number?: string
  status?: "active" | "removed"
  removed_reason?: string
  variant?: {
    position: number
  }
  order_info: {
    order_id: string
    order_number: string
    processed_at: string
    fulfillment_status: string
    financial_status: string
  }
  customAttributes?: any[]
  properties?: any[]
}

// Determine if we're in a preview environment
const isPreviewEnvironment = () => {
  // Check if we're in a Vercel preview deployment
  if (typeof window !== "undefined") {
    // Check for preview URL patterns
    const isVercelPreview = window.location.hostname.includes("vercel.app")
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    return isVercelPreview || isLocalhost
  }
  return false
}

export default function OrderLookup() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [lineItems, setLineItems] = useState<OrderItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [noMoreOrders, setNoMoreOrders] = useState(false)
  const [totalItemsLoaded, setTotalItemsLoaded] = useState(0)
  const [usingMockData, setUsingMockData] = useState(isPreviewEnvironment())
  const [apiAttempted, setApiAttempted] = useState(false)
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null)
  const [removeReason, setRemoveReason] = useState("")
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncProductId, setSyncProductId] = useState("")
  const [syncResult, setSyncResult] = useState<any>(null)

  // Filter state
  const [allVendors, setAllVendors] = useState<Set<string>>(new Set())
  const [allTags, setAllTags] = useState<Set<string>>(new Set())
  const [allOrderNumbers, setAllOrderNumbers] = useState<Set<string>>(new Set())
  const [currentVendor, setCurrentVendor] = useState("all")
  const [currentTag, setCurrentTag] = useState("all")
  const [currentOrder, setCurrentOrder] = useState("all")
  const [currentStatus, setCurrentStatus] = useState("fulfillable")

  useEffect(() => {
    // In a real implementation, this would not be needed as Shopify would handle authentication
    // For demo purposes, we'll simulate a logged-in user
    const checkLoginStatus = () => {
      // Simulate checking login status
      setTimeout(() => {
        setIsLoggedIn(true)
        setCustomerId("12345678")
      }, 1000)
    }

    checkLoginStatus()
  }, [])

  useEffect(() => {
    if (isLoggedIn && customerId) {
      // Wrap in a try-catch to prevent unhandled errors
      try {
        fetchOrdersByCustomerId(customerId)
      } catch (error) {
        console.error("Error in initial data fetch:", error)
        // Ensure we're using mock data as fallback
        setUsingMockData(true)
      }
    }
  }, [isLoggedIn, customerId])

  const fetchOrdersByCustomerId = async (id: string, cursor: string | null = null, append = false) => {
    if (isLoading) return

    setIsLoading(true)
    setError(null) // Clear any previous errors

    try {
      if (!append) {
        setLineItems([])
        setOrders([])
        setTotalItemsLoaded(0)
        setNoMoreOrders(false)
        setAllVendors(new Set())
        setAllTags(new Set())
        setAllOrderNumbers(new Set())
      }

      console.log(`Fetching orders for customer ID: ${id}, cursor: ${cursor || "none"}`)
      setApiAttempted(true)

      // Try to fetch from Supabase directly
      let data;
      
      try {
        // Get all line items from Supabase
        const { data: supabaseData, error: supabaseError } = await supabase
          .from("order_line_items")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20)
          
        if (supabaseError) {
          throw supabaseError;
        }
        
        // Transform Supabase data to match the expected format
        const transformedOrders = transformSupabaseDataToOrders(supabaseData);
        data = {
          orders: transformedOrders,
          pagination: {
            nextCursor: null,
            hasNextPage: false
          }
        };
      } catch (supabaseError) {
        console.error("Error fetching from Supabase, falling back to mock data:", supabaseError);
        // Fall back to mock data if Supabase fails
        data = mockResponseData;
        setUsingMockData(true);
      }

      // Update pagination state
      setNextCursor(data.pagination.nextCursor)
      setNoMoreOrders(!data.pagination.hasNextPage)

      // Add new orders to our loaded orders array
      if (append) {
        setOrders((prev) => [...prev, ...data.orders])
      } else {
        setOrders(data.orders)
      }

      // Process line items
      const newLineItems: OrderItem[] = []
      data.orders.forEach((order: any) => {
        if (append) {
          // Only process new orders when appending
          const isNewOrder = !lineItems.some(
            (item) => item.order_info && item.order_info.order_number === order.order_number,
          )

          if (isNewOrder) {
            processOrderLineItems(order, newLineItems)
          }
        } else {
          // Process all orders when not appending
          processOrderLineItems(order, newLineItems)
        }
      })

      // Update line items
      if (append) {
        setLineItems((prev) => [...prev, ...newLineItems])
        setTotalItemsLoaded((prev) => prev + newLineItems.length)
      } else {
        setLineItems(newLineItems)
        setTotalItemsLoaded(newLineItems.length)
      }
    } catch (err: any) {
      console.error("Error fetching orders:", err)
      setError(err.message || "An error occurred while fetching your purchases. Please try again later.")

      // When there's an error, fall back to mock data
      if (!usingMockData) {
        setUsingMockData(true)
        const data = mockResponseData
        setOrders(data.orders)
        
        const newLineItems: OrderItem[] = []
        data.orders.forEach((order: any) => {
          processOrderLineItems(order, newLineItems)
        })
        
        setLineItems(newLineItems)
        setTotalItemsLoaded(newLineItems.length)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Transform Supabase data to match the expected orders format
  const transformSupabaseDataToOrders = (supabaseData: any[]) => {
    // Group line items by order_id
    const orderMap = new Map();
    
    supabaseData.forEach(item => {
      if (!orderMap.has(item.order_id)) {
        orderMap.set(item.order_id, {
          id: item.order_id,
          order_number: item.order_name?.replace('#', '') || item.order_id,
          processed_at: item.created_at,
          fulfillment_status: "fulfilled", // Default value
          financial_status: "paid", // Default value
          line_items: []
        });
      }
      
      // Add this line item to the order
      const order = orderMap.get(item.order_id);
      order.line_items.push({
        id: item.line_item_id,
        line_item_id: item.line_item_id,
        product_id: item.product_id,
        title: `Product ${item.product_id}`, // Default title
        quantity: 1,
        price: "0.00", // Default price
        total: "0.00", // Default total
        vendor: "Unknown Vendor",
        image: "/placeholder.svg?height=400&width=400",
        tags: [],
        fulfillable: item.status === "active",
        is_limited_edition: true,
        total_inventory: item.edition_total?.toString() || "100",
        inventory_quantity: 0,
        status: item.status,
        removed_reason: item.removed_reason,
        order_info: {
          order_id: item.order_id,
          order_number: item.order_name?.replace('#', '') || item.order_id,
          processed_at: item.created_at,
          fulfillment_status: "fulfilled", // Default value
          financial_status: "paid", // Default value
        }
      });
    });
    
    // Convert the map to an array of orders
    return Array.from(orderMap.values());
  }

  const processOrderLineItems = (order: any, itemsArray: OrderItem[]) => {
    order.line_items.forEach((item: any) => {
      // Parse refund information from order data
      let refundedQuantity = 0
      let restocked = false
      let refunded = false
      let removed = false

      // Check if there's refund data attached to this order
      if (order.refunds && Array.isArray(order.refunds)) {
        // Look for this line item in the refunds
        order.refunds.forEach((refund: any) => {
          if (refund.refund_line_items && Array.isArray(refund.refund_line_items)) {
            refund.refund_line_items.forEach((refundItem: any) => {
              if (refundItem.line_item_id.toString() === item.line_item_id.toString()) {
                refundedQuantity += refundItem.quantity || 0
                restocked = refundItem.restock || false
                refunded = true
              }
            })
          }
        })
      }

      // Check for custom attributes that mark an item as removed
      if (item.properties) {
        const removedProperty = item.properties.find((prop: any) => prop.name === "removed" && prop.value === "true")
        if (removedProperty) {
          removed = true
        }
      }

      // Check for status from database
      const status = item.status || "active"
      if (status === "removed") {
        removed = true
      }

      // Add these properties to the item
      const processedItem = {
        ...item,
        refunded_quantity: refundedQuantity,
        restocked,
        refunded,
        removed,
        status: status,
        fulfillable: item.fulfillable !== false && !restocked && !refunded && !removed && status !== "removed",
      }

      // Only add items that aren't restocked or removed if we're filtering
      if (!restocked && (status !== "removed" || currentStatus === "all")) {
        itemsArray.push(processedItem)
      }

      // Collect filter data
      if (item.vendor) setAllVendors((prev) => new Set(prev).add(item.vendor))
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach((tag) => setAllTags((prev) => new Set(prev).add(tag)))
      }
      if (item.order_info && item.order_info.order_number) {
        setAllOrderNumbers((prev) => new Set(prev).add(item.order_info.order_number))
      }
    })
  }

  // Update the filterLineItems function to match the Liquid template's implementation
  const filterLineItems = (items: OrderItem[]) => {
    // Input validation
    if (!items || !Array.isArray(items)) {
      console.error("filterLineItems received invalid input:", items)
      return []
    }

    try {
      return items.filter((item) => {
        // Skip invalid items
        if (!item) {
          return false
        }

        // FIRST: Exclude items that should never be shown
        // 0. Items with null product_id
        if (!item.product_id) {
          return false
        }

        // 1. Items that have been restocked
        if (item.restocked === true || item.restocked === "true") {
          return false
        }

        // 2. Items that have been refunded
        if (item.refunded === true || item.refunded === "true") {
          return false
        }

        // 3. Items marked as "removed" via custom attributes or status
        if (
          (item.removed === true || item.removed === "true" || item.status === "removed") &&
          currentStatus !== "all"
        ) {
          return false
        }

        // 4. Check for items with custom attributes indicating removal
        if (item.customAttributes && Array.isArray(item.customAttributes)) {
          const removedAttr = item.customAttributes.find(
            (attr) => attr && attr.key === "removed" && (attr.value === "true" || attr.value === true),
          )
          if (removedAttr && currentStatus !== "all") {
            return false
          }
        }

        // 5. Check for items with properties indicating removal
        if (item.properties && Array.isArray(item.properties)) {
          const removedProp = item.properties.find(
            (prop) => prop && prop.name === "removed" && (prop.value === "true" || prop.value === true),
          )
          if (removedProp && currentStatus !== "all") {
            return false
          }
        }

        // SECOND: Apply user-selected filters
        // Filter out non-fulfillable items if we're in fulfillable-only mode
        if (currentStatus === "fulfillable" && item.fulfillable === false) {
          return false
        }

        const vendorMatch = currentVendor === "all" || item.vendor === currentVendor
        const tagMatch = currentTag === "all" || (item.tags && item.tags.includes(currentTag))
        const orderMatch =
          currentOrder === "all" || (item.order_info && item.order_info.order_number.toString() === currentOrder)
        const statusMatch =
          currentStatus === "all" ||
          currentStatus === "fulfillable" ||
          (item.order_info &&
            (item.order_info.fulfillment_status === currentStatus ||
              item.order_info.financial_status === currentStatus))

        return vendorMatch && tagMatch && orderMatch && statusMatch
      })
    } catch (error) {
      console.error("Error in filterLineItems:", error)
      return []
    }
  }

  // Update the resetFilters function to match the Liquid template's default values
  const resetFilters = () => {
    setCurrentVendor("all")
    setCurrentTag("all")
    setCurrentOrder("all")
    setCurrentStatus("fulfillable") // Changed from "all" to "fulfillable" to match Liquid template
  }

  const formatMoney = (amount: string | number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(Number(amount))
  }

  // Update the formatStatus function to match the Liquid template
  const formatStatus = (status: string) => {
    switch (status) {
      case "fulfilled":
        return "Shipped"
      case "partially_fulfilled":
        return "Partially Shipped"
      case "unfulfilled":
        return "Processing"
      case "processing":
        return "Processing"
      case "paid":
        return "Paid"
      case "pending":
        return "Pending"
      case "refunded":
        return "Refunded"
      case "partially_refunded":
        return "Partially Refunded"
      default:
        return status
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
    }
  }

  // Handle opening the remove dialog
  const handleRemoveClick = (item: OrderItem) => {
    setSelectedItem(item)
    setRemoveReason("")
    setIsRemoveDialogOpen(true)
  }

  // Handle confirming removal
  const handleConfirmRemove = async () => {
    if (!selectedItem) return

    setIsUpdatingStatus(true)

    try {
      // Update the status in Supabase
      const { error } = await supabase
        .from("order_line_items")
        .update({
          status: "removed",
          removed_reason: removeReason,
          edition_number: null, // Clear the edition number
          updated_at: new Date().toISOString(),
        })
        .eq("line_item_id", selectedItem.line_item_id)
        .eq("order_id", selectedItem.order_info.order_id)

      if (error) {
        throw error
      }

      // Wait a moment to allow the resequencing to complete
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Refresh the data to get updated edition numbers
      await fetchOrdersByCustomerId(customerId!, null, false)

      // Close the dialog
      setIsRemoveDialogOpen(false)
      setSelectedItem(null)
    } catch (error) {
      console.error("Error removing item:", error)
      setError("Failed to update item status. Please try again.")
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Handle opening the sync dialog
  const handleSyncClick = () => {
    setSyncProductId("")
    setSyncResult(null)
    setIsSyncDialogOpen(true)
  }

  // Handle confirming sync
  const handleConfirmSync = async () => {
    if (!syncProductId) {
      setError("Product ID is required for syncing")
      return
    }

    setIsSyncing(true)
    setSyncResult(null)

    try {
      // Call the resequenceEditionNumbers function in Supabase
      const { data, error } = await supabase.rpc('resequence_edition_numbers', {
        product_id_param: syncProductId
      })

      if (error) {
        throw error
      }

      setSyncResult({
        productTitle: `Product ${syncProductId}`,
        totalEditions: data?.active_items || 0,
        editionTotal: "Not specified",
        lineItemsProcessed: data?.total_items || 0,
        activeItems: data?.active_items || 0,
        removedItems: data?.removed_items || 0,
      })

      // Refresh line items data to reflect the new sync status
      fetchOrdersByCustomerId(customerId!, null, false)
    } catch (error: any) {
      console.error("Error syncing edition data:", error)
      setError(error.message || "Failed to sync edition data. Please try again.")
    } finally {
      setIsSyncing(false)
    }
  }

  // Render loading state
  if (isLoggedIn === null) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="h-10 w-10 border-4 border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="text-muted-foreground">Checking your account...</p>
        </div>
      </div>
    )
  }

  // Render login required view
  if (isLoggedIn === false) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4">
        <div className="flex flex-col items-center justify-center py-12 px-4 bg-muted rounded-lg">
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-background mb-6 text-primary">
            <LogIn size={28} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Login Required</h2>
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            You need to be logged in to view your purchase history.
          </p>
          <div className="flex gap-4">
            <Button>Log In</Button>
            <Button variant="outline">Create Account</Button>
          </div>
        </div>
      </div>
    )
  }

  // Filter the items for display
  const filteredItems = filterLineItems(lineItems)

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      {error && (
        <div className="flex items-center gap-2 p-4 mb-6 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
          <AlertCircle size={20} />
          <div className="flex-1">
            <p>{error}</p>
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-white text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => fetchOrdersByCustomerId(customerId!)}
              >
                <RefreshCcw size={14} className="mr-1" />
                Retry Connection
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start gap-4 p-4 bg-muted rounded-lg mb-6">
        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-background text-primary">
          <User size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Welcome back!</h2>
          <p className="text-muted-foreground text-sm">We're fetching your purchase history.</p>
        </div>
      </div>

      {/* Customer info */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-muted text-primary">
              <User size={24} />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-lg font-semibold">Your Purchase History</h3>
              <div className="flex gap-4 mt-2">
                <div className="bg-background p-2 rounded-md min-w-20 text-center">
                  <div className="text-xl font-semibold text-primary">{totalItemsLoaded}</div>
                  <div className="text-xs text-muted-foreground">Items Purchased</div>
                </div>
                <div className="bg-background p-2 rounded-md min-w-20 text-center">
                  <div className="text-xl font-semibold text-primary">{allOrderNumbers.size}</div>
                  <div className="text-xs text-muted-foreground">Orders</div>
                </div>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleSyncClick} className="flex items-center gap-1">
            <Sync size={14} />
            Sync Edition Data
          </Button>
        </div>
      </Card>

      {/* Filter controls */}
      {(allVendors.size > 0 || allTags.size > 0 || allOrderNumbers.size > 0) && (
        <div className="flex flex-wrap gap-3 p-4 bg-muted rounded-lg mb-6">
          <div className="flex flex-col min-w-[160px] flex-1">
            <label htmlFor="vendor-filter" className="text-xs mb-1 text-muted-foreground">
              Filter by Vendor:
            </label>
            <select
              id="vendor-filter"
              className="p-2 rounded-md border text-sm"
              value={currentVendor}
              onChange={(e) => setCurrentVendor(e.target.value)}
            >
              <option value="all">All Vendors</option>
              {Array.from(allVendors)
                .sort()
                .map((vendor) => (
                  <option key={vendor} value={vendor}>
                    {vendor}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex flex-col min-w-[160px] flex-1">
            <label htmlFor="tag-filter" className="text-xs mb-1 text-muted-foreground">
              Filter by Tag:
            </label>
            <select
              id="tag-filter"
              className="p-2 rounded-md border text-sm"
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
            >
              <option value="all">All Tags</option>
              {Array.from(allTags)
                .sort()
                .map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex flex-col min-w-[160px] flex-1">
            <label htmlFor="order-filter" className="text-xs mb-1 text-muted-foreground">
              Filter by Order:
            </label>
            <select
              id="order-filter"
              className="p-2 rounded-md border text-sm"
              value={currentOrder}
              onChange={(e) => setCurrentOrder(e.target.value)}
            >
              <option value="all">All Orders</option>
              {Array.from(allOrderNumbers)
                .sort((a, b) => Number(b) - Number(a))
                .map((orderNum) => (
                  <option key={orderNum} value={orderNum}>
                    Order #{orderNum}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex flex-col min-w-[160px] flex-1">
            <label htmlFor="status-filter" className="text-xs mb-1 text-muted-foreground">
              Filter by Status:
            </label>
            <select
              id="status-filter"
              className="p-2 rounded-md border text-sm"
              value={currentStatus}
              onChange={(e) => setCurrentStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="fulfillable">Fulfillable Only</option>
              <option value="fulfilled">Shipped</option>
              <option value="unfulfilled">Processing</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button variant="outline" size="sm" onClick={resetFilters} className="whitespace-nowrap">
              Reset Filters
            </Button>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && lineItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="h-10 w-10 border-4 border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="text-muted-foreground">Looking up your purchases...</p>
        </div>
      )}

      {/* Items gallery */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {filteredItems.map((item) => (
            <ItemCard
              key={`${item.order_info.order_id}-${item.line_item_id}`}
              item={item}
              formatMoney={formatMoney}
              formatStatus={formatStatus}
              onRemoveClick={handleRemoveClick}
            />
          ))}
        </div>
      ) : (
        !isLoading && (
          <div className="text-center p-12 border border-dashed rounded-lg bg-muted">
            <p className="text-muted-foreground">No items match your filter criteria.</p>
          </div>
        )
      )}

      {/* Scroll loader */}
      {isLoading && lineItems.length > 0 && (
        <div className="flex flex-col items-center justify-center py-6">
          <div className="h-8 w-8 border-4 border-t-primary rounded-full animate-spin mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading more items...</p>
        </div>
      )}

      {/* End of orders message */}
      {noMoreOrders && lineItems.length > 0 && (
        <div className="text-center p-4 border border-dashed rounded-lg bg-muted mb-6">
          <p className="text-sm text-muted-foreground">You've reached the end of your purchase history</p>
        </div>
      )}

      {/* Load more button */}
      {!noMoreOrders && !isLoading && lineItems.length > 0 && (
        <div className="flex justify-center mb-6">
          <Button variant="outline" onClick={() => fetchOrdersByCustomerId(customerId!, nextCursor, true)}>
            Load More
          </Button>
        </div>
      )}

      {/* Remove Item Dialog */}
      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this item? This will mark it as removed in the database.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason" className="text-right">
              Reason for removal (optional)
            </Label>
            <Textarea
              id="reason"
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
              placeholder="Enter a reason for removal"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRemoveDialogOpen(false)} disabled={isUpdatingStatus}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmRemove}
              disabled={isUpdatingStatus}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {isUpdatingStatus ? "Removing..." : "Remove Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sync Edition Data Dialog */}
      <Dialog open={isSyncDialogOpen} onOpenChange={setIsSyncDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sync Edition Data</DialogTitle>
            <DialogDescription>
              Enter a product ID to sync edition data for that product. This will update all edition numbers in the
              database.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="productId" className="text-right">
              Product ID
            </Label>
            <Input
              id="productId"
              value={syncProductId}
              onChange={(e) => setSyncProductId(e.target.value)}
              placeholder="Enter product ID"
              className="mt-2"
            />
          </div>

          {syncResult && (
            <div className="bg-muted p-4 rounded-md text-sm">
              <h4 className="font-semibold mb-2">Sync Results:</h4>
              <div className="space-y-1">
                <p>Product: {syncResult.productTitle}</p>
                <p>Total Editions: {syncResult.totalEditions}</p>
                <p>Edition Total: {syncResult.editionTotal || "Not specified"}</p>
                <p>Active Items: {syncResult.activeItems}</p>
                <p>Removed Items: {syncResult.removedItems}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSyncDialogOpen(false)} disabled={isSyncing}>
              Close
            </Button>
            <Button
              onClick={handleConfirmSync}
              disabled={isSyncing || !syncProductId}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isSyncing ? "Syncing..." : "Sync Edition Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface ItemCardProps {
  item: OrderItem
  formatMoney: (amount: string | number, currency?: string) => string
  formatStatus: (status: string) => string
  onRemoveClick: (item: OrderItem) => void
}

// Update the ItemCard component to display the edition size from the editionInfo
function ItemCard({ item, formatMoney, formatStatus, onRemoveClick }: ItemCardProps) {
  const { editionInfo, isLoading, refreshEditionInfo } = useEditionInfo(item)

  const orderDate = new Date(item.order_info.processed_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  const isFulfillable = item.fulfillable !== false
  let nonFulfillableReason = ""

  if (!isFulfillable) {
    if (item.refunded) nonFulfillableReason = "Refunded"
    else if (item.restocked) nonFulfillableReason = "Restocked"
    else if (item.status === "removed") nonFulfillableReason = "Removed"
    else nonFulfillableReason = "Not Fulfillable"
  }

  return (
    <Card className={`overflow-hidden ${!isFulfillable ? "opacity-80" : ""}`}>
      {/* Item image */}
      <div className="relative h-60 bg-muted">
        {!isFulfillable && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-12 bg-destructive/90 text-white px-3 py-1 font-semibold text-sm uppercase tracking-wider rounded z-10">
            {nonFulfillableReason}
          </div>
        )}

        {/* Edition badge */}
        {editionInfo && (
          <div
            className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-medium bg-background/90 z-10 
${
  editionInfo.source === "supabase"
    ? "text-green-600 border border-green-300"
    : editionInfo.source === "sequential_uuid"
      ? "text-primary border border-primary/30"
      : "text-primary"
}`}
          >
            {editionInfo.total && editionInfo.number ? (
              <span>
                #{editionInfo.number}/{editionInfo.total} Edition
                {editionInfo.source === "supabase"
                  ? " ✓✓✓"
                  : editionInfo.source === "sequential_uuid"
                    ? " ✓✓"
                    : editionInfo.source === "sequential_order"
                      ? " ✓"
                      : " *"}
              </span>
            ) : item.is_limited_edition ? (
              <span>Limited Edition</span>
            ) : (
              <span>Open Edition</span>
            )}
          </div>
        )}

        {/* Inventory status */}
        {item.inventory_quantity !== undefined && (
          <div
            className={`absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-medium bg-background/90 z-10
            ${item.inventory_quantity > 0 ? "text-green-600" : "text-destructive"}`}
          >
            {item.inventory_quantity > 0 ? `${item.inventory_quantity} available` : "Sold out"}
          </div>
        )}

        {/* Actions menu */}
        <div className="absolute top-2 right-2 z-20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/80 hover:bg-background">
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => refreshEditionInfo()}>
                <RefreshCcw size={16} className="mr-2" />
                Refresh Edition Info
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(`/certificate/${item.line_item_id}`, "_blank")}>
                <Certificate size={16} className="mr-2" />
                View Certificate
              </DropdownMenuItem>
              {item.status !== "removed" && (
                <DropdownMenuItem onClick={() => onRemoveClick(item)} className="text-destructive">
                  <X size={16} className="mr-2" />
                  Remove Item
                </DropdownMenuItem>
              )}
              {item.status === "removed" && (
                <DropdownMenuItem className="text-muted-foreground cursor-not-allowed opacity-50">
                  <Check size={16} className="mr-2" />
                  Item Removed
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {item.image ? (
          <img
            src={item.image || "/placeholder.svg"}
            alt={item.imageAlt || item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ImageIcon size={40} />
          </div>
        )}
      </div>

      {/* Item content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-1">{item.title}</h3>
        <div className="text-sm text-muted-foreground mb-4 flex items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mr-1.5"></span>
          {item.vendor}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Price:</span>
            <span>{formatMoney(item.price)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Quantity:</span>
            <span>{item.quantity}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total:</span>
            <span>{formatMoney(item.total)}</span>
          </div>

          {/* Edition info */}
          {editionInfo && (
            <div className="bg-muted p-2 rounded mt-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Edition:</span>
                <span>
                  {editionInfo.total && editionInfo.number
                    ? `#${editionInfo.number} of ${editionInfo.total} (Limited)`
                    : editionInfo.total && item.is_limited_edition
                      ? `Limited Edition of ${editionInfo.total}`
                      : item.is_limited_edition
                        ? "Limited Edition"
                        : "Open Edition"}
                  {editionInfo.source === "supabase"
                    ? " ✓✓✓"
                    : editionInfo.source === "sequential_uuid"
                      ? " ✓✓"
                      : editionInfo.source === "sequential_order"
                        ? " ✓"
                        : ""}
                </span>
              </div>
              {editionInfo.source === "supabase" && (
                <div className="text-xs text-green-600 font-medium mt-1">
                  {editionInfo.status === "removed"
                    ? "This item has been marked as removed"
                    : "Verified edition number from database"}
                  {editionInfo.updated_at && ` (Updated: ${new Date(editionInfo.updated_at).toLocaleDateString()})`}
                </div>
              )}
              {editionInfo.source === "sequential_uuid" && (
                <div className="text-xs text-primary font-medium mt-1">Guaranteed sequential number with UUID</div>
              )}
              {editionInfo.source === "sequential_order" && (
                <div className="text-xs text-green-600 mt-1">Accurate edition number based on order date</div>
              )}
              {(editionInfo.source === "order_sequence" || editionInfo.source === "random") && editionInfo.note && (
                <div className="text-xs text-muted-foreground italic mt-1">{editionInfo.note}</div>
              )}
              {editionInfo.note && editionInfo.source === "supabase" && (
                <div className="text-xs text-muted-foreground italic mt-1">{editionInfo.note}</div>
              )}
            </div>
          )}

          {/* Removal reason if item is removed */}
          {(item.status === "removed" || editionInfo?.status === "removed") && (
            <div className="bg-destructive/10 p-2 rounded mt-2">
              <div className="flex justify-between">
                <span className="text-destructive font-medium">Status:</span>
                <span className="text-destructive font-medium">Removed</span>
              </div>
              {(item.removed_reason || editionInfo?.removed_reason) && (
                <div className="text-xs text-destructive/80 mt-1">
                  Reason: {item.removed_reason || editionInfo?.removed_reason}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {item.tags.map((tag) => (
              <span key={tag} className="inline-block px-2 py-0.5 bg-muted text-xs rounded-full text-primary">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Order info */}
      <div className="p-4 bg-muted border-t">
        <div className="flex items-center text-primary font-medium mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5"></span>
          Order #{item.order_info.order_number}
        </div>
        <div className="text-xs text-muted-foreground mb-2">{orderDate}</div>
        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
            ${
              item.order_info.fulfillment_status === "fulfilled"
                ? "bg-green-100 text-green-800"
                : item.order_info.fulfillment_status === "partially_fulfilled"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-amber-100 text-amber-800"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full mr-1 
              ${
                item.order_info.fulfillment_status === "fulfilled"
                  ? "bg-green-800"
                  : item.order_info.fulfillment_status === "partially_fulfilled"
                    ? "bg-blue-800"
                    : "bg-amber-800"
              }`}
            ></span>
            {formatStatus(item.order_info.fulfillment_status)}
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
            ${
              item.order_info.financial_status === "paid"
                ? "bg-green-100 text-green-800"
                : item.order_info.financial_status === "refunded"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full mr-1 
              ${
                item.order_info.financial_status === "paid"
                  ? "bg-green-800"
                  : item.order_info.financial_status === "refunded"
                    ? "bg-red-800"
                    : "bg-gray-800"
              }`}
            ></span>
            {formatStatus(item.order_info.financial_status)}
          </span>
        </div>
      </div>
    </Card>
  )
}
