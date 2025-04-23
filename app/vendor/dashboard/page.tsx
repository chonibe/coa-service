"use client"

import { TableCell } from "@/components/ui/table"

import { TableBody } from "@/components/ui/table"

import { TableHead } from "@/components/ui/table"

import { TableRow } from "@/components/ui/table"

import { TableHeader } from "@/components/ui/table"

import { Table } from "@/components/ui/table"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Loader2, Package, DollarSign, BarChart, ShoppingCart, LogOut, Percent } from "lucide-react"
import { ProductTable } from "./components/product-table"
import { SalesChart } from "./components/sales-chart"

interface PayoutSetting {
  product_id: string
  payout_amount: number
  is_percentage: boolean
}

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
  const [payoutSettings, setPayoutSettings] = useState<PayoutSetting[]>([])

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

  // Fetch payout settings
  useEffect(() => {
    const fetchPayoutSettings = async () => {
      if (!vendor) return

      try {
        const response = await fetch(`/api/vendors/payouts?vendorName=${vendor.vendor_name}`)
        if (!response.ok) {
          throw new Error("Failed to fetch payout settings")
        }
        const data = await response.json()
        setPayoutSettings(data.payouts || [])
      } catch (error: any) {
        console.error("Error fetching payout settings:", error)
        setError(error.message || "Failed to load payout settings")
      }
    }

    if (vendor) {
      fetchPayoutSettings()
    }
  }, [vendor])

  // Calculate total revenue based on payout amounts
  const calculateTotalRevenue = () => {
    let total = 0
    payoutSettings.forEach((payout) => {
      total += payout.payout_amount
    })
    return total
  }

  const totalPayoutRevenue = calculateTotalRevenue()

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-xl font-semibold mb-2">Loading your dashboard...</h2>
          <p className="text-muted-foreground">Please wait while we fetch your data</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/vendor/login")}>
            Return to Login
          </Button>
        </Alert>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Session Expired</AlertTitle>
          <AlertDescription>Your session has expired. Please log in again.</AlertDescription>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/vendor/login")}>
            Return to Login
          </Button>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Vendor Portal</h1>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm font-medium hidden md:block">
              Welcome, <span className="text-primary">{vendor.vendor_name}</span>
            </p>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Package className="h-5 w-5 text-primary mr-2" />
                  <div className="text-2xl font-bold">{stats.totalProducts}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <ShoppingCart className="h-5 w-5 text-primary mr-2" />
                  <div className="text-2xl font-bold">{stats.totalSales}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <BarChart className="h-5 w-5 text-primary mr-2" />
                  <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payout</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-primary mr-2" />
                  <div className="text-2xl font-bold">${stats.pendingPayout.toFixed(2)}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="products">
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="payouts">Payouts</TabsTrigger>
            </TabsList>

            <TabsContent value="products">
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

            <TabsContent value="sales">
              <Card>
                <CardHeader>
                  <CardTitle>Sales History</CardTitle>
                  <CardDescription>Track your sales and revenue over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <SalesChart vendorName={vendor.vendor_name} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payouts">
              <Card>
                <CardHeader>
                  <CardTitle>Payout Settings</CardTitle>
                  <CardDescription>View your payout settings for each product</CardDescription>
                </CardHeader>
                <CardContent>
                  {payoutSettings.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No Payout Settings</AlertTitle>
                      <AlertDescription>
                        No payout settings have been defined for your products. Contact the administrator to set up
                        payouts.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Product Payouts</h3>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product</TableHead>
                              <TableHead>Payout Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {payoutSettings.map((payout) => (
                              <TableRow key={payout.product_id}>
                                <TableCell>{payout.product_id}</TableCell>
                                <TableCell>
                                  {payout.is_percentage ? (
                                    <>
                                      {payout.payout_amount}% <Percent className="inline-block h-4 w-4 ml-1" />
                                    </>
                                  ) : (
                                    <>
                                      ${payout.payout_amount.toFixed(2)}{" "}
                                      <DollarSign className="inline-block h-4 w-4 ml-1" />
                                    </>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="text-right">
                        <h4 className="text-sm font-medium">Total Revenue: ${totalPayoutRevenue.toFixed(2)}</h4>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
