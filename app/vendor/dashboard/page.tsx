"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

interface VendorInfo {
  id: number
  vendorName: string
}

export default function VendorDashboard() {
  const [vendor, setVendor] = useState<VendorInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchVendorInfo() {
      try {
        const response = await fetch("/api/vendor/me")

        if (!response.ok) {
          throw new Error("Not authenticated")
        }

        const data = await response.json()
        setVendor(data.vendor)
      } catch (error) {
        console.error("Error fetching vendor info:", error)
        router.push("/vendor/login")
      } finally {
        setIsLoading(false)
      }
    }

    fetchVendorInfo()
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch("/api/vendor/logout", { method: "POST" })
      router.push("/vendor/login")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome, {vendor?.vendorName}</CardTitle>
          <CardDescription>This is your vendor dashboard where you can manage your products and orders</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Your vendor ID: {vendor?.id}</p>
          {/* Add more dashboard content here */}
        </CardContent>
      </Card>
    </div>
  )
}
