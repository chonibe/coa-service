"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"




import { Skeleton } from "@/components/ui"

import {
  ArrowLeft,
  AlertCircle,
  DollarSign,
  Package,
  TrendingUp,
  ShoppingCart,
  Settings,
  Mail,
  Eye,
  Calendar,
} from "lucide-react"
import { VendorSalesChart } from "@/app/vendor/dashboard/components/vendor-sales-chart"
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, ResponsiveContainer } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger, Button, Badge, Alert, AlertDescription, AlertTitle } from "@/components/ui"
interface VendorData {
  id: number
  vendor_name: string
  status: string | null
  contact_email: string | null
  onboarding_completed: boolean | null
  created_at: string | null
  last_login_at: string | null
}

interface DashboardStats {
  totalProducts: number
  totalSales: number
  totalRevenue: number
  totalPayout: number
  currency: string
  salesByDate: Array<{
    date: string
    sales: number
    revenue: number
  }>
  recentActivity: Array<{
    id: string
    date: string
    product_id: string
    price: number
    quantity: number
  }>
}

interface Order {
  id: string
  product_id: string
  title: string | null
  created_at: string
  price: number | string | null
  quantity: number | string | null
  status: string | null
  order_id: string | null
  order_name: string | null
}

interface VendorSettings {
  vendor: VendorData
  vendorUser: {
    email: string | null
    hasAuth: boolean
  } | null
}

export default function AdminVendorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const vendorId = params.vendorId as string

  const [vendor, setVendor] = useState<VendorData | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [settings, setSettings] = useState<VendorSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("dashboard")

  const fetchVendorData = useCallback(async () => {
    if (!vendorId) return
    
    try {
      setIsLoading(true)
      setError(null)

      let response: Response
      let data: any

      if (activeTab === "dashboard") {
        response = await fetch(`/api/admin/vendors/${vendorId}/dashboard`, {
          cache: "no-store",
          credentials: "include",
        })
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed to fetch vendor dashboard: ${response.status}`)
        }
        data = await response.json()
        setVendor(data.vendor)
        setStats(data.stats)
      } else if (activeTab === "orders") {
        response = await fetch(`/api/admin/vendors/${vendorId}/orders`, {
          cache: "no-store",
          credentials: "include",
        })
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed to fetch vendor orders: ${response.status}`)
        }
        data = await response.json()
        setVendor(data.vendor)
        setOrders(data.orders || [])
      } else if (activeTab === "settings") {
        response = await fetch(`/api/admin/vendors/${vendorId}/settings`, {
          cache: "no-store",
          credentials: "include",
        })
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed to fetch vendor settings: ${response.status}`)
        }
        data = await response.json()
        setSettings(data)
        setVendor(data.vendor)
      }
    } catch (err) {
      console.error("Error fetching vendor data:", err)
      setError(err instanceof Error ? err.message : "Failed to load vendor data")
    } finally {
      setIsLoading(false)
    }
  }, [activeTab, vendorId])

  useEffect(() => {
    fetchVendorData()
  }, [fetchVendorData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: stats?.currency || "GBP",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatTimestamp = (value: string | null) => {
    if (!value) return "—"
    try {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    } catch {
      return value ?? "—"
    }
  }

  if (isLoading && !vendor) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error && !vendor) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/admin/dashboard")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{vendor?.vendor_name}</h1>
            <p className="text-sm text-muted-foreground">Vendor Details & Management</p>
          </div>
        </div>
        {vendor && (
          <Badge variant={vendor.status === "active" ? "default" : "secondary"}>
            {vendor.status ?? "unknown"}
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : stats ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalSales}</div>
                    <p className="text-xs text-muted-foreground">Items sold</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                    <p className="text-xs text-muted-foreground">Vendor payout</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Products</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalProducts}</div>
                    <p className="text-xs text-muted-foreground">Active products</p>
                  </CardContent>
                </Card>
              </div>

              {stats.salesByDate && stats.salesByDate.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Sales Trend</CardTitle>
                    <CardDescription>Last 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats.salesByDate}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="sales" fill="#8884d8" name="Sales" />
                        <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {stats.recentActivity && stats.recentActivity.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between border-b pb-2">
                          <div>
                            <p className="text-sm font-medium">Product: {activity.product_id}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatTimestamp(activity.date)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {activity.quantity} × {formatCurrency(activity.price)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No data</AlertTitle>
              <AlertDescription>No dashboard data available for this vendor.</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : orders.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Vendor order history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between border-b pb-4">
                      <div>
                        <p className="font-medium">{order.title || order.product_id}</p>
                        <p className="text-sm text-muted-foreground">
                          Order: {order.order_name || order.order_id || "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimestamp(order.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {order.quantity} × {formatCurrency(Number(order.price || 0))}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {order.status || "active"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No orders</AlertTitle>
              <AlertDescription>This vendor has no orders yet.</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : settings ? (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Vendor Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Vendor Name</label>
                    <p className="text-sm">{settings.vendor.vendor_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <p className="text-sm">
                      <Badge variant={settings.vendor.status === "active" ? "default" : "secondary"}>
                        {settings.vendor.status ?? "unknown"}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Contact Email</label>
                    <p className="text-sm">
                      {settings.vendor.contact_email ? (
                        <a href={`mailto:${settings.vendor.contact_email}`} className="text-primary">
                          {settings.vendor.contact_email}
                        </a>
                      ) : (
                        "—"
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Onboarding</label>
                    <p className="text-sm">
                      <Badge variant={settings.vendor.onboarding_completed ? "default" : "outline"}>
                        {settings.vendor.onboarding_completed ? "Completed" : "Pending"}
                      </Badge>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Login Email</label>
                    <p className="text-sm">
                      {settings.vendorUser?.email || "Not assigned"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Authentication</label>
                    <p className="text-sm">
                      <Badge variant={settings.vendorUser?.hasAuth ? "default" : "outline"}>
                        {settings.vendorUser?.hasAuth ? "Linked" : "Not linked"}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                    <p className="text-sm">{formatTimestamp(settings.vendor.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Login</label>
                    <p className="text-sm">{formatTimestamp(settings.vendor.last_login_at)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No settings</AlertTitle>
              <AlertDescription>Unable to load vendor settings.</AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

