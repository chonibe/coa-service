import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Package, PoundSterlingIcon as Pound, ShoppingCart, ArrowUpRight } from "lucide-react"

interface StatsCardsProps {
  stats: {
    totalProducts: number
    totalSales: number
    totalRevenue: number
    pendingPayout: number
    period?: string
  } | null
  isLoading: boolean
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  // Helper function to get period label
  const getPeriodLabel = (statType: string) => {
    if (!stats?.period || stats.period === "all-time") {
      return "All-time total"
    }

    if (statType === "pendingPayout") {
      return "Available for withdrawal"
    }

    return "For selected period"
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
          )}
          <p className="text-xs text-muted-foreground">{getPeriodLabel("totalProducts")}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">{stats?.totalSales || 0}</div>
          )}
          <p className="text-xs text-muted-foreground">{getPeriodLabel("totalSales")}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <Pound className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">£{stats?.totalRevenue?.toFixed(2) || "0.00"}</div>
          )}
          <p className="text-xs text-muted-foreground">{getPeriodLabel("totalRevenue")}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">£{stats?.pendingPayout?.toFixed(2) || "0.00"}</div>
          )}
          <p className="text-xs text-muted-foreground">{getPeriodLabel("pendingPayout")}</p>
        </CardContent>
      </Card>
    </div>
  )
}
