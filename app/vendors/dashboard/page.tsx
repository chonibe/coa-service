"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, LogOut } from "lucide-react"

export default function VendorDashboardPage() {
  const [vendorName, setVendorName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Retrieve vendor name from local storage or cookie
    const storedVendorName = localStorage.getItem("vendorName")
    if (storedVendorName) {
      setVendorName(storedVendorName)
      setIsLoading(false)
    } else {
      // Redirect to login if no vendor name is found
      router.push("/vendors/login")
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("vendorName")
    router.push("/vendors/login")
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!vendorName) {
    return null // Should be redirected already, but just in case
  }

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vendor Dashboard</h1>
            <p className="text-muted-foreground mt-2">Welcome, {vendorName}!</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
              <CardDescription>Summary of your sales performance</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Total Sales: $0.00</p>
              <p>Orders Processed: 0</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Summary</CardTitle>
              <CardDescription>Overview of your product inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Total Products: 0</p>
              <p>Items Sold: 0</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Products</CardTitle>
            <CardDescription>A list of all your products in the store</CardDescription>
          </CardHeader>
          <CardContent>
            <p>No products found.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
