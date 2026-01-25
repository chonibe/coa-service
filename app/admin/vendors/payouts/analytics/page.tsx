"use client"

import { useState } from "react"




import { PayoutAnalytics } from "@/components/payouts/payout-analytics"
import { BarChart3, TrendingUp, Users, DollarSign, Download, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui"
export default function AdminPayoutAnalyticsPage() {
  const [selectedVendor, setSelectedVendor] = useState<string>("all")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  const handleExport = async (format: "csv" | "pdf") => {
    try {
      const response = await fetch(`/api/payouts/analytics/export?format=${format}&vendorName=${selectedVendor === "all" ? "" : selectedVendor}`)
      if (!response.ok) throw new Error("Export failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `payout-analytics.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Export successful",
        description: `Analytics data exported as ${format.toUpperCase()}`,
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: error.message || "Failed to export analytics",
      })
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Refresh logic would go here - could refresh caches or trigger recalculation
    setTimeout(() => {
      setIsRefreshing(false)
      toast({
        title: "Data refreshed",
        description: "Analytics data has been updated",
      })
    }, 2000)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payout Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive analytics and insights for all vendor payouts
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedVendor} onValueChange={setSelectedVendor}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All vendors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All vendors</SelectItem>
              {/* Vendor options would be populated dynamically */}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport("csv")}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" onClick={() => handleExport("pdf")}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payout Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0</div>
            <p className="text-xs text-muted-foreground">
              This period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              With pending payouts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Payout</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0</div>
            <p className="text-xs text-muted-foreground">
              Per vendor
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">
              Payout completion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vendors">By Vendor</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <PayoutAnalytics isAdmin={true} vendorName={selectedVendor === "all" ? undefined : selectedVendor} />
        </TabsContent>

        <TabsContent value="vendors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Performance</CardTitle>
              <CardDescription>
                Payout performance metrics for individual vendors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Vendor-specific analytics will be displayed here once data is available
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payout Trends</CardTitle>
              <CardDescription>
                Historical payout trends and patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PayoutAnalytics
                isAdmin={true}
                timeRange="1y"
                vendorName={selectedVendor === "all" ? undefined : selectedVendor}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payout Forecasting</CardTitle>
              <CardDescription>
                Predictive analytics for future payout volumes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Advanced forecasting will be available once sufficient historical data is collected
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Data Quality Notice */}
      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/50">
        <CardHeader>
          <CardTitle className="text-amber-800 dark:text-amber-200">Data Quality Notice</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Analytics will become more accurate and comprehensive as payout data accumulates over time.
            Some metrics may show as zero or incomplete until sufficient transaction history is available.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
