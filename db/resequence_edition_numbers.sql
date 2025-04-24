"use client"

import { useEffect, useState } from "react"
import { Button, Card, Text, TextInput, Textarea, Menu, Modal, Stack, Group, Badge, Image, ActionIcon, Loader } from "@mantine/core"
import { User, LogIn, ImageIcon, AlertCircle, RefreshCcw, MoreVertical, Check, X, FolderSyncIcon as Sync, BadgeIcon as Certificate } from 'lucide-react'
import { useEditionInfo } from "@/hooks/use-edition-info"
import { supabase } from "@/lib/supabase"
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
      title: `Product ${item.product_id}\``, // Default title
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
  onRemoveDialogOpen()
}

// Handle confirming removal
const handleConfirmRemove = async () => {
  if (!selectedItem) return

  setIsUpdatingStatus(true)

  try {
    // Update the status using our helper function
    const result = await updateLineItemStatus(
      selectedItem.line_item_id,
      selectedItem.order_info.order_id,
      "removed",
      removeReason,
    )

    if (!result.success) {
      throw new Error(result.error || "Failed to update item status")
    }

    // Wait a moment to allow the resequencing to complete
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Refresh the data to get updated edition numbers
    await fetchOrdersByCustomerId(customerId!, null, false)

    // Close the dialog
    onRemoveDialogClose()
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
  onSyncDialogOpen()
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
    // Use our helper function
    const result = await resequenceEditionNumbers(syncProductId)

    if (!result.success) {
      throw new Error(result.error || "Failed to sync edition data")
    }

    setSyncResult({
      productTitle: `Product ${syncProductId}`,
      totalEditions: result.activeItems || 0,
      editionTotal: "Not specified",
      lineItemsProcessed: result.updatedCount || 0,
      activeItems: result.activeItems || 0,
      removedItems: result.removedItems || 0,
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

const formSchema = z.object({
  reason: z.string().optional(),
})

const form = useForm<z.infer<typeof formSchema>>({
  defaultValues: {
    reason: "",
  },
})

const [open, setOpen] = React.useState(false)

// Render loading state
if (isLoggedIn === null) {
  return (
    <Box w="full" maxW="6xl" mx="auto" p={4}>
      <Flex flexDir="column" alignItems="center" justifyContent="center" py={12}>
        <Spinner size="lg" color="primary.500" mb={4} />
        <Text color="gray.500">Checking your account...</Text>
      </Flex>
    </Box>
  )
}

// Render login required view
if (isLoggedIn === false) {
  return (
    <Box w="full" maxW="6xl" mx="auto" p={4}>
      <Flex flexDir="column" alignItems="center" justifyContent="center" py={12} px={4} bg="gray.100" rounded="lg">
        <Flex
          w={16}
          h={16}
          alignItems="center"
          justifyContent="center"
          rounded="full"
          bg="white"
          mb={6}
          color="primary.500"
        >
          <LogIn size={28} />
        </Flex>
        <Heading as="h2" size="lg" mb={2}>
          Login Required
        </Heading>
        <Text color="gray.500" mb={6} textAlign="center" maxW="md">
          You need to be logged in to view your purchase history.
        </Text>
        <Flex gap={4}>
          <Button>Log In</Button>
          <Button variant="outline">Create Account</Button>
        </Flex>
      </Flex>
    </Box>
  )
}

// Filter the items for display
const filteredItems = filterLineItems(lineItems)

return (
  <Card p="md" radius="md" withBorder>
    <Stack spacing="md">
      <Group position="apart">
        <Text size="xl" weight={500}>Order Lookup</Text>
        <Group>
          <Button
            leftIcon={<Sync size={16} />}
            onClick={() => setIsSyncDialogOpen(true)}
            loading={isSyncing}
          >
            Sync
          </Button>
          <Menu>
            <Menu.Target>
              <ActionIcon>
                <MoreVertical size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Actions</Menu.Label>
              <Menu.Item
                icon={<AlertCircle size={16} />}
                onClick={() => setIsRemoveDialogOpen(true)}
                disabled={!selectedItem}
              >
                Remove Item
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      <Group grow>
        <TextInput
          placeholder="Search orders..."
          icon={<User size={16} />}
        />
        <TextInput
          placeholder="Filter by vendor..."
          icon={<ImageIcon size={16} />}
        />
      </Group>

      {isLoading ? (
        <Group position="center" p="xl">
          <Loader size="xl" />
        </Group>
      ) : error ? (
        <Group position="center" p="xl">
          <AlertCircle size={24} color="red" />
          <Text color="red">{error}</Text>
        </Group>
      ) : (
        <Stack spacing="md">
          {filteredItems.map((item) => (
            <Card key={item.id} p="md" radius="md" withBorder>
              <Group position="apart">
                <Group>
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.imageAlt || item.title}
                      width={60}
                      height={60}
                      radius="sm"
                    />
                  )}
                  <Stack spacing={0}>
                    <Text weight={500}>{item.title}</Text>
                    <Text size="sm" color="dimmed">
                      Order #{item.order_info.order_number}
                    </Text>
                    <Group spacing="xs">
                      <Badge color={item.fulfillable ? "green" : "red"}>
                        {item.fulfillable ? "Fulfillable" : "Not Fulfillable"}
                      </Badge>
                      {item.is_limited_edition && (
                        <Badge color="blue">Limited Edition</Badge>
                      )}
                    </Group>
                  </Stack>
                </Group>
                <Group>
                  <Text weight={500}>${item.total}</Text>
                  <ActionIcon
                    onClick={() => setSelectedItem(item)}
                    color={selectedItem?.id === item.id ? "blue" : "gray"}
                  >
                    <MoreVertical size={16} />
                  </ActionIcon>
                </Group>
              </Group>
            </Card>
          ))}
        </Stack>
      )}

      <Modal
        opened={isRemoveDialogOpen}
        onClose={() => setIsRemoveDialogOpen(false)}
        title="Remove Item"
      >
        <Stack spacing="md">
          <Text>
            Are you sure you want to remove this item? This action cannot be undone.
          </Text>
          <Textarea
            label="Reason for removal"
            placeholder="Enter the reason for removing this item..."
            value={removeReason}
            onChange={(e) => setRemoveReason(e.target.value)}
          />
          <Group position="right">
            <Button
              variant="default"
              onClick={() => setIsRemoveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleConfirmRemove}
              loading={isUpdatingStatus}
            >
              Remove
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={isSyncDialogOpen}
        onClose={() => setIsSyncDialogOpen(false)}
        title="Sync Product"
      >
        <Stack spacing="md">
          <TextInput
            label="Product ID"
            placeholder="Enter the product ID to sync..."
            value={syncProductId}
            onChange={(e) => setSyncProductId(e.target.value)}
          />
          {syncResult && (
            <Card p="md" radius="md" withBorder>
              <Text>{syncResult.message}</Text>
            </Card>
          )}
          <Group position="right">
            <Button
              variant="default"
              onClick={() => setIsSyncDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSync}
              loading={isSyncing}
            >
              Sync
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  </Card>
)
}
