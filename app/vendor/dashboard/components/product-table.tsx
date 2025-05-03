"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, RefreshCw } from "lucide-react"
import { useVendorData } from "@/hooks/use-vendor-data"

interface Product {
  id: string
  title: string
  handle: string
  vendor: string
  productType: string
  inventory: number
  price: string
  currency: string
  image: string | null
  payout_amount: number
  is_percentage: boolean
}

interface ProductTableProps {
  vendorName: string
  onRefresh?: () => Promise<void>
}

export function ProductTable({ vendorName, onRefresh }: ProductTableProps) {
  const {
    data: productsData,
    isLoading,
    error,
    isRefreshing,
    refresh,
  } = useVendorData<{ products: Product[] }>({
    endpoint: `/api/vendors/products?vendor=${encodeURIComponent(vendorName)}`,
    initialData: { products: [] },
    refreshDependencies: [vendorName],
  })

  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh()
    }
    await refresh()
  }

  // Format currency
  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === "string" ? Number.parseFloat(amount) : amount
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value)
  }

  // Format payout
  const formatPayout = (product: Product) => {
    if (product.is_percentage) {
      return `${product.payout_amount}% of sale`
    } else {
      return formatCurrency(product.payout_amount)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Your Products</CardTitle>
        <button
          onClick={handleRefresh}
          className="p-2 rounded-full hover:bg-muted"
          disabled={isRefreshing}
          title="Refresh products"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span className="sr-only">Refresh</span>
        </button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Failed to load products</p>
            <button onClick={handleRefresh} className="mt-2 text-sm underline hover:text-foreground">
              Try again
            </button>
          </div>
        ) : productsData.products.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No products found for your vendor account</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Payout</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsData.products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {product.image && (
                          <img
                            src={product.image || "/placeholder.svg"}
                            alt={product.title}
                            className="h-10 w-10 rounded object-cover"
                          />
                        )}
                        <span className="line-clamp-2">{product.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>{product.productType || "Unknown"}</TableCell>
                    <TableCell>{formatCurrency(product.price)}</TableCell>
                    <TableCell>{formatPayout(product)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
