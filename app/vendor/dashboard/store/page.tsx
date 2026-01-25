"use client"

import { useState, useEffect } from "react"


import { Skeleton } from "@/components/ui/skeleton"


import { AlertCircle, MapPin } from "lucide-react"
import Link from "next/link"
import { BalanceDisplay } from "./components/balance-display"
import { LampPurchaseCard } from "./components/lamp-purchase-card"
import { ProofPrintGallery } from "./components/proof-print-gallery"
import { PurchaseHistory } from "./components/purchase-history"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger, Alert, AlertDescription, AlertTitle, Button } from "@/components/ui"
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
      <div className="container mx-auto p-4 space-y-4">
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
    <div className="container mx-auto p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Store</h1>
        <p className="text-muted-foreground mt-2">
          Purchase Lamps and proof prints of your artwork
        </p>
      </div>

      <BalanceDisplay />


      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="history">Purchase History</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <div className="space-y-4">
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

