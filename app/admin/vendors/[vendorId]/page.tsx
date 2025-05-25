"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

interface Vendor {
  id: string
  name: string
  email: string
  phone: string
  status: string
}

interface Product {
  id: string
  title: string
  price: string
  inventory: number
  amountSold: number
}

interface Order {
  id: string
  created_at: string
  status: string
  total: number
}

export default function VendorProfilePage() {
  const router = useRouter()
  const params = useParams()
  const vendorId = params.vendorId as string
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
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
        setOrders(data.orders || [])
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>
  }

  if (!vendor) {
    return <div className="text-center py-8">Vendor not found</div>
  }

  return (
    <div className="space-y-6 pb-20 px-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendor Details</h1>
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

      <Card>
        <CardHeader>
          <CardTitle>{vendor.name}</CardTitle>
          <CardDescription>Vendor Profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Vendor Details</h2>
              <p>Email: {vendor.email}</p>
              <p>Phone: {vendor.phone}</p>
              <p>Status: {vendor.status}</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Products</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Inventory</TableHead>
                    <TableHead>Amount Sold</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.title}</TableCell>
                      <TableCell>£{product.price}</TableCell>
                      <TableCell>{product.inventory}</TableCell>
                      <TableCell>{product.amountSold}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
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
                    <p className="text-sm text-muted-foreground">{vendor.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Email</h3>
                    <p className="text-sm text-muted-foreground">{vendor.email}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Status</h3>
                  <Badge variant={vendor.status === "active" ? "default" : "secondary"}>
                    {vendor.status}
                  </Badge>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>{product.title}</TableCell>
                        <TableCell>£{product.price}</TableCell>
                        <TableCell>{product.inventory}</TableCell>
                        <TableCell>{product.amountSold}</TableCell>
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
              <CardDescription>Recent orders containing this vendor's products</CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>{order.id}</TableCell>
                        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={order.status === "completed" ? "default" : "secondary"}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>£{order.total.toFixed(2)}</TableCell>
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
      </Tabs>
    </div>
  )
} 