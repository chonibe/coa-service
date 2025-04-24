"use client"

import { useEffect, useState } from "react"
import { mockResponseData } from "@/lib/mock-data"
import { getCustomerOrders } from "@/lib/data-access"
import { CollectionCard } from "@/components/collection-card"
import { CollectionListItem } from "@/components/collection-list-item"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Search, Grid, List } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const supabase = createClientComponentClient()

export interface OrderItem {
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
  editionInfo?: {
    number?: string
    total?: string
    source?: string
    status?: string
    removed_reason?: string
    updated_at?: string
    note?: string
  }
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [activeTab, setActiveTab] = useState<"all" | "verified" | "unverified">("all")
  const [availableCustomerIds, setAvailableCustomerIds] = useState<string[]>([
    "customer-22845350150530",
    "customer-1234567890",
    "customer-0987654321",
  ])

  // Filter state
  const [allVendors, setAllVendors] = useState<Set<string>>(new Set())
  const [allTags, setAllTags] = useState<Set<string>>(new Set())
  const [allOrderNumbers, setAllOrderNumbers] = useState<Set<string>>(new Set())
  const [currentVendor, setCurrentVendor] = useState("all")
  const [currentTag, setCurrentTag] = useState("all")
  const [currentOrder, setCurrentOrder] = useState("all")
  const [currentStatus, setCurrentStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    // In a real implementation, this would not be needed as Shopify would handle authentication
    // For demo purposes, we'll simulate a logged-in user
    const checkLoginStatus = () => {
      // Simulate checking login status
      setTimeout(() => {
        setIsLoggedIn(true)
        setCustomerId("customer-22845350150530")
      }, 1000)
    }

    checkLoginStatus()
  }, [])

  useEffect(() => {
    if (isLoggedIn) {
      // Wrap in a try-catch to prevent unhandled errors
      try {
        fetchOrdersByCustomerId(customerId!)
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

      // Get data using our helper function
      const data = await getCustomerOrders(id)
      setUsingMockData(isPreviewEnvironment())

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
      const { data, error } = await supabase.rpc("resequence_edition_numbers", {
        product_id_param: syncProductId,
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

  const filteredItems = filterLineItems(lineItems).filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.customAttributes &&
        item.customAttributes.some(
          (attr) =>
            attr.value &&
            typeof attr.value === "string" &&
            attr.value.toLowerCase().includes(searchQuery.toLowerCase()),
        )) ||
      (item.properties &&
        item.properties.some(
          (prop) =>
            prop.value &&
            typeof prop.value === "string" &&
            prop.value.toLowerCase().includes(searchQuery.toLowerCase()),
        )),
  )

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
                <RefreshCw size={14} className="mr-1" />
                Retry Connection
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Collection</h1>
        <div className="flex gap-2">
          <div className="flex border border-gray-200 rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className={`h-10 w-10 rounded-none ${viewMode === "grid" ? "bg-gray-100" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-10 w-10 rounded-none ${viewMode === "list" ? "bg-gray-100" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Select value={customerId || ""} onValueChange={setCustomerId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Customer" />
            </SelectTrigger>
            <SelectContent>
              {availableCustomerIds.map((id) => (
                <SelectItem key={id} value={id}>
                  {id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            className="pl-8"
            placeholder="Search by title or artist..."
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-center">
        {isLoading ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <>
            {filteredItems.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No items found</AlertTitle>
                <AlertDescription>No items match your filter criteria.</AlertDescription>
              </Alert>
            ) : (
              <>
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map((item) => (
                      <CollectionCard
                        key={`${item.order_info.order_id}-${item.line_item_id}`}
                        item={item}
                        onRemoveClick={handleRemoveClick}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredItems.map((item) => (
                      <CollectionListItem
                        key={`${item.order_info.order_id}-${item.line_item_id}`}
                        item={item}
                        onRemoveClick={handleRemoveClick}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
