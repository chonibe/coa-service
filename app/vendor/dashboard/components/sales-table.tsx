"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/utils"

interface SalesTableProps {
  period: string
  customStart?: string
  customEnd?: string
}

interface SaleItem {
  id: number
  orderId: string
  orderName: string
  lineItemId: string
  productId: string
  productTitle: string
  price: number | string
  editionNumber: number
  editionTotal: number
  createdAt: string
  status: string
}

export function SalesTable({ period, customStart, customEnd }: SalesTableProps) {
  const [sales, setSales] = useState<SaleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 10

  useEffect(() => {
    async function fetchSales() {
      setLoading(true)
      try {
        let url = `/api/vendor/sales-data?period=${period}&limit=${limit}&offset=${(page - 1) * limit}`

        if (period === "custom" && customStart && customEnd) {
          url += `&start=${customStart}&end=${customEnd}`
        }

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error("Failed to fetch sales data")
        }

        const data = await response.json()
        setSales(data.sales)
        setTotal(data.total)
      } catch (error) {
        console.error("Error fetching sales data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSales()
  }, [period, customStart, customEnd, page])

  const totalPages = Math.ceil(total / limit)

  function formatPrice(price: number | string | null | undefined): string {
    if (price === null || price === undefined) return "$0.00"

    const numPrice = typeof price === "string" ? Number.parseFloat(price) : price

    if (isNaN(numPrice)) return "$0.00"

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(numPrice)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Edition</TableHead>
              <TableHead className="text-right">Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: limit }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : sales.length > 0 ? (
              sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{formatDate(sale.createdAt)}</TableCell>
                  <TableCell>{sale.orderName}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={sale.productTitle}>
                    {sale.productTitle}
                  </TableCell>
                  <TableCell>
                    {sale.editionNumber ? `${sale.editionNumber}/${sale.editionTotal || "∞"}` : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">{formatPrice(sale.price)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  No sales found for this period
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {sales.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, total)} of {total} sales
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
