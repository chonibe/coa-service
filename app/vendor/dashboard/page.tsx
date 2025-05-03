"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useVendorData } from "@/hooks/use-vendor-data"
import { VendorSalesChart } from "./components/vendor-sales-chart"
import { ProductTable } from "./components/product-table"
import { PayoutProducts } from "./components/payout-products"
import { AlertCircle, DollarSign, Package, TrendingUp } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh"

export default function VendorDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const { data, isLoading, error, refetch } = useVendorData()

  // Enable pull-to-refresh functionality
  usePullToRefresh(refetch)

  // Force a refresh when the tab changes to ensure data is up-to-date
  useEffect(() => {
    if (activeTab === "products" || activeTab === "payouts") {
      refetch()
    }
  }, [activeTab, refetch])

  return (
    <div className="container mx-auto p-4 space-y-6 pb-20">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Vendor Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {data?.vendor?.name || "Vendor"}</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error.message || "Failed to load vendor data"}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-1/2" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(data?.stats?.totalSales || 0)}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products Sold</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-1/2" />
            ) : (
              <div className="text-2xl font-bold">{data?.stats?.totalQuantity || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-1/2" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(data?.stats?.pendingPayout || 0)}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
              <CardDescription>Your sales performance over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Skeleton className="h-[250px] w-full" />
                </div>
              ) : (
                <VendorSalesChart data={data?.salesData || []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Products</CardTitle>
              <CardDescription>Products you have sold through our platform</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductTable products={data?.products || []} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
              <CardDescription>Your payout history and pending payments</CardDescription>
            </CardHeader>
            <CardContent>
              <PayoutProducts payouts={data?.payouts || []} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
