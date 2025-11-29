"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, MapPin } from "lucide-react"
import Link from "next/link"
import { BalanceDisplay } from "./components/balance-display"
import { LampPurchaseCard } from "./components/lamp-purchase-card"
import { ProofPrintGallery } from "./components/proof-print-gallery"
import { PurchaseHistory } from "./components/purchase-history"

export default function StorePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasAddress, setHasAddress] = useState<boolean | null>(null)

  useEffect(() => {
    fetchAddressStatus()
    setIsLoading(false)
  }, [])

  const fetchAddressStatus = async () => {
    try {
      const response = await fetch("/api/vendor/store/products", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setHasAddress(data.hasAddress ?? false)
      }
    } catch (error) {
      console.error("Error fetching address status:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Store</h1>
        <p className="text-muted-foreground mt-2">
          Purchase Lamps and proof prints of your artwork
        </p>
      </div>

      <BalanceDisplay />

      {hasAddress === false && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Delivery Address Required</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-3">
              You need to add a delivery address to your profile before making store purchases. 
              This is required for shipping Lamps and proof prints to your location.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/vendor/dashboard/settings">
                <MapPin className="h-4 w-4 mr-2" />
                Add Delivery Address
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="history">Purchase History</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Lamps</h2>
              <p className="text-muted-foreground mb-4">
                Get 50% off your first Lamp purchase when you join the platform
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <LampPurchaseCard />
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Proof Prints</h2>
              <p className="text-muted-foreground mb-4">
                Order proof prints of your artwork (up to 2 per artwork) - $8.00 each
              </p>
              <ProofPrintGallery />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <PurchaseHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}

