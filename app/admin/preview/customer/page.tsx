"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, Search } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface LineItem {
  line_item_id: string
  order_id: string
  title: string
  quantity: number
  price: number
  image_url: string
  nfc_tag_id: string | null
  nfc_claimed_at: string | null
  certificate_url: string
}

interface Order {
  id: string
  name: string
  created_at: string
  line_items: LineItem[]
}

interface OrderListItem {
  id: string
  name: string
  created_at: string
  line_items: LineItem[]
}

interface Customer {
  id: string
  email: string
  name: string
}

export default function CustomerPreviewPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [orderList, setOrderList] = useState<OrderListItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrderId, setSelectedOrderId] = useState<string>("")
  const [activeTab, setActiveTab] = useState("customer")

  useEffect(() => {
    fetchCustomers()
    fetchOrders()
  }, [])

  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomerOrders(selectedCustomerId)
    }
  }, [selectedCustomerId])

  useEffect(() => {
    if (selectedOrderId) {
      fetchOrderById(selectedOrderId)
    }
  }, [selectedOrderId])

  const fetchCustomers = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/admin/customers")
      if (!response.ok) {
        throw new Error("Failed to fetch customers")
      }

      const data = await response.json()
      setCustomers(data.customers)
    } catch (err: any) {
      console.error("Error fetching customers:", err)
      setError(err.message || "Failed to fetch customers")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCustomerOrders = async (customerId: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/customers/${customerId}/orders`)
      if (!response.ok) {
        throw new Error("Failed to fetch orders")
      }

      const data = await response.json()
      setOrders(data.orders)
    } catch (err: any) {
      console.error("Error fetching orders:", err)
      setError(err.message || "Failed to fetch orders")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchOrderById = async (orderId: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/orders/${orderId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch order")
      }

      const data = await response.json()
      setOrders([data.order])
    } catch (err: any) {
      console.error("Error fetching order:", err)
      setError(err.message || "Failed to fetch order")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/admin/orders")
      if (!response.ok) {
        throw new Error("Failed to fetch orders")
      }

      const data = await response.json()
      setOrderList(data.orders)
    } catch (err: any) {
      console.error("Error fetching orders:", err)
      setError(err.message || "Failed to fetch orders")
    } finally {
      setIsLoading(false)
    }
  }

  const getNfcStatus = (lineItem: LineItem) => {
    if (lineItem.nfc_tag_id && lineItem.nfc_claimed_at) {
      return { status: "paired", label: "Paired", variant: "default" as const }
    }
    if (lineItem.nfc_tag_id) {
      return { status: "unclaimed", label: "Unclaimed", variant: "secondary" as const }
    }
    return { status: "unpaired", label: "Unpaired", variant: "destructive" as const }
  }

  const filteredCustomers = customers.filter(customer => 
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredOrders = orderList.filter(order => 
    order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.line_items.some(item => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const renderOrderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    }

    if (orders.length === 0) {
      return (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No orders found</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-6">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <CardTitle>Order {order.name}</CardTitle>
              <CardDescription>
                Placed on {new Date(order.created_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.line_items.map((item) => {
                  const nfcStatus = getNfcStatus(item)
                  return (
                    <div
                      key={item.line_item_id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div>
                          <h3 className="font-medium">{item.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant={nfcStatus.variant}>{nfcStatus.label}</Badge>
                        <Button
                          variant="outline"
                          onClick={() => window.open(item.certificate_url, "_blank")}
                        >
                          View Certificate
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (isLoading && !selectedCustomerId && !selectedOrderId) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Preview Dashboard</h1>
        <p className="text-muted-foreground mb-6">
          View and test the customer experience by customer or order
        </p>

        <Tabs defaultValue="customer" className="mb-6" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="customer">Customer View</TabsTrigger>
            <TabsTrigger value="order">Order View</TabsTrigger>
          </TabsList>

          <TabsContent value="customer">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search customers by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCustomers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} ({customer.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="order">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search orders by ID, name, or product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select an order" />
                </SelectTrigger>
                <SelectContent>
                  {filteredOrders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.name} - {order.line_items.length} items - {new Date(order.created_at).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {activeTab === "customer" && !selectedCustomerId ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Select a customer to preview their dashboard
              </p>
            </CardContent>
          </Card>
        ) : activeTab === "order" && !selectedOrderId ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Select an order to preview its details
              </p>
            </CardContent>
          </Card>
        ) : (
          renderOrderContent()
        )}
      </div>
    </div>
  )
} 