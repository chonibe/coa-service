"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, Package, DollarSign, BarChart, History } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"

interface Vendor {
  id: string
  vendor_name: string
  email: string
  phone: string
  status: string
  contact_name: string
  contact_email: string
  address: string
  website: string
  bio: string
  paypal_email: string
  payout_method: string
  tax_id: string
  tax_country: string
  is_company: boolean
  instagram_url: string
  notes: string
}

interface Product {
  id: string
  title: number
  price: number
  inventory: number
  amountSold: number
  payout_amount: number
  is_percentage: boolean
}

interface Order {
  id: string
  order_id: string
  product_id: string
  product_title: string
  price: number
  quantity: number
  status: string
  created_at: string
  payout_status: string
}

interface Payout {
  id: string
  amount: number
  status: string
  date: string
  reference: string
  payment_method: string
}

interface Analytics {
  totalSales: number
  pendingPayout: number
  totalOrders: number
  totalProducts: number
}

export default function VendorProfilePage() {
  const router = useRouter()
  const params = useParams()
  const vendorId = params.vendorId as string
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchVendorData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/vendors/${vendorId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch vendor data")
        }

        const data = await response.json()
        setVendor(data.vendor)
        setProducts(data.products)
        setOrders(data.recentOrders || [])
        setAnalytics(data.analytics)
        setPayouts(data.payouts || [])
      } catch (err: any) {
        console.error("Error fetching vendor data:", err)
        setError(err.message || "Failed to fetch vendor data")
        toast({
          variant: "destructive",
          title: "Error loading vendor data",
          description: err.message || "Failed to fetch vendor data",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchVendorData()
  }, [vendorId])

  const handlePayoutChange = (productId: string, value: string, isPercentage: boolean) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? { ...product, payout_amount: parseFloat(value), is_percentage: isPercentage }
          : product
      )
    )
  }

  const savePayoutSettings = async () => {
    try {
      const response = await fetch(`/api/vendors/${vendorId}/payouts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ products }),
      })

      if (!response.ok) {
        throw new Error("Failed to save payout settings")
      }

      toast({
        title: "Payout settings saved",
        description: "Your payout settings have been updated successfully.",
      })
    } catch (err: any) {
      console.error("Error saving payout settings:", err)
      toast({
        variant: "destructive",
        title: "Error saving payout settings",
        description: err.message || "Failed to save payout settings",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 pb-20 px-1">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 pb-20 px-1">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="space-y-6 pb-20 px-1">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>Vendor not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 px-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{vendor.vendor_name}</h1>
          <p className="text-muted-foreground">View and manage vendor information</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => router.push(`/admin/vendors/${vendorId}/payouts`)}>
            Payout Settings
          </Button>
          <Button variant="outline" onClick={() => router.push("/admin/vendors")}>
            Back to Vendors
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Information</CardTitle>
              <CardDescription>Basic information about the vendor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium">Name</h3>
                    <p className="text-sm text-muted-foreground">{vendor.vendor_name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Email</h3>
                    <p className="text-sm text-muted-foreground">{vendor.contact_email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Phone</h3>
                    <p className="text-sm text-muted-foreground">{vendor.phone}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Status</h3>
                    <Badge variant={vendor.status === "active" ? "default" : "secondary"}>
                      {vendor.status}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">PayPal Email</h3>
                    <p className="text-sm text-muted-foreground">{vendor.paypal_email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Payout Method</h3>
                    <p className="text-sm text-muted-foreground">{vendor.payout_method}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Tax ID</h3>
                    <p className="text-sm text-muted-foreground">{vendor.tax_id}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Tax Country</h3>
                    <p className="text-sm text-muted-foreground">{vendor.tax_country}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Company Status</h3>
                    <p className="text-sm text-muted-foreground">{vendor.is_company ? "Company" : "Individual"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Instagram</h3>
                    <p className="text-sm text-muted-foreground">
                      {vendor.instagram_url ? (
                        <a href={vendor.instagram_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                          {vendor.instagram_url}
                        </a>
                      ) : (
                        "Not set"
                      )}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Notes</h3>
                  <p className="text-sm text-muted-foreground">{vendor.notes || "No notes"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
              <CardDescription>Products associated with this vendor</CardDescription>
            </CardHeader>
            <CardContent>
              {products.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Inventory</TableHead>
                      <TableHead>Amount Sold</TableHead>
                      <TableHead>Payout Amount</TableHead>
                      <TableHead>Payout Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>{product.title}</TableCell>
                        <TableCell>£{product.price}</TableCell>
                        <TableCell>{product.inventory}</TableCell>
                        <TableCell>{product.amountSold}</TableCell>
                        <TableCell>£{product.payout_amount}</TableCell>
                        <TableCell>{product.is_percentage ? "Percentage" : "Fixed"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">No products found for this vendor</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Recent orders for this vendor's products</CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payout Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>{order.order_id}</TableCell>
                        <TableCell>{order.product_title}</TableCell>
                        <TableCell>£{order.price}</TableCell>
                        <TableCell>{order.quantity}</TableCell>
                        <TableCell>
                          <Badge variant={order.status === "completed" ? "default" : "secondary"}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={order.payout_status === "paid" ? "default" : "secondary"}>
                            {order.payout_status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">No orders found for this vendor</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
              <CardDescription>History of payouts to this vendor</CardDescription>
            </CardHeader>
            <CardContent>
              {payouts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell>{payout.reference}</TableCell>
                        <TableCell>£{payout.amount}</TableCell>
                        <TableCell>
                          <Badge variant={payout.status === "completed" ? "default" : "secondary"}>
                            {payout.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{payout.payment_method}</TableCell>
                        <TableCell>{new Date(payout.date).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">No payout history found for this vendor</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">£{analytics?.totalSales || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">£{analytics?.pendingPayout || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <History className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalOrders || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalProducts || 0}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 