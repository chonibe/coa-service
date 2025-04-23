"use client"

import { PayoutProducts } from "./components/payout-products"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2, Package, DollarSign, BarChart, ShoppingCart, LogOut, Save } from "lucide-react"
import { ProductTable } from "./components/product-table"
import { VendorSalesChart } from "./components/vendor-sales-chart"

export default function VendorDashboardPage() {
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
  const router = useRouter()

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

  const handleLogout = async () => {
    try {
      await fetch("/api/vendor/logout", { method: "POST" })
      router.push("/vendor/login")
    } catch (err) {
      console.error("Logout error:", err)
    }
  }

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <h2 className="text-xl font-semibold mb-2">Loading your dashboard...</h2>
          <p className="text-muted-foreground">Please wait while we fetch your data</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Alert variant="destructive" className="max-w-md w-full">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button variant="outline" className="mt-4 w-full" onClick={() => router.push("/vendor/login")}>
            Return to Login
          </Button>
        </Alert>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Alert variant="destructive" className="max-w-md w-full">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Session Expired</AlertTitle>
          <AlertDescription>Your session has expired. Please log in again.</AlertDescription>
          <Button variant="outline" className="mt-4 w-full" onClick={() => router.push("/vendor/login")}>
            Return to Login
          </Button>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Vendor Portal</h1>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium hidden sm:block">
              Welcome, <span className="text-primary">{vendor.vendor_name}</span>
            </p>
            <Button variant="outline" size="sm" onClick={handleLogout} className="h-8">
              <LogOut className="h-3.5 w-3.5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-6">
        <div className="grid gap-4 sm:gap-6">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <Card className="shadow-sm">
              <CardHeader className="p-3 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Products</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="flex items-center">
                  <Package className="h-4 w-4 text-primary mr-2" />
                  <div className="text-lg sm:text-2xl font-bold">{stats.totalProducts}</div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="p-3 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Sales</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="flex items-center">
                  <ShoppingCart className="h-4 w-4 text-primary mr-2" />
                  <div className="text-lg sm:text-2xl font-bold">{stats.totalSales}</div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="p-3 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Revenue</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="flex items-center">
                  <BarChart className="h-4 w-4 text-primary mr-2" />
                  <div className="text-lg sm:text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="p-3 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Pending</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-primary mr-2" />
                  <div className="text-lg sm:text-2xl font-bold">${stats.pendingPayout.toFixed(2)}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="products" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4 sm:mb-6 w-full">
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="payouts">Payouts</TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="mt-0">
              <Card className="shadow-sm">
                <CardHeader className="p-4">
                  <CardTitle>Your Products</CardTitle>
                  <CardDescription>View all your products and their current status</CardDescription>
                </CardHeader>
                <CardContent className="p-0 sm:p-4">
                  <ProductTable vendorName={vendor.vendor_name} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sales" className="mt-0">
              <Card className="shadow-sm">
                <CardHeader className="p-4">
                  <CardTitle>Sales History</CardTitle>
                  <CardDescription>Track your sales and revenue over time</CardDescription>
                </CardHeader>
                <CardContent className="p-0 sm:p-4">
                  <VendorSalesChart vendorName={vendor.vendor_name} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payouts" className="mt-0 space-y-4 sm:space-y-6">
              <Card className="shadow-sm">
                <CardHeader className="p-4">
                  <CardTitle>Payout Products</CardTitle>
                  <CardDescription>View your products and their payout settings</CardDescription>
                </CardHeader>
                <CardContent className="p-0 sm:p-4">
                  <PayoutProducts vendorName={vendor.vendor_name} />
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="p-4">
                  <CardTitle>Payout Settings</CardTitle>
                  <CardDescription>Manage your payout preferences</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4 sm:space-y-6">
                    <div className="space-y-3 sm:space-y-4">
                      <h3 className="text-base sm:text-lg font-medium">PayPal Information</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
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
                        {saveSuccess && (
                          <p className="text-xs sm:text-sm text-green-600">PayPal email updated successfully!</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      <h3 className="text-base sm:text-lg font-medium">Payout History</h3>
                      <div className="text-center py-6 border rounded-md bg-gray-50">
                        <DollarSign className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                        <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">No payouts yet</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto px-4">
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
      </main>
    </div>
  )
}
