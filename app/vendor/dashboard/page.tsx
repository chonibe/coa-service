"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { AlertCircle, Loader2, Package, DollarSign, BarChart, ShoppingCart, Save } from "lucide-react"
import { ProductTable } from "./components/product-table"
import { VendorSalesChart } from "./components/vendor-sales-chart"
import { PayoutProducts } from "./components/payout-products"
import { SidebarLayout } from "../components/sidebar-layout"

export default function VendorDashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState(tabParam || "dashboard")
  const [vendor, setVendor] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    pendingPayout: 0,
  })
  const [paypalEmail, setPaypalEmail] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Fetch vendor data
  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        const response = await fetch("/api/vendor/profile")

        if (!response.ok) {
          if (response.status === 401) {
            // Unauthorized, redirect to login
            router.push("/vendor/login")
            return
          }
          throw new Error("Failed to fetch vendor data")
        }

        const data = await response.json()
        setVendor(data.vendor)
        setPaypalEmail(data.vendor.paypal_email || "")

        // Fetch vendor stats
        const statsResponse = await fetch("/api/vendor/stats")
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData)
        }
      } catch (err: any) {
        console.error("Error fetching vendor data:", err)
        setError(err.message || "Failed to load vendor data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchVendorData()
  }, [router])

  // Update tab when URL param changes
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const handleSavePayPal = async () => {
    setIsSaving(true)
    setSaveSuccess(false)

    try {
      const response = await fetch("/api/vendor/update-paypal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paypalEmail }),
      })

      if (!response.ok) {
        throw new Error("Failed to update PayPal email")
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: any) {
      console.error("Error updating PayPal email:", err)
      setError(err.message || "Failed to update PayPal email")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center p-8 h-[calc(100vh-64px)]">
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Loading your dashboard...</h2>
            <p className="text-muted-foreground">Please wait while we fetch your data</p>
          </div>
        </div>
      </SidebarLayout>
    )
  }

  if (error) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center p-8 h-[calc(100vh-64px)]">
          <Alert variant="destructive" className="max-w-md w-full">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <Button variant="outline" className="mt-4 w-full" onClick={() => router.push("/vendor/login")}>
              Return to Login
            </Button>
          </Alert>
        </div>
      </SidebarLayout>
    )
  }

  if (!vendor) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center p-8 h-[calc(100vh-64px)]">
          <Alert variant="destructive" className="max-w-md w-full">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Session Expired</AlertTitle>
            <AlertDescription>Your session has expired. Please log in again.</AlertDescription>
            <Button variant="outline" className="mt-4 w-full" onClick={() => router.push("/vendor/login")}>
              Return to Login
            </Button>
          </Alert>
        </div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {vendor.vendor_name}</p>
        </div>

        <div className="grid gap-6">
          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Package className="h-4 w-4 text-primary mr-2" />
                  <div className="text-2xl font-bold">{stats.totalProducts}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <ShoppingCart className="h-4 w-4 text-primary mr-2" />
                  <div className="text-2xl font-bold">{stats.totalSales}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <BarChart className="h-4 w-4 text-primary mr-2" />
                  <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-primary mr-2" />
                  <div className="text-2xl font-bold">${stats.pendingPayout.toFixed(2)}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs
            defaultValue={activeTab}
            onValueChange={(value) => {
              setActiveTab(value)
              router.push(`/vendor/dashboard?tab=${value}`)
            }}
            className="w-full"
          >
            <TabsList className="grid grid-cols-5 mb-6 w-full">
              <TabsTrigger value="dashboard">Overview</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="payouts">Payouts</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your recent sales and activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <VendorSalesChart vendorName={vendor.vendor_name} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Your Products</CardTitle>
                  <CardDescription>View all your products and their current status</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProductTable vendorName={vendor.vendor_name} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sales" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Sales History</CardTitle>
                  <CardDescription>Track your sales and revenue over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <VendorSalesChart vendorName={vendor.vendor_name} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Analytics</CardTitle>
                  <CardDescription>Detailed analytics for your products</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Analytics Coming Soon</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      We're working on detailed analytics for your products. Check back soon for insights on your sales
                      and customer behavior.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payouts" className="mt-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payout Products</CardTitle>
                  <CardDescription>View your products and their payout settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <PayoutProducts vendorName={vendor.vendor_name} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payout Settings</CardTitle>
                  <CardDescription>Manage your payout preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">PayPal Information</h3>
                      <p className="text-sm text-muted-foreground">
                        Enter your PayPal email address to receive payments for your sales.
                      </p>

                      <div className="grid gap-2">
                        <Label htmlFor="paypal-email">PayPal Email</Label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            id="paypal-email"
                            type="email"
                            placeholder="your-email@example.com"
                            value={paypalEmail}
                            onChange={(e) => setPaypalEmail(e.target.value)}
                            className="w-full"
                          />
                          <Button onClick={handleSavePayPal} disabled={isSaving} className="w-full sm:w-auto">
                            {isSaving ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Save
                              </>
                            )}
                          </Button>
                        </div>
                        {saveSuccess && <p className="text-sm text-green-600">PayPal email updated successfully!</p>}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Payout History</h3>
                      <div className="text-center py-6 border rounded-md bg-gray-50">
                        <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No payouts yet</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto px-4">
                          Your payout history will appear here once payments have been processed.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SidebarLayout>
  )
}
